import fs from "node:fs";
import path from "node:path";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AgentDefinitionSchema } from "@agentkit/schema";

export interface GenSchemaOptions {
    outDir: string;
}

export function runGenSchema(opts: GenSchemaOptions): { exitCode: number; output?: string } {
    try {
        // Cast to avoid excessive type instantiation from the complex Zod schema
        const schema = zodToJsonSchema(AgentDefinitionSchema as any, { name: "AgentDefinition" });
        const outPath = path.join(opts.outDir, "agent-definition.schema.json");
        fs.mkdirSync(opts.outDir, { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(schema, null, 2) + "\n", "utf8");
        return { exitCode: 0, output: outPath + "\n" };
    } catch (e: any) {
        return { exitCode: 2, output: String(e?.message || e) + "\n" };
    }
}
