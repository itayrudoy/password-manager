import { prisma } from "../db/prisma.js";

// Vault items are encrypted in the browser (PM-11). The server stores and returns
// the ciphertext blobs verbatim — there is no encrypt/decrypt seam here anymore,
// and no code path on the server can read a secret. Persist exactly what the
// client sends; hand back exactly what's stored.

export interface CredentialInput {
  version: number;
  overviewCiphertext: string;
  secretCiphertext: string;
}

export async function listCredentials(userId: string) {
  return prisma.credential.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCredential(userId: string, input: CredentialInput) {
  return prisma.credential.create({
    data: {
      userId,
      version: input.version,
      overviewCiphertext: input.overviewCiphertext,
      secretCiphertext: input.secretCiphertext,
    },
  });
}

export async function getCredential(userId: string, id: string) {
  return prisma.credential.findFirst({ where: { id, userId } });
}

export async function updateCredential(userId: string, id: string, input: CredentialInput) {
  const existing = await prisma.credential.findFirst({ where: { id, userId } });
  if (!existing) {
    return null;
  }
  return prisma.credential.update({
    where: { id },
    data: {
      version: input.version,
      overviewCiphertext: input.overviewCiphertext,
      secretCiphertext: input.secretCiphertext,
    },
  });
}

export async function deleteCredential(userId: string, id: string): Promise<boolean> {
  const existing = await prisma.credential.findFirst({ where: { id, userId } });
  if (!existing) {
    return false;
  }
  await prisma.credential.delete({ where: { id } });
  return true;
}
