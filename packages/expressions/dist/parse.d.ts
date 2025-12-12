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
export declare function parseExpression(expr: string): ParseResult;
