import type { EncryptedItem, ItemFields } from "../lib/itemCrypto";

/** A vault item as the UI sees it: decrypted fields + server bookkeeping. */
export interface Credential extends ItemFields {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** A vault item as stored/sent over the wire: opaque ciphertext + bookkeeping. */
export type EncryptedCredential = EncryptedItem & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

/** The full field set a form produces for a create or an edit (full replace). */
export type CredentialInput = ItemFields;
