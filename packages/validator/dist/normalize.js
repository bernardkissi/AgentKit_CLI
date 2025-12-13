"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeFinding = normalizeFinding;
exports.normalizeFindings = normalizeFindings;
const rule_catalog_1 = require("./rule-catalog");
function normalizeFinding(f) {
    const meta = (0, rule_catalog_1.getRule)(f.code);
    if (!meta)
        return f;
    return {
        ...f,
        severity: f.severity ?? meta.defaultSeverity
    };
}
function normalizeFindings(findings) {
    return findings.map(normalizeFinding);
}
//# sourceMappingURL=normalize.js.map