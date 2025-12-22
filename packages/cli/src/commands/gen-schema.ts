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
import { detectLockfile } from "@agentkit/lockfile";
import { buildStepSchemas } from "../schema/registry-schema";
import type { LoadedRegistry } from "@agentkit/registry";
import { loadRegistriesBySource } from "@agentkit/registry";

export interface GenSchemaOptions {
  outDir: string;
  projectDir?: string;
  coreOnly?: boolean;
  pluginsOnly?: boolean;
  includeBuiltins?: boolean;
  emitBuiltinsPlugin?: boolean;
  noGeneratedAt?: boolean;
}

function normalizePackageName(pkgName: string) {
  const withoutAt = pkgName.startsWith("@") ? pkgName.slice(1) : pkgName;
  return withoutAt.replace(/\//g, "__");
}

function pluginSchemaFilename(registry: LoadedRegistry) {
  if (registry.source === "npm" && registry.name) {
    return `${normalizePackageName(registry.name)}.schema.json`;
  }
  if (registry.source === "builtin") {
    return "builtin.schema.json";
  }
  const base = registry.path
    ? path.parse(registry.path).name
    : registry.name ?? registry.id;
  return `local__${base}.schema.json`;
}

function buildCoreSchema() {
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

  const baseStepCore = {
    type: "object",
    properties: {
      id: { $ref: "#/$defs/StepId" },
      type: { $ref: "#/$defs/StepType" },
      params: { type: "object", additionalProperties: true },
      outputs: { type: "object", additionalProperties: true },
      flow: { type: "object", additionalProperties: true },
    },
    required: ["id", "type", "params"],
    additionalProperties: false,
  };

  root.$defs = { ...(root.$defs ?? {}), BaseStepCore: baseStepCore };
  root.properties = root.properties ?? {};
  root.properties.steps = {
    type: "array",
    minItems: 1,
    items: { $ref: "#/$defs/BaseStepCore" },
  };

  return root;
}

function pluginIndexEntry(registry: LoadedRegistry, filePath: string, steps: Array<{ type: string; paramsDef: string; outputsDef: string }>) {
  return {
    name: registry.name ?? registry.id,
    version: registry.version,
    schema: filePath,
    steps,
  };
}

/**
 * Generates split JSON Schema outputs:
 * - agent-core.schema.json (core agent definition)
 * - plugins/<plugin>.schema.json (per-plugin verbose step schemas)
 * - schema.index.json (maps step types to plugin schema files/$defs)
 */
export async function runGenSchema(
  opts: GenSchemaOptions
): Promise<{ exitCode: number; output?: string }> {
  try {
    const projectRoot = opts.projectDir ?? process.cwd();
    const cfg = loadConfig(projectRoot);
    const plugins = (cfg.plugins ?? []) as any[];
    const includeBuiltins = opts.includeBuiltins ?? true;
    const emitBuiltinsPlugin = opts.emitBuiltinsPlugin ?? false;

    const shouldGeneratePlugins =
      !opts.coreOnly &&
      (opts.pluginsOnly || plugins.length > 0 || (includeBuiltins && emitBuiltinsPlugin));

    const lockfile = detectLockfile(projectRoot);
    const loaded = shouldGeneratePlugins && plugins.length
      ? await loadRegistriesBySource({
          plugins: plugins as any,
          projectRoot,
          trustAllow: cfg.trust?.allow,
          trustDeny: cfg.trust?.deny,
          requirePins: false,
          lockfile: lockfile ?? undefined,
          policyName: "default",
        })
      : [];

    const pluginRegistries: LoadedRegistry[] = [];
    if (includeBuiltins && emitBuiltinsPlugin) {
      pluginRegistries.push({
        id: "builtin",
        name: "builtin",
        source: "builtin",
        registry: BuiltInRegistry as any,
      });
    }
    pluginRegistries.push(...loaded);

    const sortedRegistries = pluginRegistries.sort((a, b) => {
      const aName = a.name ?? a.id;
      const bName = b.name ?? b.id;
      return aName.localeCompare(bName);
    });

    fs.mkdirSync(opts.outDir, { recursive: true });

    // Core schema (always generated)
    const coreSchema = buildCoreSchema();
    const corePath = path.join(opts.outDir, "agent-core.schema.json");
    fs.writeFileSync(corePath, JSON.stringify(coreSchema, null, 2) + "\n", "utf8");

    // Per-plugin schemas
    const pluginDir = path.join(opts.outDir, "plugins");
  const pluginIndex: Array<{ name?: string; version?: string; schema: string; steps: any[] }> = [];

  if (shouldGeneratePlugins && sortedRegistries.length > 0) {
    fs.mkdirSync(pluginDir, { recursive: true });

    for (const reg of sortedRegistries) {
      const { defs, xIndexSteps } = buildStepSchemas(reg.registry);
      const filename = pluginSchemaFilename(reg);
      const schemaPath = path.join(pluginDir, filename);
      const schema = {
        $schema: "https://json-schema.org/draft/2019-09/schema",
        title: `${reg.name ?? reg.id} Step Schemas`,
        "x-plugin": {
          name: reg.name ?? reg.id,
          version: reg.version,
          source: reg.source,
        },
        "x-index": { steps: xIndexSteps },
        $defs: defs,
      };

      fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2) + "\n", "utf8");
      const relPath = path.posix.join("plugins", filename.replace(/\\/g, "/"));
      pluginIndex.push(pluginIndexEntry(reg, relPath, xIndexSteps));
    }
  }

  // Schema index ties core + plugins together
  const index: any = {
    format: "agentkit.schema.index.v1",
    core: "agent-core.schema.json",
    plugins: pluginIndex,
  };

  const omitGeneratedAt = opts.noGeneratedAt ?? true;
  if (!omitGeneratedAt) {
    index.generatedAt = new Date().toISOString();
  }

    const indexPath = path.join(opts.outDir, "schema.index.json");
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n", "utf8");

    return { exitCode: 0, output: [corePath, indexPath].join("\n") + "\n" };
  } catch (e: any) {
    return { exitCode: 2, output: String(e?.message || e) + "\n" };
  }
}
