import { useCallback, useEffect, useRef, useState } from "react";
import { cameraService } from "../ai-motion/mediapipe/cameraService";
import { AttemptRecorder, recordingSupported, type RecordedClip } from "./recorder";
import { recordingApi, uploadAndAttach, type AssessmentKind } from "./recordingApi";

export type ConsentState = "UNKNOWN" | "GRANTED" | "DECLINED";
export type UploadState = "IDLE" | "UPLOADING" | "DONE" | "FAILED";

/**
 * Ghi hình một bài test L4 theo luồng: đồng ý → bắt đầu bài (start) → xong bài (finish, lấy clip) → nộp attempt lấy attemptId → upload(attemptId).
 * Clip giữ trong bộ nhớ tới khi upload thành công để thử lại được; không có đồng ý thì start() không làm gì (test vẫn chạy bình thường).
 */
export function useAttemptRecording(kind: AssessmentKind, sessionId: number | null) {
  const recorderRef = useRef<AttemptRecorder | null>(null);
  const clipRef = useRef<RecordedClip | null>(null);
  const [consent, setConsent] = useState<ConsentState>("UNKNOWN");
  const [recording, setRecording] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("IDLE");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const supported = recordingSupported();

  // Đồng ý ghi hình được lưu theo PHIÊN: sang phiên mới phải hỏi lại
  useEffect(() => { setConsent("UNKNOWN"); }, [sessionId]);

  /** Lưu lựa chọn lên backend (bắt buộc trước khi lấy chữ ký/gắn video). Trả true nếu backend ghi nhận. */
  const answerConsent = useCallback(async (granted: boolean): Promise<boolean> => {
    if (sessionId == null) return false;
    try {
      await recordingApi.setConsent(kind, sessionId, granted);
      setConsent(granted ? "GRANTED" : "DECLINED");
      setError(null);
      return true;
    } catch (e) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Không lưu được lựa chọn ghi hình");
      return false;
    }
  }, [kind, sessionId]);

  /** Gọi ngay khi bắt đầu một bài (camera đã chạy). Trả true nếu đang ghi. */
  const start = useCallback((maxSeconds?: number): boolean => {
    if (consent !== "GRANTED" || !supported) return false;
    const stream = cameraService.getStream();
    if (!stream) return false;
    recorderRef.current?.discard();
    clipRef.current = null;
    setUploadState("IDLE");
    setProgress(0);
    try {
      const rec = new AttemptRecorder({ maxSeconds });
      rec.start(stream);
      recorderRef.current = rec;
      setRecording(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không ghi hình được");
      return false;
    }
  }, [consent, supported]);

  /** Gọi khi kết thúc bài; clip được giữ để upload sau khi có attemptId. */
  const finish = useCallback(async (): Promise<RecordedClip | null> => {
    const rec = recorderRef.current;
    if (!rec) return null;
    const clip = await rec.stop();
    recorderRef.current = null;
    clipRef.current = clip;
    setRecording(false);
    return clip;
  }, []);

  /** Gọi sau khi nộp attempt (có attemptId). Gọi lại được nếu thất bại. */
  const upload = useCallback(async (attemptId: number): Promise<boolean> => {
    const clip = clipRef.current;
    if (!clip || sessionId == null) return false;
    setUploadState("UPLOADING");
    setProgress(0);
    const out = await uploadAndAttach(kind, sessionId, attemptId, clip, setProgress);
    if (out.ok) {
      clipRef.current = null;
      setUploadState("DONE");
      setError(null);
      return true;
    }
    setUploadState("FAILED");
    setError(out.reason);
    return false;
  }, [kind, sessionId]);

  /** Người dùng bỏ lần thử (không nộp kết quả). */
  const discard = useCallback(() => {
    recorderRef.current?.discard();
    recorderRef.current = null;
    clipRef.current = null;
    setRecording(false);
    setUploadState("IDLE");
  }, []);

  useEffect(() => () => recorderRef.current?.discard(), []);

  return { supported, consent, recording, uploadState, progress, error, hasClip: () => clipRef.current !== null, answerConsent, start, finish, upload, discard };
}
