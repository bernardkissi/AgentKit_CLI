import type { AgentDefinition } from "@agentkit/schema";
import type { Finding } from "./types";
import { validateStructural } from "./validate-structural";
import { validateSemantic } from "./validate-semantic";
import { analyzeStatic } from "./analyze-static";
import { applyPolicy } from "./policy/apply";
import { BUILTIN_POLICIES } from "./policy/builtins";

export interface ValidateContext {
    registry?: any;  // StepRegistry
    policyName?: string;
}

export function validateAll(doc: AgentDefinition, ctx: ValidateContext = {}): Finding[] {
    const findings: Finding[] = [];

    const structural = validateStructural(doc);
    findings.push(...structural.findings);

    if (structural.ok) {
        findings.push(...validateSemantic(doc as any, { registry: ctx.registry }));
        findings.push(...analyzeStatic(doc as any));
    }

    const policy = BUILTIN_POLICIES.find(p => p.name === (ctx.policyName ?? "default")) ?? BUILTIN_POLICIES[0];
    return applyPolicy(findings, policy);
}