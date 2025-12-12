import { describe, expect, it } from "vitest";

import { validateStructural } from "./validate-structural";

const validDoc = {
  schema_version: "1.0.0",
  kind: "agent_definition",
  id: "agent-id",
  name: "My Agent",
  template_version: "1.0.0",
  trigger: { type: "manual", config: {} },
  flow: { entrypoint: "step1" },
  steps: [{ id: "step1", type: "task.example", params: {} }]
};

describe("validateStructural", () => {
  it("passes for a valid agent definition", () => {
    const { ok, findings } = validateStructural(validDoc);

    expect(ok).toBe(true);
    expect(findings).toHaveLength(0);
  });

  it("fails for unsupported schema_version", () => {
    const { ok, findings } = validateStructural({ ...validDoc, schema_version: "9.9.9" });

    expect(ok).toBe(false);
    expect(findings[0]?.code).toBe("E_SCHEMA_VERSION_UNSUPPORTED");
  });
});
