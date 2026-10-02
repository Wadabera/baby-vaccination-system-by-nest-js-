import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "./Primitives";

/**
 * Destructive-action confirmation.
 *
 * Replaces `window.confirm`, which cannot be styled, blocks the main
 * thread and cannot be reached by screen-reader users reliably. Keeping
 * it on top of `Modal` means it inherits the focus trap, Escape
 * handling and scroll lock.
 */
export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  icon: Icon = AlertTriangle,
}) => {
  const confirmStyles = {
    danger: "btn-danger",
    primary: "btn-primary",
  }[tone];

  return (
    <Modal open={open} onClose={onClose} title={title} size="max-w-md">
      <div className="space-y-5">
        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
            tone === "danger"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-sky-200 bg-sky-50 text-sky-800"
          }`}
        >
          <Icon size={19} className="mt-0.5 shrink-0" />
          <p className="leading-relaxed">{description}</p>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn btn-soft">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`btn ${confirmStyles}`}
          >
            {tone === "danger" && <Trash2 size={17} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
