import { format, formatDistanceToNowStrict, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";
import type { Tone } from "../constants/labels";

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "Chưa có";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff >= 0 && diff < 60_000) return "Vừa xong";
  return formatDistanceToNowStrict(d, { addSuffix: true, locale: vi });
}

/** "Hôm nay", "Hôm qua" or "12/09". */
export function formatDay(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Hôm nay";
  if (isYesterday(d)) return "Hôm qua";
  return format(d, "dd/MM", { locale: vi });
}

export const formatDate = (iso: string, pattern = "dd/MM/yyyy") => format(new Date(iso), pattern, { locale: vi });
export const formatTime = (iso: string) => format(new Date(iso), "HH:mm");
export const formatDateTime = (iso: string) => format(new Date(iso), "HH:mm, dd/MM/yyyy", { locale: vi });

/** 222 -> "03:42" */
export function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = Math.round(total % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatSigned(n: number, digits = 0): string {
  const v = digits ? n.toFixed(digits) : String(Math.round(n));
  return n > 0 ? `+${v}` : v;
}

/** Score thresholds used consistently everywhere a 0-100 score is shown. */
export function scoreTone(score: number | null | undefined): Tone {
  if (score === null || score === undefined) return "neutral";
  if (score >= 80) return "success";
  if (score >= 65) return "warning";
  return "critical";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[parts.length - 2]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}
