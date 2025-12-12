import { describe, it, expect } from "vitest";
import path from "node:path";
import { runValidate } from "../src/commands/validate";

const root = path.resolve(__dirname, "../../..");
const validFile = path.join(root, "fixtures/valid/example.json");

describe("agentkit validate (stage 1)", () => {
  it("passes valid fixture", () => {
    const res = runValidate(validFile, { format: "json", strict: false });
    expect(res.exitCode).toBe(0);
    expect(JSON.parse(res.output).findings).toHaveLength(0);
  });

  it("fails invalid json", () => {
    const tmp = path.join(root, "fixtures/invalid/bad.json");
    const res = runValidate(tmp, { format: "json", strict: false });
    expect([1,2]).toContain(res.exitCode);
  });
});
