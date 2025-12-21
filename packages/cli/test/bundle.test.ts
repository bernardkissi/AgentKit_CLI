import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { runBundlePack, runBundleVerify } from "../src/commands/bundle";

const root = path.resolve(__dirname, "../../..");
const agent = path.join(root, "fixtures/valid/example.json");
const secretInline = path.join(root, "fixtures/invalid/secret_inline.json");

describe("agentkit bundle pack/verify", () => {
  const originalHome = process.env.AGENTKIT_HOME;
  let fakeHome: string;

  beforeAll(() => {
    fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-home-"));
    process.env.AGENTKIT_HOME = fakeHome;
  });

  afterAll(() => {
    process.env.AGENTKIT_HOME = originalHome;
    try {
      fs.rmSync(fakeHome, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it("packs and verifies a bundle", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-bundle-"));
    const out = path.join(tmp, "example.agentkit");

    const pack = await runBundlePack(agent, out);
    expect(pack.exitCode).toBe(0);
    expect(fs.existsSync(out)).toBe(true);

    const verify = await runBundleVerify(out);
    expect(verify.exitCode).toBe(0);
    expect(verify.output?.trim()).toBe("OK");
  });

  it("fails verification on hash mismatch", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-bundle-"));
    const out = path.join(tmp, "example.agentkit");
    await runBundlePack(agent, out);

    // Tamper with agent file inside bundle
    const zip = new AdmZip(out);
    zip.addFile(path.basename(agent), Buffer.from('{"tampered":true}\n', "utf8"));
    const tampered = path.join(tmp, "tampered.agentkit");
    zip.writeZip(tampered);

    const res = await runBundleVerify(tampered);
    expect(res.exitCode).toBe(1);
    expect(res.output).toContain("E_BUNDLE_HASH_MISMATCH");
  });

  it("fails pack when inline secrets are present", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-bundle-"));
    const out = path.join(tmp, "example.agentkit");

    const res = await runBundlePack(secretInline, out);
    expect(res.exitCode).toBe(2);
    expect(res.output).toContain("E_SECRET_INLINE");
    expect(fs.existsSync(out)).toBe(false);
  });
});
