import type { L4Decision, L4ReviewStatus, RuleSetStatus, SafetyClearanceStatus, SafetyStatusCode } from "../types";
import type { LabelTone } from "./labels";

export const L4_REVIEW_STATUS: Record<L4ReviewStatus, LabelTone> = {
  PENDING: { label: "Chờ xác nhận", tone: "warning" },
  CONFIRMED: { label: "Đã xác nhận L4", tone: "success" },
  REJECTED: { label: "Đã từ chối", tone: "critical" },
  RETEST_REQUESTED: { label: "Yêu cầu đo lại", tone: "info" },
  SUPERSEDED: { label: "Đã bị thay thế", tone: "neutral" },
  EXPIRED: { label: "Hết hạn", tone: "neutral" },
};

export const L4_DECISION_LABEL: Record<L4Decision, { label: string; hint: string }> = {
  CONFIRM: { label: "Xác nhận lên L4", hint: "Học viên được xếp L4 (nguồn Coach xác nhận). Cần có video còn hạn." },
  REJECT: { label: "Từ chối", hint: "Giữ nguyên L3. Cần ghi rõ lý do (ví dụ form không đạt ở rep nào)." },
  REQUEST_RETEST: { label: "Yêu cầu đo lại", hint: "Video không rõ hoặc nghi ngờ đo sai. Cần ghi lý do." },
};

export const RULE_SET_STATUS: Record<RuleSetStatus, LabelTone> = {
  DRAFT: { label: "Bản nháp", tone: "info" },
  PENDING_REVIEW: { label: "Chờ Admin duyệt", tone: "warning" },
  ACTIVE: { label: "Đang áp dụng", tone: "success" },
  ARCHIVED: { label: "Đã lưu trữ", tone: "neutral" },
};

/** Nhãn thân thiện cho mã chỉ số của attempt. */
export const METRIC_LABEL: Record<string, string> = {
  VALID_REPS: "Rep hợp lệ",
  TOTAL_REPS: "Tổng rep",
  HOLD_SEC: "Giữ (giây)",
  ANGLE_DEG: "Góc (°)",
  FORM_SCORE: "Điểm form",
  ROM_SCORE: "Biên độ",
  MAJOR_VIOLATIONS: "Lỗi nghiêm trọng",
  POSE_CONFIDENCE: "Tin cậy tư thế",
  VISIBILITY: "Độ thấy khớp",
  TRACKED_RATIO: "Tỉ lệ theo dõi",
};

export const MEASUREMENT_STATUS: Record<string, LabelTone> = {
  VALID: { label: "Hợp lệ", tone: "success" },
  INVALID_MEASUREMENT: { label: "Đo không tin cậy", tone: "warning" },
  USER_ABORTED: { label: "Học viên dừng", tone: "neutral" },
};

export const SAFETY_CLEARANCE_STATUS: Record<SafetyClearanceStatus, LabelTone> = {
  REQUESTED: { label: "Chờ xác minh", tone: "warning" },
  UNDER_REVIEW: { label: "Đang xem xét", tone: "info" },
  GRANTED: { label: "Đã chấp thuận", tone: "success" },
  REJECTED: { label: "Đã từ chối", tone: "critical" },
};

export const SAFETY_STATUS_TONE: Record<SafetyStatusCode, LabelTone> = {
  CLEARED: { label: "Không hạn chế", tone: "success" },
  REVIEW_REQUIRED: { label: "Cần tham vấn", tone: "warning" },
  RESTRICTED: { label: "Hạn chế", tone: "critical" },
};
