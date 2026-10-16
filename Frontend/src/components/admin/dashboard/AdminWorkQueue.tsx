import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, Dumbbell, GitPullRequestArrow, CheckCircle2, ClipboardCheck, Layers, Loader2, ScrollText, SlidersHorizontal, UserCheck, type LucideIcon } from "lucide-react";
import { workQueueApi, WORK_QUEUE_KEY, waitingText } from "../../../features/notifications/api";

const ICON: Record<string, LucideIcon> = {
  LEVEL_ENGINE: Layers,
  RULESET_V2: ScrollText,
  MOTION_RULE: SlidersHorizontal,
  PROGRAM_TEMPLATE: BookOpen,
  ASSESSMENT_TEMPLATE: ClipboardCheck,
  COACH_APPLICATION: UserCheck,
  EXERCISE_DRAFT: Dumbbell,
  EXERCISE_REVISION: GitPullRequestArrow,
};

/** Trang danh sách đầy đủ của từng nhóm (cho dòng "Còn N mục nữa"). */
const LIST_PAGE: Record<string, string> = {
  LEVEL_ENGINE: "/admin/level-engine",
  RULESET_V2: "/admin/assessment-rule-sets",
  MOTION_RULE: "/admin/ai",
  PROGRAM_TEMPLATE: "/admin/workout-plans",
  ASSESSMENT_TEMPLATE: "/admin/assessments",
  COACH_APPLICATION: "/admin/coaches",
  EXERCISE_DRAFT: "/admin/exercises",
  EXERCISE_REVISION: "/admin/exercises",
};

/** Hook dùng chung (dashboard và chuông thông báo): làm mới ngay khi có thông báo mới (khoá nằm dưới "notifications"). */
export function useAdminWorkQueue() {
  return useQuery({ queryKey: WORK_QUEUE_KEY, queryFn: workQueueApi.get, retry: false, refetchOnWindowFocus: true, staleTime: 15_000 });
}

/**
 * Hàng chờ việc của Admin ở đầu Bảng điều khiển: những gì đang chờ Admin duyệt hoặc xử lý, nhóm theo loại, việc chờ lâu (từ 2 ngày) được đánh dấu gấp.
 * Dữ liệu tính trực tiếp từ trạng thái hiện tại nên luôn đúng, không phụ thuộc việc có bỏ lỡ thông báo hay không.
 */
export function AdminWorkQueue() {
  const q = useAdminWorkQueue();

  return (
    <section aria-labelledby="work-queue-title" className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="work-queue-title" className="text-base font-black text-text-primary sm:text-lg">Việc cần xử lý</h2>
          <p className="text-xs text-text-secondary">Những mục đang chờ bạn duyệt hoặc xử lý, việc chờ lâu nhất xếp trước.</p>
        </div>
        {q.data && q.data.total > 0 && (
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="rounded-full bg-accent-soft px-3 py-1 text-accent-strong">{q.data.total} mục chờ</span>
            {q.data.urgent > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-3 py-1 text-rose-600 dark:text-rose-400">
                <AlertTriangle size={12} aria-hidden /> {q.data.urgent} mục gấp
              </span>
            )}
          </div>
        )}
      </header>

      {q.isLoading && <p className="flex items-center gap-2 py-6 text-xs text-text-secondary"><Loader2 size={14} className="animate-spin" aria-hidden /> Đang tải danh sách việc...</p>}
      {q.isError && <p className="rounded-xl border border-border bg-background p-3 text-xs text-text-secondary">Không tải được danh sách việc cần xử lý. Thử tải lại trang.</p>}

      {q.data && q.data.total === 0 && (
        <p className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={18} aria-hidden /> Không có việc nào đang chờ. Mọi đề xuất của Coach đã được xử lý.
        </p>
      )}

      {q.data && q.data.total > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {q.data.groups.map((g) => {
            const Icon = ICON[g.key] ?? ClipboardCheck;
            return (
              <article key={g.key} className={`rounded-2xl border p-4 ${g.urgentCount > 0 ? "border-rose-500/30 bg-rose-500/[0.04]" : "border-border bg-background"}`}>
                <header className="mb-3 flex items-start gap-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${g.urgentCount > 0 ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" : "bg-accent-soft text-accent-strong"}`}><Icon size={17} aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="flex flex-wrap items-center gap-2 text-sm font-black text-text-primary">
                      {g.label}
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-black tabular-nums text-text-secondary ring-1 ring-border">{g.count}</span>
                      {g.urgentCount > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">{g.urgentCount} gấp</span>}
                    </h3>
                    <p className="text-[11px] text-text-secondary">{g.hint}</p>
                  </div>
                </header>
                <ul className="divide-y divide-border/60">
                  {g.items.slice(0, 4).map((it) => (
                    <li key={it.id}>
                      <Link to={it.href} className="group flex items-center gap-3 rounded-lg py-2 pr-1 transition-colors hover:bg-accent-soft/40">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold text-text-primary group-hover:text-accent-strong">{it.title}</span>
                          <span className="block truncate text-[11px] text-text-secondary">{it.subtitle}</span>
                        </span>
                        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${it.urgent ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" : "bg-surface text-text-secondary"}`}>{waitingText(it.since)}</span>
                        <span className="shrink-0 text-[11px] font-extrabold text-accent-strong opacity-0 transition-opacity group-hover:opacity-100">Xem xét</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {g.count > 4 && (
                  <Link to={LIST_PAGE[g.key] ?? g.items[0].href} className="mt-2 inline-block text-[11px] font-bold text-accent-strong hover:underline">
                    Còn {g.count - 4} mục nữa trong nhóm này
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
