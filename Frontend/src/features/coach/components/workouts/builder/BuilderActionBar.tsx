import { CheckCircle2, CircleDot, Rocket, Save } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import { Button3D } from "../../ui";

interface BuilderActionBarProps {
  dirty: boolean;
  saving: "draft" | "active" | null;
  /** Existing ACTIVE/PAUSED plans save without changing status. */
  keepStatusLabel: string | null;
  onCancel: () => void;
  onSaveDraft: () => void;
  onSaveActive: () => void;
}

/** Sticky bottom bar: save state + primary actions, always reachable while scrolling a long plan. */
export function BuilderActionBar({ dirty, saving, keepStatusLabel, onCancel, onSaveDraft, onSaveActive }: BuilderActionBarProps) {
  return (
    <div className="sticky bottom-3 z-30 mt-6">
      <div className="panel-3d flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" className={cn("inline-flex items-center gap-2 text-xs font-bold", dirty ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300")}>
          {dirty ? <CircleDot size={14} aria-hidden /> : <CheckCircle2 size={14} aria-hidden />}
          {dirty ? "Có thay đổi chưa lưu" : "Đã lưu mọi thay đổi"}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Button3D variant="ghost" onClick={onCancel} disabled={saving !== null} className="col-span-2 sm:col-span-1">
            Huỷ
          </Button3D>
          <Button3D leftIcon={<Save size={15} />} onClick={onSaveDraft} loading={saving === "draft"} disabled={saving !== null}>
            {keepStatusLabel ?? "Lưu nháp"}
          </Button3D>
          <Button3D variant="primary" leftIcon={<Rocket size={15} />} onClick={onSaveActive} loading={saving === "active"} disabled={saving !== null}>
            Lưu & áp dụng
          </Button3D>
        </div>
      </div>
    </div>
  );
}
