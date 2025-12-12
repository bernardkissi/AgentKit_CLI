import type { Finding } from "./types";
export declare function validateStructural(doc: unknown): {
    ok: boolean;
    findings: Finding[];
};
