import type { S3Connection } from "../types";

// ─── Storage keys ──────────────────────────────────────────

export const SECURE_VAULT_STORAGE_KEY = "s3-explorer-secure-vault";
export const LEGACY_CONNECTION_STORAGE_KEY = "s3-explorer-connections";

// ─── Crypto constants ──────────────────────────────────────

const SALT_LEN = 16;
const IV_LEN = 12;
const VAULT_ITERATIONS = 300_000;

// ─── Types ─────────────────────────────────────────────────

export interface SecureVaultData {
  connections: S3Connection[];
  activeConnectionId: string | null;
}

interface SecureVaultPayload {
  version: 1;
  kdf: {
    algorithm: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
    salt: string;
  };
  cipher: {
    algorithm: "AES-GCM";
    iv: string;
    ciphertext: string;
  };
  updatedAt: number;
}

let activeVaultKey: CryptoKey | null = null;
let activeVaultSalt: Uint8Array | null = null;
let activeVaultIterations = VAULT_ITERATIONS;

// ─── Encoding helpers ──────────────────────────────────────

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function readPayload(): SecureVaultPayload | null {
  const raw = localStorage.getItem(SECURE_VAULT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw) as SecureVaultPayload;
    if (
      payload?.version !== 1 ||
      payload.kdf?.algorithm !== "PBKDF2" ||
      payload.kdf?.hash !== "SHA-256" ||
      payload.cipher?.algorithm !== "AES-GCM" ||
      typeof payload.kdf.salt !== "string" ||
      typeof payload.kdf.iterations !== "number" ||
      typeof payload.cipher.iv !== "string" ||
      typeof payload.cipher.ciphertext !== "string"
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function deriveVaultKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptWithKey(
  data: SecureVaultData,
  key: CryptoKey,
  salt: Uint8Array,
  iterations: number,
): Promise<SecureVaultPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext),
  );

  return {
    version: 1,
    kdf: {
      algorithm: "PBKDF2",
      hash: "SHA-256",
      iterations,
      salt: bytesToBase64(salt),
    },
    cipher: {
      algorithm: "AES-GCM",
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(ciphertext),
    },
    updatedAt: Date.now(),
  };
}

async function decryptWithKey(payload: SecureVaultPayload, key: CryptoKey): Promise<SecureVaultData> {
  const iv = base64ToBytes(payload.cipher.iv);
  const ciphertext = base64ToBytes(payload.cipher.ciphertext);

  try {
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    const decoded = JSON.parse(new TextDecoder().decode(plaintext)) as SecureVaultData;
    return {
      connections: Array.isArray(decoded.connections) ? decoded.connections : [],
      activeConnectionId: decoded.activeConnectionId ?? null,
    };
  } catch {
    throw new Error("Wrong master password or corrupted vault.");
  }
}

function writePayload(payload: SecureVaultPayload) {
  localStorage.setItem(SECURE_VAULT_STORAGE_KEY, JSON.stringify(payload));
}

// ─── Public API ─────────────────────────────────────────────

export function hasSecureVault(): boolean {
  return readPayload() !== null;
}

export function isSecureVaultUnlocked(): boolean {
  return activeVaultKey !== null;
}

export async function createSecureVault(
  password: string,
  data: SecureVaultData,
): Promise<SecureVaultData> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const key = await deriveVaultKey(password, salt, VAULT_ITERATIONS);
  const payload = await encryptWithKey(data, key, salt, VAULT_ITERATIONS);

  writePayload(payload);
  activeVaultKey = key;
  activeVaultSalt = salt;
  activeVaultIterations = VAULT_ITERATIONS;

  localStorage.removeItem(LEGACY_CONNECTION_STORAGE_KEY);
  return data;
}

export async function unlockSecureVault(password: string): Promise<SecureVaultData> {
  const payload = readPayload();
  if (!payload) throw new Error("Master password is not enabled.");

  const salt = base64ToBytes(payload.kdf.salt);
  const key = await deriveVaultKey(password, salt, payload.kdf.iterations);
  const data = await decryptWithKey(payload, key);

  activeVaultKey = key;
  activeVaultSalt = salt;
  activeVaultIterations = payload.kdf.iterations;

  return data;
}

export async function updateSecureVault(data: SecureVaultData): Promise<void> {
  if (!hasSecureVault() || !activeVaultKey || !activeVaultSalt) return;

  const payload = await encryptWithKey(
    data,
    activeVaultKey,
    activeVaultSalt,
    activeVaultIterations,
  );
  writePayload(payload);
}

export async function verifySecureVaultPassword(password: string): Promise<SecureVaultData> {
  const payload = readPayload();
  if (!payload) throw new Error("Master password is not enabled.");

  const salt = base64ToBytes(payload.kdf.salt);
  const key = await deriveVaultKey(password, salt, payload.kdf.iterations);
  return decryptWithKey(payload, key);
}

export async function changeSecureVaultPassword(
  currentPassword: string,
  newPassword: string,
  data: SecureVaultData,
): Promise<void> {
  await verifySecureVaultPassword(currentPassword);
  await createSecureVault(newPassword, data);
}

export async function disableSecureVault(password: string, data: SecureVaultData): Promise<void> {
  await verifySecureVaultPassword(password);
  removeSecureVault();
  writeLegacyConnectionStorage(data);
}

export function lockSecureVault(): void {
  activeVaultKey = null;
  activeVaultSalt = null;
  activeVaultIterations = VAULT_ITERATIONS;
}

export function removeSecureVault(): void {
  lockSecureVault();
  localStorage.removeItem(SECURE_VAULT_STORAGE_KEY);
}

export function resetAllConnectionStorage(): void {
  removeSecureVault();
  localStorage.removeItem(LEGACY_CONNECTION_STORAGE_KEY);
}

export function writeLegacyConnectionStorage(data: SecureVaultData): void {
  localStorage.setItem(
    LEGACY_CONNECTION_STORAGE_KEY,
    JSON.stringify({
      state: {
        connections: data.connections,
        activeConnectionId: data.activeConnectionId,
      },
      version: 0,
    }),
  );
}
