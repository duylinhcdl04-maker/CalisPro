import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  UserCheck,
  Activity,
  History,
  TrendingUp,
  Bot,
  MessageSquare,
  Dumbbell,
  CalendarPlus,
  MessageSquarePlus,
  CheckCircle2,
  Share2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { fitnessProfileService } from "../services/fitnessProfileService";
import { FITNESS_QUERY_KEYS } from "../hooks/useFitnessProfiles";
import { FITNESS_LEVEL_COLORS, PROFILE_STATUS_STYLES } from "../constants/fitnessConstants";
import { OverviewTabContent } from "../components/tabs/OverviewTabContent";
import { AssessmentTimelineTabContent } from "../components/tabs/AssessmentTimelineTabContent";
import { ProgressAnalyticsTabContent } from "../components/tabs/ProgressAnalyticsTabContent";
import { AiMotionTabContent } from "../components/tabs/AiMotionTabContent";
import { CoachNotesTabContent } from "../components/tabs/CoachNotesTabContent";
import { TrainingHistoryTabContent } from "../components/tabs/TrainingHistoryTabContent";
import { ScheduleReassessmentModal } from "../components/modals/ScheduleReassessmentModal";
import { AddCoachNoteModal } from "../components/modals/AddCoachNoteModal";
import { toast } from "sonner";

type TabKey = "overview" | "assessments" | "progress" | "training" | "motion" | "notes";

