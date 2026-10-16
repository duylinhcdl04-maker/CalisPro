import { Activity, Bot, Info, Loader2, ShieldCheck } from "lucide-react";
import type { Exercise } from "../../../types";
import { useAiCoach } from "../../../features/exercises/aiCoachApi";
import { AiSetPanel } from "../../../features/training/AiSetPanel";
import type { TodayExercise } from "../../../features/training/api";

interface AICoachTrainingModeProps {
  exercise: Exercise;
}

/**
 * Tập cùng AI Coach (MediaPipe): camera trong trình duyệt nhận diện khớp, đếm rep hoặc giây giữ, đo góc so với ngưỡng của bài và nhắc form theo rule đã xuất bản.
 * Chỉ tọa độ khớp được gửi lên máy chủ, không gửi video. Luyện thử ở đây không ghi vào giáo án, không tính level hay EXP.
 * Tab này chỉ xuất hiện khi Coach đã bật "tích hợp AI" cho bài; nếu bài chưa đủ cấu hình đo, trang nói rõ lý do thay vì mở camera.
 */
export function AICoachTrainingMode({ exercise }: AICoachTrainingModeProps) {
  const coach = useAiCoach(exercise.backendId);

  if (coach.isLoading) {
    return <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-5 text-sm text-text-secondary"><Loader2 size={16} className="animate-spin" aria-hidden />Đang kiểm tra cấu hình AI của bài...</div>;
  }
  if (coach.isError || !coach.data) {
    return <div role="alert" className="rounded-2xl border border-border bg-surface p-5 text-sm text-text-secondary">Chưa tải được thông tin AI Coach của bài này. Vui lòng thử lại sau.</div>;
  }

  const { ai } = coach.data;
  if (!ai.ready) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-5">
        <Info size={18} className="mt-0.5 shrink-0 text-text-secondary" aria-hidden />
        <div>
          <h3 className="text-sm font-black text-text-primary">AI Coach chưa dùng được cho bài này</h3>
          <p className="mt-1 text-sm text-text-secondary">{ai.note}</p>
        </div>
      </div>
    );
  }

  const hold = ai.movementType === "HOLD";
  const practice: TodayExercise = {
    exerciseId: coach.data.exerciseId, code: coach.data.code, name: coach.data.name, thumbnailUrl: null, videoUrl: null, section: "MAIN", sequenceNo: 1,
    sets: 1, repMin: null, repMax: 10, holdSec: 20, restSec: null, rpe: null, tempo: null, notes: null, instructions: null, recommended: false, ai,
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="rounded-2xl border border-accent/40 bg-gradient-to-r from-accent-soft/30 via-surface to-accent-soft/10 p-5 shadow-elevated">
        <h3 className="flex flex-wrap items-center gap-2 font-display text-base font-bold text-text-primary sm:text-lg">
          <Bot size={18} className="text-accent" aria-hidden />
          Tập cùng AI Coach
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase text-white">MediaPipe</span>
        </h3>
        <p className="mt-1 max-w-2xl text-xs text-text-secondary">
          Camera nhận diện các khớp xương của bạn ngay trên thiết bị, {hold ? "tính số giây bạn giữ đúng tư thế" : "đếm rep hợp lệ"}, đo góc khớp so với chuẩn của bài{ai.formScoring ? " và nhắc lỗi form bằng giọng nói" : ""}. Luyện thử ở đây không ghi vào giáo án và không ảnh hưởng level hay EXP.
        </p>
      </div>

      <AiSetPanel exercise={practice} setNumber={1} totalSets={1} practice />

      <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-elevated">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
          <div className="flex items-center gap-2 font-display text-sm font-bold text-text-primary"><Activity size={16} className="text-accent" aria-hidden />Chuẩn AI dùng để đo bài {exercise.name}</div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-strong"><ShieldCheck size={14} aria-hidden />{ai.formScoring ? "Có chấm form theo rule đã duyệt" : "Đếm rep và đo góc (chưa có rule chấm form)"}</span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><dt className="text-[11px] text-text-secondary">Kiểu đo</dt><dd className="font-black text-text-primary">{hold ? "Giữ tư thế (tính giây)" : "Đếm rep"}</dd></div>
          <div><dt className="text-[11px] text-text-secondary">Góc đặt camera</dt><dd className="font-black text-text-primary">{ai.cameraView === "FRONT" ? "Chính diện" : "Nhìn nghiêng"}</dd></div>
          {ai.repBottom != null && <div><dt className="text-[11px] text-text-secondary">{hold ? "Vùng chuẩn từ" : "Góc đáy chuẩn"}</dt><dd className="font-black text-text-primary">{ai.repBottom}°</dd></div>}
          {ai.repTop != null && <div><dt className="text-[11px] text-text-secondary">{hold ? "Đến" : "Góc đỉnh chuẩn"}</dt><dd className="font-black text-text-primary">{ai.repTop}°</dd></div>}
        </dl>
        <p className="mt-3 text-xs text-text-secondary">{ai.note}</p>
      </div>
    </div>
  );
}
