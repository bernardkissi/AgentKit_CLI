import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runGenSchema } from "../src/commands/gen-schema";

const root = path.resolve(__dirname, "../../..");
const snapshotPath = path.join(root, "packages/cli/test/fixtures/gen-schema.snapshot.json");
const pluginModule = path.join(root, "fixtures/plugins/echo-plugin.cjs");

async function generateSchema(projectDir: string) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-schema-"));
  const res = await runGenSchema({ outDir, projectDir });
  expect(res.exitCode).toBe(0);
  const outPath = path.join(outDir, "agent-definition.schema.json");
  const json = JSON.parse(fs.readFileSync(outPath, "utf8"));
  return { json, outPath };
}

describe("gen schema snapshot", () => {
  let rootSchema: any;

  beforeAll(async () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-schema-proj-"));
    const res = await generateSchema(projectDir);
    rootSchema = res.json;
  });

  it("matches the committed snapshot", async () => {
    const stepParamsKeys = Object.keys(rootSchema.$defs ?? {})
      .filter((key) => key.startsWith("StepParams__"))
      .sort();
    const stepOutputsKeys = Object.keys(rootSchema.$defs ?? {})
      .filter((key) => key.startsWith("StepOutputs__"))
      .sort();

    const snapshot = {
      stepDefs: {
        paramsKeys: stepParamsKeys,
        outputsKeys: stepOutputsKeys,
      },
      stepsSchema: rootSchema.properties?.steps,
    };

    const expected = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
    expect(snapshot).toEqual(expected);
  });

  it("includes a known step type in $defs and steps union", () => {
    expect(rootSchema.$defs?.StepParams__llm_prompt).toBeDefined();
    const stepVariants = rootSchema.properties?.steps?.items?.oneOf ?? [];
    const stepTypes = stepVariants.map((variant: any) => variant.properties?.type?.const);
    expect(stepTypes).toContain("llm.prompt");
  });

  it("includes plugin steps when project config loads a plugin", async () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-schema-plugin-"));
    const cfgPath = path.join(projectDir, "agentkit.config.json");
    fs.writeFileSync(cfgPath, JSON.stringify({ plugins: [pluginModule] }, null, 2));

    const { json } = await generateSchema(projectDir);

    expect(json.$defs?.StepParams__plugin_echo).toBeDefined();
    const stepVariants = json.properties?.steps?.items?.oneOf ?? [];
    const stepTypes = stepVariants.map((variant: any) => variant.properties?.type?.const);
    expect(stepTypes).toContain("plugin.echo");
  });
});
