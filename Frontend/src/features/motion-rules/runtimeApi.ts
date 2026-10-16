import { apiClient } from "../../lib/api/client";

/** Phiên phân tích chuyển động realtime: gửi lô landmark (không gửi video), nhận phản hồi đã tổng hợp từ rule PUBLISHED. */

export interface StartMotionSessionRequest {
  exerciseId?: number;
  profileId?: number;
  context?: "TRAINING" | "ASSESSMENT";
  cameraView?: string;
  assessmentSessionId?: number;
  testItemId?: number;
  /** Buổi tập đang diễn ra: gắn phiên đo vào buổi tập để điểm form được tính vào tiến độ. */
  workoutSessionId?: number;
}
export interface StartMotionSessionResponse {
  sessionId: string; profileId: number; profileVersion: string; cameraView?: string; movementType: string;
  activeRules: number; requiredLandmarkHint: string[]; recommendedBatchMs: number; warnings: string[];
}
/** l: 33 landmark [x, y, z, visibility]; mảng rỗng = không phát hiện người. */
export interface MotionFrame { t: number; l: number[][] }
export interface MotionFeedback {
  mode: "SIMPLE" | "COMBINED"; feedbackCode?: string; severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL"; uiText?: string;
  voiceText?: string; audioUrl?: string; needsTts: boolean; relatedCodes: string[]; ruleCode: string; ruleVersion: number;
  observed?: number; expected?: string;
}
export interface MotionRep { repNumber: number; complete: boolean; valid: boolean; qualityScore: number; violationCodes: string[] }
export interface FrameBatchResponse {
  phase: string; repCount: number; validReps: number; measurementStatus: string; feedback: MotionFeedback[];
  completedReps: MotionRep[]; stopRequested: boolean; stopReason?: string;
}
export interface FinishMotionSessionResponse {
  sessionId: string; totalReps: number; validReps: number; invalidReps: number; qualityScore: number; holdSec: number;
  romAvg: number; criticalCount: number; poseConfidenceAvg: number; visibilityAvg: number; trackedRatio: number;
  violationCounts: Record<string, number>; reps: MotionRep[]; reliability: "RELIABLE" | "LOW"; assessmentResult?: unknown;
}

const B = "/motion/sessions";

export const motionRuntimeApi = {
  start: async (req: StartMotionSessionRequest) => (await apiClient.post<StartMotionSessionResponse>(B, req)).data,
  frames: async (sessionId: string, frames: MotionFrame[], aspectRatio: number) =>
    (await apiClient.post<FrameBatchResponse>(`${B}/${sessionId}/frames`, { frames, aspectRatio })).data,
  finish: async (sessionId: string) => (await apiClient.post<FinishMotionSessionResponse>(`${B}/${sessionId}/finish`)).data,
};

/** Phát phản hồi: audio đã tạo sẵn (cache Viettel AI) nếu có, không thì đọc câu ngắn bằng giọng trình duyệt. */
export function speakFeedback(f: MotionFeedback) {
  if (f.audioUrl) {
    new Audio(f.audioUrl).play().catch(() => undefined);
  } else if (f.needsTts && f.voiceText && "speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(f.voiceText);
    u.lang = "vi-VN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
}
