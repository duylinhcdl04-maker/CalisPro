import { Laptop, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import type { SecuritySettings } from "../../types";
import { formatDate, formatRelative } from "../../lib/format";
import { useSetTwoFactor } from "../../hooks";
import { Panel, StatusBadge, Toggle } from "../ui";
import { SettingRow } from "./NotificationPrefsPanel";

export function SecurityPanel({ security }: { security: SecuritySettings }) {
  const setTwoFactor = useSetTwoFactor();

  function toggle2fa(enabled: boolean) {
    setTwoFactor.mutate(enabled, {
      onSuccess: () => toast.success(enabled ? "Đã bật xác thực hai lớp." : "Đã tắt xác thực hai lớp."),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Không thể cập nhật bảo mật."),
    });
  }

  return (
    <Panel title="Bảo mật" description="Bảo vệ tài khoản và quản lý phiên đăng nhập." icon={ShieldCheck}>
      <div className="divide-y divide-border/60">
        <SettingRow
          label="Xác thực hai lớp (2FA)"
          description={security.twoFactorEnabled ? "Đang bật: cần mã xác thực khi đăng nhập." : "Khuyến nghị bật để tăng bảo mật tài khoản."}
          control={
            <div className="flex items-center gap-2">
              <StatusBadge tone={security.twoFactorEnabled ? "success" : "warning"}>{security.twoFactorEnabled ? "Đang bật" : "Đang tắt"}</StatusBadge>
              <Toggle checked={security.twoFactorEnabled} onChange={toggle2fa} label="Xác thực hai lớp" disabled={setTwoFactor.isPending} />
            </div>
          }
        />
        <SettingRow
          label="Lần đổi mật khẩu gần nhất"
          description={`${formatDate(security.lastPasswordChangeAt)} (${formatRelative(security.lastPasswordChangeAt)})`}
          control={null}
        />
      </div>
      <h3 className="mb-2 mt-4 text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">Phiên đăng nhập</h3>
      <ul className="space-y-2">
        {security.activeSessions.map((s) => {
          const mobile = /ios|android|iphone/i.test(s.device);
          const Icon = mobile ? Smartphone : Laptop;
          return (
            <li key={s.id} className="flex items-center gap-3 rounded-[14px] border border-border/70 bg-surface-elevated/50 p-3">
              <span className="icon-tile-3d well-3d h-9 w-9 shrink-0 text-text-secondary">
                <Icon size={16} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-text-primary">{s.device}</p>
                <p className="truncate text-xs text-text-secondary">
                  {s.location}, hoạt động {formatRelative(s.lastActiveAt)}
                </p>
              </div>
              {s.current && <StatusBadge tone="success">Phiên này</StatusBadge>}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
