import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  CalendarPlus,
  MessageSquarePlus,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { FitnessProfile } from "../types/fitnessProfile";
import {
  FITNESS_LEVEL_COLORS,
  PROFILE_STATUS_STYLES,
} from "../constants/fitnessConstants";

interface StudentFitnessTableProps {
  profiles: FitnessProfile[];
  isLoading?: boolean;
  onOpenDrawer?: (profile: FitnessProfile) => void;
  onScheduleReassessment?: (profile: FitnessProfile) => void;
  onAddNote?: (profile: FitnessProfile) => void;
}

type SortField =
  | "name"
  | "overallScore"
  | "level"
  | "trend"
  | "lastAssessmentDate"
  | "strength"
  | "endurance"
  | "mobility";
type SortDirection = "asc" | "desc";

export const StudentFitnessTable: React.FC<StudentFitnessTableProps> = ({
  profiles,
  isLoading,
  onOpenDrawer,
  onScheduleReassessment,
  onAddNote,
}) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>("overallScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedProfiles = useMemo(() => {
    const list = [...profiles];
    list.sort((a, b) => {
      let valA: string | number = a.overallScore;
      let valB: string | number = b.overallScore;

      if (sortField === "name") {
        valA = a.student.fullName;
        valB = b.student.fullName;
      } else if (sortField === "level") {
        valA = a.level;
        valB = b.level;
      } else if (sortField === "trend") {
        valA = a.trend;
        valB = b.trend;
      } else if (sortField === "lastAssessmentDate") {
        valA = a.lastAssessmentDate;
        valB = b.lastAssessmentDate;
      } else if (sortField === "strength") {
        valA = a.strength;
        valB = b.strength;
      } else if (sortField === "endurance") {
        valA = a.endurance;
        valB = b.endurance;
      } else if (sortField === "mobility") {
        valA = a.mobility;
        valB = b.mobility;
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
  }, [profiles, sortField, sortDirection]);

  // Pagination slice
  const totalPages = Math.ceil(sortedProfiles.length / rowsPerPage) || 1;
  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedProfiles.slice(start, start + rowsPerPage);
  }, [sortedProfiles, currentPage, rowsPerPage]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400 opacity-60" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-[#547EFF] dark:text-[#8CA9FF]" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-[#547EFF] dark:text-[#8CA9FF]" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Danh sách hồ sơ thể chất
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dữ liệu toàn diện 6 chỉ số & tình trạng đánh giá định kỳ của từng học viên
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Số hàng mỗi trang:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-900 focus:border-[#8CA9FF] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-slate-500 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400">
              <tr>
                <th
                  onClick={() => handleSort("name")}
                  className="cursor-pointer py-3.5 pr-4 pl-5 font-semibold whitespace-nowrap min-w-[210px] transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center">
                    <span>Học viên</span>
                    {renderSortIcon("name")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("level")}
                  className="cursor-pointer px-3 py-3.5 text-center font-semibold whitespace-nowrap min-w-[110px] transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-center">
                    <span>Cấp độ</span>
                    {renderSortIcon("level")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("overallScore")}
                  className="cursor-pointer px-3 py-3.5 text-center font-semibold whitespace-nowrap min-w-[80px] transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-center">
                    <span>Overall</span>
                    {renderSortIcon("overallScore")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("strength")}
                  className="cursor-pointer px-2 py-3.5 text-center font-semibold whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-white"
                  title="Sức mạnh"
                >
                  <div className="flex items-center justify-center">
                    <span>STR</span>
                    {renderSortIcon("strength")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("endurance")}
                  className="cursor-pointer px-2 py-3.5 text-center font-semibold whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-white"
                  title="Sức bền"
                >
                  <div className="flex items-center justify-center">
                    <span>END</span>
                    {renderSortIcon("endurance")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("mobility")}
                  className="cursor-pointer px-2 py-3.5 text-center font-semibold whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-white"
                  title="Linh hoạt"
                >
                  <div className="flex items-center justify-center">
                    <span>MOB</span>
                    {renderSortIcon("mobility")}
                  </div>
                </th>
                <th className="px-2 py-3.5 text-center font-semibold whitespace-nowrap" title="Cơ trung tâm">
                  CORE
                </th>
                <th className="px-2 py-3.5 text-center font-semibold whitespace-nowrap" title="Thăng bằng">
                  BAL
                </th>
                <th className="px-2 py-3.5 text-center font-semibold whitespace-nowrap" title="Kỹ năng">
                  SKL
                </th>
                <th
                  onClick={() => handleSort("trend")}
                  className="cursor-pointer px-3 py-3.5 text-center font-semibold whitespace-nowrap min-w-[90px] transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-center">
                    <span>Tiến độ</span>
                    {renderSortIcon("trend")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("lastAssessmentDate")}
                  className="cursor-pointer px-3 py-3.5 font-semibold whitespace-nowrap min-w-[110px] transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center">
                    <span>Lần test cuối</span>
                    {renderSortIcon("lastAssessmentDate")}
                  </div>
                </th>
                <th className="px-3 py-3.5 font-semibold whitespace-nowrap min-w-[115px]">Test tiếp theo</th>
                <th className="px-3 py-3.5 text-center font-semibold whitespace-nowrap min-w-[125px]">Trạng thái</th>
                <th className="py-3.5 pr-5 pl-3 text-right font-semibold whitespace-nowrap min-w-[90px]">Hành động</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#547EFF] border-t-transparent" />
                      <span>Đang tải danh sách hồ sơ thể chất...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedProfiles.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    Không tìm thấy học viên nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedProfiles.map((p) => {
                  const levelStyle = FITNESS_LEVEL_COLORS[p.level];
                  const statusStyle = PROFILE_STATUS_STYLES[p.status] || PROFILE_STATUS_STYLES.Healthy;
                  const isPositiveTrend = p.trend >= 0;

                  return (
                    <tr
                      key={p.id}
                      className="group cursor-pointer transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-800/50"
                      onClick={() => navigate(`/coach/fitness-profiles/${p.studentId}`)}
                    >
                      {/* Student Info */}
                      <td className="py-3.5 pr-4 pl-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8CA9FF]/15 font-bold text-[#1e3a8a] ring-1 ring-blue-500/20 dark:bg-[#8CA9FF]/25 dark:text-[#8CA9FF] dark:ring-[#8CA9FF]/30">
                            {p.student.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-[#547EFF] dark:text-white dark:group-hover:text-[#8CA9FF]">
                              {p.student.fullName}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 whitespace-nowrap dark:text-slate-400">
                              <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{p.student.code}</span>
                              <span>•</span>
                              <span>{p.student.age}t</span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                                <UserCheck className="h-3 w-3 text-[#547EFF]/70 dark:text-[#8CA9FF]/70" />
                                {p.student.assignedCoach.name.split(" ").slice(-2).join(" ")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Level */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${levelStyle.dot}`} />
                          {p.level}
                        </span>
                      </td>

                      {/* Overall Score */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center rounded-lg bg-slate-100/90 px-2.5 py-1 font-mono text-xs font-black text-slate-900 ring-1 ring-slate-200/60 dark:bg-slate-800 dark:text-white dark:ring-slate-700">
                          {p.overallScore}
                        </div>
                      </td>

                      {/* 6 Dimensions Mini Scores */}
                      <td className="px-2 py-3.5 text-center font-mono text-xs font-semibold text-slate-700 whitespace-nowrap dark:text-slate-300">
                        {p.strength}
                      </td>
                      <td className="px-2 py-3.5 text-center font-mono text-xs font-semibold text-slate-700 whitespace-nowrap dark:text-slate-300">
                        {p.endurance}
                      </td>
                      <td
                        className={`px-2 py-3.5 text-center font-mono text-xs font-semibold whitespace-nowrap ${
                          p.mobility < 50 ? "font-bold text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {p.mobility}
                      </td>
                      <td className="px-2 py-3.5 text-center font-mono text-xs font-semibold text-slate-700 whitespace-nowrap dark:text-slate-300">
                        {p.core}
                      </td>
                      <td className="px-2 py-3.5 text-center font-mono text-xs font-semibold text-slate-700 whitespace-nowrap dark:text-slate-300">
                        {p.balance}
                      </td>
                      <td className="px-2 py-3.5 text-center font-mono text-xs font-semibold text-slate-700 whitespace-nowrap dark:text-slate-300">
                        {p.skill}
                      </td>

                      {/* Trend */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center font-mono text-xs font-bold ${
                            isPositiveTrend
                              ? "text-[#547EFF] dark:text-[#8CA9FF]"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isPositiveTrend ? (
                            <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
                          )}
                          {isPositiveTrend ? `+${p.trend}%` : `${p.trend}%`}
                        </span>
                      </td>

                      {/* Last Assessment */}
                      <td className="px-3 py-3.5 whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                        {p.lastAssessmentDate}
                      </td>

                      {/* Next Assessment */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono text-xs ${
                              p.isReassessmentOverdue
                                ? "font-bold text-rose-600 dark:text-rose-400"
                                : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {p.nextAssessmentDate}
                          </span>
                          {p.isReassessmentOverdue && (
                            <AlertCircle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotClass}`} />
                          {statusStyle.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 pr-5 pl-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative inline-flex items-center justify-end gap-1.5">
                          <Link
                            to={`/coach/fitness-profiles/${p.studentId}`}
                            title="Xem chi tiết toàn trang"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600 transition-all hover:border-[#8CA9FF] hover:bg-[#8CA9FF]/10 hover:text-[#547EFF] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-[#8CA9FF] dark:hover:text-[#8CA9FF]"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          <button
                            onClick={() =>
                              setOpenActionMenuId((prev) => (prev === p.id ? null : p.id))
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {openActionMenuId === p.id && (
                            <div className="absolute top-9 right-0 z-30 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                              <Link
                                to={`/coach/fitness-profiles/${p.studentId}`}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                              >
                                <Eye className="h-3.5 w-3.5 text-[#547EFF] dark:text-[#8CA9FF]" />
                                Xem toàn bộ hồ sơ
                              </Link>

                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  if (onScheduleReassessment) onScheduleReassessment(p);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                              >
                                <CalendarPlus className="h-3.5 w-3.5 text-blue-500" />
                                Lên lịch đánh giá lại
                              </button>

                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  if (onAddNote) onAddNote(p);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                              >
                                <MessageSquarePlus className="h-3.5 w-3.5 text-amber-500" />
                                Thêm ghi chú HLV
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3.5 sm:flex-row dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Hiển thị{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {paginatedProfiles.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {Math.min(currentPage * rowsPerPage, sortedProfiles.length)}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {sortedProfiles.length}
            </span>{" "}
            học viên
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && page - prev > 1;

                return (
                  <React.Fragment key={page}>
                    {showEllipsis && (
                      <span className="px-1 text-xs text-slate-400">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                        currentPage === page
                          ? "bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
