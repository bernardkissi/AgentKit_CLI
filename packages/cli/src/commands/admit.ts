import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { runValidate } from "./validate";
import { verifyBundle } from "./bundle";

function isBundle(p: string) {
    return p.toLowerCase().endsWith(".agentkit");
}

function writeBufferToTemp(name: string, buf: Buffer): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-admit-"));
    const outPath = path.join(dir, path.basename(name));
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, buf);
    return outPath;
}

export async function runAdmit(target: string, policy: string): Promise<{ exitCode: number; output: string }> {
    try {
        let agentPath = target;
        if (isBundle(target)) {
            const { manifest, agentBuffer } = verifyBundle(target);
            agentPath = writeBufferToTemp(manifest.agent_path, agentBuffer);
        }

        const res = await runValidate(agentPath, { format: "json", policy: policy || "runtime" });
        return res;
    } catch (e: any) {
        const msg = e?.message || String(e);
        return { exitCode: 2, output: msg + "\n" };
    }
}
