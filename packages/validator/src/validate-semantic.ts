import type { AgentDefinition, StepTypeDef } from '@agentkit/schema';
import { extractExpressions, parseExpression, validateNamespace } from "@agentkit/expressions";
import { extractOutputRefs } from "./references/output-references";
import type { Finding } from './types';
import { StepRegistry as BaseStepRegistry } from "@agentkit/schema";
import { URL } from "node:url";

function isNonEmptyString(x: unknown): x is string {
	return typeof x === 'string' && x.trim().length > 0;
}

function wildcardMatch(pattern: string, value: string): boolean {
	const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*");
	const re = new RegExp(`^${escaped}$`, "i");
	return re.test(value);
}

function extractHostname(value: string): string | null {
	try {
		return new URL(value).hostname.toLowerCase();
	} catch {
		// If it's already a bare host, return it
		if (value && !value.includes("://")) return value.toLowerCase();
		return null;
	}
}

function collectFlowTargets(
	step: any
): Array<{ jsonPath: string; target: string }> {
	const out: Array<{ jsonPath: string; target: string }> = [];
	const flow: any = step.flow ?? {};

	// Common pointer keys (works for base steps + control steps)
	const keys = [
		'next',
		'on_error_next',
		'true_next',
		'false_next',
		'approved_next',
		'rejected_next',
	];
	for (const k of keys) {
		if (isNonEmptyString(flow[k])) {
			out.push({
				jsonPath: `$.steps[?(@.id=="${step.id}")].flow.${k}`,
				target: String(flow[k]),
			});
		}
	}

	// switch-style cases: flow.cases = { key: "stepId", default: "stepId" }
	if (flow.cases && typeof flow.cases === 'object') {
		for (const [caseKey, v] of Object.entries(flow.cases)) {
			if (isNonEmptyString(v)) {
				out.push({
					jsonPath: `$.steps[?(@.id=="${step.id}")].flow.cases.${caseKey}`,
					target: String(v),
				});
			}
		}
	}

	return out;
}



type StepRegistry = Record<string, StepTypeDef>;

export interface ValidateSemanticOptions {
	registry?: StepRegistry;
}

