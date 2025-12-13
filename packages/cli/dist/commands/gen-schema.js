"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGenSchema = runGenSchema;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const zod_to_json_schema_1 = require("zod-to-json-schema");
const schema_1 = require("@agentkit/schema");
function runGenSchema(opts) {
    try {
        // Cast to avoid excessive type instantiation from the complex Zod schema
        const schema = (0, zod_to_json_schema_1.zodToJsonSchema)(schema_1.AgentDefinitionSchema, { name: "AgentDefinition" });
        const outPath = node_path_1.default.join(opts.outDir, "agent-definition.schema.json");
        node_fs_1.default.mkdirSync(opts.outDir, { recursive: true });
        node_fs_1.default.writeFileSync(outPath, JSON.stringify(schema, null, 2) + "\n", "utf8");
        return { exitCode: 0, output: outPath + "\n" };
    }
    catch (e) {
        return { exitCode: 2, output: String(e?.message || e) + "\n" };
    }
}
//# sourceMappingURL=gen-schema.js.map