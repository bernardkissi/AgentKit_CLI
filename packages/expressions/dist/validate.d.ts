/**
 * Extract first identifier token to enforce root namespace rules.
 * Examples:
 * - input.lead.email -> input
 * - steps.a.outputs.text -> steps
 */
export declare function validateNamespace(expr: string): {
    ok: boolean;
    root?: string;
};
