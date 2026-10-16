import { withLatency } from "./latency";
import {
  ADMIN_KPIS,
  USER_GROWTH_DATA,
  WORKOUT_COMPLETION_STATS,
  FITNESS_DISTRIBUTION_DATA,
  USER_GOALS_DATA,
  AI_SYSTEM_HEALTH,
  RECENT_ACTIVITIES,
  ADMIN_USERS_LIST,
  ADMIN_COACHES_LIST,
  type AdminUserItem,
  type AdminCoachItem,
} from "./adminMockData";

export const adminService = {
  async getDashboardSummary() {
    await withLatency(null, 300);
    return {
      kpis: ADMIN_KPIS,
      userGrowth: USER_GROWTH_DATA,
      workoutStats: WORKOUT_COMPLETION_STATS,
      fitnessDistribution: FITNESS_DISTRIBUTION_DATA,
      userGoals: USER_GOALS_DATA,
      aiHealth: AI_SYSTEM_HEALTH,
      recentActivities: RECENT_ACTIVITIES,
    };
  },

  async listUsers() {
    await withLatency(null, 350);
    return ADMIN_USERS_LIST;
  },

  async updateUserStatus(userId: string, status: AdminUserItem["status"]) {
    await withLatency(null, 300);
    const user = ADMIN_USERS_LIST.find((u) => u.id === userId);
    if (user) user.status = status;
    return user;
  },

  async listCoaches() {
    await withLatency(null, 350);
    return ADMIN_COACHES_LIST;
  },
};
