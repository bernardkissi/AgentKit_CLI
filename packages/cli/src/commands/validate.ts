import type { Finding } from "@agentkit/validator";
import { validateStructural } from "@agentkit/validator";
import { loadDoc } from "../io/load";
import { renderText } from "../reporting/text";
import { renderJson } from "../reporting/json";

export interface ValidateOptions {
  format: "text" | "json";
  strict: boolean;
}

export function runValidate(filePath: string, opts: ValidateOptions): { exitCode: number; output: string } {
  try {
    const { doc } = loadDoc(filePath);
    const res = validateStructural(doc);

    // attach file to findings
    const findings: Finding[] = res.findings.map(f => ({ ...f, file: filePath }));

    const hasErrors = findings.some(f => f.severity === "error");
    const hasWarnings = findings.some(f => f.severity === "warning");
    const fail = hasErrors || (opts.strict && hasWarnings);

    const out = opts.format === "json" ? renderJson(findings) : renderText(findings);
    return { exitCode: fail ? 1 : 0, output: out };
  } catch (e: any) {
    const msg = e?.message || String(e);
    const findings: Finding[] = [{
      code: "E_CLI_INTERNAL",
      severity: "error",
      message: msg,
      file: filePath,
      jsonPath: "$"
    }];
    const out = opts.format === "json" ? renderJson(findings) : renderText(findings);
    return { exitCode: 2, output: out };
  }
}
