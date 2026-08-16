import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { importVaultKey } from "../lib/itemCrypto";

// Holds the session's Vault Key in memory. Once the user is authenticated we
// fetch the server-delivered key (GET /api/keychain/vault-key) and import it as
// a non-extractable AES-GCM CryptoKey, so the browser can encrypt/decrypt items
// without the raw bytes ever being readable back out or persisted. The key is
// dropped when the user logs out. PM-12 will layer manual lock/unlock on top.

export type VaultKeyStatus = "loading" | "ready" | "error";

interface VaultKeyContextValue {
  vaultKey: CryptoKey | null;
  status: VaultKeyStatus;
}

const VaultKeyContext = createContext<VaultKeyContextValue | undefined>(undefined);

/** The fetched key, tagged with the user it belongs to so a stale key from a
 *  previous session is never presented to a different (or logged-out) user. */
interface KeyState {
  userId: string | null;
  vaultKey: CryptoKey | null;
  status: VaultKeyStatus;
}

const INITIAL: KeyState = { userId: null, vaultKey: null, status: "loading" };

export function VaultKeyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<KeyState>(INITIAL);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    api
      .get<{ vaultKey: string }>("/keychain/vault-key")
      .then((res) => importVaultKey(res.vaultKey))
      .then((key) => {
        if (!cancelled) setState({ userId, vaultKey: key, status: "ready" });
      })
      .catch(() => {
        if (!cancelled) setState({ userId, vaultKey: null, status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Only trust the fetched key for the current user; otherwise show "loading"
  // (no user yet, or a fetch still in flight after a user change).
  const value: VaultKeyContextValue =
    userId && state.userId === userId
      ? { vaultKey: state.vaultKey, status: state.status }
      : { vaultKey: null, status: "loading" };

  return <VaultKeyContext.Provider value={value}>{children}</VaultKeyContext.Provider>;
}

export function useVaultKey(): VaultKeyContextValue {
  const context = useContext(VaultKeyContext);
  if (!context) {
    throw new Error("useVaultKey must be used within a VaultKeyProvider");
  }
  return context;
}
