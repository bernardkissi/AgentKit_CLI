"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportedSchemaVersions = exports.AgentDefinitionSchema = exports.BaseStep = exports.AgentFlow = exports.Trigger = exports.StepType = exports.StepId = exports.SemVer = void 0;
const zod_1 = require("zod");
exports.SemVer = zod_1.z.string().regex(/^\d+\.\d+\.\d+$/);
exports.StepId = zod_1.z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/);
exports.StepType = zod_1.z.string().min(1).regex(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/);
exports.Trigger = zod_1.z.discriminatedUnion("type", [
    zod_1.z.object({ type: zod_1.z.literal("manual"), config: zod_1.z.record(zod_1.z.any()).default({}) }).strict(),
    zod_1.z.object({ type: zod_1.z.literal("schedule"), config: zod_1.z.object({ cron: zod_1.z.string().min(1), timezone: zod_1.z.string().optional() }).strict() }).strict(),
    zod_1.z.object({ type: zod_1.z.literal("webhook"), config: zod_1.z.object({ path: zod_1.z.string().min(1), auth: zod_1.z.enum(["none", "workspace", "shared_secret"]).default("workspace") }).strict() }).strict(),
    zod_1.z.object({ type: zod_1.z.literal("event"), config: zod_1.z.object({ source: zod_1.z.string().min(1), event_type: zod_1.z.string().min(1), resource: zod_1.z.string().min(1) }).strict() }).strict(),
]);
exports.AgentFlow = zod_1.z.object({ entrypoint: exports.StepId }).strict();
exports.BaseStep = zod_1.z.object({
    id: exports.StepId,
    type: exports.StepType,
    params: zod_1.z.record(zod_1.z.any()),
    outputs: zod_1.z.record(zod_1.z.any()).optional(),
    flow: zod_1.z.record(zod_1.z.any()).optional()
}).strict();
exports.AgentDefinitionSchema = zod_1.z.object({
    schema_version: exports.SemVer,
    kind: zod_1.z.literal("agent_definition"),
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    template_version: exports.SemVer,
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    trigger: exports.Trigger,
    inputs: zod_1.z.record(zod_1.z.any()).optional(),
    runtime: zod_1.z.record(zod_1.z.any()).optional(),
    flow: exports.AgentFlow,
    steps: zod_1.z.array(exports.BaseStep).min(1),
    error_handling: zod_1.z.record(zod_1.z.any()).optional()
}).strict();
exports.supportedSchemaVersions = ["1.0.0"];
//# sourceMappingURL=agent-definition.zod.js.map