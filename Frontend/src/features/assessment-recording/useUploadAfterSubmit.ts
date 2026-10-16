import { useCallback, useEffect, useState } from "react";
import type { useAttemptRecording } from "./useAttemptRecording";

type Recording = ReturnType<typeof useAttemptRecording>;

/**
 * Tải video lên SAU khi attempt đã được lưu (có attemptId). Backend chỉ nhận video khi phiên còn mở hoặc đã có yêu cầu xác nhận L4 đang chờ Coach;
 * ngoài ra video vô ích nên bỏ clip. Lỗi tải lên không ảnh hưởng kết quả đo: hiện "Thử lại" (clip vẫn nằm trong bộ nhớ).
 */
export function useUploadAfterSubmit(recording: Recording) {
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [uploadedFor, setUploadedFor] = useState<number | null>(null);

  const discard = recording.discard;
  const noteSubmitted = useCallback((id: number | null, accepted: boolean) => {
    setAttemptId(id);
    setAllowed(accepted);
    if (!accepted) discard();
  }, [discard]);

  const reset = useCallback(() => { setAttemptId(null); setAllowed(false); setUploadedFor(null); }, []);

  const pending = allowed && attemptId !== null && attemptId !== uploadedFor && recording.hasClip();

  const upload = recording.upload;
  const retry = useCallback(async () => {
    if (attemptId === null) return;
    if (await upload(attemptId)) setUploadedFor(attemptId);
  }, [attemptId, upload]);

  // tự tải ngay khi có attemptId và clip; lỗi thì chờ người dùng bấm Thử lại
  useEffect(() => {
    if (pending && recording.uploadState === "IDLE") void retry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, recording.uploadState]);

  return { pending, retry, noteSubmitted, reset };
}
