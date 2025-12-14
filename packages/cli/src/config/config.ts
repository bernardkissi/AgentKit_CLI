import fs from "node:fs";
import path from "node:path";

// export interface AgentKitConfig {
//     plugins?: string[]; // package names
// }

export function loadConfig(cwd = process.cwd()): AgentKitConfig {
    const p = path.join(cwd, "agentkit.config.json");
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, "utf8"));
}

export type PluginSpec =
    | string
    | { name: string; pin?: string }
    | { path: string };

export interface TrustConfig {
    allow?: string[];
    deny?: string[];
    requirePinnedVersionsInCi?: boolean;
}

export interface AgentKitConfig {
    plugins?: PluginSpec[];
    trust?: TrustConfig;
}