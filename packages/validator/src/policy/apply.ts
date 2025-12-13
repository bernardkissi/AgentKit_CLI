import type { Finding } from "../types";
import { getRule } from "../rule-catalog";
import type { PolicyPack } from "./types";

export function applyPolicy(findings: Finding[], policy: PolicyPack): Finding[] {
    const out: Finding[] = [];
    for (const f of findings) {
        const meta = getRule(f.code);
        const enabled = policy.enabled?.[f.code];
        if (enabled === false) continue;

        const sev = policy.severityOverrides?.[f.code] ?? f.severity ?? meta?.defaultSeverity ?? "error";
        out.push({ ...f, severity: sev });
    }
    return out;
}