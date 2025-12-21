import fs from "node:fs";
import type { ResolvedPackage } from "./types";

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function resolveFromYarn(lockfilePath: string, pkgName: string): ResolvedPackage | null {
  const content = fs.readFileSync(lockfilePath, "utf8");

  // Yarn v1 style: "<name>@...:\n  version "x.y.z"\n  resolved ..."
  const pattern = new RegExp(`^"?${escapeRegExp(pkgName)}@[^:]*:`, "m");
  const match = pattern.exec(content);
  if (match) {
    const rest = content.slice(match.index);
    const versionMatch = rest.match(/version\s+"([^"]+)"/);
    if (versionMatch) {
      return { name: pkgName, version: versionMatch[1] };
    }
  }

  // Basic Yarn v3 support: entries like <name>@npm:x.y.z
  const v3Pattern = new RegExp(`^"${escapeRegExp(pkgName)}@npm:([^"]+)":`, "m");
  const v3Match = v3Pattern.exec(content);
  if (v3Match) {
    return { name: pkgName, version: v3Match[1] };
  }

  return null;
}
