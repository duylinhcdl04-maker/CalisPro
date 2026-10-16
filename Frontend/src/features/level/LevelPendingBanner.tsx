import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Dumbbell } from "lucide-react";
import { levelApi } from "./api";
import { CTA, useAssessmentJourney } from "../assessment-v2/journey";

/**
 * Nhắc người dùng CHƯA được phân level (đã bỏ qua bài test đầu vào, hoặc chưa làm): làm bài để nhận level và lộ trình đúng trình độ,
 * trong lúc chờ vẫn tự chọn bài tập trong Thư viện. Chỉ hiện khi backend trả level rỗng; mọi trường hợp khác (đang tải, lỗi, đã có level) thì ẩn.
 */
export function LevelPendingBanner({ className = "" }: { className?: string }) {
  const state = useQuery({ queryKey: ["fitness-state"], queryFn: levelApi.state, retry: false });
  // V2 bật: bước kế tiếp của hành trình (sàng lọc, khảo sát, đo thực hành); V2 tắt: bài test đầu vào v1
  const journey = useAssessmentJourney();
  const next = journey.data?.nextKey && journey.data.nextPath ? { path: journey.data.nextPath, label: CTA[journey.data.nextKey] ?? "Làm bài đánh giá" } : null;
  if (!state.isSuccess || state.data.level) return null;
  return (
    <section role="status" aria-label="Chưa được phân level" className={`rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-black text-text-primary">Bạn chưa được phân level</h2>
          <p className="mt-0.5 max-w-xl text-sm text-text-secondary">
            Làm bài đánh giá đầu vào (khoảng vài phút) để hệ thống xếp level và gợi ý chu kỳ tập đúng trình độ của bạn.
            Trong lúc chờ, bạn vẫn có thể tự chọn bài tập trong Thư viện.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={next?.path ?? "/onboarding"} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:opacity-90">
            <ClipboardCheck size={15} aria-hidden /> {next?.label ?? "Làm bài đánh giá"}
          </Link>
          <Link to="/exercises" className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-text-primary transition hover:border-accent">
            <Dumbbell size={15} aria-hidden /> Thư viện bài tập
          </Link>
        </div>
      </div>
    </section>
  );
}
