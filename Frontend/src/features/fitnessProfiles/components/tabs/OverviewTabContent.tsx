import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  UserCheck,
  Award,
  AlertTriangle,
  ExternalLink,
  Target,
} from "lucide-react";
import { FitnessProfile } from "../../types/fitnessProfile";
import { FITNESS_DIMENSION_COLORS, FITNESS_LEVEL_COLORS } from "../../constants/fitnessConstants";
import { FitnessPerformanceRadarCard } from "../FitnessPerformanceRadarCard";

interface OverviewTabContentProps {
  profile: FitnessProfile;
  onOpenScheduleModal?: () => void;
  onOpenNoteModal?: () => void;
  showFullProfileLink?: boolean;
}

export const OverviewTabContent: React.FC<OverviewTabContentProps> = ({
  profile,
  onOpenScheduleModal,
  onOpenNoteModal,
  showFullProfileLink = true,
}) => {
  const levelStyle = FITNESS_LEVEL_COLORS[profile.level];
  const isPositiveTrend = profile.trend >= 0;

  const dimensions = [
    { key: "strength", label: "Strength (Sức mạnh)", score: profile.strength, color: FITNESS_DIMENSION_COLORS.strength },
    { key: "endurance", label: "Endurance (Sức bền)", score: profile.endurance, color: FITNESS_DIMENSION_COLORS.endurance },
    { key: "mobility", label: "Mobility (Linh hoạt)", score: profile.mobility, color: FITNESS_DIMENSION_COLORS.mobility },
    { key: "core", label: "Core (Cơ bụng)", score: profile.core, color: FITNESS_DIMENSION_COLORS.core },
    { key: "balance", label: "Balance (Thăng bằng)", score: profile.balance, color: FITNESS_DIMENSION_COLORS.balance },
    { key: "skill", label: "Skill (Kỹ năng)", score: profile.skill, color: FITNESS_DIMENSION_COLORS.skill },
  ];

  // Top strength & weakness
  const sortedDims = [...dimensions].sort((a, b) => b.score - a.score);
  const topStrengths = sortedDims.slice(0, 2);
  const topWeaknesses = sortedDims.slice(-2).reverse();

  return (
    <div className="space-y-6">
      {/* Top Hero Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Overall Score */}
        <div className="rounded-2xl border border-[#E3E7DF] bg-[#F7F8F4] p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <span className="text-[11px] font-bold tracking-wider text-[#687268] uppercase dark:text-zinc-400">
            FITNESS SCORE
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#172019] dark:text-white">
              {profile.overallScore}
            </span>
            <span className="text-xs text-[#687268] dark:text-zinc-400">/ 100</span>
            <span
              className={`ml-auto inline-flex items-center text-xs font-bold ${
                isPositiveTrend
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isPositiveTrend ? <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
              {isPositiveTrend ? `+${profile.trend}%` : `${profile.trend}%`}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-[#687268] dark:text-zinc-400">
            <span>Điểm trước: {profile.previousScore}</span>
            <span className="font-semibold text-[#547EFF]">
              {profile.overallScore > profile.previousScore ? "Đang tiến bộ" : "Cần bứt phá"}
            </span>
          </div>
        </div>

        {/* Level & Goal */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            CẤP ĐỘ HIỆN TẠI
          </span>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
            >
              <span className={`h-2 w-2 rounded-full ${levelStyle.dot}`} />
              {profile.level}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Target className="h-3 w-3 text-[#547EFF]" />
            <span className="truncate">{profile.student.primaryGoal}</span>
          </div>
        </div>

        {/* Coach & Schedule */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            LẦN TEST TIẾP THEO
          </span>
          <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
            <Calendar className="h-4 w-4 text-[#547EFF]" />
            {profile.nextAssessmentDate}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <UserCheck className="h-3 w-3" />
            <span>HLV: {profile.student.assignedCoach.name}</span>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <FitnessPerformanceRadarCard
        studentData={{
          strength: profile.strength,
          endurance: profile.endurance,
          mobility: profile.mobility,
          core: profile.core,
          balance: profile.balance,
          skill: profile.skill,
        }}
        showComparisonDropdown={true}
      />

      {/* 6 Dimensions Bars */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Chi tiết 6 chỉ số Thể chất
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Biểu đồ thang điểm 0 - 100 theo tiêu chuẩn khoa học thể thao
        </p>

        <div className="mt-4 space-y-3.5">
          {dimensions.map((d) => (
            <div key={d.key}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {d.label}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {d.score} <span className="font-normal text-slate-400">/ 100</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${d.score}%`, backgroundColor: d.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Strengths and Weaknesses */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <Award className="h-4 w-4" />
            Điểm mạnh nổi bật
          </div>
          <div className="mt-3 space-y-2">
            {topStrengths.map((s) => (
              <div key={s.key} className="flex items-center justify-between rounded-lg bg-white/80 p-2 text-xs dark:bg-slate-800/80">
                <span className="font-medium text-slate-900 dark:text-white">{s.label}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{s.score}/100</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            Cần ưu tiên cải thiện
          </div>
          <div className="mt-3 space-y-2">
            {topWeaknesses.map((w) => (
              <div key={w.key} className="flex items-center justify-between rounded-lg bg-white/80 p-2 text-xs dark:bg-slate-800/80">
                <span className="font-medium text-slate-900 dark:text-white">{w.label}</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{w.score}/100</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {onOpenScheduleModal && (
            <button
              onClick={onOpenScheduleModal}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Lên lịch test lại
            </button>
          )}

          {onOpenNoteModal && (
            <button
              onClick={onOpenNoteModal}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Thêm ghi chú HLV
            </button>
          )}
        </div>

        {showFullProfileLink && (
          <Link
            to={`/coach/fitness-profiles/${profile.studentId}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#547EFF] hover:underline dark:text-[#8CA9FF]"
          >
            Mở toàn bộ trang hồ sơ
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};
