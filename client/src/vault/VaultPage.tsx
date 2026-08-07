import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { CredentialCard } from "./CredentialCard";
import { CredentialFormModal } from "./CredentialFormModal";
import { DeleteCredentialConfirmModal } from "./DeleteCredentialConfirmModal";
import type { Credential } from "./types";

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

  return (
    <div className="vault-page">
      <header className="vault-header">
        <h1>Vault</h1>
        <div>
          <span>{user?.email}</span>{" "}
          <button onClick={openAddForm}>Add item</button>{" "}
          <button onClick={() => logout()}>Log out</button>
        </div>
      </header>

      {isLoading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}

      {!isLoading && !error && items.length === 0 && <p>No credentials yet.</p>}

      <div className="vault-grid">
        {items.map((item) => (
          <CredentialCard
            key={item.id}
            item={item}
            onEdit={openEditForm}
            onDelete={setDeletingItem}
          />
        ))}
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
