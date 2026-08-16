import { api } from "../api/client";
import { decryptItem, encryptItem, type ItemFields } from "../lib/itemCrypto";
import type { Credential, EncryptedCredential } from "./types";

// Client-side data layer for vault items. All encryption/decryption happens here
// under the session Vault Key, so the rest of the app works with plain
// Credentials and never touches ciphertext. The server only ever sees the blobs.

async function toCredential(
  vaultKey: CryptoKey,
  userId: string,
  row: EncryptedCredential,
): Promise<Credential> {
  const fields = await decryptItem(vaultKey, userId, row);
  return { id: row.id, createdAt: row.createdAt, updatedAt: row.updatedAt, ...fields };
}

export async function listCredentials(vaultKey: CryptoKey, userId: string): Promise<Credential[]> {
  const rows = await api.get<EncryptedCredential[]>("/credentials");
  return Promise.all(rows.map((row) => toCredential(vaultKey, userId, row)));
}

export async function saveCredential(
  vaultKey: CryptoKey,
  userId: string,
  fields: ItemFields,
  id?: string,
): Promise<Credential> {
  const blob = await encryptItem(vaultKey, userId, fields);
  const row = id
    ? await api.put<EncryptedCredential>(`/credentials/${id}`, blob)
    : await api.post<EncryptedCredential>("/credentials", blob);
  return toCredential(vaultKey, userId, row);
}

export function deleteCredential(id: string): Promise<void> {
  return api.delete<void>(`/credentials/${id}`);
}
