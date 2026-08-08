# Design reference — "Strongroom" vault redesign

An interactive HTML mockup of the vault dashboard the team liked and wants to build toward.
Open [`strongroom-vault-mockup.html`](./strongroom-vault-mockup.html) directly in a browser — it's
self-contained (no build, no external assets). It supersedes the earlier azure "top bar + list"
direction as the look we're designing to.

> Status: **design reference / exploration**, not yet implemented in `client/`. It shows some
> roadmap features (favorites, folders, tags, item types, generator, health) as mockup only.

## Concept

The whole domain is made of monospaced strings — passwords, codes, keys — so **monospace is the
personality face**: wordmark, the health score, eyebrows, and all secret data are mono; a clean
sans carries reading text.

**Signature element — the "vault barcode":** a canvas strip where every tick is one saved item,
colored by password strength. It's the hero and the one bold move; everything else stays quiet.

## Tokens

Colors are CSS custom properties in the file's `:root` (light) with a full dark theme
(`@media (prefers-color-scheme: dark)` + `[data-theme]` overrides). Light values:

| Role | Token | Light hex |
| --- | --- | --- |
| Ground (paper) | `--paper` | `#ECEDE7` |
| Card surface | `--surface` | `#FAFAF6` |
| Sunken surface | `--surface-2` | `#F2F3EC` |
| Text | `--ink` | `#161F1A` |
| Muted text | `--muted` | `#58635B` |
| Faint text | `--faint` | `#8A948B` |
| Line | `--line` | `#DBDCD2` |
| **Accent (vault green)** | `--accent` | `#0B5B45` |
| Favorites (brass) | `--brass` | `#A9803F` |

**Semantic (strength) — kept separate from the accent:** strong `--good #1F7A54`,
weak `--warn #B9760F`, reused `--slate #5E7183`, breached `--bad #B23A2E`.

- **Type:** `--mono` (ui-monospace / SF Mono stack) for display, numbers, secrets, eyebrows;
  `--sans` (system-ui stack) for UI/body. No webfonts — a deliberate call for a light mockup; if
  we commit, embed a specific mono via `@font-face` data-URI to lock it across machines.
- **Spacing/radii:** ad-hoc here; when we implement, fold into `client/src/styles/tokens.css`.

## Layout

Top bar (wordmark · search · New/avatar) → collapsible health hero → a two-column split of an
"index" rail (All / Favorites / item types / folders / tags / trash) beside the credential list.

## Notable interactions (all working in the mockup)

- **Collapsible health hero** — defaults to a slim summary bar; expands to the full barcode panel;
  choice persisted in `localStorage` (`sr-hero`).
- **Create / edit modal** — one modal, two modes; type selector (login/note/card/identity),
  password generator (`crypto.getRandomValues`) + a strength meter that echoes the barcode, tag
  chips, folder select, brass favorites switch.
- Row-level reveal/copy, favorite star, live search (`/` to focus), strength + section filters.

## Hosted copy

Published artifact (private to the owner): https://claude.ai/code/artifact/eb061915-d7c5-42e9-b19b-c6158edc26a9
