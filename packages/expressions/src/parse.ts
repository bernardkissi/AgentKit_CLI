import { tokenize } from "./tokenize";

export interface ParseResult {
	ok: boolean;
	error?: string;
}

/**
 * Minimal expression syntax checks.
 * v1 rules (Stage 3):
 * - non-empty
 * - balanced parentheses
 * - disallow characters that indicate code execution ; {} [] (outside property access)
 * This is intentionally conservative.
 */
// export function parseExpression(expr: string): ParseResult {
// 	const s = expr.trim();
// 	if (!s) return { ok: false, error: 'Empty expression' };

// 	// Disallow obvious code/execution tokens (conservative)
// 	if (/[;`]/.test(s))
// 		return { ok: false, error: 'Illegal character in expression' };

// 	// Balanced parentheses check
// 	let depth = 0;
// 	for (const ch of s) {
// 		if (ch === '(') depth++;
// 		if (ch === ')') depth--;
// 		if (depth < 0) return { ok: false, error: 'Unbalanced parentheses' };
// 	}
// 	if (depth !== 0) return { ok: false, error: 'Unbalanced parentheses' };

// 	return { ok: true };
// }

export function parseExpression(expr: string): ParseResult {
	const t = tokenize(expr);
	if (!t.ok) return { ok: false, error: t.error };

	let depth = 0;
	for (const tok of t.tokens) {
		if (tok.type === "lparen") depth++;
		if (tok.type === "rparen") depth--;
		if (depth < 0) return { ok: false, error: "Unbalanced parentheses" };
	}
	if (depth !== 0) return { ok: false, error: "Unbalanced parentheses" };

	return { ok: true };
}


