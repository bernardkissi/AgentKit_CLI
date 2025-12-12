"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractOutputRefs = extractOutputRefs;
/**
 * Extracts references like:
 * - steps.stepA.outputs.text
 * - steps.stepA.outputs["text"] (optional)
 *
 * Conservative regex: v1 focuses on dot form.
 */
function extractOutputRefs(expr) {
    const refs = [];
    // Dot form: steps.<id>.outputs.<key>
    const dot = /\bsteps\.([A-Za-z_][A-Za-z0-9_-]*)\.outputs\.([A-Za-z_][A-Za-z0-9_-]*)\b/g;
    let m;
    while ((m = dot.exec(expr)) !== null) {
        refs.push({ stepId: m[1], key: m[2] });
    }
    // Optional bracket form: steps["id"].outputs["key"]
    const br = /\bsteps\[["']([A-Za-z_][A-Za-z0-9_-]*)["']\]\.outputs\[["']([A-Za-z_][A-Za-z0-9_-]*)["']\]/g;
    while ((m = br.exec(expr)) !== null) {
        refs.push({ stepId: m[1], key: m[2] });
    }
    return refs;
}
//# sourceMappingURL=output-references.js.map