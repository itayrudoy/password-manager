import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../middleware/errorHandler.js";
import { COOKIE_NAME, verifyToken } from "./token.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    throw new HttpError(401, "Not authenticated");
  }
  try {
    req.userId = verifyToken(token).sub;
  } catch {
    throw new HttpError(401, "Not authenticated");
  }
  next();
}
