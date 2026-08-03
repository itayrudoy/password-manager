import { useState, type FormEvent } from "react";
import { api, ApiError } from "../api/client";
import type { LoginItem, LoginItemInput } from "./types";

interface LoginItemFormModalProps {
  item: LoginItem | null;
  onClose: () => void;
  onSaved: (item: LoginItem) => void;
}

export function LoginItemFormModal({ item, onClose, onSaved }: LoginItemFormModalProps) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [username, setUsername] = useState(item?.username ?? "");
  const [password, setPassword] = useState(item?.password ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    const input: LoginItemInput = {
      title,
      url: url || null,
      username: username || null,
      password,
      notes: notes || null,
    };
    try {
      const saved = item
        ? await api.put<LoginItem>(`/login-items/${item.id}`, input)
        : await api.post<LoginItem>("/login-items", input);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save item");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{item ? "Edit item" : "Add item"}</h2>
        {error && <p className="error">{error}</p>}
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Website
          <input value={url} onChange={(e) => setUrl(e.target.value)} />
        </label>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <label>
          Notes
          <input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <div className="actions">
          <button type="button" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" disabled={isSaving}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
