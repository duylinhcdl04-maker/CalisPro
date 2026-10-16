import { ArrowRight, Bot, Sparkles } from "lucide-react";
import { ClayTileIcon } from "../ui/ClayTileIcon";
import type { AICoachInsight } from "../../types";

export function AICoachCard({ coach, onCtaClick }: { coach: AICoachInsight | null; onCtaClick?: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-sky-300/40 bg-gradient-to-br from-sky-500/10 via-surface to-cyan-500/10 p-6 sm:p-8 shadow-[0_16px_36px_-10px_rgba(14,165,233,0.12),inset_0_2px_3px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.03)] dark:border-sky-500/20">
      {/* Background Soft Glows */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-sky-400/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-cyan-400/15 blur-xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4 max-w-xl">
          <div className="shrink-0 mt-0.5">
            <ClayTileIcon icon={Bot} color="sky" size="md" animateHover={true} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-bold uppercase tracking-[.14em] text-sky-700 dark:text-sky-300 border border-sky-500/20 shadow-2xs">
              <Sparkles size={13} className="text-sky-600 dark:text-sky-400 animate-pulse" />
              <span>AI Coach Thông Minh</span>
            </div>

            {coach ? (
              <>
                <p className="mt-2.5 font-display text-lg font-bold text-text-primary">{coach.headline}</p>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">{coach.message}</p>
              </>
            ) : (
              <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">
                Hoàn thành thêm buổi tập để AI Coach có đủ dữ liệu đưa ra đề xuất tối ưu.
              </p>
            )}
          </div>
        </div>

        {coach && (
          <div className="shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={onCtaClick}
              className="clay-btn clay-btn-sky text-xs sm:text-sm gap-2"
            >
              <span>{coach.ctaLabel}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