export function validateSemantic(doc: AgentDefinition, opts?: ValidateSemanticOptions): Finding[] {
	const findings: Finding[] = [];
	const registry = opts?.registry ?? (BaseStepRegistry as StepRegistry);
	const requiredCaps: Array<{
		kind: "network" | "connector" | "llm";
		name: string;
		scope?: string;
		detail?: any;
		stepId: string;
		stepType: string;
		jsonPath: string;
		host?: string;
		model?: string;
	}> = [];

	// E_STEP_ID_DUPLICATE
	const seen = new Set<string>();

	const outputsByStep = new Map<string, Set<string>>();
	for (const s of doc.steps as any[]) {
		const out = s.outputs && typeof s.outputs === "object" ? Object.keys(s.outputs) : [];
		outputsByStep.set(s.id, new Set(out));
	}

	for (let i = 0; i < doc.steps.length; i++) {
		const id = doc.steps[i].id;
		if (seen.has(id)) {
			findings.push({
				code: 'E_STEP_ID_DUPLICATE',
				severity: 'error',
				message: `Duplicate step id '${id}'. Step IDs must be unique within an agent.`,
				jsonPath: `$.steps[${i}].id`,
			});
		} else {
			seen.add(id);
		}
	}

	// E_FLOW_ENTRYPOINT_MISSING
	if (!seen.has(doc.flow.entrypoint)) {
		findings.push({
			code: 'E_FLOW_ENTRYPOINT_MISSING',
			severity: 'error',
			message: `Entrypoint '${doc.flow.entrypoint}' does not match any step.id.`,
			jsonPath: '$.flow.entrypoint',
		});
	}

	// E_FLOW_TARGET_MISSING
	for (const step of doc.steps as any[]) {
		const targets = collectFlowTargets(step);
		for (const t of targets) {
			if (!seen.has(t.target)) {
				findings.push({
					code: 'E_FLOW_TARGET_MISSING',
					severity: 'error',
					message: `Flow target '${t.target}' referenced by step '${step.id}' does not exist.`,
					jsonPath: t.jsonPath,
				});
			}
		}
	}

	// E_CONNECTION_MISSING (Stage 2 heuristic: params.connection)
	const connections = (doc.runtime as any)?.connections ?? {};
	for (const step of doc.steps as any[]) {
		const conn = step?.params?.connection;
		if (isNonEmptyString(conn) && !(conn in connections)) {
			findings.push({
				code: 'E_CONNECTION_MISSING',
				severity: 'error',
				message: `Step '${step.id}' references connection '${conn}', but runtime.connections does not define it.`,
				jsonPath: `$.steps[?(@.id=="${step.id}")].params.connection`,
			});
		}
	}

	// E_STEP_TYPE_UNKNOWN / E_STEP_PARAMS_INVALID
		for (const step of doc.steps as any[]) {
		const def = (registry as any)[step.type];
		if (!def) {
			findings.push({
				code: "E_STEP_TYPE_UNKNOWN",
				severity: "error",
				message: `Unknown step type '${step.type}'.`,
				jsonPath: `$.steps[?(@.id=="${step.id}")].type`
			});
			continue;
		}

		const parsed = def.paramsSchema.safeParse(step.params ?? {});
		if (!parsed.success) {
			findings.push({
				code: "E_STEP_PARAMS_INVALID",
				severity: "error",
				message: `Invalid params for step type '${step.type}': ` +
					parsed.error.issues.map((i: any) => `${i.path.join(".") || "$"}: ${i.message}`).join("; "),
				jsonPath: `$.steps[?(@.id=="${step.id}")].params`
			});
		}

		for (const cap of def.requiredCapabilities ?? []) {
			const req = {
				kind: cap.kind,
				name: cap.name,
				scope: cap.scope,
				detail: cap.detail,
				stepId: step.id,
				stepType: step.type,
				jsonPath: `$.steps[?(@.id=="${step.id}")]`,
				host: undefined as string | undefined,
				model: undefined as string | undefined
			};

			if (cap.kind === "network" && cap.detail?.hostFromParam && typeof step.params?.[cap.detail.hostFromParam] === "string") {
				req.host = extractHostname(step.params[cap.detail.hostFromParam]) ?? undefined;
			}
			if (cap.kind === "llm" && cap.detail?.modelFromParam && typeof step.params?.[cap.detail.modelFromParam] === "string") {
				req.model = step.params[cap.detail.modelFromParam];
			}
			requiredCaps.push(req);
		}
	}

	// E_EXPR_PARSE / E_EXPR_NAMESPACE
	const occurrences = extractExpressions(doc, "$");
	for (const occ of occurrences) {
		const parsed = parseExpression(occ.expr);
		if (!parsed.ok) {
			findings.push({
				code: "E_EXPR_PARSE",
				severity: "error",
				message: `Invalid expression: ${parsed.error}. Expression: "${occ.expr}"`,
				jsonPath: occ.jsonPath
			});
			continue;
		}

		const ns = validateNamespace(occ.expr);
		if (!ns.ok) {
			findings.push({
				code: "E_EXPR_NAMESPACE",
				severity: "error",
				message: `Illegal expression root namespace "${ns.root ?? "unknown"}". Allowed: input, steps, runtime, connections.`,
				jsonPath: occ.jsonPath
			});
		}

		// E_OUTPUT_REFERENCE_INVALID
		const outRefs = extractOutputRefs(occ.expr);
		for (const r of outRefs) {
			if (!seen.has(r.stepId)) {
				findings.push({
					code: "E_OUTPUT_REFERENCE_INVALID",
					severity: "error",
					message: `Expression references steps.${r.stepId}.outputs.${r.key}, but step '${r.stepId}' does not exist.`,
					jsonPath: occ.jsonPath
				});
				continue;
			}

			const declared = outputsByStep.get(r.stepId);
			if (!declared || declared.size === 0 || !declared.has(r.key)) {
				findings.push({
					code: "E_OUTPUT_REFERENCE_INVALID",
					severity: "error",
					message: `Expression references steps.${r.stepId}.outputs.${r.key}, but step '${r.stepId}' does not declare output '${r.key}'.`,
					jsonPath: occ.jsonPath
				});
			}
		}
	}

	// Secret leakage detection
	function traverseForSecrets(node: any, path: string) {
		if (node && typeof node === "object" && !Array.isArray(node)) {
			// Skip pure secret refs
			if (Object.keys(node).length === 1 && typeof node.$secret === "string") {
				return;
			}
			for (const [k, v] of Object.entries(node)) {
				const childPath = `${path}.${k}`;
				traverseForSecrets(v, childPath);
				if (typeof v === "string") {
					const keySuspicious = /api[-_]?key|token|secret|password/i.test(k);
					const looksSecret =
						/^sk-[A-Za-z0-9]{16,}/.test(v) ||
						(/[A-Za-z]/.test(v) && /\d/.test(v) && v.length >= 32);
					const templated = v.includes("{{");
					if ((keySuspicious || looksSecret) && !templated) {
						findings.push({
							code: "E_SECRET_INLINE",
							severity: "warning",
							message: `Potential inline secret at ${childPath}`,
							jsonPath: childPath.replace(/^\$\./, "$.")
						});
					}
				}
			}
		} else if (Array.isArray(node)) {
			node.forEach((item, idx) => traverseForSecrets(item, `${path}[${idx}]`));
		}
	}

	traverseForSecrets(doc, "$");

	// Permission coverage checks
	const permissions: any = (doc as any).permissions ?? {};
	const connectorDecls = new Map<string, Set<string>>();
	for (const c of permissions.connectors ?? []) {
		if (!c?.name || !Array.isArray(c.scopes)) continue;
		connectorDecls.set(c.name, new Set(c.scopes));
	}
	const egressAllow: string[] = permissions.network?.egress?.allow ?? [];
	const egressDeny: string[] = permissions.network?.egress?.deny ?? [];
	const hasEgress = Boolean(permissions.network?.egress);
	const allowedModels: string[] = permissions.llm?.allowedModels ?? [];

	const usedConnectorScopes = new Set<string>();
	const usedAllowPatterns = new Set<string>();
	const usedModels = new Set<string>();

	for (const cap of requiredCaps) {
		if (cap.kind === "connector") {
			const scopes = connectorDecls.get(cap.name);
			if (!scopes) {
				findings.push({
					code: "E_PERMISSION_MISSING",
					severity: "error",
					message: `Step '${cap.stepId}' requires connector '${cap.name}'${cap.scope ? ` (${cap.scope})` : ""} but it is not declared in permissions.connectors.`,
					jsonPath: cap.jsonPath
				});
				continue;
			}
			if (cap.scope && !scopes.has(cap.scope)) {
				findings.push({
					code: "E_PERMISSION_MISSING",
					severity: "error",
					message: `Step '${cap.stepId}' requires connector '${cap.name}' scope '${cap.scope}' but permissions declare different scopes.`,
					jsonPath: cap.jsonPath
				});
				continue;
			}
			usedConnectorScopes.add(`${cap.name}:${cap.scope ?? ""}`);
		}

		if (cap.kind === "network") {
			if (!hasEgress) {
				findings.push({
					code: "E_PERMISSION_MISSING",
					severity: "error",
					message: `Step '${cap.stepId}' requires network egress but permissions.network.egress is not declared.`,
					jsonPath: cap.jsonPath
				});
				continue;
			}

			if (cap.host) {
				if (egressDeny.some((p) => wildcardMatch(p, cap.host!))) {
					findings.push({
						code: "E_PERMISSION_DENIED",
						severity: "error",
						message: `Egress host '${cap.host}' required by step '${cap.stepId}' is denied by permissions.network.egress.deny.`,
						jsonPath: cap.jsonPath
					});
					continue;
				}

				if (egressAllow.length) {
					const match = egressAllow.find((p) => wildcardMatch(p, cap.host!));
					if (!match) {
						findings.push({
							code: "E_PERMISSION_MISSING",
							severity: "error",
							message: `Egress host '${cap.host}' required by step '${cap.stepId}' is not allowed by permissions.network.egress.allow.`,
							jsonPath: cap.jsonPath
						});
					} else {
						usedAllowPatterns.add(match);
					}
				}
			}
		}

		if (cap.kind === "llm") {
			if (!permissions.llm) {
				findings.push({
					code: "E_PERMISSION_MISSING",
					severity: "error",
					message: `Step '${cap.stepId}' requires LLM access but permissions.llm is not declared.`,
					jsonPath: cap.jsonPath
				});
				continue;
			}

			if (cap.model && Array.isArray(allowedModels) && allowedModels.length > 0) {
				if (!allowedModels.includes(cap.model)) {
					findings.push({
						code: "E_PERMISSION_MISSING",
						severity: "error",
						message: `Model '${cap.model}' used by step '${cap.stepId}' is not allowed by permissions.llm.allowedModels.`,
						jsonPath: cap.jsonPath
					});
				} else {
					usedModels.add(cap.model);
				}
			}
		}
	}

	// Overbroad declarations (not used by any required capability)
	for (const [name, scopes] of connectorDecls) {
		for (const scope of scopes) {
			if (!usedConnectorScopes.has(`${name}:${scope}`)) {
				findings.push({
					code: "W_PERMISSION_OVERBROAD",
					severity: "warning",
					message: `Connector permission '${name}' scope '${scope}' is declared but not used by any step.`,
					jsonPath: "$.permissions.connectors"
				});
			}
		}
	}

	for (const allow of egressAllow) {
		if (!usedAllowPatterns.has(allow)) {
			findings.push({
				code: "W_PERMISSION_OVERBROAD",
				severity: "warning",
				message: `Egress allow entry '${allow}' is declared but not used by any step.`,
				jsonPath: "$.permissions.network.egress.allow"
			});
		}
	}

	if (Array.isArray(allowedModels) && allowedModels.length > 0) {
		for (const m of allowedModels) {
			if (!usedModels.has(m)) {
				findings.push({
					code: "W_PERMISSION_OVERBROAD",
					severity: "warning",
					message: `LLM model '${m}' is allowed but not used by any step.`,
					jsonPath: "$.permissions.llm.allowedModels"
				});
			}
		}
	}

	return findings;
}
