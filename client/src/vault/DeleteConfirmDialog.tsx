import type { LoginItem } from "./types";

interface DeleteConfirmDialogProps {
  item: LoginItem;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({ item, onCancel, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Delete "{item.title}"?</h2>
        <p>This can't be undone.</p>
        <div className="actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
