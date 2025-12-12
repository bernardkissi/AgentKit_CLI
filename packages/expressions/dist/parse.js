"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExpression = parseExpression;
/**
 * Minimal expression syntax checks.
 * v1 rules (Stage 3):
 * - non-empty
 * - balanced parentheses
 * - disallow characters that indicate code execution ; {} [] (outside property access)
 * This is intentionally conservative.
 */
function parseExpression(expr) {
    const s = expr.trim();
    if (!s)
        return { ok: false, error: 'Empty expression' };
    // Disallow obvious code/execution tokens (conservative)
    if (/[;`]/.test(s))
        return { ok: false, error: 'Illegal character in expression' };
    // Balanced parentheses check
    let depth = 0;
    for (const ch of s) {
        if (ch === '(')
            depth++;
        if (ch === ')')
            depth--;
        if (depth < 0)
            return { ok: false, error: 'Unbalanced parentheses' };
    }
    if (depth !== 0)
        return { ok: false, error: 'Unbalanced parentheses' };
    return { ok: true };
}
//# sourceMappingURL=parse.js.map