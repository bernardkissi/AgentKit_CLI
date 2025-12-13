"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLint = runLint;
const validator_1 = require("@agentkit/validator");
const load_1 = require("../io/load");
const text_1 = require("../reporting/text");
const json_1 = require("../reporting/json");
function runLint(filePath, opts) {
    try {
        const { doc } = (0, load_1.loadDoc)(filePath);
        const findings = (0, validator_1.lintAgent)(doc).map(f => ({ ...f, file: filePath }));
        const hasWarnings = findings.some(f => f.severity === "warning");
        const fail = opts.strict && hasWarnings;
        const out = opts.format === "json" ? (0, json_1.renderJson)(findings) : (0, text_1.renderText)(findings);
        return { exitCode: fail ? 1 : 0, output: out };
    }
    catch (e) {
        const out = `[ERROR] E_CLI_INTERNAL: ${String(e?.message || e)} (${filePath} $)\n`;
        return { exitCode: 2, output: out };
    }
}
//# sourceMappingURL=lint.js.map