import {
  AssessmentRecord,
  CoachNote,
  FitnessDimensionType,
  FitnessKpiData,
  FitnessLevelDistribution,
  FitnessProfile,
  FitnessProfilesFilterState,
  FitnessProgressSummary,
  GlobalFitnessTrendPoint,
  MotionAnalysisRecord,
} from "../types/fitnessProfile";
import {
  INITIAL_STUDENT_PROFILES,
  MOCK_FITNESS_ALERTS,
  MOCK_FITNESS_KPI,
  MOCK_GLOBAL_DIMENSIONS,
  MOCK_GLOBAL_TREND,
  MOCK_LEVEL_DISTRIBUTION,
  MOCK_STUDENT_ASSESSMENTS,
  MOCK_STUDENT_MOTION,
  MOCK_STUDENT_NOTES,
  MOCK_STUDENT_PROGRESS,
} from "../mock/fitnessProfileMockData";

const STORAGE_KEYS = {
  PROFILES: "calishealth_student_fitness_profiles_v1",
  ASSESSMENTS: "calishealth_fitness_assessments_v1",
  NOTES: "calishealth_fitness_coach_notes_v1",
  PROGRESS: "calishealth_fitness_progress_v1",
  MOTION: "calishealth_fitness_motion_v1",
};

// Helper to initialize local storage with fallback
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

