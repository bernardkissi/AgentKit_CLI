import type { Finding } from "./types";
import { buildCfg } from "./analysis/cfg";

export function analyzeStatic(doc: any): Finding[] {
  const findings: Finding[] = [];
  const cfg = buildCfg(doc);

  const entry = doc?.flow?.entrypoint;
  if (typeof entry !== "string" || !entry.length) return findings;

  // Reachability (DFS)
  const visited = new Set<string>();
  const stack = [entry];
  while (stack.length) {
    const n = stack.pop()!;
    if (visited.has(n)) continue;
    visited.add(n);
    const next = cfg.adj.get(n) ?? [];
    for (const m of next) stack.push(m);
  }

  for (const n of cfg.nodes) {
    if (!visited.has(n)) {
      findings.push({
        code: "W_UNREACHABLE_STEP",
        severity: "warning",
        message: `Step '${n}' is unreachable from entrypoint '${entry}'.`,
        jsonPath: `$.steps[?(@.id=="${n}")]`
      });
    }
  }

  // Cycle detection (directed DFS)
  const temp = new Set<string>();
  const perm = new Set<string>();

  const hasCycleFrom = (node: string): boolean => {
    if (perm.has(node)) return false;
    if (temp.has(node)) return true;
    temp.add(node);
    for (const nxt of cfg.adj.get(node) ?? []) {
      if (hasCycleFrom(nxt)) return true;
    }
    temp.delete(node);
    perm.add(node);
    return false;
  };

  for (const n of cfg.nodes) {
    if (hasCycleFrom(n)) {
      findings.push({
        code: "E_CYCLE_DETECTED",
        severity: "error",
        message: "Cycle detected in control flow. Cycles are invalid in schema v1.",
        jsonPath: "$.steps"
      });
      break;
    }
  }

  return findings;
}