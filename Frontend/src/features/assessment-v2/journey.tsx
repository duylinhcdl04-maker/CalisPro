import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Circle, Clock, Lock } from "lucide-react";
import { apiClient } from "../../lib/api/client";

/**
 * Hành trình đánh giá V2 (sàng lọc an toàn → khảo sát → Baseline → đo định kỳ): chỉ NHẮC, không chặn trang nào.
 * Backend chỉ có endpoint khi app.assessment-v2.enabled=true; khi tắt, truy vấn lỗi và mọi thứ ở đây tự ẩn.
 */

export interface JourneyStep { key: "SAFETY" | "INITIAL" | "BASELINE" | "PERIODIC"; status: "DONE" | "TODO" | "LOCKED" | "WAIT" | "DEFERRED"; path: string; detail: string | null }
export interface Journey { steps: JourneyStep[]; nextKey: string | null; nextPath: string | null; complete: boolean }

const LABEL: Record<JourneyStep["key"], string> = {
  SAFETY: "Sàng lọc an toàn",
  INITIAL: "Khảo sát năng lực",
  BASELINE: "Đo thực hành",
  PERIODIC: "Đo định kỳ",
};

export const CTA: Record<string, string> = {
  SAFETY: "Làm sàng lọc an toàn",
  INITIAL: "Làm khảo sát năng lực",
  BASELINE: "Bắt đầu đo thực hành",
  PERIODIC: "Đo lại level",
};

const HINT: Record<string, string> = {
  SAFETY: "Vài câu hỏi để biết bạn nên tập thế nào cho an toàn.",
  INITIAL: "Cho hệ thống biết bạn đang ở mức nào để xếp level tạm thời.",
  BASELINE: "Đo bằng camera để xác nhận level thật của bạn.",
  PERIODIC: "Đã đến lúc đo lại để cập nhật level và lộ trình.",
};

export function useAssessmentJourney() {
  return useQuery({
    queryKey: ["v2-journey"],
    queryFn: async () => (await apiClient.get<Journey>("/me/assessment-v2/journey")).data,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

function Icon({ status }: { status: JourneyStep["status"] }) {
  if (status === "DONE") return <CheckCircle2 size={16} className="text-emerald-500" aria-label="Đã xong" />;
  if (status === "TODO") return <Circle size={16} className="text-accent" aria-label="Cần làm" />;
  if (status === "WAIT" || status === "DEFERRED") return <Clock size={16} className="text-amber-500" aria-label={status === "DEFERRED" ? "Đo sau" : "Chờ đến hạn"} />;
  return <Lock size={14} className="text-text-secondary/60" aria-label="Chưa mở" />;
}

/** Thẻ nhắc đầu trang chủ: hiện khi còn bước cần làm. Đã xong hết và chưa tới hạn đo lại thì ẩn. */
export function JourneyCard() {
  const q = useAssessmentJourney();
  const j = q.data;
  if (!j || !j.nextKey || !j.nextPath) return null;
  const detail = j.steps.find((s) => s.key === j.nextKey)?.detail;
  const hint = detail === "ACKNOWLEDGE" ? "Bạn cần xác nhận đã đọc khuyến nghị an toàn." : detail === "RESCREEN" ? "Kết quả sàng lọc đã hết hạn, hãy làm lại." : HINT[j.nextKey];

  return (
    <section aria-label="Hành trình đánh giá" className="rounded-3xl border border-accent/30 bg-accent/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wide text-accent">Bước tiếp theo của bạn</div>
          <h2 className="font-display text-lg font-black text-text-primary">{LABEL[j.nextKey as JourneyStep["key"]]}</h2>
          <p className="mt-0.5 text-sm text-text-secondary">{hint}</p>
        </div>
        <Link to={j.nextPath} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:opacity-90">
          {CTA[j.nextKey]}<ArrowRight size={15} aria-hidden />
        </Link>
      </div>
      <ol className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-text-secondary">
        {j.steps.map((s) => (
          <li key={s.key} className={`flex items-center gap-1.5 ${s.key === j.nextKey ? "text-text-primary" : ""}`}>
            <Icon status={s.status} />{LABEL[s.key]}{s.status === "DEFERRED" ? " (đo sau)" : ""}
          </li>
        ))}
      </ol>
    </section>
  );
}
