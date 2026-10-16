import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2, Save } from "lucide-react";
import { useAiCoach } from "../aiCoachApi";
import { useExerciseBasePath } from "../useExerciseBasePath";

/**
 * Trạng thái cấu hình đo của bài khi chọn "Tích hợp AI: Có". Cờ chỉ là công tắc cho phép; AI chỉ chạy khi bài có đủ loại chuyển động, ngưỡng đỉnh/đáy
 * và 3 điểm khớp, được nhập ở trang cấu hình chuyển động (Coach: Rule chấm form; Admin: AI Coaching & Vision).
 * Bài chưa lưu lần nào thì chưa có hồ sơ AI nên chỉ nhắc cần lưu trước.
 */
export function AiConfigNotice({ exerciseId }: { exerciseId: number | undefined }) {
  const { isCoach } = useExerciseBasePath();
  const q = useAiCoach(exerciseId);

  if (exerciseId == null) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
        <Save size={14} className="mt-0.5 shrink-0" aria-hidden />
        Hãy lưu bản nháp trước. Sau khi lưu, hệ thống mới kiểm tra được bài đã đủ cấu hình đo cho AI chưa.
      </p>
    );
  }
  if (q.isLoading) return <p className="flex items-center gap-2 text-xs text-text-secondary"><Loader2 size={13} className="animate-spin" aria-hidden />Đang kiểm tra cấu hình đo của bài...</p>;
  if (q.isError || !q.data) return null;

  const { ai } = q.data;
  if (ai.configured) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 size={14} className="mt-0.5 shrink-0" aria-hidden />
        Bài đã đủ cấu hình đo: {ai.movementType === "HOLD" ? "giữ tư thế" : "đếm rep"}, góc {ai.repBottom}° đến {ai.repTop}°, camera {ai.cameraView === "FRONT" ? "chính diện" : "nhìn nghiêng"}.
        {ai.enabled ? " Học viên đã có AI Coach cho bài này sau khi bài được xuất bản." : " Chọn \"Có\" để học viên dùng được."}
      </p>
    );
  }
  const href = isCoach ? `/coach/motion-rules?exercise=${exerciseId}` : `/admin/ai?exercise=${exerciseId}`;
  return (
    <div role="alert" className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
      <p className="flex items-start gap-2 font-bold"><AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />Bài này chưa đủ cấu hình đo, nên học viên chưa tập với AI được.</p>
      <p className="pl-6">Còn thiếu: loại chuyển động (đếm rep hay giữ tư thế), ngưỡng góc đỉnh và đáy, 3 điểm khớp tạo góc đo. Các thông tin này nhập ở trang cấu hình chuyển động, không nhập trong form này.</p>
      <p className="pl-6">
        <Link to={href} className="inline-flex items-center rounded-lg bg-amber-500 px-3 py-1.5 font-black text-black hover:opacity-90">
          Mở trang cấu hình của bài này
        </Link>
      </p>
    </div>
  );
}
