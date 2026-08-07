import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import type { Credential } from "./types";

interface DeleteCredentialConfirmModalProps {
  item: Credential;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteCredentialConfirmModal({
  item,
  onCancel,
  onConfirm,
}: DeleteCredentialConfirmModalProps) {
  return (
    <Modal onClose={onCancel} labelledBy="delete-title">
      <span className="modal__warn" aria-hidden="true">
        <Icon name="trash" size={20} />
      </span>
      <h2 className="modal__title" id="delete-title">
        Delete “{item.title}”?
      </h2>
      <p className="modal__subtitle">
        This permanently removes the login from your vault. This can’t be undone.
      </p>
      <div className="modal__foot">
        <Button variant="outline" onClick={onCancel} autoFocus>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
