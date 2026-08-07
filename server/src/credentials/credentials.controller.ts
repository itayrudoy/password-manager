import type { Request, Response } from "express";
import { HttpError } from "../middleware/errorHandler.js";
import * as credentials from "./credentials.service.js";

function optionalString(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") throw new HttpError(400, `${field} must be a string`);
  return value;
}

function parseCreateInput(body: unknown): credentials.CredentialInput {
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

function parseUpdateInput(body: unknown): credentials.CredentialUpdateInput {
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
  const items = await credentials.listCredentials(req.userId!);
  res.json(items);
}

export async function create(req: Request, res: Response) {
  const input = parseCreateInput(req.body);
  const item = await credentials.createCredential(req.userId!, input);
  res.status(201).json(item);
}

export async function getOne(req: Request, res: Response) {
  const item = await credentials.getCredential(req.userId!, req.params.id);
  if (!item) {
    throw new HttpError(404, "Credential not found");
  }
  res.json(item);
}

export async function update(req: Request, res: Response) {
  const input = parseUpdateInput(req.body);
  const item = await credentials.updateCredential(req.userId!, req.params.id, input);
  if (!item) {
    throw new HttpError(404, "Credential not found");
  }
  res.json(item);
}

export async function remove(req: Request, res: Response) {
  const deleted = await credentials.deleteCredential(req.userId!, req.params.id);
  if (!deleted) {
    throw new HttpError(404, "Credential not found");
  }
  res.status(204).send();
}
