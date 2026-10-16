import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { motionRulesApi, errorMessage, type ProfileSummaryDto } from "../../motion-rules/api";
import { MotionRuleEnginePanel } from "../../motion-rules/components/MotionRuleEnginePanel";
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Panel } from "../components/ui";

/**
 * Coach soạn rule chấm form (Motion Rule Engine) cho từng bài tập: cấu hình đếm rep/giữ, rule lỗi kỹ thuật, câu phản hồi,
 * chạy thử bằng Rule Tester rồi gửi duyệt. Admin là người duyệt và xuất bản (Coach không thấy nút xuất bản; backend cũng chặn).
 * Dùng API thật (không có nhánh mock).
 */
export default function CoachMotionRulesPage() {
  const [profiles, setProfiles] = useState<ProfileSummaryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  // ?exercise=ID (từ cảnh báo thiếu cấu hình đo trong form động tác): chọn đúng bài và mở tab Cấu hình profile
  const [params] = useSearchParams();
  const targetExercise = Number(params.get("exercise")) || null;

  useEffect(() => {
    let alive = true;
    motionRulesApi.profiles()
      .then((p) => { if (alive) { setProfiles(p); setSelected((cur) => cur ?? p.find((x) => x.exerciseId === targetExercise)?.id ?? p[0]?.id ?? null); } })
      .catch((e) => { if (alive) setError(errorMessage(e, "Không tải được danh sách bài tập.")); });
    return () => { alive = false; };
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (profiles ?? []).filter((p) => !q || p.exerciseName.toLowerCase().includes(q) || (p.profileName ?? "").toLowerCase().includes(q));
  }, [profiles, query]);

  return (
    <div>
      <PageHeader
        title="Rule chấm form"
        description="Soạn cách hệ thống đếm rep và chấm kỹ thuật cho từng bài tập. Bạn soạn, chạy thử và gửi duyệt; Admin duyệt và xuất bản thì rule mới chạy thật."
      />

      {error ? (
        <Panel><ErrorState title="Không tải được dữ liệu" description={error} /></Panel>
      ) : profiles === null ? (
        <Panel><ListSkeleton rows={6} /></Panel>
      ) : profiles.length === 0 ? (
        <Panel><EmptyState icon={SlidersHorizontal} title="Chưa có bài tập nào có profile AI" description="Admin cần tạo profile AI cho bài tập trước." /></Panel>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Panel title="Bài tập" icon={SlidersHorizontal} bodyClassName="p-0 sm:p-0">
            <div className="border-b border-border p-3">
              <label className="relative block">
                <span className="sr-only">Tìm bài tập</span>
                <Search size={14} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm bài tập..."
                  className="w-full rounded-xl border border-border bg-background py-2 pl-8 pr-3 text-sm text-text-primary"
                />
              </label>
            </div>
            <ul className="max-h-[70vh] overflow-y-auto py-1" aria-label="Danh sách bài tập">
              {shown.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(p.id)}
                    aria-current={selected === p.id}
                    className={`flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-surface-sunken/60 ${selected === p.id ? "bg-accent-soft/60 font-extrabold text-text-primary" : "text-text-primary"}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{p.exerciseName}</span>
                      <span className="block text-[11px] font-medium text-text-secondary">{p.movementType === "HOLD" ? "Giữ tư thế" : p.movementType === "REPS" ? "Đếm rep" : "Chưa cấu hình"}</span>
                    </span>
                    <span className="flex shrink-0 gap-1 text-[10px] font-bold">
                      {p.draftRules > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-600">{p.draftRules} nháp</span>}
                      {p.publishedRules > 0 && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-600">{p.publishedRules} chạy</span>}
                    </span>
                  </button>
                </li>
              ))}
              {shown.length === 0 && <li className="px-4 py-6 text-center text-sm text-text-secondary">Không có bài nào khớp.</li>}
            </ul>
          </Panel>

          <div className="min-w-0">
            {selected !== null && (
              <MotionRuleEnginePanel
                key={selected}
                initialView={targetExercise && profiles.find((p) => p.id === selected)?.exerciseId === targetExercise ? "PROFILE" : "RULES"}
                profileId={selected}
                allProfiles={profiles.map((p) => ({ id: p.id, exerciseName: p.exerciseName, exerciseCode: p.profileName }))}
                onSelectProfileId={setSelected}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
