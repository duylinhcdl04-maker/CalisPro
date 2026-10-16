import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fitnessProfileService } from "../services/fitnessProfileService";
import { FitnessProfilesFilterState, FitnessProfile } from "../types/fitnessProfile";
import { DEFAULT_FITNESS_FILTER } from "../constants/fitnessConstants";
import { toast } from "sonner";

export const FITNESS_QUERY_KEYS = {
  allProfiles: ["fitness-profiles"] as const,
  profileList: (filters: Partial<FitnessProfilesFilterState>) => ["fitness-profiles", "list", filters] as const,
  profileDetail: (id: string) => ["fitness-profiles", "detail", id] as const,
  kpi: ["fitness-profiles", "kpi"] as const,
  distribution: ["fitness-profiles", "distribution"] as const,
  globalDimensions: ["fitness-profiles", "global-dimensions"] as const,
  trends: (timeframe: string) => ["fitness-profiles", "trends", timeframe] as const,
  alerts: ["fitness-profiles", "alerts"] as const,
  studentAssessments: (studentId: string) => ["fitness-profiles", "assessments", studentId] as const,
  studentProgress: (studentId: string) => ["fitness-profiles", "progress", studentId] as const,
  studentMotion: (studentId: string) => ["fitness-profiles", "motion", studentId] as const,
  studentNotes: (studentId: string) => ["fitness-profiles", "notes", studentId] as const,
};

export const useFitnessProfiles = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FitnessProfilesFilterState>(DEFAULT_FITNESS_FILTER);
  const [selectedStudentForDrawer, setSelectedStudentForDrawer] = useState<FitnessProfile | null>(null);

  // Queries
  const { data: profiles = [], isLoading: isLoadingProfiles, refetch: refetchProfiles } = useQuery({
    queryKey: FITNESS_QUERY_KEYS.profileList(filters),
    queryFn: () => fitnessProfileService.getProfiles(filters),
  });

  const { data: kpiData, isLoading: isLoadingKpi } = useQuery({
    queryKey: FITNESS_QUERY_KEYS.kpi,
    queryFn: fitnessProfileService.getKpiStatistics,
  });

  const { data: distribution = [], isLoading: isLoadingDistribution } = useQuery({
    queryKey: FITNESS_QUERY_KEYS.distribution,
    queryFn: fitnessProfileService.getLevelDistribution,
  });

  const { data: globalDimensions = [] } = useQuery({
    queryKey: FITNESS_QUERY_KEYS.globalDimensions,
    queryFn: fitnessProfileService.getGlobalDimensions,
  });

  const { data: globalTrends = [] } = useQuery({
    queryKey: FITNESS_QUERY_KEYS.trends(filters.timeframe),
    queryFn: () => fitnessProfileService.getGlobalTrends(filters.timeframe),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: FITNESS_QUERY_KEYS.alerts,
    queryFn: fitnessProfileService.getAlerts,
  });

  // Filter helpers
  const updateFilter = <K extends keyof FitnessProfilesFilterState>(key: K, value: FitnessProfilesFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FITNESS_FILTER);
  };

  // Reassessment schedule mutation
  const scheduleMutation = useMutation({
    mutationFn: ({ studentId, date, name, note }: { studentId: string; date: string; name: string; note?: string }) =>
      fitnessProfileService.scheduleReassessment(studentId, date, name, note),
    onSuccess: (_, variables) => {
      toast.success("Lên lịch đánh giá lại thành công!");
      queryClient.invalidateQueries({ queryKey: FITNESS_QUERY_KEYS.allProfiles });
      queryClient.invalidateQueries({ queryKey: FITNESS_QUERY_KEYS.studentNotes(variables.studentId) });
      if (selectedStudentForDrawer?.studentId === variables.studentId) {
        fitnessProfileService.getProfileById(variables.studentId).then((updated) => {
          if (updated) setSelectedStudentForDrawer(updated);
        });
      }
    },
    onError: () => {
      toast.error("Không thể lên lịch đánh giá. Vui lòng thử lại.");
    },
  });

  // Reset demo data mutation
  const resetDemoMutation = useMutation({
    mutationFn: async () => {
      fitnessProfileService.resetToDefaults();
    },
    onSuccess: () => {
      toast.success("Đã khôi phục dữ liệu mẫu chuẩn!");
      queryClient.invalidateQueries({ queryKey: FITNESS_QUERY_KEYS.allProfiles });
    },
  });

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    profiles,
    isLoadingProfiles,
    refetchProfiles,
    kpiData,
    isLoadingKpi,
    distribution,
    isLoadingDistribution,
    globalDimensions,
    globalTrends,
    alerts,
    selectedStudentForDrawer,
    setSelectedStudentForDrawer,
    scheduleReassessment: scheduleMutation.mutateAsync,
    isScheduling: scheduleMutation.isPending,
    resetToDefaults: resetDemoMutation.mutateAsync,
  };
};
