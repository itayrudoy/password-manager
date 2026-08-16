import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../db/prisma.js";

const app = createApp();
const CREDENTIALS_PATH = "/api/credentials";

// The server stores opaque ciphertext blobs — it never sees plaintext, so these
// stand-in tokens are just arbitrary strings from the server's point of view.
const BLOB = {
  version: 1,
  overviewCiphertext: "b3ZlcnZpZXctdG9rZW4tMQ==",
  secretCiphertext: "c2VjcmV0LXRva2VuLTE=",
};
const BLOB_EDIT = {
  version: 1,
  overviewCiphertext: "b3ZlcnZpZXctdG9rZW4tMg==",
  secretCiphertext: "c2VjcmV0LXRva2VuLTI=",
};

async function signupUser(email: string) {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ email, password: "correct-horse" });
  return res.headers["set-cookie"];
}

function authedRequest(cookie: string) {
  return {
    get: (path: string) => request(app).get(path).set("Cookie", cookie),
    post: (path: string, body?: object) => request(app).post(path).set("Cookie", cookie).send(body),
    put: (path: string, body?: object) => request(app).put(path).set("Cookie", cookie).send(body),
    delete: (path: string) => request(app).delete(path).set("Cookie", cookie),
  };
}

beforeEach(async () => {
  await prisma.credential.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.credential.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("credentials CRUD", () => {
  it("stores and returns the encrypted blobs verbatim for the owning user", async () => {
    const client = authedRequest(await signupUser("alice@example.com"));

    const createRes = await client.post(CREDENTIALS_PATH, BLOB);
    expect(createRes.status).toBe(201);
    expect(createRes.body).toMatchObject(BLOB);
    const itemId = createRes.body.id;

    const listRes = await client.get(CREDENTIALS_PATH);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0]).toMatchObject(BLOB);

    const updateRes = await client.put(`${CREDENTIALS_PATH}/${itemId}`, BLOB_EDIT);
    expect(updateRes.status).toBe(200);
    expect(updateRes.body).toMatchObject(BLOB_EDIT);

    const deleteRes = await client.delete(`${CREDENTIALS_PATH}/${itemId}`);
    expect(deleteRes.status).toBe(204);

    const afterDeleteRes = await client.get(CREDENTIALS_PATH);
    expect(afterDeleteRes.body).toHaveLength(0);
  });

  it("never persists or returns any plaintext content column", async () => {
    const client = authedRequest(await signupUser("alice@example.com"));

    const createRes = await client.post(CREDENTIALS_PATH, BLOB);
    // The stored row exposes only the blob + bookkeeping — no title/password/etc.
    expect(createRes.body).not.toHaveProperty("title");
    expect(createRes.body).not.toHaveProperty("password");
    expect(createRes.body).not.toHaveProperty("username");
    expect(createRes.body).not.toHaveProperty("notes");

    const stored = await prisma.credential.findUniqueOrThrow({ where: { id: createRes.body.id } });
    expect(Object.keys(stored)).not.toContain("password");
    expect(stored.overviewCiphertext).toBe(BLOB.overviewCiphertext);
  });

  it("rejects requests without a session", async () => {
    const res = await request(app).get(CREDENTIALS_PATH);
    expect(res.status).toBe(401);
  });

  it("rejects a create that is missing a ciphertext blob", async () => {
    const client = authedRequest(await signupUser("alice@example.com"));

    const noOverview = await client.post(CREDENTIALS_PATH, {
      version: 1,
      secretCiphertext: BLOB.secretCiphertext,
    });
    expect(noOverview.status).toBe(400);

    const noSecret = await client.post(CREDENTIALS_PATH, {
      version: 1,
      overviewCiphertext: BLOB.overviewCiphertext,
    });
    expect(noSecret.status).toBe(400);

    const noVersion = await client.post(CREDENTIALS_PATH, {
      overviewCiphertext: BLOB.overviewCiphertext,
      secretCiphertext: BLOB.secretCiphertext,
    });
    expect(noVersion.status).toBe(400);
  });

  it("prevents one user from reading, updating, or deleting another user's item", async () => {
    const alice = authedRequest(await signupUser("alice@example.com"));
    const bob = authedRequest(await signupUser("bob@example.com"));

    const createRes = await alice.post(CREDENTIALS_PATH, BLOB);
    const itemId = createRes.body.id;

    const bobList = await bob.get(CREDENTIALS_PATH);
    expect(bobList.body).toHaveLength(0);

    const bobGet = await bob.get(`${CREDENTIALS_PATH}/${itemId}`);
    expect(bobGet.status).toBe(404);

    const bobUpdate = await bob.put(`${CREDENTIALS_PATH}/${itemId}`, BLOB_EDIT);
    expect(bobUpdate.status).toBe(404);

    const bobDelete = await bob.delete(`${CREDENTIALS_PATH}/${itemId}`);
    expect(bobDelete.status).toBe(404);

    const aliceGet = await alice.get(`${CREDENTIALS_PATH}/${itemId}`);
    expect(aliceGet.status).toBe(200);
    expect(aliceGet.body).toMatchObject(BLOB);
  });
});
