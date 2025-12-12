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
  export function extractOutputRefs(expr: string): OutputRef[] {
    const refs: OutputRef[] = [];
  
    // Dot form: steps.<id>.outputs.<key>
    const dot = /\bsteps\.([A-Za-z_][A-Za-z0-9_-]*)\.outputs\.([A-Za-z_][A-Za-z0-9_-]*)\b/g;
    let m: RegExpExecArray | null;
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