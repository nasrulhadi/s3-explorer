// ─── Constants ──────────────────────────────────────────────

/** Magic bytes prepended to encrypted exports for detection */
const MAGIC = new Uint8Array([0x53, 0x33, 0x58, 0x50, 0x4c, 0x52]); // "S3XPLR"

const SALT_LEN = 16;
const IV_LEN = 12; // AES-GCM nonce

/**
 * PBKDF2 iterations for backup exports. Matches the secure vault (300k) so
 * an exported `.enc` file — the artifact most likely to leave the device —
 * gets the same brute-force resistance as the on-device vault.
 */
const PBKDF2_ITERATIONS = 300_000;

// ─── Helpers ────────────────────────────────────────────────

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Encrypt a JSON-serializable value with a passphrase.
 * Returns a Uint8Array: MAGIC | salt | iv | ciphertext.
 */
export async function encryptExport(data: unknown, passphrase: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));

  const key = await deriveKey(passphrase, salt);

  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data, null, 2));

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext),
  );

  // Concatenate: magic | salt | iv | ciphertext
  const out = new Uint8Array(MAGIC.length + salt.length + iv.length + ciphertext.length);
  out.set(MAGIC, 0);
  out.set(salt, MAGIC.length);
  out.set(iv, MAGIC.length + salt.length);
  out.set(ciphertext, MAGIC.length + salt.length + iv.length);

  return out;
}

/**
 * Decrypt a Uint8Array produced by `encryptExport`.
 * Throws if passphrase is wrong or data is corrupted.
 */
export async function decryptExport<T = unknown>(data: Uint8Array, passphrase: string): Promise<T> {
  // Verify magic header
  if (data.length < MAGIC.length + SALT_LEN + IV_LEN + 16) {
    throw new Error("Not an S3 Explorer encrypted file");
  }
  for (let i = 0; i < MAGIC.length; i++) {
    if (data[i] !== MAGIC[i]) throw new Error("Not an S3 Explorer encrypted file");
  }

  const salt = data.slice(MAGIC.length, MAGIC.length + SALT_LEN);
  const iv = data.slice(MAGIC.length + SALT_LEN, MAGIC.length + SALT_LEN + IV_LEN);
  const ciphertext = data.slice(MAGIC.length + SALT_LEN + IV_LEN);

  const key = await deriveKey(passphrase, salt);

  try {
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(plaintext)) as T;
  } catch {
    throw new Error("Wrong passphrase or corrupted file");
  }
}

/**
 * Check if a Uint8Array starts with the S3XPLR magic header.
 */
export function isEncryptedExport(data: Uint8Array): boolean {
  if (data.length < MAGIC.length) return false;
  for (let i = 0; i < MAGIC.length; i++) {
    if (data[i] !== MAGIC[i]) return false;
  }
  return true;
}
