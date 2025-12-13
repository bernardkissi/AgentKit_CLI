import type { Finding } from "@agentkit/validator";
import { lintAgent } from "@agentkit/validator";
import { BUILTIN_POLICIES, applyPolicy } from "@agentkit/validator";
import { loadDoc } from "../io/load";
import { renderText } from "../reporting/text";
import { renderJson } from "../reporting/json";

export interface LintOptions {
    format: "text" | "json";
    policy?: string; // default|strict|runtime|ci
    strict?: boolean; // legacy flag to force strict policy
}

function getBuiltInPolicy(name: string) {
    return BUILTIN_POLICIES.find((p: any) => p.name === name) ?? BUILTIN_POLICIES[0]; // default fallback
}

export function runLint(filePath: string, opts: LintOptions): { exitCode: number; output: string } {
    try {
        const effectivePolicy = opts.strict ? "strict" : (opts.policy ?? "default");
        const { doc } = loadDoc(filePath);
        let findings: Finding[] = lintAgent(doc as any).map(f => ({ ...f, file: filePath }));

        // Apply policy
        const policyPack = getBuiltInPolicy(effectivePolicy);
        findings = applyPolicy(findings, policyPack);
        //  exit code logic
        const hasWarnings = findings.some(f => f.severity === "warning");
        const fail = effectivePolicy === "strict" && hasWarnings;
        const out = opts.format === "json" ? renderJson(findings) : renderText(findings);
        return { exitCode: fail ? 1 : 0, output: out };
    } catch (e: any) {
        const out = `[ERROR] E_CLI_INTERNAL: ${String(e?.message || e)} (${filePath} $)\n`;
        return { exitCode: 2, output: out };
    }
}
