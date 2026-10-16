import React from "react";
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { StudentPerformanceRecord } from "../../types/performance.types";

interface StudentAIMotionTabProps {
  student: StudentPerformanceRecord;
}

export const StudentAIMotionTab: React.FC<StudentAIMotionTabProps> = ({ student }) => {
  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#8CA9FF]/30 bg-[#8CA9FF]/10 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#8CA9FF]/30 dark:bg-[#8CA9FF]/15">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] text-white shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Điểm chuẩn form AI Motion:{" "}
              <span className="text-sm font-extrabold text-[#547EFF] dark:text-[#8CA9FF]">
                {student.formScoreAverage}/100
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Đánh giá tự động từ camera AI (biên độ ROM, nhịp độ và căn chỉnh tư thế)
            </p>
          </div>
        </div>

        <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-[#547EFF] shadow-2xs dark:bg-slate-800 dark:text-[#8CA9FF]">
          Chất lượng: {student.formScoreAverage >= 85 ? "Tối ưu" : "Khá tốt"}
        </span>
      </div>

      {/* Breakdown Dimensions */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-1.5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Biên độ (ROM)
          </span>
          <div className="text-base font-bold text-slate-900 dark:text-white">
            {Math.min(98, student.formScoreAverage + 3)}%
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[#547EFF]"
              style={{ width: `${Math.min(98, student.formScoreAverage + 3)}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-1.5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Cân bằng (Alignment)
          </span>
          <div className="text-base font-bold text-slate-900 dark:text-white">
            {student.formScoreAverage}%
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[#8CA9FF]"
              style={{ width: `${student.formScoreAverage}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-1.5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Nhịp độ (Tempo)
          </span>
          <div className="text-base font-bold text-slate-900 dark:text-white">
            {Math.max(72, student.formScoreAverage - 4)}%
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[#AAC4F5]"
              style={{ width: `${Math.max(72, student.formScoreAverage - 4)}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-2.5 dark:border-slate-800 dark:bg-slate-900">
        <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
          <ShieldCheck className="h-4 w-4 text-[#547EFF]" />
          Nhận xét kỹ thuật từ AI Coach
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2 rounded-lg bg-emerald-50/60 p-2.5 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <strong>Ưu điểm kỹ thuật:</strong> Giữ lưng thẳng rất chuẩn trong Pull Up và Push Up. Khóa khớp vai an toàn khi lock-out.
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-amber-50/60 p-2.5 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <strong>Lưu ý cải thiện:</strong> Ở các reps cuối cùng khi cơ mỏi, có hiện tượng giật người (kipping) nhẹ. Nên kiểm soát nhịp hạ (eccentric) 2 giây.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
