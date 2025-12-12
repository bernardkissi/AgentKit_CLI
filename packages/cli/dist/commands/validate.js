"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runValidate = runValidate;
const validator_1 = require("@agentkit/validator");
const load_1 = require("../io/load");
const text_1 = require("../reporting/text");
const json_1 = require("../reporting/json");
function runValidate(filePath, opts) {
    try {
        const { doc } = (0, load_1.loadDoc)(filePath);
        const structural = (0, validator_1.validateStructural)(doc);
        // attach file to findings
        let findings = structural.findings.map((f) => ({
            ...f,
            file: filePath,
        }));
        // Only run semantic validation if structural validation succeeded
        if (structural.ok) {
            const semantic = (0, validator_1.validateSemantic)(doc).map((f) => ({
                ...f,
                file: filePath,
            }));
            findings = findings.concat(semantic);
        }
        const hasErrors = findings.some((f) => f.severity === 'error');
        const hasWarnings = findings.some((f) => f.severity === 'warning');
        const fail = hasErrors || (opts.strict && hasWarnings);
        const out = opts.format === 'json' ? (0, json_1.renderJson)(findings) : (0, text_1.renderText)(findings);
        return { exitCode: fail ? 1 : 0, output: out };
    }
    catch (e) {
        const msg = e?.message || String(e);
        const findings = [
            {
                code: 'E_CLI_INTERNAL',
                severity: 'error',
                message: msg,
                file: filePath,
                jsonPath: '$',
            },
        ];
        const out = opts.format === 'json' ? (0, json_1.renderJson)(findings) : (0, text_1.renderText)(findings);
        return { exitCode: 2, output: out };
    }
}
//# sourceMappingURL=validate.js.map