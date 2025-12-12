import type { Finding } from "@agentkit/validator";
export function renderJson(findings: Finding[]) {
  return JSON.stringify({ findings }, null, 2) + "\n";
}
