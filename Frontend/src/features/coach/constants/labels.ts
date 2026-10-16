import type {
  AchievementType,
  AssessmentStatus,
  AssessmentType,
  AttentionType,
  CalendarEventStatus,
  CalendarEventType,
  CoachNoteCategory,
  CoachNotificationType,
  Equipment,
  ExerciseDifficulty,
  FeedbackType,
  Intensity,
  MessageKind,
  MotionErrorSeverity,
  MovementPattern,
  PlanStatus,
  ReviewStatus,
  SessionStatus,
  StudentLevel,
  StudentStatus,
  TrainingGoal,
  Weekday,
} from "../types";

/** Visual tone used by <StatusBadge>. Maps 1:1 to the semantic palette. */
export type Tone = "success" | "warning" | "critical" | "info" | "neutral" | "accent";

export interface LabelTone {
  label: string;
  tone: Tone;
}

export const STUDENT_STATUS: Record<StudentStatus, LabelTone> = {
  ACTIVE: { label: "Đang tập", tone: "success" },
  NEEDS_ATTENTION: { label: "Cần chú ý", tone: "warning" },
  INACTIVE: { label: "Không hoạt động", tone: "critical" },
  PAUSED: { label: "Tạm dừng", tone: "neutral" },
  NEW: { label: "Mới", tone: "info" },
};

export const LEVEL_LABEL: Record<StudentLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  ELITE: "Elite",
};

export const GOAL_LABEL: Record<TrainingGoal, string> = {
  STRENGTH: "Sức mạnh",
  MUSCLE: "Tăng cơ",
  FAT_LOSS: "Giảm mỡ",
  SKILL: "Kỹ năng",
  MOBILITY: "Linh hoạt",
  ENDURANCE: "Sức bền",
};

export const ATTENTION_TYPE_LABEL: Record<AttentionType, string> = {
  INACTIVE: "Không hoạt động",
  PERFORMANCE_DROP: "Hiệu suất giảm",
  FORM_DROP: "Form giảm",
  ASSESSMENT_OVERDUE: "Đánh giá quá hạn",
  SUBSCRIPTION: "Gói hội viên",
  INJURY: "Chấn thương",
  LOW_ADHERENCE: "Tuân thủ thấp",
};

export const ASSESSMENT_STATUS: Record<AssessmentStatus, LabelTone> = {
  UPCOMING: { label: "Sắp tới", tone: "info" },
  DUE: { label: "Đến hạn", tone: "warning" },
  OVERDUE: { label: "Quá hạn", tone: "critical" },
  COMPLETED: { label: "Hoàn thành", tone: "success" },
  NEEDS_REVIEW: { label: "Cần review", tone: "accent" },
};

export const ASSESSMENT_TYPE_LABEL: Record<AssessmentType, string> = {
  INITIAL: "Đầu vào",
  MONTHLY: "Hàng tháng",
  QUARTERLY: "Hàng quý",
  SKILL_TEST: "Kỹ năng",
};

export const PLAN_STATUS: Record<PlanStatus, LabelTone> = {
  DRAFT: { label: "Nháp", tone: "neutral" },
  ACTIVE: { label: "Đang áp dụng", tone: "success" },
  PAUSED: { label: "Tạm dừng", tone: "warning" },
  ARCHIVED: { label: "Lưu trữ", tone: "neutral" },
};

export const INTENSITY: Record<Intensity, LabelTone> = {
  LOW: { label: "Low", tone: "info" },
  MODERATE: { label: "Moderate", tone: "success" },
  HIGH: { label: "High", tone: "warning" },
  MAX: { label: "Max", tone: "critical" },
};

export const PATTERN_LABEL: Record<MovementPattern, string> = {
  PUSH: "Push",
  PULL: "Pull",
  LEGS: "Legs",
  CORE: "Core",
  SKILL: "Skill",
  MOBILITY: "Mobility",
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  NONE: "Không dụng cụ",
  PULL_UP_BAR: "Xà đơn",
  PARALLEL_BARS: "Xà kép",
  RINGS: "Vòng treo",
  RESISTANCE_BAND: "Dây kháng lực",
  WALL: "Tường",
};

export const DIFFICULTY_LABEL: Record<ExerciseDifficulty, string> = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Nâng cao",
};

