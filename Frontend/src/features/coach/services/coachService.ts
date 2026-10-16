import { MockApiError } from "../../../services/mock/latency";
import type {
  AvailabilitySlot,
  ChangePasswordInput,
  CoachDashboard,
  CoachProfile,
  CoachProfileInput,
  CoachSettings,
  NotificationPreferences,
} from "../types";
import { COACH_PROFILE, COACH_SETTINGS } from "../mock/coach.mock";
import { ATTENTION_ALERTS, STUDENTS } from "../mock/students.mock";
import { ASSESSMENTS } from "../mock/assessments.mock";
import { SESSIONS } from "../mock/training.mock";
import { ACHIEVEMENTS, CALENDAR_EVENTS } from "../mock/communication.mock";
import { COACH_ENDPOINTS, USE_MOCK_API, api, mockResponse } from "./http";

const DAY = 86_400_000;

function buildDashboard(): CoachDashboard {
  const activeCount = STUDENTS.filter((s) => s.lastWorkoutAt && Date.now() - new Date(s.lastWorkoutAt).getTime() <= 7 * DAY).length;
  const attention = STUDENTS.filter((s) => s.needsAttention).length;
  const due = ASSESSMENTS.filter((a) => a.status === "DUE" || a.status === "OVERDUE");
  const overdue = due.filter((a) => a.status === "OVERDUE").length;
  const newThisMonth = STUDENTS.filter((s) => Date.now() - new Date(s.joinedAt).getTime() <= 30 * DAY).length;
  const todayKey = new Date().toDateString();

  return {
    coachName: COACH_PROFILE.name,
    kpis: [
      { key: "TOTAL_STUDENTS", label: "Tổng học viên", value: STUDENTS.length, description: "Được phân công cho bạn", trend: { direction: "up", value: `+${newThisMonth}`, label: "trong 30 ngày" }, status: "info", href: "/coach/students" },
      { key: "ACTIVE_STUDENTS", label: "Đang tập tuần này", value: activeCount, description: `${Math.round((activeCount / STUDENTS.length) * 100)}% học viên có buổi tập trong 7 ngày`, trend: { direction: "up", value: "+3", label: "so với tuần trước" }, status: "success", href: "/coach/students?lastActive=7D" },
      { key: "NEEDS_ATTENTION", label: "Cần chú ý", value: attention, description: "Hiệu suất, form hoặc tuân thủ giảm", trend: { direction: "down", value: "-2", label: "so với tuần trước" }, status: "critical", href: "/coach/students?needsAttention=true" },
      { key: "ASSESSMENTS_DUE", label: "Đánh giá đến hạn", value: due.length, description: overdue ? `${overdue} bài đã quá hạn` : "Không có bài quá hạn", trend: null, status: overdue ? "warning" : "info", href: "/coach/assessments?status=DUE" },
    ],
    todaySchedule: CALENDAR_EVENTS.filter((e) => new Date(e.start).toDateString() === todayKey).sort((a, b) => a.start.localeCompare(b.start)),
    attention: ATTENTION_ALERTS,
    achievements: ACHIEVEMENTS,
    recentSessions: SESSIONS.filter((s) => s.status !== "MISSED").slice(0, 6).map(({ rpe: _r, avgHeartRate: _h, studentNote: _n, exercises: _e, feedback: _f, ...summary }) => summary),
  };
}

export const coachService = {
  async getDashboard(): Promise<CoachDashboard> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.dashboard);
    return mockResponse(buildDashboard(), 600);
  },

  async getProfile(): Promise<CoachProfile> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.profile);
    return mockResponse(COACH_PROFILE, 350);
  },

  async updateProfile(input: CoachProfileInput): Promise<CoachProfile> {
    if (!USE_MOCK_API) return api.put(COACH_ENDPOINTS.profile, input);
    Object.assign(COACH_PROFILE, input);
    return mockResponse(COACH_PROFILE, 500);
  },

  async getSettings(): Promise<CoachSettings> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.settings);
    return mockResponse(COACH_SETTINGS, 350);
  },

  async updateNotificationPreferences(prefs: NotificationPreferences): Promise<CoachSettings> {
    if (!USE_MOCK_API) return api.put(`${COACH_ENDPOINTS.settings}/notifications`, prefs);
    COACH_SETTINGS.notifications = prefs;
    return mockResponse(COACH_SETTINGS, 400);
  },

  async updateAvailability(slots: AvailabilitySlot[]): Promise<CoachSettings> {
    if (!USE_MOCK_API) return api.put(`${COACH_ENDPOINTS.settings}/availability`, slots);
    const invalid = slots.find((s) => s.enabled && s.end <= s.start);
    if (invalid) throw new MockApiError("Giờ kết thúc phải sau giờ bắt đầu.", 422);
    COACH_SETTINGS.availability = slots;
    return mockResponse(COACH_SETTINGS, 400);
  },

  async setTwoFactor(enabled: boolean): Promise<CoachSettings> {
    if (!USE_MOCK_API) return api.put(`${COACH_ENDPOINTS.settings}/two-factor`, { enabled });
    COACH_SETTINGS.security.twoFactorEnabled = enabled;
    return mockResponse(COACH_SETTINGS, 400);
  },

  async changePassword(input: ChangePasswordInput): Promise<void> {
    if (!USE_MOCK_API) return api.post(COACH_ENDPOINTS.password, input);
    if (input.currentPassword !== "coach1234") throw new MockApiError("Mật khẩu hiện tại không đúng.", 400);
    COACH_SETTINGS.security.lastPasswordChangeAt = new Date().toISOString();
    return mockResponse(undefined, 600);
  },
};
