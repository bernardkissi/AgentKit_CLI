export interface BundleManifest {
    format_version: "1.0";
    agent_path: string; // "agent.yaml"
    created_at: string; // ISO date
    sha256: {
        agent: string; // sha256 hex of agent file
        assets?: Record<string, string>;
    };
    metadata?: Record<string, any>;
    plugins?: {
        resolved: Array<{
            source: "npm" | "local";
            name?: string;
            version?: string;
            path?: string;
            integrity?: string;
            spec: string;
        }>;
    };
    lockfile?: {
        kind: "pnpm" | "npm" | "yarn";
        path: string;     // relative path from project root
        sha256: string;   // sha256 hex of lockfile content
    };
}
