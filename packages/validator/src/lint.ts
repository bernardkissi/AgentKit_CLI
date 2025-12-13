import type { Finding } from "./types";

export function lintAgent(doc: any): Finding[] {
    const findings: Finding[] = [];

    if (!doc.description) {
        findings.push({
            code: "W_NO_DESCRIPTION",
            severity: "warning",
            message: "Agent is missing top-level description.",
            jsonPath: "$.description"
        });
    }

    if (!doc.metadata?.owner) {
        findings.push({
            code: "W_NO_METADATA_OWNER",
            severity: "warning",
            message: "metadata.owner is recommended for accountability.",
            jsonPath: "$.metadata.owner"
        });
    }

    if (!doc.error_handling) {
        findings.push({
            code: "W_MISSING_ERROR_HANDLING",
            severity: "warning",
            message: "error_handling is recommended to standardize failures and retries.",
            jsonPath: "$.error_handling"
        });
    }

    const steps = Array.isArray(doc.steps) ? doc.steps : [];
    for (const s of steps) {
        const isAction = typeof s.type === "string" && s.type.startsWith("action.");
        if (isAction && !s?.params?.idempotency_key) {
            findings.push({
                code: "W_ACTION_NO_IDEMPOTENCY",
                severity: "warning",
                message: `Action step '${s.id}' is missing params.idempotency_key (recommended).`,
                jsonPath: `$.steps[?(@.id=="${s.id}")].params.idempotency_key`
            });
        }
    }

    return findings;
}