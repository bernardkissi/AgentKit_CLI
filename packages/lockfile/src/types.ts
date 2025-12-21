export type LockfileKind = "pnpm" | "npm" | "yarn";

export interface LockfileInfo {
  kind: LockfileKind;
  path: string;     // absolute path
  relPath: string;  // relative path from project root
  sha256: string;
}

export interface ResolvedPackage {
  name: string;
  version: string;
  integrity?: string;
}
