import { isAxiosError } from "axios";

/** "muscle-up" -> "Muscle up"; "shoulder-flexion-test" -> "Shoulder flexion test". */
export function exerciseLabel(code: string): string {
  const text = code.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Số ngày còn lại tới hạn (âm khi đã quá hạn), làm tròn lên. */
export function daysLeft(iso: string, now = Date.now()): number {
  return Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
}

/** Ưu tiên thông điệp backend trả về (ApiError.message), sau đó tới lỗi chung. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === "string" && message) return message.replace(/^[A-Z_]{4,}:\s*/, "");
  }
  if (error instanceof Error && error.message) return error.message.replace(/^[A-Z_]{4,}:\s*/, "");
  return fallback;
}

/** Thứ tự hiển thị các chỉ số của một attempt. */
export const METRIC_ORDER = ["VALID_REPS", "TOTAL_REPS", "HOLD_SEC", "ANGLE_DEG", "FORM_SCORE", "ROM_SCORE", "MAJOR_VIOLATIONS", "POSE_CONFIDENCE", "VISIBILITY", "TRACKED_RATIO"];

export function formatMetric(key: string, value: number): string {
  if (["POSE_CONFIDENCE", "VISIBILITY", "TRACKED_RATIO"].includes(key)) return `${Math.round(value * 100)}%`;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
