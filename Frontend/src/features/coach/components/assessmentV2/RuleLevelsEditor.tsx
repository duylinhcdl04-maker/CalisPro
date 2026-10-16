import { cn } from "../../../../lib/utils";
import type { RuleLevel } from "../../types";
import { Panel, StatusBadge, TextInput } from "../ui";
import { GATE_LABEL, levelName, requirementLabel } from "../../../level/levelLabels";
import type { RuleSetEdits } from "./ruleSetEdits";

type LevelField = "promoteMin" | "regressBelow" | "minCompetencyConfidence";

interface Props {
  levels: RuleLevel[];
  edits: RuleSetEdits;
  editable: boolean;
  onLevelChange: (code: string, field: LevelField, value: string | null) => void;
  onRequirementChange: (id: number, value: string | null) => void;
}

const FIELDS: { key: LevelField; label: string; hint: string }[] = [
  { key: "promoteMin", label: "Điểm tổng để lên level", hint: "Điểm tổng từ mức này trở lên mới đủ điều kiện lên level này." },
  { key: "regressBelow", label: "Xét tụt khi điểm trung bình trượt dưới", hint: "Đặt thấp hơn mức lên để có vùng đệm, tránh lên xuống level liên tục." },
  { key: "minCompetencyConfidence", label: "Độ chắc chắn tối thiểu của năng lực", hint: "Thang 0–1; dữ liệu năng lực kém chắc chắn hơn mức này không được dùng để lên level." },
];


/** Ngưỡng điểm và yêu cầu của từng level. Level thấp nhất (L0) không có ngưỡng xét tụt. */
export function RuleLevelsEditor({ levels, edits, editable, onLevelChange, onRequirementChange }: Props) {
  return (
    <div className="space-y-4">
      {[...levels].sort((a, b) => a.rank - b.rank).map((l) => {
        const levelEdits = edits.levels[l.code] ?? {};
        return (
          <Panel key={l.code} title={`${l.code}${levelName(l.code) ? ` · ${levelName(l.code)}` : ""} (${l.name})`} description={l.rank === 4 ? "Camera không tự xác minh L4: cần Coach xác nhận." : undefined}>
            <div className="grid gap-3 sm:grid-cols-3">
              {FIELDS.map((f) => {
                const dirty = levelEdits[f.key] !== undefined;
                return (
                  <label key={f.key} className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-text-secondary">{f.label}</span>
                    <TextInput
                      type="number" step="any" disabled={!editable || (l.rank === 0 && f.key !== "minCompetencyConfidence")}
                      className={cn("tabular-nums", dirty && "border-accent bg-accent-soft/40")}
                      value={dirty ? levelEdits[f.key] : String(l[f.key])}
                      onChange={(e) => onLevelChange(l.code, f.key, e.target.value === String(l[f.key]) ? null : e.target.value)}
                    />
                    <span className="text-[10px] text-text-secondary">{f.hint}</span>
                  </label>
                );
              })}
            </div>

            {l.requirements.length > 0 && (
              <div className="mt-5">
                <h4 className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-text-secondary">Điều kiện để đạt level này</h4>
                <ul className="divide-y divide-border/60 rounded-2xl border border-border/70">
                  {l.requirements.map((r) => {
                    const dirty = edits.requirements[r.id] !== undefined;
                    const subject = r.competency ?? r.exerciseCode ?? "";
                    const req = requirementLabel(r);
                    return (
                      <li key={r.id} className={cn("flex flex-wrap items-center gap-3 px-3 py-2", dirty && "bg-accent-soft/40")}>
                        <StatusBadge tone="info">{GATE_LABEL[r.gate] ?? r.gate}</StatusBadge>
                        <span className="min-w-0 flex-1 text-sm font-bold text-text-primary">{req.label}</span>
                        {r.sourceType === "COACHING_BENCHMARK" && <StatusBadge tone="warning">Cần Coach xác nhận</StatusBadge>}
                        <TextInput
                          aria-label={`Giá trị yêu cầu ${r.gate} ${subject} của ${l.code}`}
                          type="number" step="any" disabled={!editable} className="h-9 w-28 text-right tabular-nums"
                          value={dirty ? edits.requirements[r.id] : String(r.value)}
                          onChange={(e) => onRequirementChange(r.id, e.target.value === String(r.value) ? null : e.target.value)}
                        />
                        {req.unit && <span className="w-24 text-[11px] font-semibold text-text-secondary">{req.unit}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
