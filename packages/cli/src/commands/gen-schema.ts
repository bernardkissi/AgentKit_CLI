// import fs from "node:fs";
// import path from "node:path";
// import { zodToJsonSchema } from "zod-to-json-schema";
// import { AgentDefinitionSchema } from "@agentkit/schema";

// export interface GenSchemaOptions {
//     outDir: string;
// }

// export function runGenSchema(opts: GenSchemaOptions): { exitCode: number; output?: string } {
//     try {
//         // Cast to avoid excessive type instantiation from the complex Zod schema
//         const schema = zodToJsonSchema(AgentDefinitionSchema as any, { name: "AgentDefinition" });
//         const outPath = path.join(opts.outDir, "agent-definition.schema.json");
//         fs.mkdirSync(opts.outDir, { recursive: true });
//         fs.writeFileSync(outPath, JSON.stringify(schema, null, 2) + "\n", "utf8");
//         return { exitCode: 0, output: outPath + "\n" };
//     } catch (e: any) {
//         return { exitCode: 2, output: String(e?.message || e) + "\n" };
//     }
// }

import fs from "node:fs";
import path from "node:path";
import { zodToJsonSchema } from "zod-to-json-schema";

// Import sub-schemas so we can force stable $defs
import {
  AgentDefinitionSchema,
  SemVer,
  StepId,
  StepType,
  Trigger,
  AgentFlow,
  SecretRef,
  Permissions,
  StepRegistry as BuiltInRegistry,
} from "@agentkit/schema";
import { loadConfig } from "../config/config";
import { loadTrustedPluginRegistries, mergeRegistries } from "@agentkit/registry";
import { detectLockfile } from "@agentkit/lockfile";
import { buildRegistrySchemaFragments } from "../schema/registry-schema";

export interface GenSchemaOptions {
  outDir: string;
  projectDir?: string;
}

/**
 * Generates a single JSON Schema file with stable $defs for key sub-nodes.
 * Notes:
 * - Uses JSON Schema 2019-09 so $defs is supported.
 * - $refStrategy "root" produces references to $defs where possible.
 */
export async function runGenSchema(
  opts: GenSchemaOptions
): Promise<{ exitCode: number; output?: string }> {
  try {
    const projectRoot = opts.projectDir ?? process.cwd();

    const cfg = loadConfig(projectRoot);
    const plugins = (cfg.plugins ?? []) as any[];

    const lockfile = detectLockfile(projectRoot);
    const pluginRegs = plugins.length
      ? (await loadTrustedPluginRegistries({
          plugins: plugins as any,
          projectRoot,
          trustAllow: cfg.trust?.allow,
          trustDeny: cfg.trust?.deny,
          requirePins: false,
          lockfile: lockfile ?? undefined,
          policyName: "default",
        })).registries
      : [];

    const registry = mergeRegistries(BuiltInRegistry as any, pluginRegs);

    const root = zodToJsonSchema(AgentDefinitionSchema as any, {
      name: "AgentDefinition",
      target: "jsonSchema2019-09",
      $refStrategy: "root",
      definitionPath: "$defs",
      definitions: {
        SemVer: SemVer as any,
        StepId: StepId as any,
        StepType: StepType as any,
        Trigger: Trigger as any,
        AgentFlow: AgentFlow as any,
        SecretRef: SecretRef as any,
        Permissions: Permissions as any,
      },
    }) as any;

    const reg = buildRegistrySchemaFragments(registry);

    root.$defs = { ...(root.$defs ?? {}), ...reg.defs };
    root.properties = root.properties ?? {};
    root.properties.steps = reg.stepsSchema;

    const outPath = path.join(opts.outDir, "agent-definition.schema.json");
    fs.mkdirSync(opts.outDir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(root, null, 2) + "\n", "utf8");
    return { exitCode: 0, output: outPath + "\n" };
  } catch (e: any) {
    return { exitCode: 2, output: String(e?.message || e) + "\n" };
  }
}
