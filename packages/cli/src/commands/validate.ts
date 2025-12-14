import type { Finding } from '@agentkit/validator';
import {
	validateStructural,
	BUILTIN_POLICIES,
	applyPolicy,
	validateAll,
	analyzeStatic,
	lintAgent,
} from '@agentkit/validator';

import { loadDoc } from '../io/load';
import { renderText } from '../reporting/text';
import { renderJson } from '../reporting/json';

import { StepRegistry as BaseRegistry } from '@agentkit/schema';
import { loadConfig } from '../config/config';
import { mergeRegistries, loadTrustedPluginRegistries } from '@agentkit/registry';



function getBuiltInPolicy(name: string) {
	return BUILTIN_POLICIES.find((p: any) => p.name === name) ?? BUILTIN_POLICIES[0];
}

export interface ValidateOptions {
	format: 'text' | 'json';
	policy?: string; // default|strict|runtime|ci
	strict?: boolean; // legacy flag to force strict policy
}

export async function runValidate(
	filePath: string,
	opts: ValidateOptions
): Promise<{ exitCode: number; output: string }> {
	try {
		const effectivePolicy = opts.strict ? 'strict' : (opts.policy ?? 'default');

		const { doc } = loadDoc(filePath);

		// -----------------------------
		// Stage 8b: Load plugins (if any)
		// -----------------------------
		const projectRoot = process.cwd();
		const cfg = loadConfig(projectRoot);

		const requirePins = effectivePolicy === "ci" && (cfg.trust?.requirePinnedVersionsInCi ?? true);

		const { registries: pluginRegistries } = await loadTrustedPluginRegistries({
			plugins: cfg.plugins ?? [],
			projectRoot,
			trustAllow: cfg.trust?.allow,
			trustDeny: cfg.trust?.deny,
			requirePins
		});

		const registry = mergeRegistries(BaseRegistry as any, pluginRegistries);

		// -----------------------------
		// Structural validation first
		// -----------------------------
		const structural = validateStructural(doc);

		let findings: Finding[] = structural.findings.map((f) => ({
			...f,
			file: filePath,
		}));

		// Only run semantic + static + lint if structural validation succeeded
		if (structural.ok) {
			// -----------------------------
			// Semantic validation (registry injected)
			// -----------------------------
			const semantic = validateAll(doc as any, { registry, policyName: opts.policy }).map((f) => ({
				...f,
				file: filePath,
			}));
			findings = findings.concat(semantic);

			// -----------------------------
			// Static analysis
			// -----------------------------
			const staticFindings = analyzeStatic(doc as any).map((f) => ({
				...f,
				file: filePath,
			}));
			findings = findings.concat(staticFindings);

			// -----------------------------
			// Lint warnings
			// -----------------------------
			const lintFindings = lintAgent(doc as any).map((f) => ({
				...f,
				file: filePath,
			}));
			findings = findings.concat(lintFindings);
		}

		// -----------------------------
		// Apply policy (single source of truth)
		// -----------------------------
		const policyPack = getBuiltInPolicy(effectivePolicy);
		findings = applyPolicy(findings, policyPack);

		// -----------------------------
		// Exit logic: fail if any errors remain after policy
		// (Strict is handled by policy escalation, not duplicated here.)
		// -----------------------------
		const hasErrors = findings.some((f) => f.severity === 'error');
		const out = opts.format === 'json' ? renderJson(findings) : renderText(findings);

		return { exitCode: hasErrors ? 1 : 0, output: out };
	} catch (e: any) {
		const msg = e?.message || String(e);
		const match = /^(E_[A-Z0-9_]+)(?::\s*)?(.*)$/m.exec(msg);
		if (match) {
			const code = match[1];
			const message = match[2]?.trim() || msg;
			const findings: Finding[] = [
				{
					code,
					severity: 'error',
					message,
					file: filePath,
					jsonPath: '$',
				},
			];
			const out = opts.format === 'json' ? renderJson(findings) : renderText(findings);
			return { exitCode: 1, output: out };
		}

		const findings: Finding[] = [
			{
				code: 'E_CLI_INTERNAL',
				severity: 'error',
				message: msg,
				file: filePath,
				jsonPath: '$',
			},
		];
		const out = opts.format === 'json' ? renderJson(findings) : renderText(findings);
		return { exitCode: 2, output: out };
	}
}
