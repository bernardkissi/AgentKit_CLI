import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { StepRegistry, AgentKitPluginModule } from "./types";
import type { PluginProvenance } from "./provenance";

export type PluginSpec =
    | string
    | { name: string; pin?: string }
    | { path: string };

function isPathLike(s: string) {
    return s.startsWith("./") || s.startsWith("../") || s.startsWith("/") || s.startsWith("file:");
}

function normalize(spec: PluginSpec):
    | { kind: "npm"; name: string; pin?: string; raw: string }
    | { kind: "local"; path: string; raw: string } {
    if (typeof spec === "string") {
        if (isPathLike(spec)) return { kind: "local", path: spec, raw: spec };
        return { kind: "npm", name: spec, raw: spec };
    }
    if ((spec as any).path) return { kind: "local", path: (spec as any).path, raw: JSON.stringify(spec) };
    return { kind: "npm", name: (spec as any).name, pin: (spec as any).pin, raw: JSON.stringify(spec) };
}

function normalizePath(p: string, projectRoot: string) {
    if (p.startsWith("file:")) return fileURLToPath(p);
    return path.isAbsolute(p) ? p : path.resolve(projectRoot, p);
}

async function importLocal(p: string, projectRoot: string) {
    const abs = normalizePath(p, projectRoot);
    try {
        return require(abs);
    } catch {
        return import(pathToFileURL(abs).href);
    }
}

async function importNpm(name: string) {
    return import(name);
}

/**
 * NOTE: Version resolution is best-effort in Stage 9.
 * For full correctness, Stage 10 can parse lockfile(s).
 */
async function resolvePackageVersion(pkgName: string): Promise<string | undefined> {
    try {
        const mod = require(`${pkgName}/package.json`);
        return mod?.version;
    } catch {
        return undefined;
    }
}

export async function loadTrustedPluginRegistries(args: {
    plugins: PluginSpec[];
    projectRoot: string;
    trustAllow?: string[];
    trustDeny?: string[];
    requirePins?: boolean;
}): Promise<{ registries: StepRegistry[]; provenance: PluginProvenance[] }> {

    const registries: StepRegistry[] = [];
    const provenance: PluginProvenance[] = [];

    const deny = new Set(args.trustDeny ?? []);
    const allow = args.trustAllow ? new Set(args.trustAllow) : null;

    for (const s of args.plugins ?? []) {
        const n = normalize(s);

        if (n.kind === "npm") {
            if (deny.has(n.name)) throw new Error(`E_PLUGIN_UNTRUSTED: denied plugin '${n.name}'`);
            if (allow && !allow.has(n.name)) throw new Error(`E_PLUGIN_UNTRUSTED: '${n.name}' not in allowlist`);
            if (args.requirePins && !n.pin) throw new Error(`E_PLUGIN_VERSION_UNPINNED: '${n.name}' missing pin`);

            const mod = (await importNpm(n.name)) as AgentKitPluginModule;
            const reg = mod.agentkitRegistry ?? mod.default;
            if (!reg || typeof reg !== "object") throw new Error(`E_PLUGIN_LOAD_FAILED: '${n.name}' invalid exports`);

            const version = await resolvePackageVersion(n.name);
            if (n.pin && version && version !== n.pin) {
                throw new Error(`E_PLUGIN_VERSION_UNPINNED: '${n.name}' resolved version ${version} does not match pin ${n.pin}`);
            }

            registries.push(reg as StepRegistry);
            provenance.push({
                source: "npm",
                spec: n.raw,
                resolved: `${n.name}@${version ?? "unknown"}`,
                name: n.name,
                version
            });
        } else {
            const abs = n.path.startsWith("file:") ? n.path : path.resolve(args.projectRoot, n.path);
            const mod = (await importLocal(n.path, args.projectRoot)) as AgentKitPluginModule;
            const reg = mod.agentkitRegistry ?? mod.default;
            if (!reg || typeof reg !== "object") throw new Error(`E_PLUGIN_LOAD_FAILED: local plugin '${n.path}' invalid exports`);

            registries.push(reg as StepRegistry);
            provenance.push({
                source: "local",
                spec: n.raw,
                resolved: abs,
                path: abs
            });
        }
    }

    return { registries, provenance };
}
