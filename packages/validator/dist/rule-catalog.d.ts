export type RuleSeverity = "error" | "warning";
export interface RuleMeta {
    code: string;
    defaultSeverity: RuleSeverity;
    title: string;
    description: string;
    hint?: string;
    rfc?: string;
}
export declare const RULES: Record<string, RuleMeta>;
export declare function getRule(code: string): RuleMeta | undefined;
export declare function listRules(): RuleMeta[];
