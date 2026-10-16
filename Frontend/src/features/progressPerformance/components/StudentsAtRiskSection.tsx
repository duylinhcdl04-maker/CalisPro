import React from "react";
import { AlertTriangle, User, ChevronRight, MessageSquare, ArrowDownRight } from "lucide-react";
import { StudentPerformanceRecord } from "../types/performance.types";

interface StudentsAtRiskSectionProps {
  students: StudentPerformanceRecord[];
  onOpenDrawer: (student: StudentPerformanceRecord) => void;
  onIntervene?: (student: StudentPerformanceRecord) => void;
}

export const StudentsAtRiskSection: React.FC<StudentsAtRiskSectionProps> = ({
  students,
  onOpenDrawer,
  onIntervene,
}) => {
  if (students.length === 0) return null;

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 dark:border-rose-950/60 dark:bg-rose-950/10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-rose-100 p-2 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
                Học viên có dấu hiệu giảm tiến độ (Students at Risk)
              </h3>
              <p className="text-xs text-rose-700/80 dark:text-rose-300/80">
                Những học viên có hiệu suất, tần suất tập hoặc mức độ duy trì giảm đáng kể cần can thiệp
              </p>
            </div>
          </div>
        </div>

        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 dark:bg-rose-900/50 dark:text-rose-200">
          {students.length} học viên cần chú ý
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {students.slice(0, 4).map((st) => (
          <div
            key={st.id}
            className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-white p-4 transition-all hover:shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-rose-900/40 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                {st.initials}
              </div>
              <div>
                <div className="font-bold text-[#172019] dark:text-white">
                  {st.studentName} <span className="text-xs font-normal text-zinc-400">({st.studentCode})</span>
                </div>
                <div className="mt-0.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  ⚠ Lý do: {st.riskReason || "Hiệu suất giảm sút & đứt chuỗi tập"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Hiệu suất</span>
                <span className="inline-flex items-center font-bold text-rose-600 dark:text-rose-400">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  {st.improvementPercentage}% ({st.startingScore} → {st.performanceScore})
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Tần suất tập</span>
                <span className="font-bold text-[#172019] dark:text-zinc-200">
                  {st.trainingFrequencyWeekly} buổi/tuần
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Lần tập cuối</span>
                <span className="font-semibold text-[#172019] dark:text-zinc-300">
                  {st.lastWorkoutDate}
                </span>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={() => onOpenDrawer(st)}
                  className="rounded-xl border border-[#E3E7DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#172019] hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  Xem hồ sơ
                </button>
                <button
                  onClick={() => onIntervene && onIntervene(st)}
                  className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
                >
                  Hỗ trợ / Liên hệ HLV
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
