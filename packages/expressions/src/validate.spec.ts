import { describe, expect, it } from "vitest";

import { validateNamespace } from "./validate";

describe("validateNamespace", () => {
  it("accepts allowed roots", () => {
    expect(validateNamespace("input.lead.email")).toMatchObject({ ok: true, root: "input" });
    expect(validateNamespace("steps.step1.outputs.text")).toMatchObject({ ok: true, root: "steps" });
  });

  it("rejects disallowed roots", () => {
    expect(validateNamespace("foo.bar").ok).toBe(false);
  });
});
