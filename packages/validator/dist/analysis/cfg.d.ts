export interface CfgEdge {
    from: string;
    to: string;
    jsonPath: string;
}
export interface Cfg {
    nodes: Set<string>;
    edges: CfgEdge[];
    adj: Map<string, string[]>;
}
export declare function buildCfg(doc: any): Cfg;
