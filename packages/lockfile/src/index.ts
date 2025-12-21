export * from "./types";
export * from "./detect";
export * from "./sha";
export * from "./pnpm";
export * from "./npm";
export * from "./yarn";

import type { LockfileInfo, ResolvedPackage } from "./types";
import { resolveFromPnpm } from "./pnpm";
import { resolveFromNpm } from "./npm";
import { resolveFromYarn } from "./yarn";

export function resolvePackageVersion(info: LockfileInfo, name: string): ResolvedPackage | null {
  if (info.kind === "pnpm") return resolveFromPnpm(info.path, name);
  if (info.kind === "npm") return resolveFromNpm(info.path, name);
  return resolveFromYarn(info.path, name);
}
