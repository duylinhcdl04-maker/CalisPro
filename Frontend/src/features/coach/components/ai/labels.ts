import type { AIReviewStatus, RecommendationStatus } from "../../types";
import type { LabelTone } from "../../constants/labels";

/** AI-specific status labels (kept local to the AI components). */
export const AI_REVIEW_STATUS: Record<AIReviewStatus, LabelTone> = {
  PENDING_REVIEW: { label: "Chờ review", tone: "accent" },
  REVIEWED: { label: "Đã review", tone: "neutral" },
};

export const RECOMMENDATION_STATUS: Record<RecommendationStatus, LabelTone> = {
  PENDING: { label: "Chưa quyết định", tone: "neutral" },
  ACCEPTED: { label: "Đã chấp nhận", tone: "success" },
  DISMISSED: { label: "Đã bỏ qua", tone: "neutral" },
};

export const AI_DISCLAIMER = "AI chỉ đưa ra khuyến nghị. Coach là người quyết định cuối cùng.";
