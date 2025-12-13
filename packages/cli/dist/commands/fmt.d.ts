/** Deep sort keys for deterministic formatting */
export declare function sortKeysDeep(value: any): any;
export interface FmtOptions {
    stdout: boolean;
}
export declare function runFmt(filePath: string, opts: FmtOptions): {
    exitCode: number;
    output?: string;
};
