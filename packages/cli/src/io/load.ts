import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

export function loadDoc(filePath: string): { doc: unknown; format: "json"|"yaml" } {
  const raw = fs.readFileSync(filePath, "utf8");
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".yaml" || ext === ".yml") {
    return { doc: YAML.parse(raw), format: "yaml" };
  }
  // default JSON
  return { doc: JSON.parse(raw), format: "json" };
}
