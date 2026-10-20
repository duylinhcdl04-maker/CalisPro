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

// ---------- Giọng đọc phản hồi ----------
// Giọng nhắc luôn là giọng Admin đã cấu hình (Viettel AI...). Backend tạo audio theo yêu cầu cho từng câu một lần rồi dùng lại; ở đây chỉ phát.
// Không dùng giọng đọc mặc định của trình duyệt (thường là giọng nước ngoài): máy không có giọng tiếng Việt thì chỉ hiện chữ.
const audioUrlCache = new Map<string, string>();
const audioRequests = new Map<string, Promise<string | null>>();
let playing: HTMLAudioElement | null = null;

async function audioFor(f: MotionFeedback): Promise<string | null> {
  if (f.audioUrl) return f.audioUrl;
  const code = f.feedbackCode;
  if (!code || !f.voiceText) return null;
  const known = audioUrlCache.get(code);
  if (known) return known;
  let pending = audioRequests.get(code);
  if (!pending) {
    pending = apiClient
      .post<{ audioUrl: string | null }>(`/motion/feedback/${encodeURIComponent(code)}/audio`, undefined, { timeout: 30_000 })
      .then((r) => { if (r.data.audioUrl) audioUrlCache.set(code, r.data.audioUrl); return r.data.audioUrl; })
      .catch(() => null)
      .finally(() => { audioRequests.delete(code); });
    audioRequests.set(code, pending);
  }
  return pending;
}

function speakWithVietnameseBrowserVoice(text: string | undefined) {
  if (!text || !("speechSynthesis" in window)) return;
  const vi = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("vi"));
  if (!vi) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = vi.lang;
  u.voice = vi;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/** Phát phản hồi bằng giọng Admin đã cấu hình; chưa có audio thì nhờ backend tạo (một lần cho mỗi câu). Không bao giờ dùng giọng nước ngoài. */
export function speakFeedback(f: MotionFeedback) {
  void audioFor(f).then((url) => {
    if (url) {
      playing?.pause();
      const audio = new Audio(url);
      playing = audio;
      audio.play().catch(() => undefined);
    } else {
      speakWithVietnameseBrowserVoice(f.voiceText);
    }
  });
}
