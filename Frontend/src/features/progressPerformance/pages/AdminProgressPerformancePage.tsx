import React, { useState } from "react";
import { 
  BarChart3, 
  Users, 
  Trophy, 
  AlertTriangle, 
  Sparkles,
  Layers,
  Activity
} from "lucide-react";
import { PerformanceHeader } from "../components/PerformanceHeader";
import { PerformanceKPICards } from "../components/PerformanceKPICards";
import { PerformanceFilters } from "../components/PerformanceFilters";
import { PerformanceTrendChart } from "../components/PerformanceTrendChart";
import { TrainingSummary } from "../components/TrainingSummary";
import { TrainingVolumeChart } from "../components/TrainingVolumeChart";
import { ExerciseVolumeBreakdown } from "../components/ExerciseVolumeBreakdown";
import { TrainingConsistencyHeatmap } from "../components/TrainingConsistencyHeatmap";
import { PersonalRecordsCard } from "../components/PersonalRecordsCard";
import { AchievementOverviewCard } from "../components/AchievementOverviewCard";
import { AIMotionPerformanceCard } from "../components/AIMotionPerformanceCard";
import { TopProgressingStudentsCard } from "../components/TopProgressingStudentsCard";
import { StudentsAtRiskSection } from "../components/StudentsAtRiskSection";
import { StudentPerformanceTable } from "../components/StudentPerformanceTable";
import { StudentPerformanceDrawer } from "../components/StudentPerformanceDrawer";
import { ExportPerformanceReportModal } from "../components/modals/ExportPerformanceReportModal";
import { useProgressPerformance } from "../hooks/useProgressPerformance";
import { StudentPerformanceRecord } from "../types/performance.types";
import { toast } from "sonner";

type DashboardTabKey = "analytics" | "students" | "records" | "risk";

