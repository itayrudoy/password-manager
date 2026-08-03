import type { Request, Response } from "express";
import { HttpError } from "../middleware/errorHandler.js";
import * as loginItems from "./loginItems.service.js";

function optionalString(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") throw new HttpError(400, `${field} must be a string`);
  return value;
}

function parseCreateInput(body: unknown): loginItems.LoginItemInput {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.title !== "string" || !b.title) {
    throw new HttpError(400, "title is required");
  }
  if (typeof b.password !== "string" || !b.password) {
    throw new HttpError(400, "password is required");
  }
  return {
    title: b.title,
    password: b.password,
    url: optionalString(b.url, "url"),
    username: optionalString(b.username, "username"),
    notes: optionalString(b.notes, "notes"),
  };
}

function parseUpdateInput(body: unknown): loginItems.LoginItemUpdateInput {
  const b = (body ?? {}) as Record<string, unknown>;
  if (b.title !== undefined && (typeof b.title !== "string" || !b.title)) {
    throw new HttpError(400, "title must be a non-empty string");
  }
  if (b.password !== undefined && (typeof b.password !== "string" || !b.password)) {
    throw new HttpError(400, "password must be a non-empty string");
  }
  return {
    title: b.title as string | undefined,
    password: b.password as string | undefined,
    url: optionalString(b.url, "url"),
    username: optionalString(b.username, "username"),
    notes: optionalString(b.notes, "notes"),
  };
}

export async function list(req: Request, res: Response) {
  const items = await loginItems.listLoginItems(req.userId!);
  res.json(items);
}

export async function create(req: Request, res: Response) {
  const input = parseCreateInput(req.body);
  const item = await loginItems.createLoginItem(req.userId!, input);
  res.status(201).json(item);
}

export async function getOne(req: Request, res: Response) {
  const item = await loginItems.getLoginItem(req.userId!, req.params.id);
  if (!item) {
    throw new HttpError(404, "Login item not found");
  }
  res.json(item);
}

export async function update(req: Request, res: Response) {
  const input = parseUpdateInput(req.body);
  const item = await loginItems.updateLoginItem(req.userId!, req.params.id, input);
  if (!item) {
    throw new HttpError(404, "Login item not found");
  }
  res.json(item);
}

export async function remove(req: Request, res: Response) {
  const deleted = await loginItems.deleteLoginItem(req.userId!, req.params.id);
  if (!deleted) {
    throw new HttpError(404, "Login item not found");
  }
  res.status(204).send();
}
