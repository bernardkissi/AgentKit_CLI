import { getRule, listRules } from "@agentkit/validator";

export interface RulesOptions {
    code?: string;
}

export function runRules(opts: RulesOptions): { exitCode: number; output: string } {
    if (opts.code) {
        const r = getRule(opts.code);
        if (!r) return { exitCode: 1, output: `Unknown rule code: ${opts.code}\n` };
        return { exitCode: 0, output: JSON.stringify(r, null, 2) + "\n" };
    }
    return { exitCode: 0, output: JSON.stringify(listRules(), null, 2) + "\n" };
}