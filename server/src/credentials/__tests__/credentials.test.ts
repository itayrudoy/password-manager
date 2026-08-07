import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../db/prisma.js";

const app = createApp();

async function signupUser(email: string) {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ email, password: "correct-horse" });
  return res.headers["set-cookie"];
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
    const cookie = await signupUser("alice@example.com");

    const createRes = await request(app)
      .post("/api/credentials")
      .set("Cookie", cookie)
      .send({ title: "GitHub", url: "https://github.com", username: "alice", password: "s3cret" });
    expect(createRes.status).toBe(201);
    expect(createRes.body.password).toBe("s3cret");
    const itemId = createRes.body.id;

    const listRes = await request(app).get("/api/credentials").set("Cookie", cookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].title).toBe("GitHub");

    const updateRes = await request(app)
      .put(`/api/credentials/${itemId}`)
      .set("Cookie", cookie)
      .send({ title: "GitHub (work)" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.title).toBe("GitHub (work)");
    expect(updateRes.body.password).toBe("s3cret");

    const deleteRes = await request(app).delete(`/api/credentials/${itemId}`).set("Cookie", cookie);
    expect(deleteRes.status).toBe(204);

    const afterDeleteRes = await request(app).get("/api/credentials").set("Cookie", cookie);
    expect(afterDeleteRes.body).toHaveLength(0);
  });

  it("rejects requests without a session", async () => {
    const res = await request(app).get("/api/credentials");
    expect(res.status).toBe(401);
  });

  it("prevents one user from reading, updating, or deleting another user's item", async () => {
    const aliceCookie = await signupUser("alice@example.com");
    const bobCookie = await signupUser("bob@example.com");

    const createRes = await request(app)
      .post("/api/credentials")
      .set("Cookie", aliceCookie)
      .send({ title: "Alice's Bank", password: "alice-secret" });
    const itemId = createRes.body.id;

    const bobList = await request(app).get("/api/credentials").set("Cookie", bobCookie);
    expect(bobList.body).toHaveLength(0);

    const bobGet = await request(app).get(`/api/credentials/${itemId}`).set("Cookie", bobCookie);
    expect(bobGet.status).toBe(404);

    const bobUpdate = await request(app)
      .put(`/api/credentials/${itemId}`)
      .set("Cookie", bobCookie)
      .send({ title: "Hacked" });
    expect(bobUpdate.status).toBe(404);

    const bobDelete = await request(app).delete(`/api/credentials/${itemId}`).set("Cookie", bobCookie);
    expect(bobDelete.status).toBe(404);

    const aliceGet = await request(app).get(`/api/credentials/${itemId}`).set("Cookie", aliceCookie);
    expect(aliceGet.status).toBe(200);
    expect(aliceGet.body.title).toBe("Alice's Bank");
  });
});
