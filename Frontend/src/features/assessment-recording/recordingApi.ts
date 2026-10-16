import axios from "axios";
import { apiClient } from "../../lib/api/client";
import { extensionFor, type RecordedClip } from "./recorder";

/** Bài test V2 thuộc phiên BASELINE hoặc PERIODIC; hai nhóm endpoint có cùng hình dạng. */
export type AssessmentKind = "baseline" | "periodic";

export interface RecordingConsent {
  sessionId: number;
  granted: boolean;
  retentionDays: number;
}

interface CloudinarySignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  signature: string;
}

const base = (kind: AssessmentKind, sessionId: number) => `/assessments/${kind}/${sessionId}`;

export const recordingApi = {
  setConsent: (kind: AssessmentKind, sessionId: number, granted: boolean) =>
    apiClient.put<RecordingConsent>(`${base(kind, sessionId)}/recording-consent`, { granted }).then((r) => r.data),

  signature: (kind: AssessmentKind, sessionId: number) =>
    apiClient.post<CloudinarySignature>(`${base(kind, sessionId)}/recording/upload-signature`).then((r) => r.data),

  attachVideo: (kind: AssessmentKind, sessionId: number, attemptId: number, videoUrl: string) =>
    apiClient.put<void>(`${base(kind, sessionId)}/attempts/${attemptId}/video`, { videoUrl }).then(() => undefined),
};

/** Tải thẳng lên Cloudinary bằng chữ ký backend cấp (folder riêng của user). Trả secure_url. */
export async function uploadClip(
  clip: RecordedClip,
  sig: CloudinarySignature,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const form = new FormData();
  form.append("file", clip.blob, `attempt.${extensionFor(clip.mime)}`);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("public_id", sig.publicId);
  form.append("signature", sig.signature);
  // axios riêng (không qua apiClient) để không gửi JWT của app sang Cloudinary
  const res = await axios.post<{ secure_url?: string }>(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`,
    form,
    { onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)) },
  );
  if (!res.data.secure_url) throw new Error("Cloudinary không trả về địa chỉ video");
  return res.data.secure_url;
}

export type UploadOutcome = { ok: true; url: string } | { ok: false; reason: string };

/**
 * Sau khi đã nộp attempt (có attemptId): lấy chữ ký → tải lên → gắn url vào attempt.
 * Không ném lỗi: kết quả test đã được lưu, video là bằng chứng bổ sung; thất bại thì trả reason để UI cho thử lại
 * (giữ nguyên clip trong bộ nhớ, gọi lại với cùng clip).
 */
export async function uploadAndAttach(
  kind: AssessmentKind,
  sessionId: number,
  attemptId: number,
  clip: RecordedClip,
  onProgress?: (percent: number) => void,
): Promise<UploadOutcome> {
  try {
    const sig = await recordingApi.signature(kind, sessionId);
    const url = await uploadClip(clip, sig, onProgress);
    await recordingApi.attachVideo(kind, sessionId, attemptId, url);
    return { ok: true, url };
  } catch (err) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return { ok: false, reason: msg ?? (err instanceof Error ? err.message : "Không tải được video") };
  }
}
