import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../db/prisma.js";

const app = createApp();

beforeEach(async () => {
  await prisma.credential.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.credential.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("auth", () => {
  it("registers a new user and sets a session cookie", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "alice@example.com", password: "correct-horse" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(String), email: "alice@example.com" });
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^token=/);
  });

  it("rejects registering the same email twice", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "alice@example.com", password: "correct-horse" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "alice@example.com", password: "another-password" });

    expect(res.status).toBe(409);
  });

  it("logs in with correct credentials and rejects the wrong password", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "alice@example.com", password: "correct-horse" });

    const goodLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "correct-horse" });
    expect(goodLogin.status).toBe(200);

    const badLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "wrong-password" });
    expect(badLogin.status).toBe(401);
  });

  it("returns the current user from /me when authenticated, 401 otherwise", async () => {
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({ email: "alice@example.com", password: "correct-horse" });
    const cookie = registerRes.headers["set-cookie"];

    const meRes = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe("alice@example.com");

    const unauthedRes = await request(app).get("/api/auth/me");
    expect(unauthedRes.status).toBe(401);
  });

  it("clears the session on logout", async () => {
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({ email: "alice@example.com", password: "correct-horse" });
    const cookie = registerRes.headers["set-cookie"];

    const logoutRes = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    expect(logoutRes.status).toBe(204);
    expect(logoutRes.headers["set-cookie"]?.[0]).toMatch(/^token=;/);
  });
});
