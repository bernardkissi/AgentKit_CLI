import type { AgentDefinition } from '@agentkit/schema';
import { extractExpressions, parseExpression, validateNamespace } from "@agentkit/expressions";
import type { Finding } from './types';

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

export function validateSemantic(doc: AgentDefinition): Finding[] {
	const findings: Finding[] = [];

	// E_STEP_ID_DUPLICATE
	const seen = new Set<string>();
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
    }


	return findings;
}
