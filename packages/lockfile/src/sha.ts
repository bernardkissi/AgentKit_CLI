import fs from "node:fs";
import crypto from "node:crypto";

export function sha256Bytes(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function sha256File(filePath: string): string {
  const b = fs.readFileSync(filePath);
  return sha256Bytes(b);
}
