import type { Finding } from '@agentkit/validator';
import { validateStructural, validateSemantic, analyzeStatic, lintAgent } from '@agentkit/validator';
import { BUILTIN_POLICIES, applyPolicy } from "@agentkit/validator";
import { loadDoc } from '../io/load';
import { renderText } from '../reporting/text';
import { renderJson } from '../reporting/json';


function getBuiltInPolicy(name: string) {
	return BUILTIN_POLICIES.find((p: any) => p.name === name) ?? BUILTIN_POLICIES[0]; // default fallback
}

export interface ValidateOptions {
	format: 'text' | 'json';
	policy?: string; // default|strict|runtime|ci
	strict?: boolean; // legacy flag to force strict policy
}

export function runValidate(
	filePath: string,
	opts: ValidateOptions
): { exitCode: number; output: string } {
	try {
		const effectivePolicy = opts.strict ? 'strict' : (opts.policy ?? 'default');
		const { doc } = loadDoc(filePath);
		const structural = validateStructural(doc);

		// attach file to findings
		let findings: Finding[] = structural.findings.map((f) => ({
			...f,
			file: filePath,
		}));

		// Only run semantic validation if structural validation succeeded
		if (structural.ok) {
			const semantic = validateSemantic(doc as any).map((f) => ({
				...f,
				file: filePath,
			}));
			findings = findings.concat(semantic);
		}

		const staticFindings = analyzeStatic(doc as any).map((f) => ({ ...f, file: filePath }));
		findings = findings.concat(staticFindings);

		// Lint-style warnings
		const lintFindings = lintAgent(doc as any).map((f) => ({ ...f, file: filePath }));
		findings = findings.concat(lintFindings);

		const policyPack = getBuiltInPolicy(effectivePolicy);
		findings = applyPolicy(findings, policyPack);

		const hasErrors = findings.some((f) => f.severity === 'error');
		const hasWarnings = findings.some((f) => f.severity === 'warning');
		const fail = hasErrors || (effectivePolicy === 'strict' && hasWarnings);

		const out =
			opts.format === 'json' ? renderJson(findings) : renderText(findings);
		return { exitCode: fail ? 1 : 0, output: out };
	} catch (e: any) {
		const msg = e?.message || String(e);
		const findings: Finding[] = [
			{
				code: 'E_CLI_INTERNAL',
				severity: 'error',
				message: msg,
				file: filePath,
				jsonPath: '$',
			},
		];
		const out =
			opts.format === 'json' ? renderJson(findings) : renderText(findings);
		return { exitCode: 2, output: out };
	}
}
