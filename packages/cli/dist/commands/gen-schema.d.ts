export interface GenSchemaOptions {
    outDir: string;
}
export declare function runGenSchema(opts: GenSchemaOptions): {
    exitCode: number;
    output?: string;
};
