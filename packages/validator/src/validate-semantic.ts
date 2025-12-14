import type { AgentDefinition, StepTypeDef } from '@agentkit/schema';
import { extractExpressions, parseExpression, validateNamespace } from "@agentkit/expressions";
import { extractOutputRefs } from "./references/output-references";
import type { Finding } from './types';
import { StepRegistry as BaseStepRegistry } from "@agentkit/schema";

function isNonEmptyString(x: unknown): x is string {
	return typeof x === 'string' && x.trim().length > 0;
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

	return findings;
}
