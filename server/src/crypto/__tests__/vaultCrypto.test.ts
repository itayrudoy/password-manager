import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "../vaultCrypto.js";

describe("vaultCrypto", () => {
  it("round-trips plaintext through encrypt then decrypt", async () => {
    const plaintext = "hunter2";
    const ciphertext = await encrypt(plaintext);
    await expect(decrypt(ciphertext)).resolves.toBe(plaintext);
  });
});
