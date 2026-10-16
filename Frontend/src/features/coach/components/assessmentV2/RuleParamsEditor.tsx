import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { RuleParam } from "../../types";
import { SearchInput, StatusBadge, TextInput } from "../ui";
import { PARAM_GROUPS, describeParam } from "../../../level/levelLabels";
import type { RuleSetEdits } from "./ruleSetEdits";

interface Props {
  params: RuleParam[];
  edits: RuleSetEdits["params"];
  editable: boolean;
  onChange: (key: string, value: string | null) => void;
}

function display(p: RuleParam): string {
  return p.value != null ? String(p.value) : p.text ?? "";
}

/** Bảng tham số của rule set: nhóm theo tiền tố, tìm kiếm, sửa tại chỗ. Giá trị `COACHING_BENCHMARK` được đánh dấu cần Coach xác nhận. */
export function RuleParamsEditor({ params, edits, editable, onChange }: Props) {
  const [search, setSearch] = useState("");
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, RuleParam[]>();
    for (const p of params) {
      const info = describeParam(p.key);
      if (q && !p.key.toLowerCase().includes(q) && !info.title.toLowerCase().includes(q) && !(info.help ?? "").toLowerCase().includes(q) && !(p.sourceReference ?? "").toLowerCase().includes(q)) continue;
      const g = info.group;
      map.set(g, [...(map.get(g) ?? []), p]);
    }
    const order = (g: string) => { const i = (PARAM_GROUPS as readonly string[]).indexOf(g); return i < 0 ? 99 : i; };
    return [...map.entries()].sort(([a], [b]) => order(a) - order(b));
  }, [params, search]);

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} label="Tìm tham số" placeholder="Tìm theo tên gọi, mã hoặc ghi chú..." className="mb-4 w-full sm:w-80" />
      {groups.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-secondary">Không có tham số nào khớp.</p>
      ) : (
        <div className="space-y-5">
          {groups.map(([group, rows]) => (
            <details key={group} className="group" open={search.trim() !== "" || groups[0]?.[0] === group || rows.some((p) => edits[p.key] !== undefined) || undefined}>
              <summary className="mb-1.5 flex cursor-pointer list-none items-center gap-2 text-[11px] font-black uppercase tracking-wider text-text-secondary hover:text-text-primary">
                <ChevronRight size={14} className="transition-transform group-open:rotate-90" aria-hidden />
                {group}
                <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal">{rows.length} tham số</span>
                {rows.some((p) => edits[p.key] !== undefined) && <StatusBadge tone="accent">Có chỉnh sửa</StatusBadge>}
              </summary>
              <div className="overflow-x-auto rounded-2xl border border-border/70">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Tham số nhóm {group}</caption>
                  <thead>
                    <tr className="border-b border-border bg-surface-sunken/50 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                      <th scope="col" className="px-3 py-2">Tham số</th>
                      <th scope="col" className="w-40 px-3 py-2">Giá trị</th>
                      <th scope="col" className="hidden px-3 py-2 md:table-cell">Giải thích / nguồn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => {
                      const dirty = edits[p.key] !== undefined;
                      return (
                        <tr key={p.key} className={cn("border-b border-border/50 last:border-0", dirty && "bg-accent-soft/40")}>
                          <th scope="row" className="px-3 py-2 text-left">
                            <span className="block text-[13px] font-bold text-text-primary">{describeParam(p.key).title}</span>
                            <span className="block font-mono text-[10px] font-normal text-text-secondary/80">{p.key}</span>
                          </th>
                          <td className="px-3 py-1.5">
                            {editable ? (
                              <TextInput
                                aria-label={`Giá trị ${p.key}`}
                                type={p.value != null ? "number" : "text"}
                                step="any"
                                className="h-9 w-36 text-right tabular-nums"
                                value={dirty ? edits[p.key] : display(p)}
                                onChange={(e) => onChange(p.key, e.target.value === display(p) ? null : e.target.value)}
                              />
                            ) : (
                              <span className="block text-right font-bold tabular-nums">{display(p)}</span>
                            )}
                            {describeParam(p.key).unit && <span className="mt-0.5 block text-right text-[10px] font-semibold text-text-secondary">{describeParam(p.key).unit}</span>}
                          </td>
                          <td className="hidden px-3 py-2 md:table-cell">
                            <div className="flex flex-wrap items-center gap-2">
                              {p.sourceType === "COACHING_BENCHMARK" ? <StatusBadge tone="warning">Cần Coach xác nhận</StatusBadge> : <StatusBadge tone="neutral">Quy tắc sản phẩm</StatusBadge>}
                              {describeParam(p.key).help && <span className="basis-full text-[11px] text-text-primary/80">{describeParam(p.key).help}</span>}
                              {p.sourceReference && <span className="text-[11px] text-text-secondary">{p.sourceReference}</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
