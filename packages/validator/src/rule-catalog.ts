export type RuleSeverity = "error" | "warning";

export interface RuleMeta {
    code: string;
    defaultSeverity: RuleSeverity;
    title: string;
    description: string;
    hint?: string;
    rfc?: string;
}

export const RULES: Record<string, RuleMeta> = {
    E_SCHEMA_INVALID: {
        code: "E_SCHEMA_INVALID",
        defaultSeverity: "error",
        title: "Schema invalid",
        description: "The agent definition failed structural validation against the Zod schema.",
        hint: "Fix the reported field paths and types.",
        rfc: "RFC-0013"
    },
    E_SCHEMA_VERSION_UNSUPPORTED: {
        code: "E_SCHEMA_VERSION_UNSUPPORTED",
        defaultSeverity: "error",
        title: "Unsupported schema version",
        description: "schema_version is not supported by this CLI/runtime version.",
        hint: "Update the CLI or change schema_version to a supported value.",
        rfc: "RFC-0001"
    },

    E_STEP_ID_DUPLICATE: {
        code: "E_STEP_ID_DUPLICATE",
        defaultSeverity: "error",
        title: "Duplicate step id",
        description: "Two or more steps share the same id.",
        hint: "Make all step.id values unique.",
        rfc: "RFC-0003"
    },
    E_FLOW_ENTRYPOINT_MISSING: {
        code: "E_FLOW_ENTRYPOINT_MISSING",
        defaultSeverity: "error",
        title: "Entrypoint missing",
        description: "flow.entrypoint does not match any step.id.",
        hint: "Set flow.entrypoint to an existing step id.",
        rfc: "RFC-0003"
    },
    E_FLOW_TARGET_MISSING: {
        code: "E_FLOW_TARGET_MISSING",
        defaultSeverity: "error",
        title: "Flow target missing",
        description: "A step flow pointer references a step id that does not exist.",
        hint: "Fix flow pointers (next/true_next/false_next/cases) to existing steps.",
        rfc: "RFC-0003"
    },
    E_CONNECTION_MISSING: {
        code: "E_CONNECTION_MISSING",
        defaultSeverity: "error",
        title: "Connection missing",
        description: "A step references a runtime connection key that is not defined.",
        hint: "Add the connection under runtime.connections or fix params.connection.",
        rfc: "RFC-0009"
    },

    E_EXPR_PARSE: {
        code: "E_EXPR_PARSE",
        defaultSeverity: "error",
        title: "Expression parse error",
        description: "An expression inside {{ ... }} is syntactically invalid.",
        hint: "Fix expression syntax and ensure parentheses are balanced.",
        rfc: "RFC-0002"
    },
    E_EXPR_NAMESPACE: {
        code: "E_EXPR_NAMESPACE",
        defaultSeverity: "error",
        title: "Illegal expression namespace",
        description: "Expression references a root namespace that is not allowed.",
        hint: "Use one of: input, steps, runtime, connections.",
        rfc: "RFC-0002"
    },

    E_OUTPUT_REFERENCE_INVALID: {
        code: "E_OUTPUT_REFERENCE_INVALID",
        defaultSeverity: "error",
        title: "Invalid output reference",
        description: "Expression references steps.<id>.outputs.<key> that does not exist or is not declared.",
        hint: "Declare the output key on the referenced step or fix the expression reference.",
        rfc: "RFC-0008"
    },
    E_SECRET_INLINE: {
        code: "E_SECRET_INLINE",
        defaultSeverity: "warning",
        title: "Inline secret detected",
        description: "Potential secret/token detected inline instead of a secret reference.",
        hint: "Move secrets to a secret manager and reference them with {$secret: \"name\"}.",
        rfc: "RFC-0018"
    },
    E_PERMISSION_MISSING: {
        code: "E_PERMISSION_MISSING",
        defaultSeverity: "error",
        title: "Required permission missing",
        description: "A step requires a capability that is not declared in agent.permissions.",
        hint: "Declare the needed connector/network/llm capability in agent.permissions.",
        rfc: "RFC-0017"
    },
    E_PERMISSION_DENIED: {
        code: "E_PERMISSION_DENIED",
        defaultSeverity: "error",
        title: "Permission denied by policy",
        description: "A required capability conflicts with a deny rule (e.g., egress host denied).",
        hint: "Update permissions deny/allow lists to permit the required host.",
        rfc: "RFC-0017"
    },
    W_PERMISSION_OVERBROAD: {
        code: "W_PERMISSION_OVERBROAD",
        defaultSeverity: "warning",
        title: "Permissions overbroad",
        description: "Permissions are declared that are not used by any step.",
        hint: "Remove unused permissions for least privilege.",
        rfc: "RFC-0017"
    },

    W_UNREACHABLE_STEP: {
        code: "W_UNREACHABLE_STEP",
        defaultSeverity: "warning",
        title: "Unreachable step",
        description: "A step cannot be reached from flow.entrypoint.",
        hint: "Remove the step or connect it through flow pointers.",
        rfc: "RFC-0003"
    },
    E_CYCLE_DETECTED: {
        code: "E_CYCLE_DETECTED",
        defaultSeverity: "error",
        title: "Cycle detected",
        description: "Control flow contains a directed cycle (disallowed in schema v1).",
        hint: "Remove the cycle or introduce an approved loop step type in a future schema version.",
        rfc: "RFC-0003"
    },

    // Lint rules (Stage 5)
    W_NO_DESCRIPTION: {
        code: "W_NO_DESCRIPTION",
        defaultSeverity: "warning",
        title: "Missing description",
        description: "Agent has no top-level description.",
        hint: "Add a concise description for maintainability.",
        rfc: "RFC-0014"
    },
    W_NO_METADATA_OWNER: {
        code: "W_NO_METADATA_OWNER",
        defaultSeverity: "warning",
        title: "Missing metadata.owner",
        description: "metadata.owner is recommended for accountability.",
        hint: "Add metadata.owner as a team or individual identifier.",
        rfc: "RFC-0014"
    },
    W_MISSING_ERROR_HANDLING: {
        code: "W_MISSING_ERROR_HANDLING",
        defaultSeverity: "warning",
        title: "Missing error_handling",
        description: "Agent has no error_handling block.",
        hint: "Define a standard retry/backoff and failure routing policy.",
        rfc: "RFC-0007"
    },
    W_ACTION_NO_IDEMPOTENCY: {
        code: "W_ACTION_NO_IDEMPOTENCY",
        defaultSeverity: "warning",
        title: "Missing idempotency key",
        description: "Action step lacks params.idempotency_key.",
        hint: "Add params.idempotency_key for safe retries.",
        rfc: "RFC-0014"
    },
    E_STEP_TYPE_UNKNOWN: {
        code: "E_STEP_TYPE_UNKNOWN",
        defaultSeverity: "error",
        title: "Unknown step type",
        description: "Step type is not registered.",
        hint: "Add the step type to the registry or fix the step type.",
        rfc: "RFC-0014"
    },
    E_STEP_PARAMS_INVALID: {
        code: "E_STEP_PARAMS_INVALID",
        defaultSeverity: "error",
        title: "Invalid step params",
        description: "Step params do not match the expected schema.",
        hint: "Fix the params to match the expected schema.",
        rfc: "RFC-0014"
    },
    E_PLUGIN_NOT_FOUND: {
        code: "E_PLUGIN_NOT_FOUND",
        defaultSeverity: "error",
        title: "Plugin not found",
        description: "Plugin is not registered.",
        hint: "Add the plugin to the registry or fix the plugin name.",
        rfc: "RFC-0014"
    },
    E_PLUGIN_UNTRUSTED: {
        code: "E_PLUGIN_UNTRUSTED",
        defaultSeverity: "error",
        title: "Plugin untrusted",
        description: "Plugin is not trusted.",
        hint: "Add the plugin to the registry or fix the plugin name.",
        rfc: "RFC-0014"
    },
    E_PLUGIN_VERSION_UNPINNED: {
        code: "E_PLUGIN_VERSION_UNPINNED",
        defaultSeverity: "error",
        title: "Plugin version unpinned",
        description: "Plugin version is not pinned.",
        hint: "Add the plugin to the registry or fix the plugin name.",
        rfc: "RFC-0014"
    },
    E_PLUGIN_LOAD_FAILED: {
        code: "E_PLUGIN_LOAD_FAILED",
        defaultSeverity: "error",
        title: "Plugin load failed",
        description: "Plugin load failed.",
        hint: "Add the plugin to the registry or fix the plugin name.",
        rfc: "RFC-0014"
    },
    E_BUNDLE_ATTESTATION_INVALID: {
        code: "E_BUNDLE_ATTESTATION_INVALID",
        defaultSeverity: "warning",
        title: "Bundle attestation invalid",
        description: "Bundle manifest signature failed verification or is missing.",
        hint: "Regenerate the bundle with a trusted keypair and re-sign.",
        rfc: "RFC-0015"
    },
    E_BUNDLE_PROVENANCE_MISMATCH: {
        code: "E_BUNDLE_PROVENANCE_MISMATCH",
        defaultSeverity: "warning",
        title: "Bundle provenance mismatch",
        description: "Bundle provenance could not be verified against declared sources.",
        hint: "Recreate the bundle with correct plugin sources and lockfiles.",
        rfc: "RFC-0015"
    },
    E_LOCKFILE_MISSING: {
        code: "E_LOCKFILE_MISSING",
        defaultSeverity: "warning",
        title: "Lockfile missing",
        description: "CI policy requires a lockfile but none was found.",
        hint: "Commit pnpm-lock.yaml/package-lock.json/yarn.lock.",
        rfc: "RFC-0016"
    },
    E_LOCKFILE_UNSUPPORTED: {
        code: "E_LOCKFILE_UNSUPPORTED",
        defaultSeverity: "warning",
        title: "Lockfile unsupported",
        description: "Lockfile exists but could not be parsed.",
        hint: "Use a supported lockfile format and ensure it is valid JSON/YAML.",
        rfc: "RFC-0016"
    },
    E_PLUGIN_VERSION_UNRESOLVABLE: {
        code: "E_PLUGIN_VERSION_UNRESOLVABLE",
        defaultSeverity: "warning",
        title: "Plugin version unresolvable",
        description: "Plugin package was not found in the lockfile.",
        hint: "Ensure the plugin is installed and present in the lockfile.",
        rfc: "RFC-0016"
    },
    E_PLUGIN_PIN_MISMATCH: {
        code: "E_PLUGIN_PIN_MISMATCH",
        defaultSeverity: "warning",
        title: "Plugin pin mismatch",
        description: "Plugin pin does not match the version in the lockfile.",
        hint: "Align plugin pin with the locked version or update the lockfile.",
        rfc: "RFC-0016"
    },
    E_BUNDLE_SIGNATURE_INVALID: {
        code: "E_BUNDLE_SIGNATURE_INVALID",
        defaultSeverity: "error",
        title: "Bundle signature invalid",
        description: "manifest.json signature failed verification.",
        hint: "Recreate the bundle or ensure the correct public key is present.",
        rfc: "RFC-0015"
    },
    E_BUNDLE_HASH_MISMATCH: {
        code: "E_BUNDLE_HASH_MISMATCH",
        defaultSeverity: "error",
        title: "Bundle hash mismatch",
        description: "Bundle contents hash does not match manifest declaration.",
        hint: "Recreate the bundle to refresh hashes and signatures.",
        rfc: "RFC-0015"
    }
};

export function getRule(code: string): RuleMeta | undefined {
    return RULES[code];
}

export function listRules(): RuleMeta[] {
    return Object.values(RULES).sort((a, b) => a.code.localeCompare(b.code));
}
