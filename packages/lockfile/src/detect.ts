import fs from "node:fs";
import path from "node:path";
import { sha256File } from "./sha";
import type { LockfileInfo } from "./types";

export function detectLockfile(projectRoot: string): LockfileInfo | null {
  const candidates = [
    { kind: "pnpm" as const, file: "pnpm-lock.yaml" },
    { kind: "npm" as const, file: "package-lock.json" },
    { kind: "yarn" as const, file: "yarn.lock" }
  ];

  for (const c of candidates) {
    const abs = path.join(projectRoot, c.file);
    if (fs.existsSync(abs)) {
      return {
        kind: c.kind,
        path: abs,
        relPath: c.file,
        sha256: sha256File(abs)
      };
    }
  }
  return null;
}