export const SESSION_STATUS: Record<SessionStatus, LabelTone> = {
  COMPLETED: { label: "Hoàn thành", tone: "success" },
  PARTIAL: { label: "Một phần", tone: "warning" },
  MISSED: { label: "Bỏ lỡ", tone: "critical" },
};

export const REVIEW_STATUS: Record<ReviewStatus, LabelTone> = {
  PENDING: { label: "Chờ review", tone: "accent" },
  REVIEWED: { label: "Đã review", tone: "neutral" },
};

export const FEEDBACK_TYPE: Record<FeedbackType, LabelTone> = {
  PRAISE: { label: "Khen ngợi", tone: "success" },
  CORRECTION: { label: "Điều chỉnh", tone: "warning" },
  GENERAL: { label: "Chung", tone: "info" },
};

export const MOTION_SEVERITY: Record<MotionErrorSeverity, LabelTone> = {
  LOW: { label: "Nhẹ", tone: "info" },
  MEDIUM: { label: "Trung bình", tone: "warning" },
  HIGH: { label: "Nghiêm trọng", tone: "critical" },
};

export const NOTE_CATEGORY: Record<CoachNoteCategory, LabelTone> = {
  GENERAL: { label: "Chung", tone: "neutral" },
  TECHNIQUE: { label: "Kỹ thuật", tone: "accent" },
  INJURY: { label: "Chấn thương", tone: "critical" },
  PROGRESS: { label: "Tiến bộ", tone: "success" },
  MOTIVATION: { label: "Động lực", tone: "info" },
};

export const NOTIFICATION_TYPE_LABEL: Record<CoachNotificationType, string> = {
  STUDENT: "Học viên",
  ASSESSMENT: "Đánh giá",
  WORKOUT: "Buổi tập",
  AI: "AI",
  ACHIEVEMENT: "Thành tích",
  SYSTEM: "Hệ thống",
};

export const EVENT_TYPE: Record<CalendarEventType, LabelTone> = {
  ASSESSMENT: { label: "Đánh giá", tone: "accent" },
  WORKOUT_REVIEW: { label: "Review buổi tập", tone: "info" },
  PROGRESS_REVIEW: { label: "Review tiến độ", tone: "success" },
  COACHING_SESSION: { label: "Buổi huấn luyện", tone: "warning" },
};

export const EVENT_STATUS: Record<CalendarEventStatus, LabelTone> = {
  UPCOMING: { label: "Sắp diễn ra", tone: "info" },
  IN_PROGRESS: { label: "Đang diễn ra", tone: "accent" },
  COMPLETED: { label: "Đã xong", tone: "success" },
  CANCELLED: { label: "Đã huỷ", tone: "neutral" },
};

export const ACHIEVEMENT_TYPE_LABEL: Record<AchievementType, string> = {
  PR: "Kỷ lục mới",
  STREAK: "Chuỗi tập",
  LEVEL_UP: "Lên cấp",
  CHALLENGE: "Thử thách",
};

export const MESSAGE_KIND: Record<MessageKind, LabelTone> = {
  TEXT: { label: "Tin nhắn", tone: "neutral" },
  WORKOUT_QUESTION: { label: "Hỏi về buổi tập", tone: "info" },
  ASSESSMENT_QUESTION: { label: "Hỏi về đánh giá", tone: "accent" },
  FEEDBACK: { label: "Phản hồi", tone: "success" },
  WORKOUT_PLAN: { label: "Giáo án", tone: "accent" },
  RECOMMENDATION: { label: "Khuyến nghị", tone: "warning" },
};

export const WEEKDAY_LABEL: Record<Weekday, { short: string; long: string }> = {
  MON: { short: "T2", long: "Thứ Hai" },
  TUE: { short: "T3", long: "Thứ Ba" },
  WED: { short: "T4", long: "Thứ Tư" },
  THU: { short: "T5", long: "Thứ Năm" },
  FRI: { short: "T6", long: "Thứ Sáu" },
  SAT: { short: "T7", long: "Thứ Bảy" },
  SUN: { short: "CN", long: "Chủ Nhật" },
};

export const FITNESS_METRIC_LABEL = {
  strength: "Sức mạnh",
  endurance: "Sức bền",
  mobility: "Linh hoạt",
  core: "Core",
  balance: "Thăng bằng",
  overall: "Tổng thể",
} as const;
