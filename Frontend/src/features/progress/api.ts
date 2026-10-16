import { apiClient } from "../../lib/api/client";
import { progressService } from "../../services/mock/progressService";

export const progressApi = {
  async getMetrics() {
    try {
      const res = await apiClient.get("/progress");
      if (res.data) {
        // combine with mock structure
        const mockMetrics = await progressService.getMetrics();
        return {
          ...mockMetrics,
          ...res.data,
        };
      }
    } catch (err) {
      console.warn("Backend progress API error, using mock fallback", err);
    }
    return progressService.getMetrics();
  },

  async getPersonalRecords() {
    try {
      const res = await apiClient.get("/user-goals");
      if (res.data && res.data.length > 0) {
        // Return existing or combined
        return progressService.getPersonalRecords();
      }
    } catch (err) {
      console.warn("Backend PR error", err);
    }
    return progressService.getPersonalRecords();
  },

  async getAssessmentSnapshots() {
    return progressService.getAssessmentSnapshots();
  },
};

