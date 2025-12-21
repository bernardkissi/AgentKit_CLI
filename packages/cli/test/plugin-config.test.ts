import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runValidate } from "../src/commands/validate";
import Module from "module";

const root = path.resolve(__dirname, "../../..");
const pluginAgent = path.join(root, "fixtures/plugins/plugin-agent.json");
const pluginModule = path.join(root, "fixtures/plugins/echo-plugin.cjs");
const pluginPkgAgent = path.join(root, "fixtures/plugins/plugin-gmail-agent.json");
const missingPluginAgent = path.join(root, "fixtures/invalid/missing_plugin_config/agent.json");
const missingPluginConfig = path.join(root, "fixtures/invalid/missing_plugin_config/agentkit.config.json");
const rootNodeModules = path.join(root, "node_modules");
const basicLockfile = `lockfileVersion: '9.0'
importers:
  .:
    devDependencies: {}
packages: {}
`;

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

  it("denies plugins not in allowlist (E_PLUGIN_UNTRUSTED)", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-plugin-"));
    const cfgPath = path.join(tmpDir, "agentkit.config.json");
    const agentPath = path.join(tmpDir, "agent.json");

    fs.writeFileSync(cfgPath, JSON.stringify({
      plugins: ["@agentkit/plugin-gmail"],
      trust: { allow: ["@acme/agentkit-plugin-slack"] }
    }, null, 2));
    fs.copyFileSync(pluginPkgAgent, agentPath);

    const cwd = process.cwd();
    process.chdir(tmpDir);
    try {
      const res = await runValidate(agentPath, { format: "json", policy: "default" });
      expect(res.exitCode).toBe(1);
      const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
      expect(codes).toContain("E_PLUGIN_UNTRUSTED");
    } finally {
      process.chdir(cwd);
    }
  });

  it("CI policy requires pins (E_PLUGIN_VERSION_UNPINNED)", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-plugin-"));
    const cfgPath = path.join(tmpDir, "agentkit.config.json");
    const agentPath = path.join(tmpDir, "agent.json");

    fs.writeFileSync(cfgPath, JSON.stringify({
      plugins: [{ name: "@agentkit/plugin-gmail" }],
      trust: { requirePinnedVersionsInCi: true }
    }, null, 2));
    fs.copyFileSync(pluginPkgAgent, agentPath);
    fs.copyFileSync(path.join(root, "pnpm-lock.yaml"), path.join(tmpDir, "pnpm-lock.yaml"));
    fs.mkdirSync(path.join(tmpDir, "packages/plugins/plugin-gmail"), { recursive: true });
    fs.copyFileSync(path.join(root, "packages/plugins/plugin-gmail/package.json"), path.join(tmpDir, "packages/plugins/plugin-gmail/package.json"));

    const cwd = process.cwd();
    process.chdir(tmpDir);
    const prevNodePath = process.env.NODE_PATH;
    process.env.NODE_PATH = rootNodeModules;
    (Module as any)._initPaths();
    try {
      const res = await runValidate(agentPath, { format: "json", policy: "ci" });
      expect(res.exitCode).toBe(1);
      const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
      expect(codes).toContain("E_PLUGIN_VERSION_UNPINNED");
    } finally {
      process.env.NODE_PATH = prevNodePath;
      (Module as any)._initPaths();
      process.chdir(cwd);
    }
  });

  it("Runtime policy requires pins (E_PLUGIN_VERSION_UNPINNED)", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-plugin-"));
    const cfgPath = path.join(tmpDir, "agentkit.config.json");
    const agentPath = path.join(tmpDir, "agent.json");

    fs.writeFileSync(cfgPath, JSON.stringify({
      plugins: [{ name: "@agentkit/plugin-gmail" }],
      trust: { requirePinnedVersionsInCi: true }
    }, null, 2));
    fs.copyFileSync(pluginPkgAgent, agentPath);

    const cwd = process.cwd();
    process.chdir(tmpDir);
    const prevNodePath = process.env.NODE_PATH;
    process.env.NODE_PATH = rootNodeModules;
    (Module as any)._initPaths();
    try {
      const res = await runValidate(agentPath, { format: "json", policy: "runtime" });
      expect(res.exitCode).toBe(1);
      const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
      expect(codes).toContain("E_PLUGIN_VERSION_UNPINNED");
    } finally {
      process.env.NODE_PATH = prevNodePath;
      (Module as any)._initPaths();
      process.chdir(cwd);
    }
  });

  it("CI policy passes when pin matches installed version", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-plugin-"));
    const cfgPath = path.join(tmpDir, "agentkit.config.json");
    const agentPath = path.join(tmpDir, "agent.json");

    fs.writeFileSync(cfgPath, JSON.stringify({
      plugins: [{ name: "@agentkit/plugin-gmail", pin: "0.1.0" }],
      trust: { requirePinnedVersionsInCi: true }
    }, null, 2));
    fs.copyFileSync(pluginPkgAgent, agentPath);
    fs.copyFileSync(path.join(root, "pnpm-lock.yaml"), path.join(tmpDir, "pnpm-lock.yaml"));
    fs.mkdirSync(path.join(tmpDir, "packages/plugins/plugin-gmail"), { recursive: true });
    fs.copyFileSync(path.join(root, "packages/plugins/plugin-gmail/package.json"), path.join(tmpDir, "packages/plugins/plugin-gmail/package.json"));

    const cwd = process.cwd();
    process.chdir(tmpDir);
    const prevNodePath = process.env.NODE_PATH;
    process.env.NODE_PATH = rootNodeModules;
    (Module as any)._initPaths();
    try {
      const res = await runValidate(agentPath, { format: "json", policy: "ci" });
      expect(res.exitCode).toBe(0);
    } finally {
      process.env.NODE_PATH = prevNodePath;
      (Module as any)._initPaths();
      process.chdir(cwd);
    }
  });

  it("CI policy fails when pin mismatches lockfile (E_PLUGIN_PIN_MISMATCH)", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-plugin-"));
    const cfgPath = path.join(tmpDir, "agentkit.config.json");
    const agentPath = path.join(tmpDir, "agent.json");

    fs.writeFileSync(cfgPath, JSON.stringify({
      plugins: [{ name: "@agentkit/plugin-gmail", pin: "9.9.9" }],
      trust: { requirePinnedVersionsInCi: true }
    }, null, 2));
    fs.copyFileSync(pluginPkgAgent, agentPath);
    fs.copyFileSync(path.join(root, "pnpm-lock.yaml"), path.join(tmpDir, "pnpm-lock.yaml"));
    fs.mkdirSync(path.join(tmpDir, "packages/plugins/plugin-gmail"), { recursive: true });
    fs.copyFileSync(path.join(root, "packages/plugins/plugin-gmail/package.json"), path.join(tmpDir, "packages/plugins/plugin-gmail/package.json"));

    const cwd = process.cwd();
    process.chdir(tmpDir);
    const prevNodePath = process.env.NODE_PATH;
    process.env.NODE_PATH = rootNodeModules;
    (Module as any)._initPaths();
    try {
      const res = await runValidate(agentPath, { format: "json", policy: "ci" });
      expect(res.exitCode).toBe(1);
      const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
      expect(codes).toContain("E_PLUGIN_PIN_MISMATCH");
    } finally {
      process.env.NODE_PATH = prevNodePath;
      (Module as any)._initPaths();
      process.chdir(cwd);
    }
  });

  it("CI policy fails without lockfile (E_LOCKFILE_MISSING)", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-plugin-"));
    const cfgPath = path.join(tmpDir, "agentkit.config.json");
    const agentPath = path.join(tmpDir, "agent.json");

    fs.writeFileSync(cfgPath, JSON.stringify({
      plugins: [{ name: "@agentkit/plugin-gmail", pin: "0.1.0" }],
      trust: { requirePinnedVersionsInCi: true }
    }, null, 2));
    fs.copyFileSync(pluginPkgAgent, agentPath);

    const cwd = process.cwd();
    process.chdir(tmpDir);
    const prevNodePath = process.env.NODE_PATH;
    process.env.NODE_PATH = rootNodeModules;
    (Module as any)._initPaths();
    try {
      const res = await runValidate(agentPath, { format: "json", policy: "ci" });
      expect(res.exitCode).toBe(1);
      const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
      expect(codes).toContain("E_LOCKFILE_MISSING");
    } finally {
      process.env.NODE_PATH = prevNodePath;
      (Module as any)._initPaths();
      process.chdir(cwd);
    }
  });

  it("CI policy fails when plugin version not resolvable in lockfile (E_PLUGIN_VERSION_UNRESOLVABLE)", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-plugin-"));
    const cfgPath = path.join(tmpDir, "agentkit.config.json");
    const agentPath = path.join(tmpDir, "agent.json");

    fs.writeFileSync(cfgPath, JSON.stringify({
      plugins: [{ name: "@agentkit/plugin-gmail", pin: "0.1.0" }],
      trust: { requirePinnedVersionsInCi: true }
    }, null, 2));
    fs.copyFileSync(pluginPkgAgent, agentPath);
    fs.writeFileSync(path.join(tmpDir, "pnpm-lock.yaml"), basicLockfile);

    const cwd = process.cwd();
    process.chdir(tmpDir);
    const prevNodePath = process.env.NODE_PATH;
    process.env.NODE_PATH = rootNodeModules;
    (Module as any)._initPaths();
    try {
      const res = await runValidate(agentPath, { format: "json", policy: "ci" });
      expect(res.exitCode).toBe(1);
      const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
      expect(codes).toContain("E_PLUGIN_VERSION_UNRESOLVABLE");
    } finally {
      process.env.NODE_PATH = prevNodePath;
      (Module as any)._initPaths();
      process.chdir(cwd);
    }
  });

  it("CI policy fails when plugin missing entirely (E_PLUGIN_UNTRUSTED/E_PLUGIN_VERSION_UNRESOLVABLE)", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-plugin-"));
    fs.copyFileSync(missingPluginConfig, path.join(tmpDir, "agentkit.config.json"));
    fs.copyFileSync(missingPluginAgent, path.join(tmpDir, "agent.json"));
    fs.writeFileSync(path.join(tmpDir, "pnpm-lock.yaml"), basicLockfile);

    const cwd = process.cwd();
    process.chdir(tmpDir);
    const prevNodePath = process.env.NODE_PATH;
    process.env.NODE_PATH = rootNodeModules;
    (Module as any)._initPaths();
    try {
      const res = await runValidate(path.join(tmpDir, "agent.json"), { format: "json", policy: "ci" });
      expect(res.exitCode).toBe(1);
      const codes = JSON.parse(res.output).findings.map((f: any) => f.code);
      expect(codes).toContain("E_PLUGIN_VERSION_UNPINNED");
    } finally {
      process.env.NODE_PATH = prevNodePath;
      (Module as any)._initPaths();
      process.chdir(cwd);
    }
  });
});
