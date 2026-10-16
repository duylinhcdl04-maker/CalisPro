import {
  AchievementItem,
  AIMotionSummary,
  ConsistencyHeatmapDay,
  PerformanceFilterState,
  PerformanceFitnessLevel,
  PerformanceKPIs,
  PersonalRecordItem,
  StudentPerformanceRecord,
  StudentWorkoutSession,
  TopExerciseVolume,
  TrainingVolumePoint,
  WeeklyTrendPoint,
} from "../types/performance.types";
import {
  INITIAL_STUDENT_PERFORMANCES,
  MOCK_ACHIEVEMENTS,
  MOCK_AI_MOTION_SUMMARY,
  MOCK_CONSISTENCY_HEATMAP,
  MOCK_PERFORMANCE_KPIS,
  MOCK_PERSONAL_RECORDS,
  MOCK_STUDENT_WORKOUT_LOGS,
  MOCK_TOP_EXERCISE_VOLUMES,
  MOCK_TRAINING_VOLUMES,
  MOCK_WEEKLY_TRENDS,
} from "../mock/performance.mock";

const STORAGE_KEYS = {
  STUDENTS: "calishealth_performance_students_v1",
  PRS: "calishealth_performance_prs_v1",
  ACHIEVEMENTS: "calishealth_performance_achievements_v1",
  WORKOUT_LOGS: "calishealth_performance_workout_logs_v1",
};

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (err) {
    console.error(`Error reading ${key} from LocalStorage:`, err);
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to LocalStorage:`, err);
  }
};

export const performanceService = {
  // 1. Overview KPIs
  getKPIs: async (): Promise<PerformanceKPIs> => {
    return MOCK_PERFORMANCE_KPIS;
  },

  // 2. Weekly Performance Trends
  getWeeklyTrends: async (_metric = "overall", _timeframe = "8w"): Promise<WeeklyTrendPoint[]> => {
    return MOCK_WEEKLY_TRENDS;
  },

  // 3. Training Volume Trends
  getTrainingVolume: async (_metric = "reps"): Promise<TrainingVolumePoint[]> => {
    return MOCK_TRAINING_VOLUMES;
  },

  // 4. Top Exercises by Volume
  getTopExercisesVolume: async (): Promise<TopExerciseVolume[]> => {
    return MOCK_TOP_EXERCISE_VOLUMES;
  },

  // 5. Personal Records List
  getPersonalRecords: async (): Promise<PersonalRecordItem[]> => {
    return getStorageItem<PersonalRecordItem[]>(STORAGE_KEYS.PRS, MOCK_PERSONAL_RECORDS);
  },

  // 6. Achievements Summary
  getAchievements: async (): Promise<AchievementItem[]> => {
    return getStorageItem<AchievementItem[]>(STORAGE_KEYS.ACHIEVEMENTS, MOCK_ACHIEVEMENTS);
  },

  // 7. Training Consistency Heatmap
  getConsistencyHeatmap: async (): Promise<ConsistencyHeatmapDay[]> => {
    return MOCK_CONSISTENCY_HEATMAP;
  },

  // 8. AI Motion Performance Summary
  getAIMotionSummary: async (): Promise<AIMotionSummary> => {
    return MOCK_AI_MOTION_SUMMARY;
  },

  // 9. Top Progressing Students (Fastest improving)
  getTopProgressingStudents: async (limit = 5): Promise<StudentPerformanceRecord[]> => {
    const all = getStorageItem<StudentPerformanceRecord[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENT_PERFORMANCES);
    return [...all].sort((a, b) => b.improvementPercentage - a.improvementPercentage).slice(0, limit);
  },

  // 10. Students At Risk
  getStudentsAtRisk: async (): Promise<StudentPerformanceRecord[]> => {
    const all = getStorageItem<StudentPerformanceRecord[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENT_PERFORMANCES);
    return all.filter((s) => s.status === "At Risk" || s.improvementPercentage < 0 || s.currentStreakDays === 0);
  },

  // 11. Full Filterable Student Performance Table
  getStudents: async (filter?: Partial<PerformanceFilterState>): Promise<StudentPerformanceRecord[]> => {
    const all = getStorageItem<StudentPerformanceRecord[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENT_PERFORMANCES);
    if (!filter) return all;

    return all.filter((item) => {
      // Search
      if (filter.searchQuery && filter.searchQuery.trim() !== "") {
        const q = filter.searchQuery.toLowerCase().trim();
        const matchName = item.studentName.toLowerCase().includes(q);
        const matchCode = item.studentCode.toLowerCase().includes(q);
        const matchCoach = item.assignedCoach.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchCoach) return false;
      }

      // Level
      if (filter.fitnessLevel && filter.fitnessLevel !== "all" && item.fitnessLevel !== filter.fitnessLevel) {
        return false;
      }

      // Status
      if (filter.status && filter.status !== "all" && item.status !== filter.status) {
        return false;
      }

      // Risk only
      if (filter.riskOnly && item.status !== "At Risk" && item.improvementPercentage >= 0) {
        return false;
      }

      return true;
    });
  },

  // 12. Student Detail by ID
  getStudentById: async (id: string): Promise<StudentPerformanceRecord | null> => {
    const all = getStorageItem<StudentPerformanceRecord[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENT_PERFORMANCES);
    const found = all.find(
      (s) => s.id === id || s.studentId === id || s.studentCode.toLowerCase() === id.toLowerCase()
    );
    return found || null;
  },

  // 13. Student Workout Sessions
  getStudentWorkouts: async (studentId: string): Promise<StudentWorkoutSession[]> => {
    const map = getStorageItem<Record<string, StudentWorkoutSession[]>>(
      STORAGE_KEYS.WORKOUT_LOGS,
      MOCK_STUDENT_WORKOUT_LOGS
    );
    if (map[studentId]) return map[studentId];

    // Fallback template logs
    return (MOCK_STUDENT_WORKOUT_LOGS["stu-001"] || []).map((w, idx) => ({
      ...w,
      id: `wlog-${studentId}-${idx}`,
      studentId,
    }));
  },

  // 14. Student PRs
  getStudentPRs: async (studentId: string): Promise<PersonalRecordItem[]> => {
    const allPRs = await performanceService.getPersonalRecords();
    const studentPRs = allPRs.filter((pr) => pr.studentId === studentId);
    if (studentPRs.length > 0) return studentPRs;

    return allPRs.slice(0, 3).map((pr, idx) => ({
      ...pr,
      id: `pr-${studentId}-${idx}`,
      studentId,
    }));
  },

  // 15. Reset
  resetToDefaults: () => {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.PRS);
    localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.WORKOUT_LOGS);
  },
};
