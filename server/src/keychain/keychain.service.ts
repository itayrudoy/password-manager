import { Prisma } from "@prisma/client";
import { generateVaultKey, lockVaultKey, unlockVaultKey } from "../crypto/vaultKeyLock.js";
import { prisma } from "../db/prisma.js";

/** Thrown when an authenticated user has no Vault Key — a server-side anomaly. */
export class VaultKeyNotFoundError extends Error {
  constructor(userId: string) {
    super(`No Vault Key found for user ${userId}`);
    this.name = "VaultKeyNotFoundError";
  }
}

/**
 * Creates and stores a fresh, server-locked Vault Key for a new account.
 *
 * Only called from account-creation flows (signup today; social sign-in later)
 * — never from the delivery endpoint. Creation must happen where we *know* the
 * account is new; creating on a missing key elsewhere would silently mint a new
 * key and orphan any data encrypted under a lost one.
 *
 * Accepts a Prisma client so it can run inside a caller's transaction (so the
 * user row and its Vault Key commit together); defaults to the shared client.
 */
export function createVaultKey(
  userId: string,
  client: Prisma.TransactionClient = prisma,
) {
  const lockedKey = lockVaultKey(generateVaultKey(), userId);
  return client.vaultKey.create({ data: { userId, lockedKey } });
}

/**
 * Returns the user's Vault Key. Throws VaultKeyNotFoundError if none exists —
 * it does NOT create one. A missing key for a logged-in user is unexpected
 * (every account gets one at signup), so we surface it loudly rather than
 * papering over it with a fresh key.
 */
export async function getVaultKey(userId: string): Promise<Buffer> {
  const row = await prisma.vaultKey.findUnique({ where: { userId } });
  if (!row) {
    throw new VaultKeyNotFoundError(userId);
  }
  return unlockVaultKey(row.lockedKey, userId);
}
