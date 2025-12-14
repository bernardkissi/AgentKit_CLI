import type { StepRegistry } from "./types";

export function mergeRegistries(base: StepRegistry, extras: StepRegistry[]): StepRegistry {
    const merged: StepRegistry = { ...base };

    for (const reg of extras) {
        for (const [type, def] of Object.entries(reg)) {
            if (merged[type]) {
                throw new Error(`Duplicate step type '${type}' from plugin registry`);
            }
            merged[type] = def as any;
        }
    }

    return merged;
}
