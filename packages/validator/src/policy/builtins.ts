import type { PolicyPack } from "./types";

export const POLICY_DEFAULT: PolicyPack = {
    name: "default",
    description: "Default validation (errors fail, warnings pass).",
    enabled: {}
};

export const POLICY_STRICT: PolicyPack = {
    name: "strict",
    description: "Strict validation (warnings treated as errors).",
    enabled: {},
    severityOverrides: {}
};

export const POLICY_RUNTIME: PolicyPack = {
    name: "runtime",
    description: "Fast preflight checks suitable for runtime admission control.",
    enabled: {
        // Example: cycles and unreachable might be excluded for speed
        W_UNREACHABLE_STEP: false
    }
};

export const POLICY_CI: PolicyPack = {
    name: "ci",
    description: "CI policy: strict + governance checks (warnings escalated, pins enforced in CLI).",
    enabled: {},
    severityOverrides: {}
};

export const BUILTIN_POLICIES = [POLICY_DEFAULT, POLICY_STRICT, POLICY_RUNTIME, POLICY_CI];
