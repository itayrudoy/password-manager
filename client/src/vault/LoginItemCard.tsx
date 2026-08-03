import { useState } from "react";
import type { LoginItem } from "./types";

interface LoginItemCardProps {
  item: LoginItem;
  onEdit: (item: LoginItem) => void;
  onDelete: (item: LoginItem) => void;
}

export function LoginItemCard({ item, onEdit, onDelete }: LoginItemCardProps) {
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
