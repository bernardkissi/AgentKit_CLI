const ALLOWED_ROOTS = new Set(['input', 'steps', 'runtime', 'connections']);

/**
 * Extract first identifier token to enforce root namespace rules.
 * Examples:
 * - input.lead.email -> input
 * - steps.a.outputs.text -> steps
 */
export function validateNamespace(expr: string): {
	ok: boolean;
	root?: string;
} {
	const s = expr.trim();

	// Capture first identifier: letters/underscore then alnum/underscore
	const m = /^([A-Za-z_][A-Za-z0-9_]*)/.exec(s);
	if (!m) return { ok: false, root: undefined };

	const root = m[1];
	if (!ALLOWED_ROOTS.has(root)) return { ok: false, root };

	return { ok: true, root };
}
