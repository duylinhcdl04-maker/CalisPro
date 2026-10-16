import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowUp, Dumbbell, Plus, Search, Trash2 } from "lucide-react";
import { useExercisesQuery } from "../../features/exercises/hooks";
import { errorMessage, useRecommendedSet, useSaveSelfPlan, useSelfPlan, type SelfPlanInput } from "../../features/plan-choice/api";
import { RecommendedBadge } from "../../features/plan-choice/RecommendedBadge";

interface Row {
  exerciseId: number;
  name: string;
  thumbnailUrl: string | null;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  holdSec: number | null;
}

const num = (v: string): number | null => (v.trim() === "" ? null : Number(v));

function toInput(r: Row): SelfPlanInput {
  return { exerciseId: r.exerciseId, sets: r.sets, repMin: r.repMin, repMax: r.repMax, holdSec: r.holdSec };
}

/**
 * Danh sách bài tập TỰ TẠO của học viên (giống danh sách bài yêu thích để tập). Chọn bài có sẵn trên hệ thống, đặt số hiệp và số lần.
 * Danh sách này không dùng để nâng hoặc hạ level: muốn đổi level phải tập theo giáo án do hệ thống đưa ra.
 */
export default function MyExerciseListPage() {
  const saved = useSelfPlan();
  const save = useSaveSelfPlan();
  const library = useExercisesQuery();
  const recommended = useRecommendedSet();
  const [rows, setRows] = useState<Row[]>([]);
  const [dirty, setDirty] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (saved.data && !dirty) setRows(saved.data.items.map((i) => ({ exerciseId: i.exerciseId, name: i.name, thumbnailUrl: i.thumbnailUrl, sets: i.sets, repMin: i.repMin, repMax: i.repMax, holdSec: i.holdSec })));
  }, [saved.data, dirty]);

  const chosen = useMemo(() => new Set(rows.map((r) => String(r.exerciseId))), [rows]);
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (library.data ?? []).filter((e) => !chosen.has(e.id) && (q === "" || e.name.toLowerCase().includes(q) || e.primaryMuscles.some((m) => m.toLowerCase().includes(q)))).slice(0, 12);
  }, [library.data, chosen, query]);

  function change(next: Row[]) { setRows(next); setDirty(true); }
  function patch(i: number, p: Partial<Row>) { change(rows.map((r, idx) => (idx === i ? { ...r, ...p } : r))); }
  function move(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    change(next);
  }
  function add(id: string, name: string, thumb?: string) {
    change([...rows, { exerciseId: Number(id), name, thumbnailUrl: thumb ?? null, sets: 3, repMin: 8, repMax: 12, holdSec: null }]);
  }

  function submit() {
    save.mutate(rows.map(toInput), {
      onSuccess: () => { setDirty(false); toast.success("Đã lưu danh sách bài tập của bạn"); },
      onError: (e) => toast.error(errorMessage(e, "Không lưu được danh sách. Thử lại sau.")),
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-5 sm:p-8">
      <Link to="/plan-choice" className="inline-flex items-center gap-1 text-sm font-bold text-text-secondary hover:text-accent"><ArrowLeft size={15} aria-hidden />Quay lại chọn cách tập</Link>
      <header>
        <h1 className="font-display text-2xl font-black tracking-tight text-text-primary sm:text-3xl">Danh sách bài tập của tôi</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Tự chọn các bài tập có sẵn để tập. Danh sách này <b className="text-text-primary">không dùng để nâng hoặc hạ level</b>. Muốn đổi level, hãy tập theo giáo án của hệ thống.
        </p>
      </header>

      <section aria-label="Bài trong danh sách" className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-black text-text-primary">Bài đã chọn ({rows.length})</h2>
        {saved.isLoading && <p className="mt-2 text-sm text-text-secondary">Đang tải...</p>}
        {!saved.isLoading && rows.length === 0 && <p className="mt-2 text-sm text-text-secondary">Chưa có bài nào. Thêm bài từ phần bên dưới.</p>}
        <ul className="mt-3 space-y-2">
          {rows.map((r, i) => (
            <li key={r.exerciseId} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-3">
              <span className="w-5 text-center text-xs font-black text-text-secondary">{i + 1}</span>
              <span className="min-w-0 flex-1 basis-40 truncate text-sm font-bold text-text-primary">{r.name}</span>
              <label className="text-xs text-text-secondary">Hiệp
                <input type="number" min={1} max={10} value={r.sets} onChange={(e) => patch(i, { sets: Math.max(1, Number(e.target.value) || 1) })}
                  className="ml-1 w-14 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text-primary" />
              </label>
              {r.holdSec != null ? (
                <label className="text-xs text-text-secondary">Giữ (giây)
                  <input type="number" min={5} max={600} value={r.holdSec} onChange={(e) => patch(i, { holdSec: num(e.target.value) })}
                    className="ml-1 w-16 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text-primary" />
                </label>
              ) : (
                <label className="text-xs text-text-secondary">Số lần
                  <input type="number" min={1} max={100} value={r.repMin ?? ""} onChange={(e) => patch(i, { repMin: num(e.target.value) })}
                    className="ml-1 w-14 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text-primary" />
                  <span className="mx-1">-</span>
                  <input type="number" min={1} max={100} value={r.repMax ?? ""} onChange={(e) => patch(i, { repMax: num(e.target.value) })}
                    className="w-14 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text-primary" aria-label="Số lần tối đa" />
                </label>
              )}
              <button type="button" onClick={() => patch(i, r.holdSec != null ? { holdSec: null, repMin: 8, repMax: 12 } : { holdSec: 30, repMin: null, repMax: null })}
                className="text-xs font-bold text-accent underline">{r.holdSec != null ? "Tính theo số lần" : "Tính theo giây giữ"}</button>
              <span className="ml-auto flex items-center gap-1">
                <button type="button" aria-label="Đưa lên" disabled={i === 0} onClick={() => move(i, -1)} className="rounded-lg p-1.5 text-text-secondary hover:text-accent disabled:opacity-30"><ArrowUp size={15} /></button>
                <button type="button" aria-label="Đưa xuống" disabled={i === rows.length - 1} onClick={() => move(i, 1)} className="rounded-lg p-1.5 text-text-secondary hover:text-accent disabled:opacity-30"><ArrowDown size={15} /></button>
                <button type="button" aria-label={`Bỏ ${r.name}`} onClick={() => change(rows.filter((_, idx) => idx !== i))} className="rounded-lg p-1.5 text-text-secondary hover:text-red-500"><Trash2 size={15} /></button>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" disabled={!dirty || save.isPending} onClick={submit} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:opacity-90 disabled:opacity-50">
            {save.isPending ? "Đang lưu..." : "Lưu danh sách và tập theo danh sách này"}
          </button>
          {dirty && <span className="text-xs text-amber-500">Có thay đổi chưa lưu</span>}
        </div>
      </section>

      <section aria-label="Thêm bài" className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-black text-text-primary">Thêm bài từ thư viện</h2>
        <label className="relative mt-3 block">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên bài hoặc nhóm cơ" aria-label="Tìm bài tập"
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-text-primary" />
        </label>
        {library.isLoading && <p className="mt-3 text-sm text-text-secondary">Đang tải thư viện...</p>}
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {candidates.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => add(e.id, e.name, e.imageUrl)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-2.5 text-left transition hover:border-accent">
                {e.imageUrl
                  ? <img src={e.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" loading="lazy" />
                  : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent"><Dumbbell size={16} aria-hidden /></span>}
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-text-primary">{e.name}</span><span className="block truncate text-[11px] text-text-secondary">{e.primaryMuscles.join(", ")}</span>{recommended.has(e.id) && <RecommendedBadge className="mt-1" />}</span>
                <Plus size={16} className="shrink-0 text-accent" aria-label="Thêm" />
              </button>
            </li>
          ))}
        </ul>
        {library.isSuccess && candidates.length === 0 && <p className="mt-3 text-sm text-text-secondary">Không có bài nào phù hợp.</p>}
      </section>
    </div>
  );
}
