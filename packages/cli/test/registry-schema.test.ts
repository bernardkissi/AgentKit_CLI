import { describe, it, expect } from "vitest";
import { StepRegistry } from "@agentkit/schema";
import { buildRegistrySchemaFragments } from "../src/schema/registry-schema";

describe("buildRegistrySchemaFragments", () => {
  it("generates $defs entries and a steps[] union", () => {
    const fragment = buildRegistrySchemaFragments(StepRegistry as any);

    expect(fragment.defs.StepParams__llm_prompt).toBeDefined();
    expect(fragment.defs.StepOutputs__llm_prompt).toBeDefined();

    expect(fragment.defs.StepParams__action_gmail_send_email).toBeDefined();
    expect(fragment.defs.StepOutputs__action_gmail_send_email).toBeDefined();

    const items = fragment.stepsSchema.items as { oneOf?: Array<{ properties: { type: { const: string } } }> };
    expect(items.oneOf?.map((entry) => entry.properties.type.const)).toEqual([
      "action.gmail.send_email",
      "llm.prompt",
    ]);
  });
});
