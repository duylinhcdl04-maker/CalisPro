import { BellRing, X } from "lucide-react";
import { Button3D } from "../../ui";

interface BulkActionBarProps {
  count: number;
  onRemind: () => void;
  onClear: () => void;
}

export function BulkActionBar({ count, onRemind, onClear }: BulkActionBarProps) {
  if (count === 0) return null;
  return (
    <div
      role="region"
      aria-label="Thao tác hàng loạt"
      className="flex animate-rise flex-wrap items-center justify-between gap-3 rounded-[16px] border border-accent/30 bg-accent-soft/60 px-4 py-2.5"
    >
      <p className="text-sm font-bold text-text-primary" aria-live="polite">
        Đã chọn <span className="tabular-nums">{count}</span> học viên
      </p>
      <div className="flex items-center gap-2">
        <Button3D size="sm" variant="primary" leftIcon={<BellRing size={14} aria-hidden />} onClick={onRemind}>
          Gửi nhắc nhở
        </Button3D>
        <Button3D size="sm" variant="ghost" leftIcon={<X size={14} aria-hidden />} onClick={onClear}>
          Bỏ chọn
        </Button3D>
      </div>
    </div>
  );
}
