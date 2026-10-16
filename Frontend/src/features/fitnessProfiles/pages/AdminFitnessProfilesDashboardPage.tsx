import React, { useState } from "react";
import { useFitnessProfiles } from "../hooks/useFitnessProfiles";
import { FitnessProfilesHeader } from "../components/FitnessProfilesHeader";
import { FitnessProfilesKpiGrid } from "../components/FitnessProfilesKpiGrid";
import { FitnessProfilesFilterToolbar } from "../components/FitnessProfilesFilterToolbar";
import { FitnessDistributionSection } from "../components/FitnessDistributionSection";
import { FitnessPerformanceRadarCard } from "../components/FitnessPerformanceRadarCard";
import { FitnessTrendAnalyticsCard } from "../components/FitnessTrendAnalyticsCard";
import { FitnessStrengthsWeaknessesSection } from "../components/FitnessStrengthsWeaknessesSection";
import { RecentAssessmentsCard } from "../components/RecentAssessmentsCard";
import { FitnessAlertsSection } from "../components/FitnessAlertsSection";
import { StudentFitnessTable } from "../components/StudentFitnessTable";
import { ExportReportModal } from "../components/modals/ExportReportModal";
import { ScheduleReassessmentModal } from "../components/modals/ScheduleReassessmentModal";
import { AddCoachNoteModal } from "../components/modals/AddCoachNoteModal";
import { FitnessProfile } from "../types/fitnessProfile";
import { toast } from "sonner";

export const AdminFitnessProfilesDashboardPage: React.FC = () => {
  const {
    filters,
    updateFilter,
    resetFilters,
    profiles,
    isLoadingProfiles,
    kpiData,
    isLoadingKpi,
    distribution,
    globalDimensions,
    globalTrends,
    alerts,
    scheduleReassessment,
    isScheduling,
    resetToDefaults,
  } = useFitnessProfiles();

  // Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [modalStudent, setModalStudent] = useState<FitnessProfile | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState<boolean>(false);

  const handleOpenScheduleModal = (profile: FitnessProfile) => {
    setModalStudent(profile);
    setIsScheduleModalOpen(true);
  };

  const handleOpenAddNoteModal = (profile: FitnessProfile) => {
    setModalStudent(profile);
    setIsAddNoteModalOpen(true);
  };

  const handleAlertClick = (alert: (typeof alerts)[0]) => {
    if (alert.targetFilter.isOverdue) {
      updateFilter("overdueOnly", true);
      toast.info("Đã lọc danh sách học viên quá hạn đánh giá.");
    } else if (alert.targetFilter.dimension) {
      updateFilter("dimensionFilter", alert.targetFilter.dimension);
      toast.info("Đã lọc danh sách học viên theo chỉ số Mobility.");
    } else if (alert.targetFilter.minScore) {
      updateFilter("level", "Advanced");
      toast.info("Đã lọc nhóm học viên tiến bộ tích cực.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 lg:p-8 space-y-6 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* 1. Page Header */}
      <FitnessProfilesHeader
        onExportClick={() => setIsExportModalOpen(true)}
        onResetData={resetToDefaults}
      />

      {/* 2. KPI Section (4-column grid) */}
      <FitnessProfilesKpiGrid
        data={kpiData}
        isLoading={isLoadingKpi}
        onFilterOverdue={() => updateFilter("overdueOnly", true)}
        onFilterImproving={() => updateFilter("level", "Intermediate")}
      />

      {/* 3. Filter Toolbar */}
      <FitnessProfilesFilterToolbar
        filters={filters}
        onFilterChange={updateFilter}
        onResetFilters={resetFilters}
        onExportClick={() => setIsExportModalOpen(true)}
        totalResults={profiles.length}
      />

      {/* 4. Fitness Level Distribution & Dimensions (Section 7) */}
      <FitnessDistributionSection
        distribution={distribution}
        globalDimensions={globalDimensions}
        onSelectLevel={(level) => updateFilter("level", level)}
        onSelectDimension={(dim) => updateFilter("dimensionFilter", dim as any)}
      />

      {/* 5. Analytics Radar & Trend Line Charts (Section 8 & 9) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <FitnessPerformanceRadarCard showComparisonDropdown={true} />
        </div>
        <div className="lg:col-span-7">
          <FitnessTrendAnalyticsCard trendData={globalTrends} />
        </div>
      </div>

      {/* 6. Strengths and Weaknesses (Section 10) */}
      <FitnessStrengthsWeaknessesSection
        onViewImprovementStudents={(dim) => updateFilter("dimensionFilter", dim as any)}
      />

      {/* 7. Recent Assessments Table Card (Section 11) */}
      <RecentAssessmentsCard
        profiles={profiles}
      />

      {/* 8. Fitness Intelligence Alerts (Section 12) */}
      <FitnessAlertsSection
        alerts={alerts}
        onAlertClick={handleAlertClick}
      />

      {/* 9. Student Fitness TanStack Table (Section 13) */}
      <StudentFitnessTable
        profiles={profiles}
        isLoading={isLoadingProfiles}
        onScheduleReassessment={handleOpenScheduleModal}
        onAddNote={handleOpenAddNoteModal}
      />


      {/* Modals */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        totalRecords={profiles.length}
      />

      <ScheduleReassessmentModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        studentProfile={modalStudent}
        onSchedule={async (data) => {
          if (modalStudent) {
            await scheduleReassessment({
              studentId: modalStudent.studentId,
              date: data.date,
              name: data.name,
              note: data.note,
            });
          }
        }}
        isLoading={isScheduling}
      />

      <AddCoachNoteModal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        studentProfile={modalStudent}
        onAddNote={async (noteData) => {
          if (modalStudent) {
            toast.success("Đã thêm ghi chú HLV thành công!");
          }
        }}
      />
    </div>
  );
};
