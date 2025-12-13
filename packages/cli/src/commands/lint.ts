import type { Finding } from "@agentkit/validator";
import { lintAgent } from "@agentkit/validator";
import { loadDoc } from "../io/load";
import { renderText } from "../reporting/text";
import { renderJson } from "../reporting/json";

export interface LintOptions {
    format: "text" | "json";
    strict: boolean;
}

export function runLint(filePath: string, opts: LintOptions): { exitCode: number; output: string } {
    try {
        const { doc } = loadDoc(filePath);
        const findings: Finding[] = lintAgent(doc as any).map(f => ({ ...f, file: filePath }));
        const hasWarnings = findings.some(f => f.severity === "warning");
        const fail = opts.strict && hasWarnings;
        const out = opts.format === "json" ? renderJson(findings) : renderText(findings);
        return { exitCode: fail ? 1 : 0, output: out };
    } catch (e: any) {
        const out = `[ERROR] E_CLI_INTERNAL: ${String(e?.message || e)} (${filePath} $)\n`;
        return { exitCode: 2, output: out };
    }
}