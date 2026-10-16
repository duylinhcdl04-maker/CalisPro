import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { StudentPerformanceRecord } from "../types/performance.types";
import {
  PERFORMANCE_FITNESS_LEVEL_STYLES,
  PERFORMANCE_STATUS_STYLES,
} from "../constants/performance.constants";

interface StudentPerformanceTableProps {
  students: StudentPerformanceRecord[];
  isLoading?: boolean;
  onOpenDrawer: (student: StudentPerformanceRecord) => void;
  onIntervene?: (student: StudentPerformanceRecord) => void;
}

type SortField =
  | "name"
  | "score"
  | "improvement"
  | "workouts"
  | "streak"
  | "prs"
  | "lastWorkout";
type SortDirection = "asc" | "desc";

export const StudentPerformanceTable: React.FC<StudentPerformanceTableProps> = ({
  students,
  isLoading,
  onOpenDrawer,
  onIntervene,
}) => {
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedStudents = useMemo(() => {
    const list = [...students];
    list.sort((a, b) => {
      let valA: string | number = a.performanceScore;
      let valB: string | number = b.performanceScore;

      if (sortField === "name") {
        valA = a.studentName;
        valB = b.studentName;
      } else if (sortField === "improvement") {
        valA = a.improvementPercentage;
        valB = b.improvementPercentage;
      } else if (sortField === "workouts") {
        valA = a.totalWorkouts;
        valB = b.totalWorkouts;
      } else if (sortField === "streak") {
        valA = a.currentStreakDays;
        valB = b.currentStreakDays;
      } else if (sortField === "prs") {
        valA = a.personalRecordsCount;
        valB = b.personalRecordsCount;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortDirection === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
    return list;
  }, [students, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedStudents.length / rowsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedStudents.slice(start, start + rowsPerPage);
  }, [sortedStudents, currentPage, rowsPerPage]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400 opacity-60" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-[#547EFF]" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-[#547EFF]" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Danh sách tiến độ học viên
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Theo dõi chi tiết hiệu suất, chuỗi ngày tập, kỷ lục và tiến độ bứt phá
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Số hàng:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-[#8CA9FF] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <tr className="border-b border-slate-200/80 dark:border-slate-800">
                <th
                  onClick={() => handleSort("name")}
                  className="cursor-pointer py-3.5 pr-4 pl-5 font-semibold transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center">
                    <span>Học viên</span>
                    {renderSortIcon("name")}
                  </div>
                </th>
                <th className="px-3 py-3.5 text-center font-semibold">Cấp độ</th>
                <th
                  onClick={() => handleSort("score")}
                  className="cursor-pointer px-3 py-3.5 text-center font-semibold transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-center">
                    <span>Hiệu suất</span>
                    {renderSortIcon("score")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("improvement")}
                  className="cursor-pointer px-3 py-3.5 text-center font-semibold transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-center">
                    <span>Tăng trưởng</span>
                    {renderSortIcon("improvement")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("workouts")}
                  className="cursor-pointer px-3 py-3.5 text-center font-semibold transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-center">
                    <span>Số buổi tập</span>
                    {renderSortIcon("workouts")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("streak")}
                  className="cursor-pointer px-3 py-3.5 text-center font-semibold transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-center">
                    <span>Chuỗi (Streak)</span>
                    {renderSortIcon("streak")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("prs")}
                  className="cursor-pointer px-3 py-3.5 text-center font-semibold transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-center">
                    <span>Kỷ lục PRs</span>
                    {renderSortIcon("prs")}
                  </div>
                </th>
                <th className="px-3 py-3.5 text-center font-semibold">Lần tập cuối</th>
                <th className="px-3 py-3.5 text-center font-semibold">Trạng thái</th>
                <th className="py-3.5 pr-5 pl-3 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#547EFF] border-t-transparent" />
                      <span>Đang tải danh sách tiến độ học viên...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    Không tìm thấy học viên nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((st) => {
                  const levelStyle = PERFORMANCE_FITNESS_LEVEL_STYLES[st.fitnessLevel];
                  const statusStyle = PERFORMANCE_STATUS_STYLES[st.status] || PERFORMANCE_STATUS_STYLES.Active;
                  const isPositive = st.improvementPercentage >= 0;

                  return (
                    <tr
                      key={st.id}
                      onClick={() => onOpenDrawer(st)}
                      className="group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      {/* Student Info */}
                      <td className="py-3 pr-4 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8CA9FF]/15 font-bold text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
                            {st.initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-[#547EFF] dark:text-white dark:group-hover:text-[#8CA9FF]">
                              {st.studentName}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{st.studentCode}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-slate-500">
                                <UserCheck className="h-3 w-3" />
                                {st.assignedCoach}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Fitness Level */}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${levelStyle.dot}`} />
                          {st.fitnessLevel}
                        </span>
                      </td>

                      {/* Performance Score */}
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2.5 py-1 font-extrabold text-slate-900 dark:bg-slate-800 dark:text-white">
                          {st.performanceScore}
                        </span>
                      </td>

                      {/* Improvement */}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center font-extrabold ${
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
                          {isPositive ? `+${st.improvementPercentage}%` : `${st.improvementPercentage}%`}
                        </span>
                      </td>

                      {/* Workouts */}
                      <td className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {st.totalWorkouts} buổi
                      </td>

                      {/* Streak */}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold ${
                            st.currentStreakDays > 0
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          <Flame className={`h-3 w-3 ${st.currentStreakDays > 0 ? "text-amber-500" : "text-slate-400"}`} />
                          {st.currentStreakDays} ngày
                        </span>
                      </td>

                      {/* PRs */}
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-indigo-700 dark:text-indigo-300">
                          <Trophy className="h-3.5 w-3.5 text-indigo-500" />
                          {st.personalRecordsCount}
                        </span>
                      </td>

                      {/* Last Workout */}
                      <td className="px-3 py-3 text-center text-slate-500 dark:text-slate-400">
                        {st.lastWorkoutDate}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusStyle.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotClass}`} />
                          {statusStyle.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 pr-5 pl-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenDrawer(st)}
                            title="Xem nhanh"
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-[#8CA9FF]/15 hover:text-[#547EFF] dark:hover:bg-slate-800 dark:hover:text-[#8CA9FF]"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <Link
                            to={`/coach/performance/${st.studentId}`}
                            title="Mở toàn bộ hồ sơ tiến độ"
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 bg-white px-5 py-3.5 sm:flex-row dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Hiển thị{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {paginatedStudents.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {Math.min(currentPage * rowsPerPage, sortedStudents.length)}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {sortedStudents.length}
            </span>{" "}
            học viên
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                  currentPage === page
                    ? "bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
