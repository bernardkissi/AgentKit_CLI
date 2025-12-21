import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { ResolvedPackage } from "./types";

function parsePackageKey(key: string): { name: string; version?: string } | null {
  const parts = key.split("/").filter(Boolean);
  if (!parts.length) return null;
  if (parts[0].startsWith("@")) {
    if (parts.length < 3) return null;
    return { name: `${parts[0]}/${parts[1]}`, version: parts[2] };
  }
  if (parts.length < 2) return null;
  return { name: parts[0], version: parts[1] };
}

export function resolveFromPnpm(lockfilePath: string, pkgName: string): ResolvedPackage | null {
  const raw = fs.readFileSync(lockfilePath, "utf8");
  const data = YAML.parse(raw) || {};
  const packages = data.packages ?? {};
  const rootDir = path.dirname(lockfilePath);

  // Build map from packages section
  const candidates: ResolvedPackage[] = [];
  for (const [key, val] of Object.entries<any>(packages)) {
    const parsed = parsePackageKey(key);
    if (!parsed || parsed.name !== pkgName) continue;
    let version = val?.version ?? parsed.version;
    if (version && version.startsWith("link:")) {
      const rel = version.replace("link:", "");
      const pkgJson = path.join(rootDir, rel, "package.json");
      if (fs.existsSync(pkgJson)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgJson, "utf8"));
          version = pkg.version || version;
        } catch {
          // ignore
        }
      }
    }
    if (!version) continue;
    candidates.push({
      name: pkgName,
      version,
      integrity: val?.resolution?.integrity
    });
  }

  if (candidates.length) return candidates[0];

  // Fallback: check importer declared versions
  const importer = data.importers?.["."] ?? {};
  const decl = importer?.dependencies?.[pkgName]
    ?? importer?.devDependencies?.[pkgName]
    ?? importer?.optionalDependencies?.[pkgName];
  const declVersion = typeof decl === "string" ? decl : (decl?.version as string | undefined);
  if (typeof declVersion === "string") {
    let version = declVersion;
    if (version.startsWith("link:")) {
      const rel = version.replace("link:", "");
      const pkgJson = path.join(rootDir, rel, "package.json");
      if (fs.existsSync(pkgJson)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgJson, "utf8"));
          version = pkg.version || version;
        } catch {
          // ignore
        }
      }
    }
    return { name: pkgName, version };
  }

  return null;
}
