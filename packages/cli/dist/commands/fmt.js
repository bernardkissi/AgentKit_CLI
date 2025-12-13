"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortKeysDeep = sortKeysDeep;
exports.runFmt = runFmt;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const yaml_1 = __importDefault(require("yaml"));
function isPlainObject(x) {
    return !!x && typeof x === "object" && !Array.isArray(x);
}
/** Deep sort keys for deterministic formatting */
function sortKeysDeep(value) {
    if (Array.isArray(value))
        return value.map(sortKeysDeep);
    if (isPlainObject(value)) {
        const out = {};
        for (const k of Object.keys(value).sort())
            out[k] = sortKeysDeep(value[k]);
        return out;
    }
    return value;
}
function runFmt(filePath, opts) {
    try {
        const ext = node_path_1.default.extname(filePath).toLowerCase();
        const raw = node_fs_1.default.readFileSync(filePath, "utf8");
        const isYaml = ext === ".yaml" || ext === ".yml";
        const doc = isYaml ? yaml_1.default.parse(raw) : JSON.parse(raw);
        const normalized = sortKeysDeep(doc);
        let formatted;
        if (isYaml) {
            formatted = yaml_1.default.stringify(normalized, { indent: 2 });
        }
        else {
            formatted = JSON.stringify(normalized, null, 2) + "\n";
        }
        if (opts.stdout)
            return { exitCode: 0, output: formatted };
        node_fs_1.default.writeFileSync(filePath, formatted, "utf8");
        return { exitCode: 0 };
    }
    catch (e) {
        return { exitCode: 2, output: String(e?.message || e) + "\n" };
    }
}
//# sourceMappingURL=fmt.js.map