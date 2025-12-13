import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

function isPlainObject(x: any): x is Record<string, any> {
    return !!x && typeof x === "object" && !Array.isArray(x);
}

/** Deep sort keys for deterministic formatting */
export function sortKeysDeep(value: any): any {
    if (Array.isArray(value)) return value.map(sortKeysDeep);
    if (isPlainObject(value)) {
        const out: Record<string, any> = {};
        for (const k of Object.keys(value).sort()) out[k] = sortKeysDeep(value[k]);
        return out;
    }
    return value;
}

export interface FmtOptions {
    stdout: boolean;
}

export function runFmt(filePath: string, opts: FmtOptions): { exitCode: number; output?: string } {
    try {
        const ext = path.extname(filePath).toLowerCase();
        const raw = fs.readFileSync(filePath, "utf8");
        const isYaml = ext === ".yaml" || ext === ".yml";

        const doc = isYaml ? YAML.parse(raw) : JSON.parse(raw);
        const normalized = sortKeysDeep(doc);

        let formatted: string;
        if (isYaml) {
            formatted = YAML.stringify(normalized, { indent: 2 });
        } else {
            formatted = JSON.stringify(normalized, null, 2) + "\n";
        }

        if (opts.stdout) return { exitCode: 0, output: formatted };
        fs.writeFileSync(filePath, formatted, "utf8");
        return { exitCode: 0 };
    } catch (e: any) {
        return { exitCode: 2, output: String(e?.message || e) + "\n" };
    }
}
