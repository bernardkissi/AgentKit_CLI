"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RULES = void 0;
exports.getRule = getRule;
exports.listRules = listRules;
exports.RULES = {
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
    }
};
function getRule(code) {
    return exports.RULES[code];
}
function listRules() {
    return Object.values(exports.RULES).sort((a, b) => a.code.localeCompare(b.code));
}
//# sourceMappingURL=rule-catalog.js.map