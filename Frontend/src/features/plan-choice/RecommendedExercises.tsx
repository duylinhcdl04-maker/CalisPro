import { Link } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import { competencyName } from "../level/levelLabels";
import { useExerciseRecommendations } from "./api";

const SOURCE_LABEL = { PLAN: "Theo giáo án của bạn", GOAL: "Theo mục tiêu của bạn", FOUNDATION: "Cho người mới", WEAK_AREAS: "Cải thiện phần yếu" } as const;

/**
 * Gợi ý bài tập theo trạng thái người dùng: đang tập giáo án hệ thống thì lấy từ chu kỳ hiện tại; đã khảo sát nhưng không theo giáo án hệ thống thì theo
 * mục tiêu đã chọn; chưa khảo sát thì bài nền tảng. Ẩn khi đang tải, lỗi hoặc không có gợi ý.
 */
export function RecommendedExercises({ className = "" }: { className?: string }) {
  const rec = useExerciseRecommendations();
  if (!rec.isSuccess || rec.data.items.length === 0) return null;
  const { source, title, items } = rec.data;
  return (
    <section aria-label="Gợi ý bài tập" className={`rounded-3xl border border-border bg-surface p-5 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-black text-text-primary">Gợi ý bài tập cho bạn</h2>
        <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-black text-accent">{SOURCE_LABEL[source]}</span>
      </div>
      <p className="mt-0.5 text-xs text-text-secondary">{title}</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((e) => (
          <li key={e.exerciseId}>
            <Link to={`/exercises/${e.exerciseId}`} className="group flex h-full items-center gap-3 rounded-2xl border border-border bg-background p-3 transition hover:border-accent">
              {e.thumbnailUrl
                ? <img src={e.thumbnailUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" loading="lazy" />
                : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><Dumbbell size={18} aria-hidden /></span>}
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-text-primary group-hover:text-accent">{e.name}</span>
                {e.competency && <span className="block text-[11px] text-text-secondary">{competencyName(e.competency)}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
