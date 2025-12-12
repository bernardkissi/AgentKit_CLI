"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStructural = validateStructural;
const schema_1 = require("@agentkit/schema");
function validateStructural(doc) {
    const findings = [];
    const parsed = schema_1.AgentDefinitionSchema.safeParse(doc);
    if (!parsed.success) {
        findings.push({
            code: "E_SCHEMA_INVALID",
            severity: "error",
            message: parsed.error.issues.map(i => `${i.path.join(".") || "$"}: ${i.message}`).join("; "),
            jsonPath: "$"
        });
        return { ok: false, findings };
    }
    const schemaVersion = parsed.data.schema_version;
    if (!schema_1.supportedSchemaVersions.includes(schemaVersion)) {
        findings.push({
            code: "E_SCHEMA_VERSION_UNSUPPORTED",
            severity: "error",
            message: `Unsupported schema_version: ${schemaVersion}. Supported: ${schema_1.supportedSchemaVersions.join(", ")}`,
            jsonPath: "$.schema_version"
        });
        return { ok: false, findings };
    }
    return { ok: true, findings };
}
//# sourceMappingURL=validate-structural.js.map