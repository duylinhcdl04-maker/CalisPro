import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check, ArrowRightLeft } from "lucide-react";
import type { CalisHealthMuscle, MuscleRole, MuscleTarget } from "../../types/exercise";
import { CALISHEALTH_MUSCLE_CATALOG } from "./bodyMusclesAdapter";

const REGION_LABEL: Record<CalisHealthMuscle["region"], string> = {
  CHEST: "Ngực",
  SHOULDERS: "Vai",
  ARMS: "Tay",
  BACK: "Lưng",
  ABDOMINALS: "Bụng & Core",
  GLUTES: "Mông",
  LEGS: "Chân",
};

const REGION_ORDER: CalisHealthMuscle["region"][] = ["CHEST", "SHOULDERS", "ARMS", "BACK", "ABDOMINALS", "GLUTES", "LEGS"];

export const ROLE_LABEL: Record<MuscleRole, string> = {
  PRIMARY: "Cơ chính",
  SECONDARY: "Cơ phụ trợ",
  STABILIZER: "Cơ ổn định",
};

interface MusclePickerPanelProps {
  role: MuscleRole;
  targets: MuscleTarget[];
  /** Thêm cơ mới vào nhóm `role`, hoặc chuyển cơ đang ở nhóm khác sang nhóm này */
  onPick: (muscle: CalisHealthMuscle, existing?: MuscleTarget) => void;
  onClose: () => void;
}

/**
 * Bảng chọn cơ theo danh mục (tìm kiếm + nhóm theo vùng cơ thể), dùng cho nút "+ Thêm cơ" của từng nhóm vai trò.
 * Chọn được cả các cơ khó bấm trên sơ đồ (cơ chóp xoay, cơ trám...). Bảng giữ mở để chọn liên tiếp nhiều cơ.
 */
export function MusclePickerPanel({ role, targets, onPick, onClose }: MusclePickerPanelProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = CALISHEALTH_MUSCLE_CATALOG.filter(
      (m) => !q || m.nameVi.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
    );
    return REGION_ORDER.map((region) => ({ region, muscles: matched.filter((m) => m.region === region) })).filter(
      (g) => g.muscles.length
    );
  }, [query]);

  return (
    <div
      className="rounded-2xl border border-accent/30 bg-background p-3 space-y-3 shadow-sm"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Tìm cơ để thêm vào ${ROLE_LABEL[role]}...`}
            className="w-full rounded-xl border border-border bg-surface py-1.5 pl-8 pr-2 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 rounded-xl bg-accent px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-accent-strong cursor-pointer"
        >
          <Check size={12} /> Xong
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
        {groups.length === 0 && <p className="py-4 text-center text-xs text-text-secondary">Không tìm thấy cơ phù hợp.</p>}
        {groups.map((g) => (
          <div key={g.region} className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary">{REGION_LABEL[g.region]}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.muscles.map((m) => {
                const existing = targets.find((t) => t.muscleId === m.id);
                const inThisRole = existing?.role === role;
                const inOtherRole = existing && !inThisRole;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={inThisRole}
                    onClick={() => onPick(m, existing)}
                    title={
                      inThisRole
                        ? `Đã có trong ${ROLE_LABEL[role]}`
                        : inOtherRole
                          ? `Đang là ${ROLE_LABEL[existing.role]} – bấm để chuyển sang ${ROLE_LABEL[role]}`
                          : `${m.name} – thêm vào ${ROLE_LABEL[role]}`
                    }
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors ${
                      inThisRole
                        ? "border-accent/40 bg-accent/10 text-accent cursor-default"
                        : inOtherRole
                          ? "border-amber-500/40 bg-amber-500/5 text-text-primary hover:border-amber-500 cursor-pointer"
                          : "border-border bg-surface text-text-primary hover:border-accent hover:text-accent cursor-pointer"
                    }`}
                  >
                    {inThisRole && <Check size={11} />}
                    {inOtherRole && <ArrowRightLeft size={11} className="text-amber-500" />}
                    {m.nameVi}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="flex flex-wrap items-center gap-1 text-[10px] text-text-secondary">
        <Check size={10} className="text-accent" /> đã trong nhóm này ·
        <ArrowRightLeft size={10} className="text-amber-500" /> đang ở nhóm khác (bấm để chuyển)
      </p>
    </div>
  );
}
