import { useState } from "react";
import type { Credential } from "./types";

interface CredentialCardProps {
  item: Credential;
  onEdit: (item: Credential) => void;
  onDelete: (item: Credential) => void;
}

export function CredentialCard({ item, onEdit, onDelete }: CredentialCardProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="item-card">
      <h3>{item.title}</h3>
      {item.url && <div>{item.url}</div>}
      {item.username && <div>{item.username}</div>}
      <div>
        <span>{revealed ? item.password : "•".repeat(8)}</span>{" "}
        <button type="button" onClick={() => setRevealed((r) => !r)}>
          {revealed ? "Hide" : "Show"}
        </button>
      </div>
      {item.notes && <div>{item.notes}</div>}
      <div className="actions">
        <button type="button" onClick={() => onEdit(item)}>
          Edit
        </button>
        <button type="button" onClick={() => onDelete(item)}>
          Delete
        </button>
      </div>
    </div>
  );
}
