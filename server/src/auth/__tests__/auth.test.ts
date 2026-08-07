import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../db/prisma.js";

const app = createApp();
const SIGNUP_PATH = "/api/auth/signup";
const LOGIN_PATH = "/api/auth/login";
const ME_PATH = "/api/auth/me";
const LOGOUT_PATH = "/api/auth/logout";
const ALICE = { email: "alice@example.com", password: "correct-horse" };

function signup(body: { email: string; password: string } = ALICE) {
  return request(app).post(SIGNUP_PATH).send(body);
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

describe("auth", () => {
  it("signs up a new user and sets a session cookie", async () => {
    const res = await signup();

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(String), email: ALICE.email });
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^token=/);
  });

  it("rejects signing up with the same email twice", async () => {
    await signup();
    const res = await signup({ email: ALICE.email, password: "another-password" });

    expect(res.status).toBe(409);
  });

  it("logs in with correct credentials and rejects the wrong password", async () => {
    await signup();

    const goodLogin = await request(app).post(LOGIN_PATH).send(ALICE);
    expect(goodLogin.status).toBe(200);

    const badLogin = await request(app)
      .post(LOGIN_PATH)
      .send({ email: ALICE.email, password: "wrong-password" });
    expect(badLogin.status).toBe(401);
  });

  it("returns the current user from /me when authenticated, 401 otherwise", async () => {
    const signupRes = await signup();
    const cookie = signupRes.headers["set-cookie"];

    const meRes = await request(app).get(ME_PATH).set("Cookie", cookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe(ALICE.email);

    const unauthedRes = await request(app).get(ME_PATH);
    expect(unauthedRes.status).toBe(401);
  });

  it("clears the session on logout", async () => {
    const signupRes = await signup();
    const cookie = signupRes.headers["set-cookie"];

    const logoutRes = await request(app).post(LOGOUT_PATH).set("Cookie", cookie);
    expect(logoutRes.status).toBe(204);
    expect(logoutRes.headers["set-cookie"]?.[0]).toMatch(/^token=;/);
  });
});
