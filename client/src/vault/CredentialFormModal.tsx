import { useState, type FormEvent } from "react";
import { api, ApiError } from "../api/client";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { Icon } from "../ui/Icon";
import { useCopyFeedback } from "../lib/useCopyFeedback";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { PasswordGenerator } from "./PasswordGenerator";
import type { Credential, CredentialInput } from "./types";

interface CredentialFormModalProps {
  item: Credential | null;
  onClose: () => void;
  onSaved: (item: Credential) => void;
}

export function CredentialFormModal({ item, onClose, onSaved }: CredentialFormModalProps) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [username, setUsername] = useState(item?.username ?? "");
  const [password, setPassword] = useState(item?.password ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const { copied, copy } = useCopyFeedback();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    const input: CredentialInput = {
      title,
      url: url || null,
      username: username || null,
      password,
      notes: notes || null,
    };
    try {
      const saved = item
        ? await api.put<Credential>(`/credentials/${item.id}`, input)
        : await api.post<Credential>("/credentials", input);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save item");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="credential-form-title">
      <div className="modal__head">
        <span className="modal__eyebrow" id="credential-form-title">
          <span className="modal__dot" aria-hidden="true" />
          {item ? "Edit login" : "New login"}
        </span>
        <button
          type="button"
          className="modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        {error && <p className="error">{error}</p>}

        <Input
          label="Name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. GitHub"
          required
          autoFocus
        />
        <Input
          label="Username or email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          type={revealed ? "text" : "password"}
          mono
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Type or generate"
          required
          trailing={
            <>
              <IconButton
                aria-label={revealed ? "Hide password" : "Reveal password"}
                aria-pressed={revealed}
                onClick={() => setRevealed((r) => !r)}
              >
                <Icon name={revealed ? "eyeOff" : "eye"} size={15} />
              </IconButton>
              <IconButton
                aria-label="Copy password"
                className={copied === "password" ? "is-copied" : ""}
                onClick={() => password && copy(password, "password")}
              >
                <Icon name={copied === "password" ? "check" : "copy"} size={14} />
              </IconButton>
            </>
          }
        />
        <PasswordStrengthMeter password={password} />
        <PasswordGenerator
          onGenerate={(pw) => {
            setPassword(pw);
            setRevealed(true);
          }}
        />
        <Input
          label="Website"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="github.com"
        />
        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
        />

        <div className="modal__foot">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save login"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
