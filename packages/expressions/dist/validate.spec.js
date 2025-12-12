"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const validate_1 = require("./validate");
(0, vitest_1.describe)("validateNamespace", () => {
    (0, vitest_1.it)("accepts allowed roots", () => {
        (0, vitest_1.expect)((0, validate_1.validateNamespace)("input.lead.email")).toMatchObject({ ok: true, root: "input" });
        (0, vitest_1.expect)((0, validate_1.validateNamespace)("steps.step1.outputs.text")).toMatchObject({ ok: true, root: "steps" });
    });
    (0, vitest_1.it)("rejects disallowed roots", () => {
        (0, vitest_1.expect)((0, validate_1.validateNamespace)("foo.bar").ok).toBe(false);
    });
});
//# sourceMappingURL=validate.spec.js.map