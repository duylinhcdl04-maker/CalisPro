import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { performanceService } from "../services/performanceService";
import { PerformanceFilterState, StudentPerformanceRecord } from "../types/performance.types";
import { DEFAULT_PERFORMANCE_FILTERS } from "../constants/performance.constants";
import { toast } from "sonner";

export const PERFORMANCE_QUERY_KEYS = {
  all: ["progress-performance"] as const,
  kpi: ["progress-performance", "kpi"] as const,
  trends: (metric: string, timeframe: string) => ["progress-performance", "trends", metric, timeframe] as const,
  volume: (metric: string) => ["progress-performance", "volume", metric] as const,
  topExercises: ["progress-performance", "top-exercises"] as const,
  prs: ["progress-performance", "prs"] as const,
  achievements: ["progress-performance", "achievements"] as const,
  consistency: ["progress-performance", "consistency"] as const,
  aiMotion: ["progress-performance", "ai-motion"] as const,
  topProgressing: ["progress-performance", "top-progressing"] as const,
  atRisk: ["progress-performance", "at-risk"] as const,
  studentList: (filters: Partial<PerformanceFilterState>) => ["progress-performance", "students", filters] as const,
  studentDetail: (id: string) => ["progress-performance", "student-detail", id] as const,
  studentWorkouts: (id: string) => ["progress-performance", "student-workouts", id] as const,
  studentPRs: (id: string) => ["progress-performance", "student-prs", id] as const,
};

export const useProgressPerformance = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<PerformanceFilterState>(DEFAULT_PERFORMANCE_FILTERS);
  const [selectedStudentForDrawer, setSelectedStudentForDrawer] = useState<StudentPerformanceRecord | null>(null);

  // Queries
  const { data: kpiData, isLoading: isLoadingKPIs } = useQuery({
    queryKey: PERFORMANCE_QUERY_KEYS.kpi,
    queryFn: performanceService.getKPIs,
  });

  const { data: weeklyTrends = [], isLoading: isLoadingTrends } = useQuery({
    queryKey: PERFORMANCE_QUERY_KEYS.trends(filters.metricType, filters.timeframe),
    queryFn: () => performanceService.getWeeklyTrends(filters.metricType, filters.timeframe),
  });

  const { data: volumeData = [], isLoading: isLoadingVolume } = useQuery({
    queryKey: PERFORMANCE_QUERY_KEYS.volume("reps"),
    queryFn: () => performanceService.getTrainingVolume("reps"),
  });

  const { data: topExercises = [] } = useQuery({
    queryKey: PERFORMANCE_QUERY_KEYS.topExercises,
    queryFn: performanceService.getTopExercisesVolume,
  });

  const { data: prs = [] } = useQuery({
    queryKey: PERFORMANCE_QUERY_KEYS.prs,
    queryFn: performanceService.getPersonalRecords,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: PERFORMANCE_QUERY_KEYS.achievements,
    queryFn: performanceService.getAchievements,
  });

  const { data: consistencyHeatmap = [] } = useQuery({
    queryKey: PERFORMANCE_QUERY_KEYS.consistency,
    queryFn: performanceService.getConsistencyHeatmap,
  });

  const { data: aiMotionSummary } = useQuery({
    queryKey: PERFORMANCE_QUERY_KEYS.aiMotion,
    queryFn: performanceService.getAIMotionSummary,
  });

  const { data: topProgressing = [] } = useQuery({
    queryKey: PERFORMANCE_QUERY_KEYS.topProgressing,
    queryFn: () => performanceService.getTopProgressingStudents(5),
  });

  const { data: studentsAtRisk = [] } = useQuery({
    queryKey: PERFORMANCE_QUERY_KEYS.atRisk,
    queryFn: performanceService.getStudentsAtRisk,
  });

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: PERFORMANCE_QUERY_KEYS.studentList(filters),
    queryFn: () => performanceService.getStudents(filters),
  });

  // Filter Helpers
  const updateFilter = <K extends keyof PerformanceFilterState>(
    key: K,
    value: PerformanceFilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_PERFORMANCE_FILTERS);
  };

  // Reset Demo Mutation
  const resetDemoMutation = useMutation({
    mutationFn: async () => {
      performanceService.resetToDefaults();
    },
    onSuccess: () => {
      toast.success("Đã khôi phục dữ liệu mẫu chuẩn!");
      queryClient.invalidateQueries({ queryKey: PERFORMANCE_QUERY_KEYS.all });
    },
  });

  return {
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
    resetToDefaults: resetDemoMutation.mutateAsync,
  };
};
