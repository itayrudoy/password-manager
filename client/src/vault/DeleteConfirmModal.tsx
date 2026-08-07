import type { Credential } from "./types";

interface DeleteConfirmModalProps {
  item: Credential;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ item, onCancel, onConfirm }: DeleteConfirmModalProps) {
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
