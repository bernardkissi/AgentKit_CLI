import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

function keyPaths() {
    const home = process.env.AGENTKIT_HOME || path.join(os.homedir(), ".agentkit");
    const keyDir = path.join(home, "keys");
    return {
        keyDir,
        privateKeyPath: path.join(keyDir, "ed25519.key"),
        publicKeyPath: path.join(keyDir, "ed25519.pub")
    };
}

function ensureKeyDir() {
    const { keyDir } = keyPaths();
    fs.mkdirSync(keyDir, { recursive: true });
}

export function generateKeypair() {
    ensureKeyDir();
    const { privateKeyPath, publicKeyPath } = keyPaths();
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
    const privPem = privateKey.export({ format: "pem", type: "pkcs8" });
    const pubPem = publicKey.export({ format: "pem", type: "spki" });
    fs.writeFileSync(privateKeyPath, privPem, { mode: 0o600 });
    fs.writeFileSync(publicKeyPath, pubPem, { mode: 0o644 });
    return { privateKeyPath, publicKeyPath };
}

function loadPrivateKey(): crypto.KeyObject {
    ensureKeyDir();
    const { privateKeyPath, publicKeyPath } = keyPaths();
    if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
        generateKeypair();
    }
    const pem = fs.readFileSync(privateKeyPath, "utf8");
    return crypto.createPrivateKey(pem);
}

function loadPublicKey(): crypto.KeyObject {
    ensureKeyDir();
    const { publicKeyPath } = keyPaths();
    if (!fs.existsSync(publicKeyPath)) {
        generateKeypair();
    }
    const pem = fs.readFileSync(publicKeyPath, "utf8");
    return crypto.createPublicKey(pem);
}

export function sign(data: Buffer | string, privateKey?: crypto.KeyObject | string) {
    const key = privateKey
        ? (typeof privateKey === "string" ? crypto.createPrivateKey(privateKey) : privateKey)
        : loadPrivateKey();
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return crypto.sign(null, buf, key);
}

export function verify(data: Buffer | string, signature: Buffer, publicKey?: crypto.KeyObject | string) {
    const key = publicKey
        ? (typeof publicKey === "string" ? crypto.createPublicKey(publicKey) : publicKey)
        : loadPublicKey();
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return crypto.verify(null, buf, key, signature);
}

export function getDefaultKeyPaths() {
    const { privateKeyPath, publicKeyPath } = keyPaths();
    return { privateKeyPath, publicKeyPath };
}
