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

## Phase 2 — Zero-knowledge encryption & core security
Close the plaintext hole the right way. Completing this phase = the app is completely usable for real passwords.
- Master password + client-side KDF (Argon2/PBKDF2) → vault key that never leaves the browser.
- Web Crypto encrypt/decrypt in the client; server stores ciphertext only; encrypted-blob schema; migrate existing plaintext rows.
- Unlock / lock flow (manual lock; auto-lock-on-idle deferred).
- Recovery key / emergency kit — one-time recovery code generated at master-password setup.
- XSS / CSP hardening.

## Phase 3 — Migration & CI/CD
- CI/CD: pipeline running tests + lint on every change.
- NordPass CSV import: migration tool to load an existing NordPass export into the vault.

## Phase 4 — Organization
Client-side (required under zero-knowledge).
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

## Later phases
- Browser extension — autofill, capture-on-login, inline generation.
- Account MFA (TOTP) + session/device management.
- Export — encrypted file / CSV.

## Someday / far future
- Vault health & breach monitoring.
- Secure sharing + emergency access (teams/orgs out of scope).
- Built-in TOTP / 2FA code storage for other sites.
- Desktop / mobile apps.
