import React, { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Bot,
  UserCheck,
  Timer,
  Award,
  ArrowUpRight,
} from "lucide-react";
import { AssessmentRecord } from "../../types/fitnessProfile";
import { FITNESS_LEVEL_COLORS } from "../../constants/fitnessConstants";

interface AssessmentTimelineTabContentProps {
  assessments: AssessmentRecord[];
  isLoading?: boolean;
}

export const AssessmentTimelineTabContent: React.FC<AssessmentTimelineTabContentProps> = ({
  assessments,
  isLoading,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    assessments.length > 0 ? assessments[0].id : null
  );

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-[#E3E7DF] bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E3E7DF] p-8 text-center text-xs text-[#687268] dark:border-zinc-800 dark:text-zinc-400">
        Học viên chưa có lịch sử đánh giá thể lực nào.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#172019] dark:text-white">
            Lịch sử & Tiến trình Đánh giá
          </h3>
          <p className="text-xs text-[#687268] dark:text-zinc-400">
            {assessments.length} bài test đã được ghi nhận và phân tích tự động
          </p>
        </div>
      </div>

      {/* Timeline List */}
      <div className="relative space-y-4 before:absolute before:top-4 before:bottom-4 before:left-4 before:w-0.5 before:bg-[#E3E7DF] dark:before:bg-zinc-800">
        {assessments.map((item, index) => {
          const isExpanded = expandedId === item.id;
          const levelStyle = FITNESS_LEVEL_COLORS[item.levelAssigned];
          const isLatest = index === 0;

          return (
            <div key={item.id} className="relative pl-10">
              {/* Timeline Node Icon */}
              <div
                className={`absolute top-4 left-2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-xs ${
                  isLatest
                    ? "bg-[#547EFF] text-white"
                    : "bg-[#E3E7DF] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className="h-2 w-2 rounded-full bg-current" />
              </div>

              {/* Assessment Card */}
              <div className="overflow-hidden rounded-2xl border border-[#E3E7DF] bg-white shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-900">
                {/* Header Summary */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-[#F7F8F4] sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-800/40"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#172019] dark:text-white">
                        {item.assessmentTitle}
                      </span>
                      {isLatest && (
                        <span className="rounded-full bg-[#8CA9FF]/15 px-2 py-0.5 text-[10px] font-bold text-[#1e3a8a] dark:bg-[#8CA9FF]/25 dark:text-[#8CA9FF]">
                          Mới nhất
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#687268] dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#547EFF]" />
                        {item.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5" />
                        {item.durationMinutes} phút
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {item.evaluatorType === "AI" ? (
                          <Bot className="h-3.5 w-3.5 text-blue-500" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        {item.evaluatorName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-extrabold text-[#172019] dark:text-white">
                          {item.overallScore}
                        </span>
                        <span className="text-xs text-zinc-400">/100</span>
                        {item.scoreChange !== 0 && (
                          <span
                            className={`inline-flex items-center text-xs font-bold ${
                              item.scoreChange > 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            <ArrowUpRight className="h-3 w-3" />
                            {item.scoreChange > 0 ? `+${item.scoreChange}` : item.scoreChange}
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                      >
                        {item.levelAssigned}
                      </span>
                    </div>

                    <div className="rounded-lg p-1 text-zinc-400">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-[#F0F2ED] bg-[#FAFBF9] p-4 space-y-4 dark:border-zinc-800 dark:bg-zinc-800/30">
                    {/* Dimension mini breakdown */}
                    <div>
                      <span className="text-xs font-bold text-[#172019] dark:text-zinc-200">
                        Phân bố điểm theo nhóm năng lực:
                      </span>
                      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {[
                          { label: "Sức mạnh", score: item.dimensionBreakdown.strength },
                          { label: "Sức bền", score: item.dimensionBreakdown.endurance },
                          { label: "Linh hoạt", score: item.dimensionBreakdown.mobility },
                          { label: "Core", score: item.dimensionBreakdown.core },
                          { label: "Thăng bằng", score: item.dimensionBreakdown.balance },
                          { label: "Kỹ năng", score: item.dimensionBreakdown.skill },
                        ].map((dim) => (
                          <div
                            key={dim.label}
                            className="rounded-xl border border-[#E3E7DF] bg-white p-2 text-center dark:border-zinc-700 dark:bg-zinc-800"
                          >
                            <div className="text-[10px] text-[#687268] dark:text-zinc-400">
                              {dim.label}
                            </div>
                            <div className="text-xs font-bold text-[#172019] dark:text-white">
                              {dim.score}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exercises Performed */}
                    {item.completedExercises && item.completedExercises.length > 0 && (
                      <div>
                        <span className="text-xs font-bold text-[#172019] dark:text-zinc-200">
                          Kết quả các bài thực hành đã thực hiện:
                        </span>
                        <div className="mt-2 divide-y divide-[#E3E7DF] rounded-xl border border-[#E3E7DF] bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-800">
                          {item.completedExercises.map((ex, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 text-xs"
                            >
                              <div className="space-y-0.5">
                                <span className="font-semibold text-[#172019] dark:text-white">
                                  {ex.exerciseName}
                                </span>
                                {ex.note && (
                                  <div className="text-[11px] text-[#687268] dark:text-zinc-400">
                                    {ex.note}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-[#547EFF]">
                                  {ex.performance}
                                </span>
                                <span className="rounded-md bg-[#8CA9FF]/15 px-2 py-0.5 font-extrabold text-[#1e3a8a] dark:bg-[#8CA9FF]/25 dark:text-[#8CA9FF]">
                                  Hạng {ex.grade}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Feedback */}
                    {item.aiEvaluation && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-xs dark:border-blue-900/50 dark:bg-blue-950/20">
                        <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300">
                          <Bot className="h-4 w-4" />
                          Đánh giá từ AI Vision Engine:
                        </div>
                        <p className="mt-1 text-[#172019] dark:text-zinc-200">
                          {item.aiEvaluation.summary}
                        </p>
                        <div className="mt-2 text-[11px] text-blue-700 dark:text-blue-300">
                          💡 Đề xuất: {item.aiEvaluation.recommendation}
                        </div>
                      </div>
                    )}

                    {/* Coach Feedback */}
                    {item.coachEvaluation && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs dark:border-amber-900/50 dark:bg-amber-950/20">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                          <UserCheck className="h-4 w-4" />
                          Nhận xét của HLV {item.coachEvaluation.coachName}:
                        </div>
                        <p className="mt-1 text-[#172019] dark:text-zinc-200">
                          {item.coachEvaluation.comment}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
