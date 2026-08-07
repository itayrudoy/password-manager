import type { Credential } from "@prisma/client";
import { decrypt, encrypt } from "../crypto/vaultCrypto.js";
import { prisma } from "../db/prisma.js";

export interface CredentialInput {
  title: string;
  url?: string | null;
  username?: string | null;
  password: string;
  notes?: string | null;
}

export interface CredentialUpdateInput {
  title?: string;
  url?: string | null;
  username?: string | null;
  password?: string;
  notes?: string | null;
}

async function toView(item: Credential) {
  return { ...item, password: await decrypt(item.password) };
}

export async function listCredentials(userId: string) {
  const items = await prisma.credential.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return Promise.all(items.map(toView));
}

export async function createCredential(userId: string, input: CredentialInput) {
  const item = await prisma.credential.create({
    data: {
      userId,
      title: input.title,
      url: input.url ?? null,
      username: input.username ?? null,
      password: await encrypt(input.password),
      notes: input.notes ?? null,
    },
  });
  return toView(item);
}

export async function getCredential(userId: string, id: string) {
  const item = await prisma.credential.findFirst({ where: { id, userId } });
  return item ? toView(item) : null;
}

export async function updateCredential(userId: string, id: string, input: CredentialUpdateInput) {
  const existing = await prisma.credential.findFirst({ where: { id, userId } });
  if (!existing) {
    return null;
  }
  const item = await prisma.credential.update({
    where: { id },
    data: {
      title: input.title,
      url: input.url,
      username: input.username,
      notes: input.notes,
      password: input.password !== undefined ? await encrypt(input.password) : undefined,
    },
  });
  return toView(item);
}

export async function deleteCredential(userId: string, id: string): Promise<boolean> {
  const existing = await prisma.credential.findFirst({ where: { id, userId } });
  if (!existing) {
    return false;
  }
  await prisma.credential.delete({ where: { id } });
  return true;
}