export const fitnessProfileService = {
  // 1. Get List with Filters
  getProfiles: async (filter?: Partial<FitnessProfilesFilterState>): Promise<FitnessProfile[]> => {
    const all = getStorageItem<FitnessProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_STUDENT_PROFILES);
    if (!filter) return all;

    return all.filter((item) => {
      // Search query (name, code, email, phone)
      if (filter.searchQuery && filter.searchQuery.trim() !== "") {
        const q = filter.searchQuery.toLowerCase().trim();
        const matchName = item.student.fullName.toLowerCase().includes(q);
        const matchCode = item.student.code.toLowerCase().includes(q);
        const matchEmail = item.student.email.toLowerCase().includes(q);
        const matchPhone = item.student.phone.toLowerCase().includes(q);
        const matchCoach = item.student.assignedCoach.name.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchEmail && !matchPhone && !matchCoach) {
          return false;
        }
      }

      // Level
      if (filter.level && filter.level !== "all" && item.level !== filter.level) {
        return false;
      }

      // Status
      if (filter.status && filter.status !== "all" && item.status !== filter.status) {
        return false;
      }

      // Overdue filter
      if (filter.overdueOnly && !item.isReassessmentOverdue) {
        return false;
      }

      // Dimension Filter threshold (e.g. low mobility < 55)
      if (filter.dimensionFilter && filter.dimensionFilter !== "all") {
        const dimVal = item[filter.dimensionFilter as FitnessDimensionType];
        if (typeof dimVal === "number" && dimVal > 60) {
          // If filtering specific dimension focus
          return true;
        }
      }

      return true;
    });
  },

  // 2. Get Profile Detail by Student ID or Profile ID
  getProfileById: async (id: string): Promise<FitnessProfile | null> => {
    const all = getStorageItem<FitnessProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_STUDENT_PROFILES);
    const found = all.find((p) => p.id === id || p.studentId === id || p.student.code.toLowerCase() === id.toLowerCase());
    return found || null;
  },

  // 3. KPI Statistics
  getKpiStatistics: async (): Promise<FitnessKpiData> => {
    return MOCK_FITNESS_KPI;
  },

  // 4. Level Distribution & Global Dimensions
  getLevelDistribution: async (): Promise<FitnessLevelDistribution[]> => {
    return MOCK_LEVEL_DISTRIBUTION;
  },

  getGlobalDimensions: async () => {
    return MOCK_GLOBAL_DIMENSIONS;
  },

  // 5. Global Trends
  getGlobalTrends: async (_timeframe = "90d"): Promise<GlobalFitnessTrendPoint[]> => {
    return MOCK_GLOBAL_TREND;
  },

  // 6. Alerts
  getAlerts: async () => {
    return MOCK_FITNESS_ALERTS;
  },

  // 7. Assessments by Student
  getAssessmentsByStudent: async (studentId: string): Promise<AssessmentRecord[]> => {
    const assessmentsMap = getStorageItem<Record<string, AssessmentRecord[]>>(
      STORAGE_KEYS.ASSESSMENTS,
      MOCK_STUDENT_ASSESSMENTS
    );
    if (assessmentsMap[studentId]) {
      return assessmentsMap[studentId];
    }
    // Return standard mock assessments if student has no dedicated list
    return (MOCK_STUDENT_ASSESSMENTS["stu-001"] || []).map((as, idx) => ({
      ...as,
      id: `as-${studentId}-${idx}`,
      studentId,
    }));
  },

  // 8. Progress by Student
  getProgressByStudent: async (studentId: string): Promise<FitnessProgressSummary> => {
    const progressMap = getStorageItem<Record<string, FitnessProgressSummary>>(
      STORAGE_KEYS.PROGRESS,
      MOCK_STUDENT_PROGRESS
    );
    if (progressMap[studentId]) {
      return progressMap[studentId];
    }
    // Return baseline adapted progress
    const profile = await fitnessProfileService.getProfileById(studentId);
    const currentScore = profile?.overallScore || 65;
    const startScore = Math.max(30, currentScore - 16);
    const improvement = Number((((currentScore - startScore) / startScore) * 100).toFixed(1));

    return {
      studentId,
      startingOverallScore: startScore,
      currentOverallScore: currentScore,
      totalImprovementPercentage: improvement,
      startDate: profile?.student.joinDate || "01/08/2026",
      currentDate: profile?.lastAssessmentDate || "26/09/2026",
      dimensions: [
        {
          dimension: "strength",
          label: "Strength (Sức mạnh)",
          startScore: Math.max(30, (profile?.strength || 65) - 18),
          currentScore: profile?.strength || 65,
          changeValue: 18,
          changePercentage: 32.4,
          history: [
            { date: "01/08", score: Math.max(30, (profile?.strength || 65) - 18) },
            { date: "26/09", score: profile?.strength || 65 },
          ],
        },
        {
          dimension: "endurance",
          label: "Endurance (Sức bền)",
          startScore: Math.max(30, (profile?.endurance || 70) - 16),
          currentScore: profile?.endurance || 70,
          changeValue: 16,
          changePercentage: 28.5,
          history: [
            { date: "01/08", score: Math.max(30, (profile?.endurance || 70) - 16) },
            { date: "26/09", score: profile?.endurance || 70 },
          ],
        },
        {
          dimension: "mobility",
          label: "Mobility (Linh hoạt)",
          startScore: Math.max(30, (profile?.mobility || 55) - 6),
          currentScore: profile?.mobility || 55,
          changeValue: 6,
          changePercentage: 11.2,
          history: [
            { date: "01/08", score: Math.max(30, (profile?.mobility || 55) - 6) },
            { date: "26/09", score: profile?.mobility || 55 },
          ],
        },
        {
          dimension: "core",
          label: "Core (Cơ trung tâm)",
          startScore: Math.max(30, (profile?.core || 60) - 14),
          currentScore: profile?.core || 60,
          changeValue: 14,
          changePercentage: 25.0,
          history: [
            { date: "01/08", score: Math.max(30, (profile?.core || 60) - 14) },
            { date: "26/09", score: profile?.core || 60 },
          ],
        },
        {
          dimension: "balance",
          label: "Balance (Thăng bằng)",
          startScore: Math.max(30, (profile?.balance || 58) - 5),
          currentScore: profile?.balance || 58,
          changeValue: 5,
          changePercentage: 9.4,
          history: [
            { date: "01/08", score: Math.max(30, (profile?.balance || 58) - 5) },
            { date: "26/09", score: profile?.balance || 58 },
          ],
        },
        {
          dimension: "skill",
          label: "Skill (Kỹ năng)",
          startScore: Math.max(25, (profile?.skill || 45) - 15),
          currentScore: profile?.skill || 45,
          changeValue: 15,
          changePercentage: 42.0,
          history: [
            { date: "01/08", score: Math.max(25, (profile?.skill || 45) - 15) },
            { date: "26/09", score: profile?.skill || 45 },
          ],
        },
      ],
      scoreTimeline: [
        {
          date: "01/08",
          overall: startScore,
          strength: (profile?.strength || 65) - 18,
          endurance: (profile?.endurance || 70) - 16,
          mobility: (profile?.mobility || 55) - 6,
          core: (profile?.core || 60) - 14,
          balance: (profile?.balance || 58) - 5,
          skill: (profile?.skill || 45) - 15,
        },
        {
          date: "26/09",
          overall: currentScore,
          strength: profile?.strength || 65,
          endurance: profile?.endurance || 70,
          mobility: profile?.mobility || 55,
          core: profile?.core || 60,
          balance: profile?.balance || 58,
          skill: profile?.skill || 45,
        },
      ],
    };
  },

  // 9. AI Motion Analysis by Student
  getMotionByStudent: async (studentId: string): Promise<MotionAnalysisRecord> => {
    const motionMap = getStorageItem<Record<string, MotionAnalysisRecord>>(
      STORAGE_KEYS.MOTION,
      MOCK_STUDENT_MOTION
    );
    if (motionMap[studentId]) {
      return motionMap[studentId];
    }
    return {
      ...MOCK_STUDENT_MOTION["stu-001"],
      id: `mot-${studentId}`,
      studentId,
    };
  },

  // 10. Coach Notes by Student
  getNotesByStudent: async (studentId: string): Promise<CoachNote[]> => {
    const notesMap = getStorageItem<Record<string, CoachNote[]>>(
      STORAGE_KEYS.NOTES,
      MOCK_STUDENT_NOTES
    );
    return notesMap[studentId] || [];
  },

  // 11. Add Coach Note
  addCoachNote: async (
    studentId: string,
    noteData: { content: string; tags: string[]; priority?: "normal" | "important" | "urgent"; isPinned?: boolean }
  ): Promise<CoachNote> => {
    const notesMap = getStorageItem<Record<string, CoachNote[]>>(
      STORAGE_KEYS.NOTES,
      MOCK_STUDENT_NOTES
    );
    const list = notesMap[studentId] || [];
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newNote: CoachNote = {
      id: `note-${Date.now()}`,
      studentId,
      coachId: "coach-current",
      coachName: "Admin / Coach Lê Quang Hải",
      coachAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      date: formattedDate,
      content: noteData.content,
      tags: noteData.tags.length > 0 ? noteData.tags : ["General"],
      isPinned: noteData.isPinned || false,
      priority: noteData.priority || "normal",
    };

    notesMap[studentId] = [newNote, ...list];
    setStorageItem(STORAGE_KEYS.NOTES, notesMap);

    // Update note count on profile
    const profiles = getStorageItem<FitnessProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_STUDENT_PROFILES);
    const updatedProfiles = profiles.map((p) =>
      p.studentId === studentId ? { ...p, notesCount: (p.notesCount || 0) + 1 } : p
    );
    setStorageItem(STORAGE_KEYS.PROFILES, updatedProfiles);

    return newNote;
  },

  // 12. Delete Coach Note
  deleteCoachNote: async (studentId: string, noteId: string): Promise<boolean> => {
    const notesMap = getStorageItem<Record<string, CoachNote[]>>(
      STORAGE_KEYS.NOTES,
      MOCK_STUDENT_NOTES
    );
    if (!notesMap[studentId]) return false;

    notesMap[studentId] = notesMap[studentId].filter((n) => n.id !== noteId);
    setStorageItem(STORAGE_KEYS.NOTES, notesMap);

    const profiles = getStorageItem<FitnessProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_STUDENT_PROFILES);
    const updatedProfiles = profiles.map((p) =>
      p.studentId === studentId ? { ...p, notesCount: Math.max(0, (p.notesCount || 1) - 1) } : p
    );
    setStorageItem(STORAGE_KEYS.PROFILES, updatedProfiles);

    return true;
  },

  // 13. Schedule Reassessment
  scheduleReassessment: async (
    studentId: string,
    scheduledDate: string,
    assessmentName: string,
    note?: string
  ): Promise<boolean> => {
    const profiles = getStorageItem<FitnessProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_STUDENT_PROFILES);
    const updatedProfiles = profiles.map((p) => {
      if (p.studentId === studentId) {
        return {
          ...p,
          nextAssessmentDate: scheduledDate,
          isReassessmentOverdue: false,
          status: p.status === "Reassessment Due" ? ("Healthy" as const) : p.status,
        };
      }
      return p;
    });
    setStorageItem(STORAGE_KEYS.PROFILES, updatedProfiles);

    if (note && note.trim() !== "") {
      await fitnessProfileService.addCoachNote(studentId, {
        content: `Đã lên lịch đánh giá lại [${assessmentName}] vào ngày ${scheduledDate}. Ghi chú: ${note}`,
        tags: ["Reassessment", "Schedule"],
        priority: "important",
      });
    }

    return true;
  },

  // 14. Reset to Defaults
  resetToDefaults: () => {
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.ASSESSMENTS);
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.MOTION);
  },
};