export const AdminStudentFitnessProfileDetailPage: React.FC = () => {
  const { studentId = "" } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState<boolean>(false);

  // Queries
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: FITNESS_QUERY_KEYS.profileDetail(studentId),
    queryFn: () => fitnessProfileService.getProfileById(studentId),
    enabled: !!studentId,
  });

  const { data: assessments = [], isLoading: isLoadingAssessments } = useQuery({
    queryKey: FITNESS_QUERY_KEYS.studentAssessments(studentId),
    queryFn: () => fitnessProfileService.getAssessmentsByStudent(studentId),
    enabled: !!studentId,
  });

  const { data: progress, isLoading: isLoadingProgress } = useQuery({
    queryKey: FITNESS_QUERY_KEYS.studentProgress(studentId),
    queryFn: () => fitnessProfileService.getProgressByStudent(studentId),
    enabled: !!studentId,
  });

  const { data: motion, isLoading: isLoadingMotion } = useQuery({
    queryKey: FITNESS_QUERY_KEYS.studentMotion(studentId),
    queryFn: () => fitnessProfileService.getMotionByStudent(studentId),
    enabled: !!studentId,
  });

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: FITNESS_QUERY_KEYS.studentNotes(studentId),
    queryFn: () => fitnessProfileService.getNotesByStudent(studentId),
    enabled: !!studentId,
  });

  // Mutations
  const addNoteMutation = useMutation({
    mutationFn: (data: {
      content: string;
      tags: string[];
      priority: "normal" | "important" | "urgent";
      isPinned: boolean;
    }) => fitnessProfileService.addCoachNote(studentId, data),
    onSuccess: () => {
      toast.success("Đã thêm ghi chú huấn luyện viên!");
      queryClient.invalidateQueries({ queryKey: FITNESS_QUERY_KEYS.studentNotes(studentId) });
      queryClient.invalidateQueries({ queryKey: FITNESS_QUERY_KEYS.profileDetail(studentId) });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => fitnessProfileService.deleteCoachNote(studentId, noteId),
    onSuccess: () => {
      toast.success("Đã xóa ghi chú!");
      queryClient.invalidateQueries({ queryKey: FITNESS_QUERY_KEYS.studentNotes(studentId) });
      queryClient.invalidateQueries({ queryKey: FITNESS_QUERY_KEYS.profileDetail(studentId) });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (data: { date: string; name: string; note?: string }) =>
      fitnessProfileService.scheduleReassessment(studentId, data.date, data.name, data.note),
    onSuccess: () => {
      toast.success("Lên lịch kiểm tra thành công!");
      queryClient.invalidateQueries({ queryKey: FITNESS_QUERY_KEYS.profileDetail(studentId) });
      queryClient.invalidateQueries({ queryKey: FITNESS_QUERY_KEYS.studentNotes(studentId) });
    },
  });

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#547EFF] border-t-transparent" />
          <span>Đang tải thông tin hồ sơ thể chất học viên...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center dark:bg-slate-950">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Không tìm thấy hồ sơ thể chất học viên
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Mã học viên &quot;{studentId}&quot; không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Link
          to="/coach/fitness-profiles"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#8CA9FF]/30 transition-all hover:opacity-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách hồ sơ
        </Link>
      </div>
    );
  }

  const levelStyle = FITNESS_LEVEL_COLORS[profile.level];
  const statusStyle = PROFILE_STATUS_STYLES[profile.status] || PROFILE_STATUS_STYLES.Healthy;
  const isPositiveTrend = profile.trend >= 0;

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-4 text-slate-900 md:p-6 lg:p-8 dark:bg-slate-950 dark:text-white">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/coach/fitness-profiles"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xs transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Hồ sơ thể chất học viên /
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {profile.student.code}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {profile.student.fullName}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <CalendarPlus className="h-3.5 w-3.5 text-[#547EFF]" />
            Đánh giá lại
          </button>

          <button
            onClick={() => setActiveTab("training")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <Dumbbell className="h-3.5 w-3.5 text-[#547EFF]" />
            Xem lịch tập
          </button>

          <button
            onClick={() => setIsAddNoteModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#8CA9FF]/30 transition-all hover:opacity-95"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Thêm ghi chú HLV
          </button>
        </div>
      </div>

      {/* Main Hero Student Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Student Profile Info */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#8CA9FF]/15 text-xl font-black text-[#1e3a8a] shadow-xs dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
              {profile.student.initials}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {profile.student.fullName}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                >
                  <span className={`h-2 w-2 rounded-full ${levelStyle.dot}`} />
                  {profile.level}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle.badgeClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotClass}`} />
                  {statusStyle.label}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>Mã: <strong className="text-slate-900 dark:text-white">{profile.student.code}</strong></span>
                <span>•</span>
                <span>{profile.student.age} tuổi ({profile.student.gender === "male" ? "Nam" : "Nữ"})</span>
                <span>•</span>
                <span>{profile.student.heightCm}cm / {profile.student.weightKg}kg (BMI: {profile.student.bmi})</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-[#547EFF] dark:text-[#8CA9FF]">
                  <UserCheck className="h-3.5 w-3.5" />
                  HLV: {profile.student.assignedCoach.name}
                </span>
              </div>

              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                🎯 Mục tiêu chính: <span className="font-semibold text-slate-900 dark:text-slate-200">{profile.student.primaryGoal}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4 lg:border-t-0 lg:pt-0 dark:border-slate-800">
            <div className="rounded-xl bg-slate-50/80 p-3 text-center dark:bg-slate-800/60">
              <span className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Fitness Score
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {profile.overallScore}
                </span>
                <span className="text-[10px] text-slate-400">/100</span>
              </div>
              <span
                className={`text-[11px] font-bold ${
                  isPositiveTrend ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {isPositiveTrend ? `+${profile.trend}%` : `${profile.trend}%`}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50/80 p-3 text-center dark:bg-slate-800/60">
              <span className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Lần test cuối
              </span>
              <div className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                {profile.lastAssessmentDate}
              </div>
              <span className="block truncate text-[10px] text-slate-400">
                {profile.lastAssessmentName.split(" ")[0]}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50/80 p-3 text-center dark:bg-slate-800/60">
              <span className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Test kế tiếp
              </span>
              <div className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                {profile.nextAssessmentDate}
              </div>
              <span className={`text-[10px] font-semibold ${profile.isReassessmentOverdue ? "font-bold text-rose-600" : "text-[#547EFF]"}`}>
                {profile.isReassessmentOverdue ? "Đã quá hạn" : "Đúng hạn"}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50/80 p-3 text-center dark:bg-slate-800/60">
              <span className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                AI Form Score
              </span>
              <div className="mt-1 text-2xl font-black text-[#547EFF] dark:text-[#8CA9FF]">
                {profile.aiMotionAverageScore}
              </div>
              <span className="text-[10px] text-slate-400">Trung bình 30 ngày</span>
            </div>
          </div>
        </div>

        {/* Detail Tabs Bar */}
        <div className="-mx-6 -mb-6 mt-6 flex overflow-x-auto border-b border-slate-200/80 px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden dark:border-slate-800">
          {[
            { key: "overview", label: "Tổng quan", icon: Activity },
            { key: "assessments", label: "Lịch sử Đánh giá", icon: History, count: assessments.length },
            { key: "progress", label: "Tiến độ & Xu hướng", icon: TrendingUp },
            { key: "training", label: "Giáo án & Tập luyện", icon: Dumbbell },
            { key: "motion", label: "AI Motion Analysis", icon: Bot },
            { key: "notes", label: "Ghi chú HLV", icon: MessageSquare, count: notes.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`relative inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "border-[#547EFF] text-[#547EFF] font-bold dark:border-[#8CA9FF] dark:text-[#8CA9FF]"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#547EFF] dark:text-[#8CA9FF]" : "text-slate-400 dark:text-slate-500"}`} />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-[#8CA9FF]/20 text-[#1e3a8a] dark:bg-[#8CA9FF]/30 dark:text-[#8CA9FF]"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Rendering */}
      <div>
        {activeTab === "overview" && (
          <OverviewTabContent
            profile={profile}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            onOpenNoteModal={() => setIsAddNoteModalOpen(true)}
            showFullProfileLink={false}
          />
        )}

        {activeTab === "assessments" && (
          <AssessmentTimelineTabContent
            assessments={assessments}
            isLoading={isLoadingAssessments}
          />
        )}

        {activeTab === "progress" && progress && (
          <ProgressAnalyticsTabContent
            progress={progress}
            isLoading={isLoadingProgress}
          />
        )}

        {activeTab === "training" && (
          <TrainingHistoryTabContent profile={profile} />
        )}

        {activeTab === "motion" && motion && (
          <AiMotionTabContent
            motionData={motion}
            isLoading={isLoadingMotion}
          />
        )}

        {activeTab === "notes" && (
          <CoachNotesTabContent
            notes={notes}
            onOpenAddNoteModal={() => setIsAddNoteModalOpen(true)}
            onDeleteNote={async (noteId: string) => {
              await deleteNoteMutation.mutateAsync(noteId);
            }}
            isLoading={isLoadingNotes}
          />
        )}
      </div>

      {/* Modals */}
      <ScheduleReassessmentModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        studentProfile={profile}
        onSchedule={async (data) => {
          await scheduleMutation.mutateAsync(data);
        }}
        isLoading={scheduleMutation.isPending}
      />

      <AddCoachNoteModal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        studentProfile={profile}
        onAddNote={async (data) => {
          await addNoteMutation.mutateAsync(data);
        }}
        isLoading={addNoteMutation.isPending}
      />
    </div>
  );
};
