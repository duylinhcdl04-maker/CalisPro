import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  ExternalLink,
  Trophy,
  Flame,
  Activity,
  Calendar,
  Award,
  BarChart3,
  TrendingUp,
  Sparkles,
  UserCheck,
  Clock,
  Dumbbell,
} from "lucide-react";
import { StudentPerformanceRecord } from "../types/performance.types";
import {
  PERFORMANCE_FITNESS_LEVEL_STYLES,
  PERFORMANCE_STATUS_STYLES,
} from "../constants/performance.constants";
import { StudentPerformanceOverviewTab } from "./tabs/StudentPerformanceOverviewTab";
import { StudentPerformanceTrendTab } from "./tabs/StudentPerformanceTrendTab";
import { StudentWorkoutHistoryTab } from "./tabs/StudentWorkoutHistoryTab";
import { StudentPersonalRecordsTab } from "./tabs/StudentPersonalRecordsTab";
import { StudentAchievementsTab } from "./tabs/StudentAchievementsTab";
import { StudentAIMotionTab } from "./tabs/StudentAIMotionTab";

interface StudentPerformanceDrawerProps {
  student: StudentPerformanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = "overview" | "trend" | "history" | "prs" | "achievements" | "ai_motion";

export const StudentPerformanceDrawer: React.FC<StudentPerformanceDrawerProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  if (!isOpen || !student) return null;

  const levelStyle = PERFORMANCE_FITNESS_LEVEL_STYLES[student.fitnessLevel];
  const statusStyle = PERFORMANCE_STATUS_STYLES[student.status] || PERFORMANCE_STATUS_STYLES.Active;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Tổng quan", icon: <Activity className="h-4 w-4" /> },
    { key: "trend", label: "Xu hướng & Volume", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "history", label: "Buổi tập", icon: <Calendar className="h-4 w-4" /> },
    { key: "prs", label: "Kỷ lục PRs", icon: <Trophy className="h-4 w-4" /> },
    { key: "achievements", label: "Huy hiệu", icon: <Award className="h-4 w-4" /> },
    { key: "ai_motion", label: "AI Motion", icon: <Sparkles className="h-4 w-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="flex w-screen max-w-2xl flex-col bg-white shadow-2xl dark:bg-zinc-900">
          {/* Header */}
          <div className="border-b border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#8CA9FF]/15 text-lg font-bold text-[#1e3a8a] ring-2 ring-[#8CA9FF]/30 dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
                  {student.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {student.studentName}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${levelStyle.dot}`} />
                      {student.fitnessLevel}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                    <span>{student.studentCode}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3 text-slate-400" />
                      {student.assignedCoach}
                    </span>
                    <span>•</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotClass}`} />
                      {statusStyle.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  to={`/coach/performance/${student.studentId}`}
                  onClick={onClose}
                  className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-[#8CA9FF]/15 hover:text-[#547EFF] dark:hover:bg-slate-800 dark:hover:text-[#8CA9FF]"
                  title="Mở toàn bộ hồ sơ"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <button
                  onClick={onClose}
                  className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-5 flex items-center gap-1.5 overflow-x-auto border-b border-slate-200/80 pb-1 no-scrollbar dark:border-slate-800">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-[#8CA9FF]/15 text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]"
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

          {/* Drawer Body Scroll Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50/70 p-5 dark:bg-slate-950">
            {activeTab === "overview" && <StudentPerformanceOverviewTab student={student} />}
            {activeTab === "trend" && <StudentPerformanceTrendTab student={student} />}
            {activeTab === "history" && <StudentWorkoutHistoryTab student={student} />}
            {activeTab === "prs" && <StudentPersonalRecordsTab student={student} />}
            {activeTab === "achievements" && <StudentAchievementsTab student={student} />}
            {activeTab === "ai_motion" && <StudentAIMotionTab student={student} />}
          </div>

          {/* Drawer Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Mã học viên: <strong>{student.studentCode}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Đóng
              </button>
              <Link
                to={`/coach/performance/${student.studentId}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-[#8CA9FF]/30 transition-all hover:opacity-95"
              >
                <span>Xem chi tiết đầy đủ</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
