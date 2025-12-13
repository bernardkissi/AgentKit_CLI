"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenize = tokenize;
const ILLEGAL = /[;`{}]/;
function tokenize(expr) {
    if (ILLEGAL.test(expr))
        return { ok: false, error: "Illegal character in expression" };
    const s = expr.trim();
    const tokens = [];
    let i = 0;
    const isAlpha = (c) => /[A-Za-z_]/.test(c);
    const isAlnum = (c) => /[A-Za-z0-9_]/.test(c);
    const isDigit = (c) => /[0-9]/.test(c);
    while (i < s.length) {
        const c = s[i];
        if (/\s/.test(c)) {
            i++;
            continue;
        }
        if (c === ".") {
            tokens.push({ type: "dot", value: ".", pos: i });
            i++;
            continue;
        }
        if (c === "(") {
            tokens.push({ type: "lparen", value: "(", pos: i });
            i++;
            continue;
        }
        if (c === ")") {
            tokens.push({ type: "rparen", value: ")", pos: i });
            i++;
            continue;
        }
        if (c === "[") {
            tokens.push({ type: "lbrack", value: "[", pos: i });
            i++;
            continue;
        }
        if (c === "]") {
            tokens.push({ type: "rbrack", value: "]", pos: i });
            i++;
            continue;
        }
        // strings (no escape handling v1)
        if (c === "'" || c === '"') {
            const quote = c;
            let j = i + 1;
            while (j < s.length && s[j] !== quote)
                j++;
            if (j >= s.length)
                return { ok: false, error: "Unterminated string literal" };
            tokens.push({ type: "string", value: s.slice(i, j + 1), pos: i });
            i = j + 1;
            continue;
        }
        // number
        if (isDigit(c)) {
            let j = i + 1;
            while (j < s.length && /[0-9.]/.test(s[j]))
                j++;
            tokens.push({ type: "number", value: s.slice(i, j), pos: i });
            i = j;
            continue;
        }
        // identifier
        if (isAlpha(c)) {
            let j = i + 1;
            while (j < s.length && isAlnum(s[j]))
                j++;
            const ident = s.slice(i, j);
            // keywords to forbid (safety hardening)
            const forbidden = new Set(["function", "new", "while", "for", "return", "class", "import", "eval"]);
            if (forbidden.has(ident))
                return { ok: false, error: `Forbidden keyword: ${ident}` };
            tokens.push({ type: "ident", value: ident, pos: i });
            i = j;
            continue;
        }
        // operators (multi-char first)
        const two = s.slice(i, i + 2);
        const ops2 = new Set(["==", "!=", "<=", ">=", "&&", "||"]);
        if (ops2.has(two)) {
            tokens.push({ type: "op", value: two, pos: i });
            i += 2;
            continue;
        }
        const ops1 = new Set(["+", "-", "*", "/", "%", "<", ">", "!"]);
        if (ops1.has(c)) {
            tokens.push({ type: "op", value: c, pos: i });
            i++;
            continue;
        }
        return { ok: false, error: `Unexpected character '${c}' at ${i}` };
    }
    return { ok: true, tokens };
}
//# sourceMappingURL=tokenize.js.map