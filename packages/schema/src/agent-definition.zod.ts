import { z } from "zod";

export const SemVer = z.string().regex(/^\d+\.\d+\.\d+$/);

export const StepId = z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/);
export const StepType = z.string().min(1).regex(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/);

export const Trigger = z.discriminatedUnion("type", [
  z.object({ type: z.literal("manual"), config: z.record(z.any()).default({}) }).strict(),
  z.object({ type: z.literal("schedule"), config: z.object({ cron: z.string().min(1), timezone: z.string().optional() }).strict() }).strict(),
  z.object({ type: z.literal("webhook"), config: z.object({ path: z.string().min(1), auth: z.enum(["none","workspace","shared_secret"]).default("workspace") }).strict() }).strict(),
  z.object({ type: z.literal("event"), config: z.object({ source: z.string().min(1), event_type: z.string().min(1), resource: z.string().min(1) }).strict() }).strict(),
]);

export const AgentFlow = z.object({ entrypoint: StepId }).strict();

export const BaseStep = z.object({
  id: StepId,
  type: StepType,
  params: z.record(z.any()),
  flow: z.record(z.any()).optional()
}).strict();

export const AgentDefinitionSchema = z.object({
  schema_version: SemVer,
  kind: z.literal("agent_definition"),
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  template_version: SemVer,
  metadata: z.record(z.any()).optional(),
  trigger: Trigger,
  inputs: z.record(z.any()).optional(),
  runtime: z.record(z.any()).optional(),
  flow: AgentFlow,
  steps: z.array(BaseStep).min(1),
  error_handling: z.record(z.any()).optional()
}).strict();

export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;
export const supportedSchemaVersions = ["1.0.0"];
