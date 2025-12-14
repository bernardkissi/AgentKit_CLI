export type PluginSource = "npm" | "local";

export interface PluginProvenance {
    source: PluginSource;
    spec: string;        // what user wrote
    resolved: string;    // resolved identifier (name@version or absolute path)
    name?: string;       // npm package name
    version?: string;    // resolved version
    path?: string;       // resolved absolute path
}