import { AgentDefinitionSchema, supportedSchemaVersions } from "@agentkit/schema";
import type { Finding } from "./types";

export function validateStructural(doc: unknown): { ok: boolean; findings: Finding[] } {
  const findings: Finding[] = [];
  const parsed = AgentDefinitionSchema.safeParse(doc);

  if (!parsed.success) {
    findings.push({
      code: "E_SCHEMA_INVALID",
      severity: "error",
      message: parsed.error.issues.map(i => `${i.path.join(".") || "$"}: ${i.message}`).join("; "),
      jsonPath: "$"
    });
    return { ok: false, findings };
  }

  const schemaVersion = (parsed.data as any).schema_version;
  if (!supportedSchemaVersions.includes(schemaVersion)) {
    findings.push({
      code: "E_SCHEMA_VERSION_UNSUPPORTED",
      severity: "error",
      message: `Unsupported schema_version: ${schemaVersion}. Supported: ${supportedSchemaVersions.join(", ")}`,
      jsonPath: "$.schema_version"
    });
    return { ok: false, findings };
  }

  return { ok: true, findings };
}
