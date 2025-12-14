import type { StepTypeDef } from "@agentkit/schema";

export type StepRegistry = Record<string, StepTypeDef>;

export interface AgentKitPluginModule {
    agentkitRegistry?: StepRegistry;
    default?: StepRegistry;
}
