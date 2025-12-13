import type { Finding } from "./types";
import { getRule } from "./rule-catalog";

export function normalizeFinding(f: Finding): Finding {
    const meta = getRule(f.code);
    if (!meta) return f;
    return {
        ...f,
        severity: f.severity ?? meta.defaultSeverity
    } as Finding;
}

export function normalizeFindings(findings: Finding[]): Finding[] {
    return findings.map(normalizeFinding);
}