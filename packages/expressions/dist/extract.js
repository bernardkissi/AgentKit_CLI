"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractExpressions = extractExpressions;
const EXPR_BLOCK = /{{\s*([^}]+?)\s*}}/g;
function isPlainObject(x) {
    return !!x && typeof x === 'object' && !Array.isArray(x);
}
function extractExpressions(value, basePath = '$') {
    const out = [];
    if (typeof value === 'string') {
        let m;
        EXPR_BLOCK.lastIndex = 0;
        while ((m = EXPR_BLOCK.exec(value)) !== null) {
            out.push({
                jsonPath: basePath,
                expr: m[1].trim(),
            });
        }
        return out;
    }
    if (Array.isArray(value)) {
        value.forEach((v, i) => {
            out.push(...extractExpressions(v, `${basePath}[${i}]`));
        });
        return out;
    }
    if (isPlainObject(value)) {
        for (const [k, v] of Object.entries(value)) {
            out.push(...extractExpressions(v, `${basePath}.${k}`));
        }
        return out;
    }
    return out;
}
//# sourceMappingURL=extract.js.map