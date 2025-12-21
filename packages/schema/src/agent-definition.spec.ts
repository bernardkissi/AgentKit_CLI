import { describe, expect, it } from "vitest";

import { AgentDefinitionSchema, supportedSchemaVersions } from "./agent-definition.zod";

describe("AgentDefinitionSchema", () => {
  it("parses a minimal valid agent definition", () => {
    const doc = {
      schema_version: "1.0.0",
      kind: "agent_definition",
      id: "agent-id",
      name: "My Agent",
      template_version: "1.0.0",
      trigger: { type: "manual", config: {} },
      flow: { entrypoint: "step1" },
      steps: [{ id: "step1", type: "task.example", params: {} }]
    };

    const result = AgentDefinitionSchema.safeParse(doc);

    expect(result.success).toBe(true);
    expect(result.success && result.data).toMatchObject({ id: "agent-id" });
  });

  it("accepts permissions block with network/connectors/llm", () => {
    const doc = {
      schema_version: "1.0.0",
      kind: "agent_definition",
      id: "agent-id",
      name: "My Agent",
      template_version: "1.0.0",
      trigger: { type: "manual", config: {} },
      flow: { entrypoint: "step1" },
      permissions: {
        network: { egress: { allow: ["api.openai.com"], deny: ["*.bad.com"] } },
        connectors: [{ name: "gmail", scopes: ["send_email"] }],
        llm: { allowedModels: ["gpt-4"], maxTokensPerRun: 2000 }
      },
      steps: [{ id: "step1", type: "task.example", params: {} }]
    };

    const result = AgentDefinitionSchema.safeParse(doc);
    expect(result.success).toBe(true);
  });

  it("lists the supported schema versions", () => {
    expect(supportedSchemaVersions).toContain("1.0.0");
  });
});
