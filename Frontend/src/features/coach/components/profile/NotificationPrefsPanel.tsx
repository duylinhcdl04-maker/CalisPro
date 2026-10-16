import { useEffect, useState, type ReactNode } from "react";
import { BellRing, Save } from "lucide-react";
import { toast } from "sonner";
import type { CoachNotificationType, NotificationPreferences } from "../../types";
import { NOTIFICATION_TYPE_LABEL } from "../../constants/labels";
import { useUpdateNotificationPreferences } from "../../hooks";
import { Button3D, Panel, Segmented, Toggle, type SegmentOption } from "../ui";

const DIGEST_OPTIONS: SegmentOption<NotificationPreferences["digest"]>[] = [
  { value: "OFF", label: "Tắt" },
  { value: "DAILY", label: "Hằng ngày" },
  { value: "WEEKLY", label: "Hằng tuần" },
];

const CHANNELS: { key: "email" | "push" | "inApp"; label: string; description: string }[] = [
  { key: "inApp", label: "Trong ứng dụng", description: "Hiển thị ở chuông thông báo." },
  { key: "push", label: "Thông báo đẩy", description: "Gửi tới điện thoại và trình duyệt." },
  { key: "email", label: "Email", description: "Gửi tới email đăng ký." },
];

const TYPES = Object.keys(NOTIFICATION_TYPE_LABEL) as CoachNotificationType[];

export function SettingRow({ label, description, control }: { label: string; description?: string; control: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-bold text-text-primary">{label}</p>
        {description && <p className="mt-0.5 text-xs text-text-secondary">{description}</p>}
      </div>
      {control}
    </div>
  );
}

export function NotificationPrefsPanel({ prefs }: { prefs: NotificationPreferences }) {
  const [draft, setDraft] = useState(prefs);
  const save = useUpdateNotificationPreferences();
  useEffect(() => setDraft(prefs), [prefs]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(prefs);
  const setType = (t: CoachNotificationType, v: boolean) => setDraft((d) => ({ ...d, types: { ...d.types, [t]: v } }));

  function submit() {
    save.mutate(draft, {
      onSuccess: () => toast.success("Đã lưu tuỳ chọn thông báo."),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Không thể lưu tuỳ chọn."),
    });
  }

  return (
    <Panel
      title="Tuỳ chọn thông báo"
      description="Chọn kênh và loại thông báo bạn muốn nhận."
      icon={BellRing}
      actions={
        <Button3D variant="primary" size="sm" onClick={submit} loading={save.isPending} disabled={!dirty} leftIcon={<Save size={14} />}>
          Lưu
        </Button3D>
      }
    >
      <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">Kênh nhận</h3>
      <div className="divide-y divide-border/60">
        {CHANNELS.map((c) => (
          <SettingRow
            key={c.key}
            label={c.label}
            description={c.description}
            control={<Toggle checked={draft[c.key]} onChange={(v) => setDraft((d) => ({ ...d, [c.key]: v }))} label={c.label} disabled={save.isPending} />}
          />
        ))}
        <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-text-primary">Bản tin tổng hợp</p>
            <p className="mt-0.5 text-xs text-text-secondary">Tóm tắt hoạt động của học viên qua email.</p>
          </div>
          <Segmented options={DIGEST_OPTIONS} value={draft.digest} onChange={(v) => setDraft((d) => ({ ...d, digest: v }))} ariaLabel="Tần suất bản tin" size="sm" />
        </div>
      </div>
      <h3 className="mt-4 text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">Loại thông báo</h3>
      <div className="grid gap-x-8 sm:grid-cols-2">
        {TYPES.map((t) => (
          <SettingRow
            key={t}
            label={NOTIFICATION_TYPE_LABEL[t]}
            control={<Toggle checked={draft.types[t]} onChange={(v) => setType(t, v)} label={`Thông báo ${NOTIFICATION_TYPE_LABEL[t]}`} disabled={save.isPending} />}
          />
        ))}
      </div>
    </Panel>
  );
}
