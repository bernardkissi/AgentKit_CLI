export type Severity = "error" | "warning";

export interface Finding {
  code: string;
  severity: Severity;
  message: string;
  file?: string;
  jsonPath?: string;
  hint?: string;
}
