import { Video } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../components/ui/Dialog";

interface Props {
  open: boolean;
  retentionDays: number;
  busy?: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

/** Xin đồng ý trước khi ghi hình bài test L4. Từ chối vẫn test được nhưng chỉ lên tới L3 bằng camera. */
export function RecordingConsentDialog({ open, retentionDays, busy, onAccept, onDecline }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !busy) onDecline(); }}>
      <DialogContent>
        <DialogTitle className="flex items-center gap-2 font-display text-lg font-black text-text-primary">
          <Video size={18} aria-hidden />Ghi hình bài test để Coach xác nhận
        </DialogTitle>
        <DialogDescription className="mt-1 text-xs text-text-secondary">Bài test này có thể đưa bạn lên Level 4.</DialogDescription>
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-text-secondary">
          <li>Camera chỉ ghi hình, <b>không ghi âm</b>, và chỉ trong lúc bạn làm bài test.</li>
          <li>Video được tải lên kho lưu trữ riêng và chỉ Coach xác nhận Level 4 xem được.</li>
          <li>Video tự động bị xoá sau <b>{retentionDays} ngày</b>.</li>
          <li>Nếu không đồng ý, bạn vẫn test bình thường nhưng chỉ có thể được xác nhận tới Level 3.</li>
        </ul>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onDecline} disabled={busy}>Không đồng ý</Button>
          <Button variant="accent" size="sm" onClick={onAccept} disabled={busy}>Đồng ý ghi hình</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
