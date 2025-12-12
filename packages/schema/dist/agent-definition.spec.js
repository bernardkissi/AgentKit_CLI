"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const agent_definition_zod_1 = require("./agent-definition.zod");
(0, vitest_1.describe)("AgentDefinitionSchema", () => {
    (0, vitest_1.it)("parses a minimal valid agent definition", () => {
        const doc = {
            schema_version: "1.0.0",
            kind: "agent_definition",
            id: "agent-id",
            name: "My Agent",
            template_version: "1.0.0",
            trigger: { type: "manual", config: {} },
            flow: { entrypoint: "step1" },
            steps: [{ id: "step1", type: "task.example", params: {} }]
        };
        const result = agent_definition_zod_1.AgentDefinitionSchema.safeParse(doc);
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.success && result.data).toMatchObject({ id: "agent-id" });
    });
    (0, vitest_1.it)("lists the supported schema versions", () => {
        (0, vitest_1.expect)(agent_definition_zod_1.supportedSchemaVersions).toContain("1.0.0");
    });
});
//# sourceMappingURL=agent-definition.spec.js.map