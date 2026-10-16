import type { useAttemptRecording } from "../assessment-recording/useAttemptRecording";
import type { NextStep, SubmitAttempt } from "./api";

export type Recording = ReturnType<typeof useAttemptRecording>;

/** Props chung của mọi bước đo (đếm rep, giữ tư thế, đo góc): hàm nộp được truyền vào để dùng cho cả Baseline lẫn đo định kỳ. */
export interface StepProps<P> {
  step: NextStep;
  /** Cách đo: ưu tiên metric của bước, nếu không có thì của bộ test. */
  metric?: string | null;
  submit: (req: SubmitAttempt) => Promise<P>;
  recording: Recording;
  onSubmitted: (progress: P) => void;
}
