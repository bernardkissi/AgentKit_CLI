import type { Finding } from "@agentkit/validator";

export function renderText(findings: Finding[]): string {
  if (!findings.length) return "OK\n";
  const lines = findings.map(f => {
    const loc = [f.file, f.jsonPath].filter(Boolean).join(" ");
    return `[${f.severity.toUpperCase()}] ${f.code}: ${f.message}${loc ? ` (${loc})` : ""}`;
  });
  return lines.join("\n") + "\n";
}
