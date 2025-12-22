import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runGenSchema } from "../src/commands/gen-schema";

const root = path.resolve(__dirname, "../../..");
const pluginModule = path.join(root, "fixtures/plugins/echo-plugin.cjs");

function readJson(p: string) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function generateSchema(projectDir: string, extra: Partial<Parameters<typeof runGenSchema>[0]> = {}) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-schema-"));
  const res = await runGenSchema({
    outDir,
    projectDir,
    noGeneratedAt: true,
    ...extra,
  });
  if (res.exitCode !== 0 && res.output) {
    // Surface generator errors in test output for easier debugging.
    // eslint-disable-next-line no-console
    console.error(res.output);
  }
  expect(res.exitCode).toBe(0);
  return outDir;
}

describe("gen schema snapshot", () => {
  it("writes core schema with generic steps and empty index by default", async () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-schema-proj-"));
    const outDir = await generateSchema(projectDir);

    const corePath = path.join(outDir, "agent-core.schema.json");
    const indexPath = path.join(outDir, "schema.index.json");
    expect(fs.existsSync(corePath)).toBe(true);
    expect(fs.existsSync(indexPath)).toBe(true);

    const core = readJson(corePath);
    const index = readJson(indexPath);

    expect(core.properties?.steps?.items).toEqual({ $ref: "#/$defs/BaseStepCore" });
    expect(core.$defs?.BaseStepCore?.required).toEqual(["id", "type", "params"]);
    const stepParamsKeys = Object.keys(core.$defs ?? {}).filter((k) => k.startsWith("StepParams__"));
    expect(stepParamsKeys).toHaveLength(0);

    expect(index.core).toBe("agent-core.schema.json");
    expect(index.plugins).toEqual([]);
    expect(index.generatedAt).toBeUndefined();
  });

  it("emits plugin schema files and indexes step defs", async () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-schema-plugin-"));
    const cfgPath = path.join(projectDir, "agentkit.config.json");
    fs.writeFileSync(cfgPath, JSON.stringify({ plugins: [pluginModule] }, null, 2));

    const outDir = await generateSchema(projectDir);
    const pluginPath = path.join(outDir, "plugins", "local__echo-plugin.schema.json");
    expect(fs.existsSync(pluginPath)).toBe(true);

    const pluginSchema = readJson(pluginPath);
    const index = readJson(path.join(outDir, "schema.index.json"));

    const expectedStep = {
      type: "plugin.echo",
      paramsDef: "StepParams__plugin_echo",
      outputsDef: "StepOutputs__plugin_echo",
    };
    expect(pluginSchema["x-index"].steps).toEqual([expectedStep]);
    expect(pluginSchema.$defs.StepParams__plugin_echo).toBeDefined();
    expect(pluginSchema.$defs.StepOutputs__plugin_echo).toBeDefined();

    const indexPlugin = index.plugins.find((p: any) => p.schema.endsWith("local__echo-plugin.schema.json"));
    expect(indexPlugin).toMatchObject({
      name: expect.stringContaining("echo-plugin"),
      steps: [expectedStep],
    });
  });

  it("is deterministic across runs when generatedAt is omitted", async () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-schema-plugin-"));
    fs.writeFileSync(path.join(projectDir, "agentkit.config.json"), JSON.stringify({ plugins: [pluginModule] }, null, 2));

    const outDir1 = await generateSchema(projectDir);
    const outDir2 = await generateSchema(projectDir);

    const core1 = fs.readFileSync(path.join(outDir1, "agent-core.schema.json"), "utf8");
    const core2 = fs.readFileSync(path.join(outDir2, "agent-core.schema.json"), "utf8");
    expect(core1).toEqual(core2);

    const plugin1 = fs.readFileSync(path.join(outDir1, "plugins", "local__echo-plugin.schema.json"), "utf8");
    const plugin2 = fs.readFileSync(path.join(outDir2, "plugins", "local__echo-plugin.schema.json"), "utf8");
    expect(plugin1).toEqual(plugin2);

    const index1 = fs.readFileSync(path.join(outDir1, "schema.index.json"), "utf8");
    const index2 = fs.readFileSync(path.join(outDir2, "schema.index.json"), "utf8");
    expect(index1).toEqual(index2);
  });
});
