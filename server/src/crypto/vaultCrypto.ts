// Placeholder seam for vault item encryption. Today both functions are
// identity no-ops, so credentials.password is stored as plaintext. All
// credential password reads/writes must go through here (never touch the
// `password` column directly elsewhere) so real encryption — likely
// client-side/zero-knowledge — can replace these bodies later without
// changing any caller, the schema, or the API contract. Typed as async
// from the start since real crypto (e.g. Web Crypto API) will be async.

export async function encrypt(plaintext: string): Promise<string> {
  return plaintext;
}

export async function decrypt(ciphertext: string): Promise<string> {
  return ciphertext;
}
