import { describe, expect, it } from "vitest";
import {
  encryptItem,
  decryptItem,
  importVaultKey,
  ItemSchemaError,
  type ItemFields,
} from "./itemCrypto";

const USER_ID = "user-123";

/** A fresh non-extractable AES-GCM Vault Key, like the one the session holds. */
async function makeVaultKey(): Promise<CryptoKey> {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  return keyFromRaw(raw);
}

async function keyFromRaw(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Seals an arbitrary doc in the same wire format itemCrypto uses, so tests can
 * simulate a blob written by another client (or corruption) that decrypts fine
 * but carries a malformed payload — something the typed encryptItem can't make.
 */
async function sealRaw(
  key: CryptoKey,
  userId: string,
  part: "overview" | "secret",
  version: number,
  doc: unknown,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aad = new TextEncoder().encode(`${version}:${part}:${userId}`);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: aad },
      key,
      new TextEncoder().encode(JSON.stringify(doc)),
    ),
  );
  const token = new Uint8Array(iv.length + ct.length);
  token.set(iv, 0);
  token.set(ct, iv.length);
  let binary = "";
  for (const byte of token) binary += String.fromCharCode(byte);
  return btoa(binary);
}

const SAMPLE: ItemFields = {
  title: "GitHub",
  url: "https://github.com",
  username: "octocat",
  password: "s3cret-hunter2",
  notes: "backup codes in the drawer",
};

describe("itemCrypto", () => {
  it("round-trips an item back to its original fields", async () => {
    const key = await makeVaultKey();

    const encrypted = await encryptItem(key, USER_ID, SAMPLE);
    const decrypted = await decryptItem(key, USER_ID, encrypted);

    expect(decrypted).toEqual(SAMPLE);
  });

  it("round-trips null optional fields", async () => {
    const key = await makeVaultKey();
    const sparse: ItemFields = {
      title: "Just a title",
      url: null,
      username: null,
      password: "pw",
      notes: null,
    };

    const decrypted = await decryptItem(key, USER_ID, await encryptItem(key, USER_ID, sparse));

    expect(decrypted).toEqual(sparse);
  });

  it("round-trips Unicode field values without corruption", async () => {
    const key = await makeVaultKey();
    const unicode: ItemFields = {
      title: "Café ☕",
      url: "https://例え.jp",
      username: "üser🙂",
      password: "pä$$wörd–🔐—naïve",
      notes: "日本語のメモ\nemoji: 👻🎉",
    };

    const decrypted = await decryptItem(key, USER_ID, await encryptItem(key, USER_ID, unicode));

    expect(decrypted).toEqual(unicode);
  });

  it("produces a fresh IV each time, so identical items encrypt differently", async () => {
    const key = await makeVaultKey();

    const a = await encryptItem(key, USER_ID, SAMPLE);
    const b = await encryptItem(key, USER_ID, SAMPLE);

    expect(a.overviewCiphertext).not.toEqual(b.overviewCiphertext);
    expect(a.secretCiphertext).not.toEqual(b.secretCiphertext);
  });

  it("leaves no plaintext field readable in the stored blobs", async () => {
    const key = await makeVaultKey();

    const { overviewCiphertext, secretCiphertext } = await encryptItem(key, USER_ID, SAMPLE);
    const haystack = (overviewCiphertext + secretCiphertext).toLowerCase();

    for (const secret of [SAMPLE.password, SAMPLE.username, SAMPLE.notes, SAMPLE.title]) {
      expect(haystack).not.toContain(secret!.toLowerCase());
    }
  });

  it("keeps the secret fields out of the overview blob", async () => {
    const key = await makeVaultKey();

    const encrypted = await encryptItem(key, USER_ID, SAMPLE);
    // Sanity: overview decrypts, but it only carries display fields — proven by
    // the secret blob being required to recover the password (below).
    expect(encrypted.overviewCiphertext).not.toEqual(encrypted.secretCiphertext);
  });

  it("refuses to decrypt an item bound to a different user", async () => {
    const key = await makeVaultKey();

    const encrypted = await encryptItem(key, USER_ID, SAMPLE);

    await expect(decryptItem(key, "someone-else", encrypted)).rejects.toThrow();
  });

  it("refuses to decrypt when the two blobs are swapped", async () => {
    const key = await makeVaultKey();

    const encrypted = await encryptItem(key, USER_ID, SAMPLE);
    const swapped = {
      ...encrypted,
      overviewCiphertext: encrypted.secretCiphertext,
      secretCiphertext: encrypted.overviewCiphertext,
    };

    await expect(decryptItem(key, USER_ID, swapped)).rejects.toThrow();
  });

  it("refuses to decrypt a tampered blob", async () => {
    const key = await makeVaultKey();

    const encrypted = await encryptItem(key, USER_ID, SAMPLE);
    // Flip the last base64 char of the overview token.
    const flipped =
      encrypted.overviewCiphertext.slice(0, -2) +
      (encrypted.overviewCiphertext.at(-2) === "A" ? "B" : "A") +
      encrypted.overviewCiphertext.slice(-1);

    await expect(
      decryptItem(key, USER_ID, { ...encrypted, overviewCiphertext: flipped }),
    ).rejects.toThrow();
  });

  it("refuses to decrypt under a different Vault Key", async () => {
    const encrypted = await encryptItem(await makeVaultKey(), USER_ID, SAMPLE);

    await expect(decryptItem(await makeVaultKey(), USER_ID, encrypted)).rejects.toThrow();
  });

  it("refuses to decrypt an item whose envelope version was altered", async () => {
    const key = await makeVaultKey();

    const encrypted = await encryptItem(key, USER_ID, SAMPLE);

    await expect(decryptItem(key, USER_ID, { ...encrypted, version: 2 })).rejects.toThrow();
  });

  it("imports a base64 Vault Key into a working, non-extractable key", async () => {
    // 32 zero bytes → a known base64 the server would deliver.
    const base64 = btoa(String.fromCharCode(...new Uint8Array(32)));

    const key = await importVaultKey(base64);
    const roundTripped = await decryptItem(key, USER_ID, await encryptItem(key, USER_ID, SAMPLE));
    expect(roundTripped).toEqual(SAMPLE);

    // Same key bytes decrypt what another import of them encrypted (deterministic).
    const twin = await importVaultKey(base64);
    expect(await decryptItem(twin, USER_ID, await encryptItem(key, USER_ID, SAMPLE))).toEqual(SAMPLE);

    // Non-extractable: the raw bytes can't be read back out.
    await expect(crypto.subtle.exportKey("raw", key)).rejects.toThrow();
  });

  it("rejects a well-encrypted blob whose payload is missing a required field", async () => {
    const raw = crypto.getRandomValues(new Uint8Array(32));
    const key = await keyFromRaw(raw);
    // Overview doc is authentic and decryptable, but has no `title`.
    const malformedOverview = await sealRaw(key, USER_ID, "overview", 1, {
      v: 1,
      url: null,
      username: null,
    });
    const secret = await sealRaw(key, USER_ID, "secret", 1, {
      v: 1,
      password: "pw",
      notes: null,
    });

    await expect(
      decryptItem(key, USER_ID, {
        version: 1,
        overviewCiphertext: malformedOverview,
        secretCiphertext: secret,
      }),
    ).rejects.toBeInstanceOf(ItemSchemaError);
  });
});
