import { useEffect, useState } from "react";
import { Clock, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../../lib/utils";
import type { AvailabilitySlot } from "../../types";
import { WEEKDAY_LABEL } from "../../constants/labels";
import { useUpdateAvailability } from "../../hooks";
import { Button3D, Panel, TextInput, Toggle } from "../ui";

const slotError = (s: AvailabilitySlot) => (s.enabled && (!s.start || !s.end || s.end <= s.start) ? "Giờ kết thúc phải sau giờ bắt đầu." : null);

export function AvailabilityPanel({ slots }: { slots: AvailabilitySlot[] }) {
  const [draft, setDraft] = useState(slots);
  const [showErrors, setShowErrors] = useState(false);
  const save = useUpdateAvailability();
  useEffect(() => setDraft(slots), [slots]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(slots);
  const update = (i: number, patch: Partial<AvailabilitySlot>) => setDraft((d) => d.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  function submit() {
    if (draft.some((s) => slotError(s))) {
      setShowErrors(true);
      toast.error("Vui lòng kiểm tra lại khung giờ.");
      return;
    }
    setShowErrors(false);
    save.mutate(draft, {
      onSuccess: () => toast.success("Đã lưu lịch rảnh."),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Không thể lưu lịch rảnh."),
    });
  }

  return (
    <Panel
      title="Lịch rảnh"
      description="Khung giờ học viên có thể đặt lịch với bạn."
      icon={Clock}
      actions={
        <Button3D variant="primary" size="sm" onClick={submit} loading={save.isPending} disabled={!dirty} leftIcon={<Save size={14} />}>
          Lưu
        </Button3D>
      }
    >
      <ul className="divide-y divide-border/60">
        {draft.map((s, i) => {
          const day = WEEKDAY_LABEL[s.day].long;
          const err = showErrors ? slotError(s) : null;
          const errId = `avail-err-${s.day}`;
          return (
            <li key={s.day} className="py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex w-32 items-center gap-3">
                  <Toggle checked={s.enabled} onChange={(v) => update(i, { enabled: v })} label={`Nhận lịch ${day}`} disabled={save.isPending} />
                  <span className={cn("text-sm font-bold", s.enabled ? "text-text-primary" : "text-text-secondary")}>{day}</span>
                </div>
                {s.enabled ? (
                  <div className="flex items-center gap-2">
                    <TextInput
                      type="time"
                      step={900}
                      value={s.start}
                      onChange={(e) => update(i, { start: e.target.value })}
                      aria-label={`Giờ bắt đầu ${day}`}
                      aria-invalid={!!err}
                      aria-describedby={err ? errId : undefined}
                      disabled={save.isPending}
                      className="w-[7.5rem]"
                    />
                    <span className="text-xs text-text-secondary">đến</span>
                    <TextInput
                      type="time"
                      step={900}
                      value={s.end}
                      onChange={(e) => update(i, { end: e.target.value })}
                      aria-label={`Giờ kết thúc ${day}`}
                      aria-invalid={!!err}
                      aria-describedby={err ? errId : undefined}
                      disabled={save.isPending}
                      className="w-[7.5rem]"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-text-secondary">Không nhận lịch</span>
                )}
              </div>
              {err && (
                <p id={errId} className="mt-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  {err}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
