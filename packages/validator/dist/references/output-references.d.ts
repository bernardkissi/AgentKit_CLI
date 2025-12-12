export interface OutputRef {
    stepId: string;
    key: string;
}
/**
 * Extracts references like:
 * - steps.stepA.outputs.text
 * - steps.stepA.outputs["text"] (optional)
 *
 * Conservative regex: v1 focuses on dot form.
 */
export declare function extractOutputRefs(expr: string): OutputRef[];
