import type { LoginItem } from "@prisma/client";
import { decrypt, encrypt } from "../crypto/vaultCrypto.js";
import { prisma } from "../db/prisma.js";

export interface LoginItemInput {
  title: string;
  url?: string | null;
  username?: string | null;
  password: string;
  notes?: string | null;
}

export interface LoginItemUpdateInput {
  title?: string;
  url?: string | null;
  username?: string | null;
  password?: string;
  notes?: string | null;
}

async function toView(item: LoginItem) {
  return { ...item, password: await decrypt(item.password) };
}

export async function listLoginItems(userId: string) {
  const items = await prisma.loginItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return Promise.all(items.map(toView));
}

export async function createLoginItem(userId: string, input: LoginItemInput) {
  const item = await prisma.loginItem.create({
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

export async function getLoginItem(userId: string, id: string) {
  const item = await prisma.loginItem.findFirst({ where: { id, userId } });
  return item ? toView(item) : null;
}

export async function updateLoginItem(userId: string, id: string, input: LoginItemUpdateInput) {
  const existing = await prisma.loginItem.findFirst({ where: { id, userId } });
  if (!existing) {
    return null;
  }
  const item = await prisma.loginItem.update({
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

export async function deleteLoginItem(userId: string, id: string): Promise<boolean> {
  const existing = await prisma.loginItem.findFirst({ where: { id, userId } });
  if (!existing) {
    return false;
  }
  await prisma.loginItem.delete({ where: { id } });
  return true;
}
