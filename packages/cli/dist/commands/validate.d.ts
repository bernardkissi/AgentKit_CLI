export interface ValidateOptions {
    format: "text" | "json";
    strict: boolean;
}
export declare function runValidate(filePath: string, opts: ValidateOptions): {
    exitCode: number;
    output: string;
};
