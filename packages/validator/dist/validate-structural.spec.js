"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const validate_structural_1 = require("./validate-structural");
const validDoc = {
    schema_version: "1.0.0",
    kind: "agent_definition",
    id: "agent-id",
    name: "My Agent",
    template_version: "1.0.0",
    trigger: { type: "manual", config: {} },
    flow: { entrypoint: "step1" },
    steps: [{ id: "step1", type: "task.example", params: {} }]
};
(0, vitest_1.describe)("validateStructural", () => {
    (0, vitest_1.it)("passes for a valid agent definition", () => {
        const { ok, findings } = (0, validate_structural_1.validateStructural)(validDoc);
        (0, vitest_1.expect)(ok).toBe(true);
        (0, vitest_1.expect)(findings).toHaveLength(0);
    });
    (0, vitest_1.it)("fails for unsupported schema_version", () => {
        const { ok, findings } = (0, validate_structural_1.validateStructural)({ ...validDoc, schema_version: "9.9.9" });
        (0, vitest_1.expect)(ok).toBe(false);
        (0, vitest_1.expect)(findings[0]?.code).toBe("E_SCHEMA_VERSION_UNSUPPORTED");
    });
});
//# sourceMappingURL=validate-structural.spec.js.map