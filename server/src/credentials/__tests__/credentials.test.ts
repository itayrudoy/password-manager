import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../db/prisma.js";

const app = createApp();
const CREDENTIALS_PATH = "/api/credentials";

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
  it("creates, lists, updates, and deletes an item for the owning user", async () => {
    const client = authedRequest(await signupUser("alice@example.com"));

    const createRes = await client.post(CREDENTIALS_PATH, {
      title: "GitHub",
      url: "https://github.com",
      username: "alice",
      password: "s3cret",
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.password).toBe("s3cret");
    const itemId = createRes.body.id;

    const listRes = await client.get(CREDENTIALS_PATH);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].title).toBe("GitHub");

    const updateRes = await client.put(`${CREDENTIALS_PATH}/${itemId}`, { title: "GitHub (work)" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.title).toBe("GitHub (work)");
    expect(updateRes.body.password).toBe("s3cret");

    const deleteRes = await client.delete(`${CREDENTIALS_PATH}/${itemId}`);
    expect(deleteRes.status).toBe(204);

    const afterDeleteRes = await client.get(CREDENTIALS_PATH);
    expect(afterDeleteRes.body).toHaveLength(0);
  });

  it("rejects requests without a session", async () => {
    const res = await request(app).get(CREDENTIALS_PATH);
    expect(res.status).toBe(401);
  });

  it("prevents one user from reading, updating, or deleting another user's item", async () => {
    const alice = authedRequest(await signupUser("alice@example.com"));
    const bob = authedRequest(await signupUser("bob@example.com"));

    const createRes = await alice.post(CREDENTIALS_PATH, { title: "Alice's Bank", password: "alice-secret" });
    const itemId = createRes.body.id;

    const bobList = await bob.get(CREDENTIALS_PATH);
    expect(bobList.body).toHaveLength(0);

    const bobGet = await bob.get(`${CREDENTIALS_PATH}/${itemId}`);
    expect(bobGet.status).toBe(404);

    const bobUpdate = await bob.put(`${CREDENTIALS_PATH}/${itemId}`, { title: "Hacked" });
    expect(bobUpdate.status).toBe(404);

    const bobDelete = await bob.delete(`${CREDENTIALS_PATH}/${itemId}`);
    expect(bobDelete.status).toBe(404);

    const aliceGet = await alice.get(`${CREDENTIALS_PATH}/${itemId}`);
    expect(aliceGet.status).toBe(200);
    expect(aliceGet.body.title).toBe("Alice's Bank");
  });
});
