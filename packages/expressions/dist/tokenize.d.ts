export type TokenType = "ident" | "number" | "string" | "op" | "dot" | "lparen" | "rparen" | "lbrack" | "rbrack";
export interface Token {
    type: TokenType;
    value: string;
    pos: number;
}
export declare function tokenize(expr: string): {
    ok: true;
    tokens: Token[];
} | {
    ok: false;
    error: string;
};
