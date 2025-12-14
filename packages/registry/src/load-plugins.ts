import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { StepRegistry, AgentKitPluginModule } from "./types";

function isPathLike(s: string) {
    return s.startsWith("./") || s.startsWith("../") || s.startsWith("/") || s.startsWith("file:");
}

function normalizeSpecifier(spec: string, projectRoot: string) {
    if (isPathLike(spec)) {
        if (spec.startsWith("file:")) {
            return fileURLToPath(spec);
        }
        return path.isAbsolute(spec) ? spec : path.resolve(projectRoot, spec);
    }
    return spec;
}

async function importBySpecifier(spec: string, projectRoot: string) {
    const normalized = normalizeSpecifier(spec, projectRoot);
    // Require handles CommonJS plugins. For ESM plugins, fall back to dynamic import.
    try {
        return require(normalized) as AgentKitPluginModule;
    } catch {
        return import(pathToFileURL(normalized).href) as Promise<AgentKitPluginModule>;
    }
}

export async function loadPluginRegistries(
    plugins: string[],
    projectRoot: string
): Promise<StepRegistry[]> {
    const registries: StepRegistry[] = [];

    for (const plugin of plugins) {
        const mod = (await importBySpecifier(plugin, projectRoot)) as AgentKitPluginModule;
        const registry = mod.agentkitRegistry ?? mod.default;

        if (!registry || typeof registry !== "object") {
            throw new Error(
                `Plugin '${plugin}' does not export agentkitRegistry or default StepRegistry`
            );
        }

        registries.push(registry as StepRegistry);
    }

    return registries;
}
