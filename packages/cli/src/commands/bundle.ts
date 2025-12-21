import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import AdmZip from "adm-zip";
import { runFmt } from "./fmt";
import type { BundleManifest } from "../bundle/manifest";
import { sign, verify } from "../bundle/crypto";
import { loadConfig } from "../config/config";
import { loadTrustedPluginRegistries } from "@agentkit/registry";
import { detectLockfile, resolvePackageVersion } from "@agentkit/lockfile";
import type { LockfileInfo } from "@agentkit/lockfile";
import { runValidate } from "./validate";

export interface VerifiedBundle {
    manifest: BundleManifest;
    agentBuffer: Buffer;
}

function sha256(data: Buffer) {
    return crypto.createHash("sha256").update(data).digest("hex");
}

function ensureDir(dir: string) {
    fs.mkdirSync(dir, { recursive: true });
}

function asBuffer(value: Buffer | string) {
    return Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
}

export function verifyBundle(bundlePath: string): VerifiedBundle {
    const zip = new AdmZip(bundlePath);
        const manifestEntry = zip.getEntry("manifest.json");
        const sigEntry = zip.getEntry("signatures/manifest.sig");

        if (!manifestEntry || !sigEntry) {
            throw new Error("E_BUNDLE_ATTESTATION_INVALID: manifest or signature missing");
        }

        const manifestJson = manifestEntry.getData().toString("utf8");
        const sig = sigEntry.getData();
        const okSig = verify(manifestJson, sig);
        if (!okSig) {
            throw new Error("E_BUNDLE_ATTESTATION_INVALID: signature check failed");
        }

    const manifest: BundleManifest = JSON.parse(manifestJson);
    const agentEntry = zip.getEntry(manifest.agent_path);
    if (!agentEntry) {
        throw new Error(`E_BUNDLE_HASH_MISMATCH: agent file missing (${manifest.agent_path})`);
    }
    const agentBuf = agentEntry.getData();
    const hash = sha256(agentBuf);
    if (hash !== manifest.sha256.agent) {
        throw new Error(`E_BUNDLE_HASH_MISMATCH: expected ${manifest.sha256.agent} got ${hash}`);
    }

    return { manifest, agentBuffer: agentBuf };
}

export async function runBundlePack(agentPath: string, outFile: string): Promise<{ exitCode: number; output?: string }> {
    try {
        const projectRoot = process.cwd();
        const cfg = loadConfig(projectRoot);
        const lock: LockfileInfo | null = detectLockfile(projectRoot);

        const validation = await runValidate(agentPath, { format: "json", policy: "ci" });
        if (validation.exitCode !== 0) {
            const codes = (() => {
                try {
                    const parsed = JSON.parse(validation.output ?? "{}");
                    return parsed.findings?.map((f: any) => f.code) ?? [];
                } catch {
                    return [];
                }
            })();
            if (codes.includes("E_SECRET_INLINE")) {
                throw new Error("E_SECRET_INLINE: Inline secrets detected. Move secrets to a secret manager and reference with {$secret:\"name\"}.");
            }
            throw new Error(`Validation failed before bundling:\n${validation.output ?? ""}`);
        }

        const fmt = runFmt(agentPath, { stdout: true });
        if (fmt.exitCode !== 0 || !fmt.output) {
            throw new Error(`Failed to format agent: ${fmt.output ?? ""}`);
        }

        const agentFileName = path.basename(agentPath);
        const agentBuf = asBuffer(fmt.output);

        const { provenance } = await loadTrustedPluginRegistries({
            plugins: cfg.plugins ?? [],
            projectRoot,
            trustAllow: cfg.trust?.allow,
            trustDeny: cfg.trust?.deny,
            requirePins: false,
            lockfile: lock ?? undefined,
            policyName: undefined
        });

        const resolvedPlugins = [...provenance].map((p) => {
            if ((!p.version || !p.integrity) && lock && p.name) {
                const resolved = resolvePackageVersion(lock, p.name);
                if (resolved) {
                    return {
                        ...p,
                        version: p.version ?? resolved.version,
                        integrity: p.integrity ?? resolved.integrity
                    };
                }
            }
            return p;
        });
        resolvedPlugins.sort((a, b) => (a.resolved || "").localeCompare(b.resolved || ""));

        const manifest: BundleManifest = {
            format_version: "1.0",
            agent_path: agentFileName,
            created_at: new Date().toISOString(),
            sha256: {
                agent: sha256(agentBuf)
            },
            plugins: resolvedPlugins.length ? { resolved: resolvedPlugins } : undefined,
            lockfile: lock
                ? {
                    kind: lock.kind,
                    path: lock.relPath,
                    sha256: lock.sha256
                }
                : undefined
        };

        const manifestJson = JSON.stringify(manifest, null, 2) + "\n";
        const sig = sign(manifestJson);

        const zip = new AdmZip();
        zip.addFile(agentFileName, agentBuf);
        zip.addFile("manifest.json", Buffer.from(manifestJson, "utf8"));
        zip.addFile("signatures/manifest.sig", sig);

        ensureDir(path.dirname(outFile));
        zip.writeZip(outFile);

        return { exitCode: 0, output: `${outFile}\n` };
    } catch (e: any) {
        return { exitCode: 2, output: String(e?.message || e) + "\n" };
    }
}

export async function runBundleVerify(bundlePath: string): Promise<{ exitCode: number; output?: string }> {
    try {
        if (!fs.existsSync(bundlePath)) {
            return { exitCode: 1, output: `E_BUNDLE_HASH_MISMATCH: bundle not found\n` };
        }
        verifyBundle(bundlePath);
        return { exitCode: 0, output: "OK\n" };
    } catch (e: any) {
        return { exitCode: 1, output: String(e?.message || e) + "\n" };
    }
}
