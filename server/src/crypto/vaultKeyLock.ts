import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../config/env.js";

// Locks and unlocks a user's Vault Key with the one server-wide Server Key.
//
// Crypto choices (documented per the ticket's DoD):
// - Cipher: AES-256-GCM. The Server Key (env.serverKey) is 32 bytes = AES-256.
//   GCM is authenticated, so unlock also detects tampering.
// - IV: 12 random bytes, freshly generated for every lock. The Server Key is
//   reused across every user, so a unique IV per operation is mandatory — a
//   repeated (key, IV) pair breaks GCM catastrophically.
// - AAD: the userId. This binds a locked key to its owner, so a row copied onto
//   another user's account fails to unlock instead of leaking a Vault Key.
// - Auth tag: 16 bytes (GCM default), verified on unlock.
//
// A locked Vault Key is stored as one base64 string: IV || authTag || ciphertext.
// Callers never see the IV or tag as separate fields.

const IV_BYTES = 12;
const TAG_BYTES = 16;
const VAULT_KEY_BYTES = 32;

/** Generates a fresh random 256-bit Vault Key. */
export function generateVaultKey(): Buffer {
  return randomBytes(VAULT_KEY_BYTES);
}

/** Locks a Vault Key for the given user; returns base64 (IV || tag || ciphertext). */
export function lockVaultKey(vaultKey: Buffer, userId: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", env.serverKey, iv);
  cipher.setAAD(Buffer.from(userId, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(vaultKey), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

/**
 * Unlocks a locked Vault Key for the given user. Throws if the data was
 * tampered with or the userId doesn't match the one it was locked for.
 */
export function unlockVaultKey(lockedKey: string, userId: string): Buffer {
  const raw = Buffer.from(lockedKey, "base64");
  const iv = raw.subarray(0, IV_BYTES);
  const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = raw.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", env.serverKey, iv);
  decipher.setAAD(Buffer.from(userId, "utf8"));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
