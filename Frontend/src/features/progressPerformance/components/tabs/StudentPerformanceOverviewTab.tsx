import React from "react";
import {
  Trophy,
  Flame,
  TrendingUp,
  Activity,
  Dumbbell,
  Sparkles,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { StudentPerformanceRecord } from "../../types/performance.types";
import {
  PERFORMANCE_FITNESS_LEVEL_STYLES,
  PERFORMANCE_STATUS_STYLES,
} from "../../constants/performance.constants";

interface StudentPerformanceOverviewTabProps {
  student: StudentPerformanceRecord;
}

export const StudentPerformanceOverviewTab: React.FC<StudentPerformanceOverviewTabProps> = ({
  student,
}) => {
  const levelStyle = PERFORMANCE_FITNESS_LEVEL_STYLES[student.fitnessLevel];
  const statusStyle = PERFORMANCE_STATUS_STYLES[student.status] || PERFORMANCE_STATUS_STYLES.Active;
  const isPositive = student.improvementPercentage >= 0;

  return (
    <div className="space-y-4">
      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase">Buổi tập</span>
            <Dumbbell className="h-3.5 w-3.5 text-[#547EFF]" />
          </div>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {student.totalWorkouts}
          </div>
          <div className="mt-0.5 text-[10px] font-semibold text-[#547EFF] dark:text-[#8CA9FF]">
            {student.trainingFrequencyWeekly} buổi/tuần
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase">Kỷ lục PRs</span>
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {student.personalRecordsCount}
          </div>
          <div className="mt-0.5 text-[10px] font-semibold text-amber-600">
            Kỷ lục cá nhân
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase">Chuỗi Streak</span>
            <Flame className="h-3.5 w-3.5 text-orange-500" />
          </div>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {student.currentStreakDays} ngày
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            Max: {student.longestStreakDays} ngày
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase">AI Form Score</span>
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {student.formScoreAverage}/100
          </div>
          <div className="mt-0.5 text-[10px] font-semibold text-emerald-600">
            Chuẩn form {student.formScoreAverage >= 85 ? "Tối ưu" : "Khá tốt"}
          </div>
        </div>
      </div>

      {/* Progress Score Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-2.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8CA9FF]/15 text-[#547EFF] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Điểm hiệu suất tổng thể (Performance Score)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Khởi đầu {student.startingScore} → Hiện tại {student.performanceScore} điểm
              </p>
            </div>
          </div>
          <span className="text-sm font-extrabold text-[#547EFF] dark:text-[#8CA9FF]">
            {student.performanceScore}/100 ({isPositive ? `+${student.improvementPercentage}%` : `${student.improvementPercentage}%`})
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] transition-all duration-500"
            style={{ width: `${Math.min(100, student.performanceScore)}%` }}
          />
        </div>
      </div>

      {/* Warning if At Risk */}
      {student.status === "At Risk" && student.riskReason && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <span className="block font-bold">Cảnh báo dấu hiệu giảm sút:</span>
            <span>{student.riskReason}</span>
          </div>
        </div>
      )}

      {/* Meta Info list */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 text-xs space-y-2 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400">HLV Phụ trách:</span>
          <span className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-200">
            <UserCheck className="h-3.5 w-3.5 text-[#547EFF]" />
            {student.assignedCoach}
          </span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400">Cấp bậc rèn luyện:</span>
          <span className={`font-semibold ${levelStyle.text}`}>{student.fitnessLevel}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400">Lần tập gần nhất:</span>
          <span className="font-semibold text-slate-900 dark:text-slate-200">{student.lastWorkoutDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Tần suất trung bình:</span>
          <span className="font-semibold text-slate-900 dark:text-slate-200">{student.trainingFrequencyWeekly} buổi / tuần</span>
        </div>
      </div>
    </div>
  );
};
