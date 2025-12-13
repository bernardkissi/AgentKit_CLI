import type { RuleSeverity } from "../rule-catalog";

export interface PolicyPack {
    name: string;
    description: string;
    enabled: Record<string, boolean>;
    severityOverrides?: Record<string, RuleSeverity>;
}