import type { Tone } from "../../constants/labels";
import type { MovementPattern } from "../../types";

/** Badge tone per movement focus, so a week reads at a glance. */
export const FOCUS_TONE: Record<MovementPattern, Tone> = {
  PUSH: "accent",
  PULL: "info",
  LEGS: "success",
  CORE: "warning",
  SKILL: "critical",
  MOBILITY: "neutral",
};

/** Extract a human message from a service error (mock or axios). */
export function errorMessage(err: unknown, fallback = "Đã có lỗi xảy ra. Vui lòng thử lại."): string {
  if (typeof err === "object" && err !== null) {
    const res = (err as { response?: { data?: { message?: unknown } } }).response;
    if (typeof res?.data?.message === "string") return res.data.message;
    if (err instanceof Error && err.message) return err.message;
  }
  return fallback;
}

/** HTTP-like status from a service error, if any. */
export function errorStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const direct = (err as { status?: unknown }).status;
  if (typeof direct === "number") return direct;
  const res = (err as { response?: { status?: unknown } }).response;
  return typeof res?.status === "number" ? res.status : undefined;
}
