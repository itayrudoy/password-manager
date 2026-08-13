import type { Request, Response } from "express";
import * as keychain from "./keychain.service.js";

// Hands the authenticated session its Vault Key (base64). The server unlocks the
// escrow copy on its side; the browser holds the key in memory to encrypt items.
// Throws (→ 500) if the key is missing — an anomaly we surface, never patch over.
export async function getVaultKey(req: Request, res: Response) {
  const vaultKey = await keychain.getVaultKey(req.userId!);
  // The body carries a secret — keep it out of browser/proxy caches.
  res.setHeader("Cache-Control", "no-store");
  res.json({ vaultKey: vaultKey.toString("base64") });
}
