import type { ExpressionOccurrence } from './types';

const EXPR_BLOCK = /{{\s*([^}]+?)\s*}}/g;

function isPlainObject(x: unknown): x is Record<string, unknown> {
	return !!x && typeof x === 'object' && !Array.isArray(x);
}

export function extractExpressions(
	value: unknown,
	basePath = '$'
): ExpressionOccurrence[] {
	const out: ExpressionOccurrence[] = [];

	if (typeof value === 'string') {
		let m: RegExpExecArray | null;
		EXPR_BLOCK.lastIndex = 0;
		while ((m = EXPR_BLOCK.exec(value)) !== null) {
			out.push({
				jsonPath: basePath,
				expr: m[1].trim(),
			});
		}
		return out;
	}

	if (Array.isArray(value)) {
		value.forEach((v, i) => {
			out.push(...extractExpressions(v, `${basePath}[${i}]`));
		});
		return out;
	}

	if (isPlainObject(value)) {
		for (const [k, v] of Object.entries(value)) {
			out.push(...extractExpressions(v, `${basePath}.${k}`));
		}
		return out;
	}

	return out;
}
