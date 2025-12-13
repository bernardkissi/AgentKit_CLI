export interface RulesOptions {
    code?: string;
}
export declare function runRules(opts: RulesOptions): {
    exitCode: number;
    output: string;
};