export const AdminProgressPerformancePage: React.FC = () => {
  const {
    filters,
    updateFilter,
    resetFilters,
    kpiData,
    isLoadingKPIs,
    weeklyTrends,
    isLoadingTrends,
    volumeData,
    isLoadingVolume,
    topExercises,
    prs,
    achievements,
    consistencyHeatmap,
    aiMotionSummary,
    topProgressing,
    studentsAtRisk,
    students,
    isLoadingStudents,
    selectedStudentForDrawer,
    setSelectedStudentForDrawer,
    resetToDefaults,
  } = useProgressPerformance();

  const [activeTab, setActiveTab] = useState<DashboardTabKey>("analytics");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleOpenDrawer = (student: StudentPerformanceRecord) => {
    setSelectedStudentForDrawer(student);
  };

  const handleCloseDrawer = () => {
    setSelectedStudentForDrawer(null);
  };

  const handleIntervene = (student: StudentPerformanceRecord) => {
    toast.info(
      `Đã mở kênh liên hệ và thông báo đến HLV ${student.assignedCoach} cho học viên ${student.studentName}.`
    );
  };

  const tabs: {
    id: DashboardTabKey;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeClass?: string;
  }[] = [
    {
      id: "analytics",
      label: "Xu hướng & Khối lượng",
      icon: <BarChart3 className="h-4 w-4" />,
      badge: "Analytics",
      badgeClass: "bg-[#8CA9FF]/15 text-[#1e3a8a] dark:text-[#8CA9FF]",
    },
    {
      id: "students",
      label: "Tiến độ Học viên",
      icon: <Users className="h-4 w-4" />,
      badge: `${students.length} học viên`,
      badgeClass: "bg-[#AAC4F5]/20 text-blue-700 dark:text-blue-300",
    },
    {
      id: "records",
      label: "Kỷ lục & Thành tích",
      icon: <Trophy className="h-4 w-4" />,
      badge: "34.8k PRs",
      badgeClass: "bg-[#FFF2C6] text-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    },
    {
      id: "risk",
      label: "Cần chú ý / Can thiệp",
      icon: <AlertTriangle className="h-4 w-4" />,
      badge: studentsAtRisk.length > 0 ? `${studentsAtRisk.length} cần can thiệp` : undefined,
      badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6 dark:bg-slate-950">
      {/* 1. Header with Breadcrumb, Actions & Title */}
      <PerformanceHeader
        onExportClick={() => setIsExportModalOpen(true)}
        onResetData={resetToDefaults}
      />

      {/* 2. Top-level Performance KPIs - Executive Summary */}
      <PerformanceKPICards kpis={kpiData} isLoading={isLoadingKPIs} />

      {/* 3. Main Dashboard Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] text-white shadow-md shadow-[#8CA9FF]/30"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              <span className={isActive ? "text-white" : "text-[#547EFF] dark:text-[#8CA9FF]"}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : tab.badgeClass
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Tab 1: Xu hướng & Khối lượng (Analytics & Trends) */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Comparative Trends & Training Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <PerformanceTrendChart trendData={weeklyTrends} isLoading={isLoadingTrends} />
            </div>
            <div className="lg:col-span-4">
              <TrainingSummary kpis={kpiData} isLoading={isLoadingKPIs} />
            </div>
          </div>

          {/* Training Volume & Top Exercise Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <TrainingVolumeChart volumeData={volumeData} isLoading={isLoadingVolume} />
            </div>
            <div className="lg:col-span-4">
              <ExerciseVolumeBreakdown exercises={topExercises} />
            </div>
          </div>

          {/* Consistency Heatmap */}
          <TrainingConsistencyHeatmap
            heatmapData={consistencyHeatmap}
            currentStreakDays={21}
            longestStreakDays={34}
            averageWeeklyWorkouts={kpiData?.averageWorkoutsPerWeek || 3.8}
          />
        </div>
      )}

      {/* 5. Tab 2: Tiến độ Học viên (Student Directory) */}
      {activeTab === "students" && (
        <div className="space-y-6">
          {/* Filters Toolbar */}
          <PerformanceFilters
            filters={filters}
            onFilterChange={updateFilter}
            onResetFilters={resetFilters}
            onExportClick={() => setIsExportModalOpen(true)}
            totalResults={students.length}
          />

          {/* Top Improvers */}
          <TopProgressingStudentsCard
            students={topProgressing}
            onOpenDrawer={handleOpenDrawer}
          />

          {/* Comprehensive Student Performance Table */}
          <StudentPerformanceTable
            students={students}
            isLoading={isLoadingStudents}
            onOpenDrawer={handleOpenDrawer}
            onIntervene={handleIntervene}
          />
        </div>
      )}

      {/* 6. Tab 3: Kỷ lục & Thành tích (PRs & Achievements) */}
      {activeTab === "records" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PersonalRecordsCard
              records={prs}
              onViewStudent={(id) => {
                const found = students.find((s) => s.studentId === id || s.id === id);
                if (found) setSelectedStudentForDrawer(found);
              }}
            />
            <AchievementOverviewCard achievements={achievements} />
            <AIMotionPerformanceCard summary={aiMotionSummary} />
          </div>

          {/* Top Exercises Breakdown under Achievements */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <ExerciseVolumeBreakdown exercises={topExercises} />
            </div>
            <div className="lg:col-span-6">
              <TopProgressingStudentsCard
                students={topProgressing}
                onOpenDrawer={handleOpenDrawer}
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab 4: Cảnh báo Giảm sút & Can thiệp (At Risk) */}
      {activeTab === "risk" && (
        <div className="space-y-6">
          <StudentsAtRiskSection
            students={studentsAtRisk}
            onOpenDrawer={handleOpenDrawer}
            onIntervene={handleIntervene}
          />

          {/* Filtered table for only at-risk / inactive students */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Danh sách học viên cần theo dõi & hỗ trợ
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Tự động lọc theo học viên có nguy cơ bỏ tập
              </span>
            </div>
            <StudentPerformanceTable
              students={students.filter((s) => s.status === "At Risk" || s.status === "Inactive")}
              isLoading={isLoadingStudents}
              onOpenDrawer={handleOpenDrawer}
              onIntervene={handleIntervene}
            />
          </div>
        </div>
      )}

      {/* 8. Slide-in Performance Drawer */}
      <StudentPerformanceDrawer
        student={selectedStudentForDrawer}
        isOpen={Boolean(selectedStudentForDrawer)}
        onClose={handleCloseDrawer}
      />

      {/* 9. Export Report Modal */}
      <ExportPerformanceReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        totalRecords={students.length}
      />
    </div>
  );
};
