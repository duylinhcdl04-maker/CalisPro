import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  User,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Maximize2,
  Activity,
  History,
  TrendingUp,
  Bot,
  MessageSquare,
} from "lucide-react";
import { FitnessProfile } from "../types/fitnessProfile";
import { FITNESS_LEVEL_COLORS } from "../constants/fitnessConstants";
import { OverviewTabContent } from "./tabs/OverviewTabContent";
import { AssessmentTimelineTabContent } from "./tabs/AssessmentTimelineTabContent";
import { ProgressAnalyticsTabContent } from "./tabs/ProgressAnalyticsTabContent";
import { AiMotionTabContent } from "./tabs/AiMotionTabContent";
import { CoachNotesTabContent } from "./tabs/CoachNotesTabContent";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fitnessProfileService } from "../services/fitnessProfileService";
import { FITNESS_QUERY_KEYS } from "../hooks/useFitnessProfiles";
import { ScheduleReassessmentModal } from "./modals/ScheduleReassessmentModal";
import { AddCoachNoteModal } from "./modals/AddCoachNoteModal";
import { toast } from "sonner";

interface StudentProfileDrawerProps {
  profile: FitnessProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = "overview" | "assessments" | "progress" | "motion" | "notes";

export const StudentProfileDrawer: React.FC<StudentProfileDrawerProps> = ({
  profile,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // Queries for the selected student
  const studentId = profile?.studentId || "";

  const { data: assessments = [], isLoading: isLoadingAssessments } = useQuery({
    queryKey: FITNESS_QUERY_KEYS.studentAssessments(studentId),
    queryFn: () => fitnessProfileService.getAssessmentsByStudent(studentId),
    enabled: !!studentId && isOpen,
  });

  const { data: progress, isLoading: isLoadingProgress } = useQuery({
    queryKey: FITNESS_QUERY_KEYS.studentProgress(studentId),
    queryFn: () => fitnessProfileService.getProgressByStudent(studentId),
    enabled: !!studentId && isOpen,
  });

  const { data: motion, isLoading: isLoadingMotion } = useQuery({
    queryKey: FITNESS_QUERY_KEYS.studentMotion(studentId),
    queryFn: () => fitnessProfileService.getMotionByStudent(studentId),
    enabled: !!studentId && isOpen,
  });

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: FITNESS_QUERY_KEYS.studentNotes(studentId),
    queryFn: () => fitnessProfileService.getNotesByStudent(studentId),
    enabled: !!studentId && isOpen,
  });

  // Note actions
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
      queryClient.invalidateQueries({ queryKey: FITNESS_QUERY_KEYS.allProfiles });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => fitnessProfileService.deleteCoachNote(studentId, noteId),
    onSuccess: () => {
      toast.success("Đã xóa ghi chú!");
      queryClient.invalidateQueries({ queryKey: FITNESS_QUERY_KEYS.studentNotes(studentId) });
      queryClient.invalidateQueries({ queryKey: FITNESS_QUERY_KEYS.allProfiles });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (data: { date: string; name: string; note?: string }) =>
      fitnessProfileService.scheduleReassessment(studentId, data.date, data.name, data.note),
    onSuccess: () => {
      toast.success("Lên lịch kiểm tra thành công!");
      queryClient.invalidateQueries({ queryKey: FITNESS_QUERY_KEYS.allProfiles });
      queryClient.invalidateQueries({ queryKey: FITNESS_QUERY_KEYS.studentNotes(studentId) });
    },
  });

  if (!isOpen || !profile) return null;

  const levelStyle = FITNESS_LEVEL_COLORS[profile.level];
  const isPositiveTrend = profile.trend >= 0;

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity">
        <div
          className="flex h-full w-full max-w-[620px] flex-col bg-white shadow-2xl transition-transform dark:bg-zinc-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#8CA9FF]/15 text-base font-extrabold text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
                {profile.student.initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {profile.student.fullName}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${levelStyle.dot}`} />
                    {profile.level}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{profile.student.code}</span>
                  <span>•</span>
                  <span>{profile.student.email}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {profile.overallScore} <span className="text-xs font-normal text-slate-400">/100</span>
                </div>
                <span
                  className={`inline-flex items-center text-[11px] font-bold ${
                    isPositiveTrend ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {isPositiveTrend ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {isPositiveTrend ? `+${profile.trend}%` : `${profile.trend}%`}
                </span>
              </div>

              {/* Full Page View Button */}
              <Link
                to={`/coach/fitness-profiles/${profile.studentId}`}
                title="Mở toàn màn hình / Xem toàn trang"
                className="ml-1 inline-flex items-center gap-1.5 rounded-xl border border-[#8CA9FF]/40 bg-gradient-to-r from-[#8CA9FF]/15 to-[#547EFF]/15 px-3 py-1.5 text-xs font-bold text-[#547EFF] hover:bg-[#8CA9FF]/25 dark:text-sky-300 dark:border-blue-500/30 transition-all shadow-xs"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Xem toàn trang</span>
              </Link>

              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Drawer Navigation Tabs */}
          <div className="flex overflow-x-auto border-b border-slate-200/80 bg-white px-5 dark:border-slate-800 dark:bg-slate-900">
            {[
              { key: "overview", label: "Overview", icon: Activity },
              { key: "assessments", label: "Assessments", icon: History, count: assessments.length },
              { key: "progress", label: "Tiến độ", icon: TrendingUp },
              { key: "motion", label: "AI Motion", icon: Bot },
              { key: "notes", label: "Ghi chú HLV", icon: MessageSquare, count: notes.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabKey)}
                  className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-3 text-xs font-semibold transition-colors ${
                    isActive
                      ? "border-[#547EFF] text-[#547EFF] dark:border-[#8CA9FF] dark:text-[#8CA9FF]"
                      : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {typeof tab.count === "number" && tab.count > 0 && (
                    <span
                      className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                        isActive
                          ? "bg-[#8CA9FF]/15 text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]"
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

          {/* Tab Content Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === "overview" && (
              <OverviewTabContent
                profile={profile}
                onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
                onOpenNoteModal={() => setIsAddNoteModalOpen(true)}
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
        </div>
      </div>

      {/* Reassessment Modal */}
      <ScheduleReassessmentModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        studentProfile={profile}
        onSchedule={async (data) => {
          await scheduleMutation.mutateAsync(data);
        }}
        isLoading={scheduleMutation.isPending}
      />

      {/* Add Coach Note Modal */}
      <AddCoachNoteModal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        studentProfile={profile}
        onAddNote={async (data) => {
          await addNoteMutation.mutateAsync(data);
        }}
        isLoading={addNoteMutation.isPending}
      />
    </>
  );
};
