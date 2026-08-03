import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import { hashPassword, verifyPassword } from "../crypto/passwordHash.js";
import { COOKIE_NAME, clearCookieOptions, cookieOptions, signToken } from "./token.js";

function requireCredentials(req: Request): { email: string; password: string } {
  const { email, password } = req.body as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    throw new HttpError(400, "email and password are required");
  }
  return { email, password };
}

export async function register(req: Request, res: Response) {
  const { email, password } = requireCredentials(req);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, "An account with this email already exists");
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, hashedPassword },
  });

  res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions);
  res.status(201).json({ id: user.id, email: user.email });
}

export async function login(req: Request, res: Response) {
  const { email, password } = requireCredentials(req);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.hashedPassword))) {
    throw new HttpError(401, "Invalid email or password");
  }

  res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions);
  res.json({ id: user.id, email: user.email });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME, clearCookieOptions);
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    throw new HttpError(401, "Not authenticated");
  }
  res.json({ id: user.id, email: user.email });
}
