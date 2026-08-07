import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { CredentialCard } from "./CredentialCard";
import { CredentialFormModal } from "./CredentialFormModal";
import { DeleteCredentialConfirmModal } from "./DeleteCredentialConfirmModal";
import type { Credential } from "./types";
import "./VaultPage.css";

export function VaultPage() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Credential | null>(null);
  const [deletingItem, setDeletingItem] = useState<Credential | null>(null);

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
      <div className="vault__shell">
        <header className="topbar">
          <div className="topbar__brand">
            <span className="topbar__glyph" aria-hidden="true">
              <Icon name="shield" size={19} />
            </span>
            <span className="topbar__word">Vault</span>
          </div>

          <div className="topbar__spacer" />

          <button className="topbar__new" onClick={openAddForm}>
            <Icon name="plus" size={16} /> New login
          </button>
          <button
            className="topbar__avatar"
            onClick={() => logout()}
            title={user?.email ? `Log out (${user.email})` : "Log out"}
            aria-label="Log out"
          >
            {initials}
          </button>
        </header>

        <div className="vault__body">
          <div className="vault__bhead">
            <h2 className="vault__htitle">All logins</h2>
            {showList && items.length > 0 && (
              <span className="vault__count">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            )}
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
