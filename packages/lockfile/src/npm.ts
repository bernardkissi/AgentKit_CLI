import fs from "node:fs";
import type { ResolvedPackage } from "./types";

export function resolveFromNpm(lockfilePath: string, pkgName: string): ResolvedPackage | null {
  const data = JSON.parse(fs.readFileSync(lockfilePath, "utf8"));
  const packages = data.packages ?? {};

  const pkgKey = `node_modules/${pkgName}`;
  if (packages[pkgKey]) {
    const entry = packages[pkgKey];
    return {
      name: pkgName,
      version: entry.version,
      integrity: entry.integrity ?? entry.resolution?.integrity
    };
  }

  const dep = data.dependencies?.[pkgName];
  if (dep?.version) {
    return {
      name: pkgName,
      version: dep.version,
      integrity: dep.integrity
    };
  }

  return null;
}
