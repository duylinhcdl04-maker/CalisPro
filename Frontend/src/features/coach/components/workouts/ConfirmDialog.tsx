import { Button3D, Modal } from "../ui";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Small confirm modal for destructive or lossy actions. */
export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = "Huỷ", tone = "danger", loading, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onCancel()}
      title={title}
      size="sm"
      footer={
        <>
          <Button3D variant="ghost" onClick={onCancel}>{cancelLabel}</Button3D>
          <Button3D variant={tone} onClick={onConfirm} loading={loading}>{confirmLabel}</Button3D>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
    </Modal>
  );
}
