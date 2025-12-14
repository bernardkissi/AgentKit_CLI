import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runValidate } from "../src/commands/validate";

const root = path.resolve(__dirname, "../../..");
const pluginAgent = path.join(root, "fixtures/plugins/plugin-agent.json");
const pluginModule = path.join(root, "fixtures/plugins/echo-plugin.cjs");
const pluginPkgAgent = path.join(root, "fixtures/plugins/plugin-gmail-agent.json");

describe("agentkit plugins (agentkit.config.json)", () => {
  it("loads plugin registry from config and validates custom step type", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-plugin-"));
    const cfgPath = path.join(tmpDir, "agentkit.config.json");
    const agentPath = path.join(tmpDir, "agent.json");

    // write config + agent
    fs.writeFileSync(cfgPath, JSON.stringify({ plugins: [pluginModule] }, null, 2));
    fs.copyFileSync(pluginAgent, agentPath);

    const cwd = process.cwd();
    process.chdir(tmpDir);
    try {
      const res = await runValidate(agentPath, { format: "json", policy: "default" });
      expect(res.exitCode).toBe(0);
      const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
      expect(codes).not.toContain("E_STEP_TYPE_UNKNOWN");
    } finally {
      process.chdir(cwd);
    }
  });

  it("loads workspace plugin package by name", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-plugin-"));
    const cfgPath = path.join(tmpDir, "agentkit.config.json");
    const agentPath = path.join(tmpDir, "agent.json");

    fs.writeFileSync(cfgPath, JSON.stringify({ plugins: ["@agentkit/plugin-gmail"] }, null, 2));
    fs.copyFileSync(pluginPkgAgent, agentPath);

    const cwd = process.cwd();
    process.chdir(tmpDir);
    try {
      const res = await runValidate(agentPath, { format: "json", policy: "default" });
      expect(res.exitCode).toBe(0);
      const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
      expect(codes).not.toContain("E_STEP_TYPE_UNKNOWN");
    } finally {
      process.chdir(cwd);
    }
  });
});
