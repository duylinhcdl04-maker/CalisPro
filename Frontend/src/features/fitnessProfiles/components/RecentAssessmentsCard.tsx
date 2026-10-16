import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, ChevronRight, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { AssessmentRecord, FitnessProfile } from "../types/fitnessProfile";
import { FITNESS_LEVEL_COLORS } from "../constants/fitnessConstants";

interface RecentAssessmentsCardProps {
  profiles: FitnessProfile[];
  onOpenDrawer?: (profile: FitnessProfile) => void;
  onViewAll?: () => void;
}

export const RecentAssessmentsCard: React.FC<RecentAssessmentsCardProps> = ({
  profiles,
  onViewAll,
}) => {
  const navigate = useNavigate();
  // Take top 5 recent assessed students
  const recentProfiles = [...profiles]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);



  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Đánh giá gần đây
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Các bài kiểm tra thể lực vừa hoàn thành trong 7 ngày qua
          </p>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#547EFF] hover:underline dark:text-[#8CA9FF]"
          >
            Xem tất cả
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="pb-3 font-semibold">Học viên</th>
              <th className="pb-3 font-semibold">Bài đánh giá</th>
              <th className="pb-3 font-semibold">Ngày đánh giá</th>
              <th className="pb-3 font-semibold text-center">Fitness Score</th>
              <th className="pb-3 font-semibold text-center">Cấp độ</th>
              <th className="pb-3 font-semibold text-center">Thay đổi</th>
              <th className="pb-3 font-semibold text-center">Trạng thái</th>
              <th className="pb-3 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentProfiles.map((p) => {
              const levelStyle = FITNESS_LEVEL_COLORS[p.level];
              return (
                <tr
                  key={p.id}
                  className="group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  onClick={() => navigate(`/coach/fitness-profiles/${p.studentId}`)}
                >
                  {/* Học viên */}
                  <td className="py-3">
                    <Link
                      to={`/coach/fitness-profiles/${p.studentId}`}
                      className="flex items-center gap-2.5"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8CA9FF]/15 text-xs font-bold text-[#1e3a8a] dark:bg-[#8CA9FF]/25 dark:text-[#8CA9FF]">
                        {p.student.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-[#547EFF] dark:text-white dark:group-hover:text-[#8CA9FF]">
                          {p.student.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {p.student.code}
                        </div>
                      </div>
                    </Link>
                  </td>

                  {/* Assessment */}
                  <td className="py-3 font-medium text-slate-900 dark:text-slate-200">
                    <Link to={`/coach/fitness-profiles/${p.studentId}`}>
                      {p.lastAssessmentName || "Periodic Reassessment"}
                    </Link>
                  </td>

                  {/* Ngày đánh giá */}
                  <td className="py-3 text-slate-500 dark:text-slate-400">
                    {p.lastAssessmentDate}
                  </td>

                  {/* Fitness Score */}
                  <td className="py-3 text-center">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-900 dark:bg-slate-800 dark:text-white">
                      {p.overallScore}
                    </span>
                  </td>

                  {/* Level */}
                  <td className="py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${levelStyle.dot}`} />
                      {p.level}
                    </span>
                  </td>

                  {/* Thay đổi */}
                  <td className="py-3 text-center">
                    <span
                      className={`font-semibold ${
                        p.trend >= 0
                          ? "text-[#547EFF] dark:text-[#8CA9FF]"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {p.trend >= 0 ? `+${p.trend}%` : `${p.trend}%`}
                    </span>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      Completed
                    </span>
                  </td>

                  {/* Thao tác */}
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/coach/fitness-profiles/${p.studentId}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 transition-colors hover:border-[#8CA9FF] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#547EFF] dark:text-[#8CA9FF]" />
                        Chi tiết
                      </Link>
                      <Link
                        to={`/coach/fitness-profiles/${p.studentId}`}
                        className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                        title="Xem toàn bộ hồ sơ"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
