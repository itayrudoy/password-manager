// Client-side vault item crypto. Encrypts a vault item in the browser under the
// session Vault Key before it leaves the client, and decrypts on the way back,
// so the server only ever stores opaque ciphertext (see PM-11).
//
// An item is stored as TWO independent encrypted blobs, not one:
//   - overview: title, url, username — the fields the vault list renders, so
//     they're decrypted once on load.
//   - secret: password, notes — decrypted only when an item is opened/revealed,
//     so passwords aren't held in memory just to browse the list.
//
// Each blob is a self-contained base64 token: IV ‖ ciphertext‖tag, where the
// 12-byte IV rides in the clear at the front (it must be unique per encryption,
// not secret) and Web Crypto appends the GCM auth tag to the ciphertext.
//
// Two version layers, deliberately separate (they change for different reasons):
//   - ENVELOPE_VERSION: how the bytes are encrypted (cipher/layout). Cleartext,
//     bound into the AAD so it's tamper-evident, and needed before decryption.
//   - SCHEMA_VERSION ("v" inside each doc): what the decrypted fields mean.
//     Lives inside the ciphertext, so the GCM tag already protects it.
//
// The AAD binds each blob to {userId, part, envelopeVersion}. It authenticates
// (doesn't encrypt) that context, so a blob can't be transplanted to another
// user, an overview blob can't be passed off as a secret blob, and the cleartext
// version can't be downgraded — any mismatch makes decryption fail.

/** The decrypted, user-facing fields of a vault item. */
export interface ItemFields {
  title: string;
  url: string | null;
  username: string | null;
  password: string;
  notes: string | null;
}

/** The encrypted, stored/over-the-wire shape (server bookkeeping omitted). */
export interface EncryptedItem {
  version: number;
  overviewCiphertext: string;
  secretCiphertext: string;
}

/** Thrown when a decrypted blob doesn't match the expected schema. */
export class ItemSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ItemSchemaError";
  }
}

const ENVELOPE_VERSION = 1;
const SCHEMA_VERSION = 1;
const IV_BYTES = 12;
const VAULT_KEY_BYTES = 32;

type Part = "overview" | "secret";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** UTF-8 encode into a fresh ArrayBuffer-backed view (satisfies BufferSource). */
function utf8(text: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(encoder.encode(text));
}

/** Authenticated (not encrypted) context binding a blob to its owner and slot. */
function aad(userId: string, part: Part, version: number): Uint8Array<ArrayBuffer> {
  return utf8(`${version}:${part}:${userId}`);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Encrypts one JSON doc into a self-contained IV‖ciphertext‖tag base64 token. */
async function seal(
  key: CryptoKey,
  userId: string,
  part: Part,
  doc: unknown,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const plaintext = utf8(JSON.stringify(doc));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: aad(userId, part, ENVELOPE_VERSION) },
      key,
      plaintext,
    ),
  );
  const token = new Uint8Array(iv.length + ciphertext.length);
  token.set(iv, 0);
  token.set(ciphertext, iv.length);
  return toBase64(token);
}

/** Reverses `seal`: verifies the AAD/tag and returns the parsed JSON doc. */
async function open(
  key: CryptoKey,
  userId: string,
  part: Part,
  version: number,
  token: string,
): Promise<unknown> {
  const bytes = fromBase64(token);
  const iv = bytes.slice(0, IV_BYTES);
  const ciphertext = bytes.slice(IV_BYTES);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, additionalData: aad(userId, part, version) },
    key,
    ciphertext,
  );
  return JSON.parse(decoder.decode(plaintext));
}

/**
 * Imports the base64 Vault Key delivered by GET /api/keychain/vault-key into a
 * non-extractable AES-GCM key. Non-extractable so the raw bytes can't be read
 * back out of the CryptoKey once imported (they only enter/leave via encrypt/
 * decrypt). Held in memory for the session; never persisted.
 */
export async function importVaultKey(base64: string): Promise<CryptoKey> {
  const raw = fromBase64(base64);
  if (raw.length !== VAULT_KEY_BYTES) {
    throw new Error(`Vault Key must be ${VAULT_KEY_BYTES} bytes`);
  }
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptItem(
  key: CryptoKey,
  userId: string,
  fields: ItemFields,
): Promise<EncryptedItem> {
  const overview = {
    v: SCHEMA_VERSION,
    title: fields.title,
    url: fields.url,
    username: fields.username,
  };
  const secret = {
    v: SCHEMA_VERSION,
    password: fields.password,
    notes: fields.notes,
  };
  const [overviewCiphertext, secretCiphertext] = await Promise.all([
    seal(key, userId, "overview", overview),
    seal(key, userId, "secret", secret),
  ]);
  return { version: ENVELOPE_VERSION, overviewCiphertext, secretCiphertext };
}

export async function decryptItem(
  key: CryptoKey,
  userId: string,
  item: EncryptedItem,
): Promise<ItemFields> {
  // Bind the *stored* envelope version into the AAD (not a constant), so a
  // tampered/unsupported version fails to decrypt instead of being trusted.
  if (item.version !== ENVELOPE_VERSION) {
    throw new ItemSchemaError(`unsupported envelope version: ${item.version}`);
  }
  const [overview, secret] = await Promise.all([
    open(key, userId, "overview", item.version, item.overviewCiphertext),
    open(key, userId, "secret", item.version, item.secretCiphertext),
  ]);
  return {
    title: field(overview, "title", "string") as string,
    url: nullableField(overview, "url", "string") as string | null,
    username: nullableField(overview, "username", "string") as string | null,
    password: field(secret, "password", "string") as string,
    notes: nullableField(secret, "notes", "string") as string | null,
  };
}

function field(doc: unknown, name: string, type: "string"): unknown {
  const record = doc as Record<string, unknown>;
  if (typeof record?.[name] !== type) {
    throw new ItemSchemaError(`missing or invalid field: ${name}`);
  }
  return record[name];
}

function nullableField(doc: unknown, name: string, type: "string"): unknown {
  const value = (doc as Record<string, unknown>)?.[name];
  if (value !== null && typeof value !== type) {
    throw new ItemSchemaError(`invalid field: ${name}`);
  }
  return value;
}
