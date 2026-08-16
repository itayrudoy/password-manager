import type { Request, Response } from "express";
import { HttpError } from "../middleware/errorHandler.js";
import * as credentials from "./credentials.service.js";

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value) {
    throw new HttpError(400, `${field} is required`);
  }
  return value;
}

// Create and update both carry a full encrypted item: an edit re-encrypts the
// whole thing client-side, so there is no partial update. The server validates
// only the blob's shape — it can't (and must not) inspect the ciphertext.
function parseCredentialInput(body: unknown): credentials.CredentialInput {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.version !== "number" || !Number.isInteger(b.version)) {
    throw new HttpError(400, "version is required");
  }
  return {
    version: b.version,
    overviewCiphertext: requiredString(b.overviewCiphertext, "overviewCiphertext"),
    secretCiphertext: requiredString(b.secretCiphertext, "secretCiphertext"),
  };
}

export async function list(req: Request, res: Response) {
  const items = await credentials.listCredentials(req.userId!);
  res.json(items);
}

export async function create(req: Request, res: Response) {
  const input = parseCredentialInput(req.body);
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
  const input = parseCredentialInput(req.body);
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
