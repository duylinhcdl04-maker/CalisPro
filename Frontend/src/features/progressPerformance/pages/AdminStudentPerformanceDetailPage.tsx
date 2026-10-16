import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Flame,
  TrendingUp,
  Sparkles,
  Calendar,
  Download,
  Award,
  BarChart3,
  Activity,
  UserCheck,
  Dumbbell,
  ShieldCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { performanceService } from "../services/performanceService";
import { PERFORMANCE_QUERY_KEYS } from "../hooks/useProgressPerformance";
import {
  PERFORMANCE_FITNESS_LEVEL_STYLES,
  PERFORMANCE_STATUS_STYLES,
} from "../constants/performance.constants";
import { StudentPerformanceOverviewTab } from "../components/tabs/StudentPerformanceOverviewTab";
import { StudentPerformanceTrendTab } from "../components/tabs/StudentPerformanceTrendTab";
import { StudentWorkoutHistoryTab } from "../components/tabs/StudentWorkoutHistoryTab";
import { StudentPersonalRecordsTab } from "../components/tabs/StudentPersonalRecordsTab";
import { StudentAchievementsTab } from "../components/tabs/StudentAchievementsTab";
import { StudentAIMotionTab } from "../components/tabs/StudentAIMotionTab";
import { toast } from "sonner";

type DetailTabKey = "overview" | "trend" | "history" | "prs" | "achievements" | "ai_motion";

export const AdminStudentPerformanceDetailPage: React.FC = () => {
  const { studentId = "" } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTabKey>("overview");

  const { data: student, isLoading } = useQuery({
    queryKey: PERFORMANCE_QUERY_KEYS.studentDetail(studentId),
    queryFn: () => performanceService.getStudentById(studentId),
    enabled: Boolean(studentId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#547EFF] border-t-transparent" />
        <span className="mt-3 text-sm text-slate-500 dark:text-slate-400">Đang tải hồ sơ tiến độ học viên...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8 text-center dark:bg-slate-950">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-500 dark:bg-rose-950/40">
          <Activity className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Không tìm thấy hồ sơ học viên</h2>
        <p className="mt-1 mb-6 text-sm text-slate-500 dark:text-slate-400">
          Học viên với mã ID này không tồn tại trong hệ thống hoặc đã bị xóa.
        </p>
        <button
          onClick={() => navigate("/coach/performance")}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#8CA9FF]/30 transition-all hover:opacity-95"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại trang Tiến độ</span>
        </button>
      </div>
    );
  }

  const levelStyle = PERFORMANCE_FITNESS_LEVEL_STYLES[student.fitnessLevel];
  const statusStyle = PERFORMANCE_STATUS_STYLES[student.status] || PERFORMANCE_STATUS_STYLES.Active;
  const isPositive = student.improvementPercentage >= 0;

  const tabs: { key: DetailTabKey; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Tổng quan tiến độ", icon: <Activity className="h-4 w-4" /> },
    { key: "trend", label: "Xu hướng & Khối lượng", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "history", label: "Lịch sử buổi tập", icon: <Calendar className="h-4 w-4" /> },
    { key: "prs", label: `Kỷ lục PRs (${student.personalRecordsCount})`, icon: <Trophy className="h-4 w-4" /> },
    { key: "achievements", label: "Huy hiệu & Danh hiệu", icon: <Award className="h-4 w-4" /> },
    { key: "ai_motion", label: `AI Motion (${student.formScoreAverage}/100)`, icon: <Sparkles className="h-4 w-4" /> },
  ];

  const handleExportSingle = () => {
    toast.success(`Đã xuất báo cáo chi tiết tiến độ của học viên ${student.studentName}!`);
  };

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-6 lg:p-8 dark:bg-slate-950">
      {/* Top Nav & Breadcrumb */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Link
            to="/coach/performance"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Tiến độ & Thành tích</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-xs font-bold text-slate-900 dark:text-white">{student.studentName}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/coach/fitness-profiles/${student.studentId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <UserCheck className="h-3.5 w-3.5 text-[#547EFF]" />
            <span>Xem hồ sơ thể lực Radar</span>
          </Link>

          <button
            onClick={handleExportSingle}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-[#8CA9FF]/30 transition-all hover:opacity-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Xuất PDF tiến độ</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs lg:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8CA9FF]/15 text-2xl font-black text-[#1e3a8a] ring-4 ring-[#8CA9FF]/20 dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF] dark:ring-[#8CA9FF]/30">
              {student.initials}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {student.studentName}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${levelStyle.dot}`} />
                  {student.fitnessLevel}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle.badgeClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotClass}`} />
                  {statusStyle.label}
                </span>
              </div>
              <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Mã HV: <strong>{student.studentCode}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-[#547EFF]" />
                  HLV: <strong>{student.assignedCoach}</strong>
                </span>
                <span>•</span>
                <span>Tập gần nhất: <strong>{student.lastWorkoutDate}</strong></span>
              </p>
            </div>
          </div>

          {/* Quick 4 Stat Pills */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <span className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                Điểm hiệu suất
              </span>
              <span className="text-lg font-black text-[#547EFF] dark:text-[#8CA9FF]">
                {student.performanceScore}/100
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <span className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                Kỷ lục PRs
              </span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                {student.personalRecordsCount}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <span className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                Chuỗi Streak
              </span>
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {student.currentStreakDays} ngày
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <span className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                AI Form Score
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {student.formScoreAverage}/100
              </span>
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="mt-8 flex items-center gap-1.5 overflow-x-auto border-b border-slate-200/80 pb-1 no-scrollbar dark:border-slate-800">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#8CA9FF]/15 text-[#1e3a8a] shadow-2xs dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Container */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs lg:p-8 dark:border-slate-800 dark:bg-slate-900">
        {activeTab === "overview" && <StudentPerformanceOverviewTab student={student} />}
        {activeTab === "trend" && <StudentPerformanceTrendTab student={student} />}
        {activeTab === "history" && <StudentWorkoutHistoryTab student={student} />}
        {activeTab === "prs" && <StudentPersonalRecordsTab student={student} />}
        {activeTab === "achievements" && <StudentAchievementsTab student={student} />}
        {activeTab === "ai_motion" && <StudentAIMotionTab student={student} />}
      </div>
    </div>
  );
};

