import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../db/prisma.js";

const app = createApp();
const VAULT_KEY_PATH = "/api/keychain/vault-key";

async function signup(email: string): Promise<string> {
  const res = await request(app).post("/api/auth/signup").send({ email, password: "correct-horse" });
  return res.headers["set-cookie"];
}

beforeEach(async () => {
  await prisma.user.deleteMany(); // cascades to vault_keys
});

afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("GET /api/keychain/vault-key", () => {
  it("rejects requests without a session", async () => {
    const res = await request(app).get(VAULT_KEY_PATH);
    expect(res.status).toBe(401);
  });

  it("returns a 32-byte Vault Key to a logged-in user", async () => {
    const cookie = await signup("alice@example.com");
    const res = await request(app).get(VAULT_KEY_PATH).set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(Buffer.from(res.body.vaultKey, "base64")).toHaveLength(32);
  });

  it("never stores the Vault Key in the clear", async () => {
    const cookie = await signup("alice@example.com");
    const res = await request(app).get(VAULT_KEY_PATH).set("Cookie", cookie);
    const row = await prisma.vaultKey.findFirstOrThrow();

    // Compare raw bytes, not base64 text: the stored value is
    // IV(12) || tag(16) || ciphertext, so the ciphertext starts at byte 28.
    // It must differ from the raw key — i.e. the key is stored locked, not plain.
    const stored = Buffer.from(row.lockedKey, "base64");
    const ciphertext = stored.subarray(28);
    const rawKey = Buffer.from(res.body.vaultKey, "base64");
    expect(ciphertext.equals(rawKey)).toBe(false);
  });

  it("returns the same Vault Key on repeated requests", async () => {
    const cookie = await signup("alice@example.com");
    const first = await request(app).get(VAULT_KEY_PATH).set("Cookie", cookie);
    const second = await request(app).get(VAULT_KEY_PATH).set("Cookie", cookie);
    expect(second.body.vaultKey).toBe(first.body.vaultKey);
  });

  it("fails loudly (500) instead of minting a new key when one is missing", async () => {
    const cookie = await signup("alice@example.com");
    // Simulate a lost key: the endpoint must NOT silently create a replacement,
    // which would orphan any data encrypted under the original.
    await prisma.vaultKey.deleteMany();

    const res = await request(app).get(VAULT_KEY_PATH).set("Cookie", cookie);
    expect(res.status).toBe(500);
    expect(await prisma.vaultKey.count()).toBe(0);
  });

  it("gives different users different Vault Keys", async () => {
    const alice = await signup("alice@example.com");
    const bob = await signup("bob@example.com");
    const aliceKey = await request(app).get(VAULT_KEY_PATH).set("Cookie", alice);
    const bobKey = await request(app).get(VAULT_KEY_PATH).set("Cookie", bob);
    expect(aliceKey.body.vaultKey).not.toBe(bobKey.body.vaultKey);
  });
});
