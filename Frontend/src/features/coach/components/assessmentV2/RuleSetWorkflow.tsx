import { Check, Clock, Pencil, Rocket } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { RuleSetStatus } from "../../types";

interface Step {
  key: Exclude<RuleSetStatus, "ARCHIVED">;
  title: string;
  hint: string;
  icon: typeof Pencil;
}

const STEPS: Step[] = [
  { key: "DRAFT", title: "Soạn bản nháp", hint: "Bạn chỉnh tham số và ngưỡng", icon: Pencil },
  { key: "PENDING_REVIEW", title: "Admin duyệt", hint: "Bản bị khóa trong lúc chờ", icon: Clock },
  { key: "ACTIVE", title: "Áp dụng", hint: "Dùng cho mọi lượt đánh giá mới", icon: Rocket },
];

const ORDER: Record<RuleSetStatus, number> = { DRAFT: 0, PENDING_REVIEW: 1, ACTIVE: 2, ARCHIVED: 3 };

/** Quy trình của một phiên bản bộ quy tắc: Coach soạn, Admin duyệt, rồi áp dụng. Cho biết đang ở bước nào và ai là người làm bước tiếp theo. */
export function RuleSetWorkflow({ status }: { status: RuleSetStatus }) {
  if (status === "ARCHIVED") {
    return (
      <div role="status" className="mb-5 rounded-2xl border border-border bg-surface-sunken/60 px-4 py-3 text-sm text-text-secondary">
        Phiên bản này đã được thay thế bởi một phiên bản mới hơn và chỉ giữ lại để tra cứu. Muốn dùng lại, hãy tạo bản nháp từ bản này.
      </div>
    );
  }
  const current = ORDER[status];
  return (
    <ol aria-label="Quy trình duyệt bộ quy tắc" className="mb-5 grid gap-2 sm:grid-cols-3">
      {STEPS.map((s, i) => {
        const done = i < current || (status === "ACTIVE" && i === 2);
        const active = i === current && !done;
        const Icon = s.icon;
        return (
          <li
            key={s.key}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
              active && "border-accent/40 bg-accent-soft/50",
              done && "border-emerald-500/30 bg-emerald-500/10",
              !active && !done && "border-border bg-surface-sunken/40",
            )}
          >
            <span
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
                active && "bg-accent text-white",
                done && "bg-emerald-500 text-white",
                !active && !done && "bg-surface text-text-secondary",
              )}
              aria-hidden
            >
              {done ? <Check size={16} /> : <Icon size={15} />}
            </span>
            <span className="min-w-0">
              <span className={cn("block text-sm font-extrabold", active || done ? "text-text-primary" : "text-text-secondary")}>
                {i + 1}. {s.title}
              </span>
              <span className="block truncate text-[11px] text-text-secondary">{s.hint}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
