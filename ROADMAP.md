# Roadmap

## Phase 1 — Redesign & foundation
Get the existing app to a genuinely good, clean look in our own light style. No frontend for features that don't exist yet.
- Clean, modern "our own" style — not a NordPass copy, not over-invested.
- Design tokens (color, spacing, typography, radii) as CSS variables, replacing the ad-hoc `globals.css`.
- Component primitives: `Button`, `Input`, `Modal`, `Card` (today modals are re-implemented inline).
- Restyle the existing screens only: Login, Signup, Vault, `CredentialCard`, the add/edit + delete modals.
- Copy-to-clipboard on card fields, password reveal toggle, empty/loading states.
- Password generator + strength meter in the add/edit form.
- Dark mode only if basically free.

## Phase 2 — Encryption foundation (convenient vault)
Close the plaintext hole with client-side encryption, while keeping login effortless and the vault recoverable — no master password. Completing this phase = the app is safe for real passwords for everyday users.
- Per-user **Vault Key**; the browser encrypts every item (Web Crypto / AES-GCM) before it's sent — server stores ciphertext only. Encrypted-blob schema; migrate existing plaintext rows.
- **Server-escrowed Vault Key**: the server keeps a protected (envelope-encrypted) copy, so login transparently hands the key back to the browser — no master password, works on any device, fully recoverable. (Tradeoff: the server *can* technically decrypt in this tier — like Google Password Manager's default.)
- Built around one Vault Key + pluggable **unlock methods** (key wraps), so the extra-secure tier (Phase 7) later slots in by adding user-held wraps — no re-encryption, no schema/API rewrite.
- Manual lock/unlock in-session (auto-lock-on-idle deferred).
- XSS / CSP hardening.

## Phase 3 — Migration & CI/CD
- CI/CD: pipeline running tests + lint on every change.
- NordPass CSV import: migration tool to load an existing NordPass export into the vault.

## Phase 4 — Organization
Client-side (required — items are client-side encrypted, so the server can't organize them).
- Search — filter by title/username/website.
- Favorites — pin to the top.
- Folders — named folders, one per item.
- Tags — freeform labels, many per item.
- Trash / soft-delete — recoverable delete instead of permanent removal.

## Phase 5 — Public deployment
- Hosted server + database behind HTTPS so the app is reachable from any device (multi-device / anywhere access).

## Phase 6 — Richer item data
- Item types: secure notes, credit cards, identities.
- Custom fields on logins — user-added labeled fields for sites needing more than username/password (PINs, security questions, secondary codes).

## Phase 7 — Extra-secure items (opt-in, zero-knowledge)
Let users lock chosen items so not even we can read them — the private tier, layered on the convenient vault.
- A second **Private Vault Key**, protected only by user-held unlock methods: a **master password** (client-side KDF — Argon2id/PBKDF2) and a **recovery code / emergency kit** generated at setup. Server holds no openable copy.
- Per-item choice of convenient vs extra-secure; convenient items auto-unlock on login, extra-secure items stay locked until the master password is entered.
- Unlock/lock flow for the private drawer; biometric convenience unlock (Face ID / Windows Hello) where available; client-side search for extra-secure items.
- Reuses the Phase 2 Vault-Key + unlock-method model — no re-encryption of existing items.

## Later phases
- Browser extension — autofill, capture-on-login, inline generation.
- Account MFA (TOTP) + session/device management.
- Export — encrypted file / CSV.

## Someday / far future
- Vault health & breach monitoring.
- Secure sharing + emergency access (teams/orgs out of scope).
- Built-in TOTP / 2FA code storage for other sites.
- Desktop / mobile apps.
