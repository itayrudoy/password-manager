import { describe, expect, it } from "vitest";
import { generateVaultKey, lockVaultKey, unlockVaultKey } from "../vaultKeyLock.js";

const USER = "user-123";

describe("vaultKeyLock", () => {
  it("generates a 32-byte key", () => {
    expect(generateVaultKey()).toHaveLength(32);
  });

  it("generates a different key each time", () => {
    expect(generateVaultKey().equals(generateVaultKey())).toBe(false);
  });

  it("round-trips a Vault Key through lock then unlock for the same user", () => {
    const vaultKey = generateVaultKey();
    const locked = lockVaultKey(vaultKey, USER);
    expect(unlockVaultKey(locked, USER).equals(vaultKey)).toBe(true);
  });

  it("produces different locked output each time it locks the same key (fresh IV)", () => {
    const vaultKey = generateVaultKey();
    expect(lockVaultKey(vaultKey, USER)).not.toBe(lockVaultKey(vaultKey, USER));
  });

  it("refuses to unlock with a different user id (AAD binding)", () => {
    const locked = lockVaultKey(generateVaultKey(), USER);
    expect(() => unlockVaultKey(locked, "someone-else")).toThrow();
  });

  it("refuses to unlock tampered ciphertext (auth tag check)", () => {
    const locked = lockVaultKey(generateVaultKey(), USER);
    const raw = Buffer.from(locked, "base64");
    raw[raw.length - 1] ^= 0x01; // flip a bit in the last byte
    const tampered = raw.toString("base64");
    expect(() => unlockVaultKey(tampered, USER)).toThrow();
  });
});
