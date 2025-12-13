export interface LintOptions {
    format: "text" | "json";
    strict: boolean;
}
export declare function runLint(filePath: string, opts: LintOptions): {
    exitCode: number;
    output: string;
};
