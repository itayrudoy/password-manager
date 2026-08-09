import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../lib/useTheme";
import { Button } from "../ui/Button";
import { Icon, type IconName } from "../ui/Icon";
import { CredentialCard } from "./CredentialCard";
import { CredentialFormModal } from "./CredentialFormModal";
import { DeleteCredentialConfirmModal } from "./DeleteCredentialConfirmModal";
import type { Credential } from "./types";
import "./VaultPage.css";

/* The index rail. "All logins" is the only live view today; the rest are
   scaffolded as disabled placeholders so the designed layout is visible
   ahead of the roadmap features that will fill them in (favorites, folders,
   tags, item types, trash — all later phases). */
interface RailItem {
  key: string;
  label: string;
  icon: IconName;
  soon?: boolean;
  tone?: "brass";
}
interface RailGroup {
  label?: string;
  items: RailItem[];
}

const RAIL: RailGroup[] = [
  {
    items: [
      { key: "all", label: "All logins", icon: "shield" },
      { key: "favorites", label: "Favorites", icon: "star", soon: true, tone: "brass" },
    ],
  },
  {
    label: "Types",
    items: [
      { key: "notes", label: "Secure notes", icon: "note", soon: true },
      { key: "cards", label: "Cards", icon: "card", soon: true },
      { key: "identities", label: "Identities", icon: "id", soon: true },
    ],
  },
  {
    label: "Organize",
    items: [
      { key: "folders", label: "Folders", icon: "folder", soon: true },
      { key: "tags", label: "Tags", icon: "tag", soon: true },
    ],
  },
  {
    items: [{ key: "trash", label: "Trash", icon: "trash", soon: true }],
  },
];

export function VaultPage() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [items, setItems] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Credential | null>(null);
  const [deletingItem, setDeletingItem] = useState<Credential | null>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close the account menu on outside click or Escape.
  useEffect(() => {
    if (!isAccountMenuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsAccountMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isAccountMenuOpen]);

  useEffect(() => {
    api
      .get<Credential[]>("/credentials")
      .then(setItems)
      .catch(() => setError("Failed to load your vault"))
      .finally(() => setIsLoading(false));
  }, []);

  function openAddForm() {
    setEditingItem(null);
    setIsFormOpen(true);
  }

  function openEditForm(item: Credential) {
    setEditingItem(item);
    setIsFormOpen(true);
  }

  function handleSaved(saved: Credential) {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === saved.id);
      return exists ? prev.map((i) => (i.id === saved.id ? saved : i)) : [saved, ...prev];
    });
    setIsFormOpen(false);
    setEditingItem(null);
  }

  async function handleConfirmDelete() {
    if (!deletingItem) return;
    await api.delete(`/credentials/${deletingItem.id}`);
    setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
    setDeletingItem(null);
  }

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();
  const showList = !isLoading && !error;

  return (
    <div className="vault">
      <header className="bar">
        <div className="mark">
          <span className="mark__glyph" aria-hidden="true">
            <Icon name="shield" size={19} />
          </span>
          <span className="mark__word">Vault</span>
        </div>

        {/* Search is a Phase 4 feature — shown for layout, disabled for now. */}
        <div className="search" title="Search is coming in a later phase">
          <Icon name="search" size={16} />
          <input
            type="text"
            placeholder="Search your vault…"
            disabled
            aria-label="Search your vault (coming soon)"
          />
          <kbd>/</kbd>
        </div>

        <div className="bar__right">
          <button
            className="iconbtn"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
          </button>
          <Button variant="primary" onClick={openAddForm}>
            <Icon name="plus" size={16} /> New login
          </Button>
          <div className="account" ref={accountRef}>
            <button
              className="avatar"
              onClick={() => setIsAccountMenuOpen((open) => !open)}
              aria-haspopup="true"
              aria-expanded={isAccountMenuOpen}
              aria-label="Account menu"
            >
              {initials}
            </button>
            {isAccountMenuOpen && (
              <div className="account__menu">
                <div className="account__id">
                  <span className="account__id-label">Signed in as</span>
                  <span className="account__id-email">{user?.email ?? "—"}</span>
                </div>
                <button type="button" className="account__item" onClick={() => logout()}>
                  <Icon name="logout" size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="split">
        <nav className="rail" aria-label="Vault sections">
          {RAIL.map((group, gi) => (
            <div className="rail__group" key={group.label ?? `g${gi}`}>
              {group.label && <div className="rail__label">{group.label}</div>}
              {group.items.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  className={`nav ${it.tone === "brass" ? "nav--brass" : ""}`.trim()}
                  aria-current={it.key === "all" ? "true" : undefined}
                  aria-disabled={it.soon || undefined}
                  disabled={it.soon}
                >
                  <Icon name={it.icon} size={17} />
                  <span className="nav__label">{it.label}</span>
                  {it.key === "all" && showList ? (
                    <span className="count">{items.length}</span>
                  ) : it.soon ? (
                    <span className="soon">Soon</span>
                  ) : null}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="content">
          <div className="listhead">
            <h1>
              All logins
              {showList && items.length > 0 && <span>{items.length}</span>}
            </h1>
          </div>

          {isLoading && <div className="vault__state">Loading your vault…</div>}
          {error && <div className="vault__state vault__state--error">{error}</div>}

          {showList && items.length === 0 && (
            <div className="vault__empty">
              <span className="vault__empty-glyph" aria-hidden="true">
                <Icon name="shield" size={26} />
              </span>
              <h3 className="vault__empty-title">No logins yet</h3>
              <p className="vault__empty-text">
                Add your first set of credentials and they’ll show up here.
              </p>
              <Button onClick={openAddForm}>
                <Icon name="plus" size={16} /> New login
              </Button>
            </div>
          )}

          {showList && items.length > 0 && (
            <div className="vault__list">
              {items.map((item) => (
                <CredentialCard
                  key={item.id}
                  item={item}
                  onEdit={openEditForm}
                  onDelete={setDeletingItem}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <CredentialFormModal
          item={editingItem}
          onClose={() => setIsFormOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {deletingItem && (
        <DeleteCredentialConfirmModal
          item={deletingItem}
          onCancel={() => setDeletingItem(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
