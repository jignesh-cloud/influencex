import crypto from "node:crypto";
import { env } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  // ENCRYPTION_KEY is validated as >=32 chars in env.ts; hash it down to a
  // stable 32-byte key rather than requiring the raw env value to be
  // exactly 32 bytes of key material.
  return crypto.createHash("sha256").update(env.ENCRYPTION_KEY).digest();
}

/** Encrypts a plaintext string (e.g. an affiliate program API credential)
 * for storage in AffiliateProgram.credentials. Packs iv + authTag + ciphertext.
 * Returns a plain Uint8Array (not Buffer) — Prisma's Bytes field type is
 * stricter than Buffer's ArrayBufferLike-backed generic in current @types/node. */
export function encryptSecret(plaintext: string): Uint8Array<ArrayBuffer> {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const packed = Buffer.concat([iv, authTag, ciphertext]);
  const copy = new Uint8Array(new ArrayBuffer(packed.byteLength));
  copy.set(packed);
  return copy;
}

export function decryptSecret(packed: Buffer): string {
  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = packed.subarray(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
