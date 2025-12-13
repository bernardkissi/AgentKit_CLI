"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRules = runRules;
const validator_1 = require("@agentkit/validator");
function runRules(opts) {
    if (opts.code) {
        const r = (0, validator_1.getRule)(opts.code);
        if (!r)
            return { exitCode: 1, output: `Unknown rule code: ${opts.code}\n` };
        return { exitCode: 0, output: JSON.stringify(r, null, 2) + "\n" };
    }
    return { exitCode: 0, output: JSON.stringify((0, validator_1.listRules)(), null, 2) + "\n" };
}
//# sourceMappingURL=rules.js.map