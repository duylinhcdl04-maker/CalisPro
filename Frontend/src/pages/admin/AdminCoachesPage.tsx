import { useState } from "react";
import { Ban, KeyRound, Loader2, LockOpen, Mail, Plus, RefreshCw, ShieldCheck, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "../../components/admin/layout/AdminPageHeader";
import { Button } from "../../components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../components/ui/Dialog";
import {
  apiMessage,
  useCoachAccounts,
  useCreateCoach,
  useResetCoachPassword,
  useSetCoachStatus,
  useUnlockCoach,
  type CoachAccount,
  type CoachAccountState,
} from "../../features/admin/coachAccounts/api";

const STATE_BADGE: Record<CoachAccountState, { label: string; cls: string }> = {
  LOCKED: { label: "Đang bị khóa", cls: "bg-red-500/10 text-red-600 border-red-500/25" },
  PENDING_FIRST_LOGIN: { label: "Chờ đăng nhập lần đầu", cls: "bg-amber-500/10 text-amber-600 border-amber-500/25" },
  TEMP_EXPIRED: { label: "Mật khẩu tạm đã hết hạn", cls: "bg-red-500/10 text-red-600 border-red-500/25" },
  ACTIVE: { label: "Đang hoạt động", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
};

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "-");

/**
 * Quản lý tài khoản Huấn luyện viên. Admin tạo tài khoản, hệ thống gửi email chứa mật khẩu tạm,
 * Coach đăng nhập lần đầu bắt buộc đổi mật khẩu rồi vào khu vực Coach. (Không còn luồng nộp hồ sơ để duyệt.)
 */
export default function AdminCoachesPage() {
  const accounts = useCoachAccounts();
  const create = useCreateCoach();
  const reset = useResetCoachPassword();
  const unlock = useUnlockCoach();
  const setStatus = useSetCoachStatus();
  const [statusTarget, setStatusTarget] = useState<CoachAccount | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetTarget, setResetTarget] = useState<CoachAccount | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "" });
  const [touched, setTouched] = useState(false);

  const nameError = form.fullName.trim().length < 2 ? "Nhập họ tên (ít nhất 2 ký tự)." : null;
  const emailError = !EMAIL.test(form.email.trim()) ? "Email không hợp lệ." : null;
  const items = accounts.data ?? [];
  const pending = items.filter((a) => a.state !== "ACTIVE").length;

  function openCreate() {
    setForm({ fullName: "", email: "" });
    setTouched(false);
    setCreating(true);
  }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (nameError || emailError) return;
    create.mutate({ fullName: form.fullName.trim(), email: form.email.trim() }, {
      onSuccess: (acc) => {
        toast.success(`Đã tạo tài khoản và gửi mật khẩu tạm tới ${acc.email}`);
        setCreating(false);
      },
      onError: (err) => toast.error(apiMessage(err, "Không thể tạo tài khoản. Vui lòng thử lại.")),
    });
  }

  function doUnlock(a: CoachAccount) {
    unlock.mutate(a.id, {
      onSuccess: () => toast.success(`Đã mở khóa tài khoản ${a.email}`),
      onError: (err) => toast.error(apiMessage(err, "Không thể mở khóa. Vui lòng thử lại.")),
    });
  }

  function confirmStatusChange() {
    if (!statusTarget) return;
    const next = statusTarget.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setStatus.mutate({ id: statusTarget.id, status: next }, {
      onSuccess: () => {
        toast.success(next === "SUSPENDED" ? `Đã vô hiệu hóa ${statusTarget.email}` : `Đã kích hoạt lại ${statusTarget.email}`);
        setStatusTarget(null);
      },
      onError: (err) => {
        toast.error(apiMessage(err, "Không thể đổi trạng thái. Vui lòng thử lại."));
        setStatusTarget(null);
      },
    });
  }

  function confirmReset() {
    if (!resetTarget) return;
    reset.mutate(resetTarget.id, {
      onSuccess: (acc) => {
        toast.success(`Đã cấp lại mật khẩu tạm và gửi email tới ${acc.email}`);
        setResetTarget(null);
      },
      onError: (err) => {
        toast.error(apiMessage(err, "Không thể cấp lại mật khẩu. Vui lòng thử lại."));
        setResetTarget(null);
      },
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Tài khoản Huấn luyện viên"
        description="Bạn tạo tài khoản, hệ thống gửi email mật khẩu tạm cho Coach. Coach bắt buộc đổi mật khẩu ở lần đăng nhập đầu rồi vào khu vực dành cho Coach."
        badge={`${items.length} tài khoản`}
        actions={<Button variant="accent" size="sm" onClick={openCreate}><Plus size={14} aria-hidden />Tạo tài khoản Coach</Button>}
      />

      {pending > 0 && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <ShieldCheck size={15} aria-hidden />{pending} tài khoản chưa hoàn tất đăng nhập lần đầu (chưa đổi mật khẩu tạm).
        </p>
      )}

      <section aria-label="Danh sách tài khoản Coach" className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-elevated">
        {accounts.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-text-secondary"><Loader2 size={16} className="animate-spin" aria-hidden />Đang tải...</div>
        ) : accounts.isError ? (
          <div role="alert" className="py-16 text-center">
            <p className="text-sm font-semibold text-text-primary">Không tải được danh sách tài khoản Coach.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => accounts.refetch()}><RefreshCw size={14} aria-hidden />Thử lại</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} className="mx-auto mb-2 text-text-secondary/50" aria-hidden />
            <p className="text-sm font-semibold text-text-primary">Chưa có tài khoản Coach nào</p>
            <p className="mt-1 text-xs text-text-secondary">Bấm "Tạo tài khoản Coach" để cấp tài khoản đầu tiên.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Tài khoản Huấn luyện viên</caption>
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                  <th scope="col" className="px-5 py-3">Huấn luyện viên</th>
                  <th scope="col" className="px-3 py-3">Trạng thái</th>
                  <th scope="col" className="px-3 py-3">Hạn mật khẩu tạm</th>
                  <th scope="col" className="px-3 py-3">Đăng nhập gần nhất</th>
                  <th scope="col" className="px-3 py-3">Tạo lúc</th>
                  <th scope="col" className="px-5 py-3 text-right"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => {
                  const badge = STATE_BADGE[a.state];
                  const disabled = a.status !== "ACTIVE";
                  return (
                    <tr key={a.id} className="border-b border-border/60 last:border-0 hover:bg-surface-elevated/60">
                      <th scope="row" className="px-5 py-3.5 text-left font-normal">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong"><UserCheck size={16} aria-hidden /></span>
                          <div className="min-w-0">
                            <div className="truncate font-bold text-text-primary">{a.fullName}</div>
                            <div className="flex items-center gap-1 truncate text-xs text-text-secondary"><Mail size={11} aria-hidden />{a.email}</div>
                          </div>
                        </div>
                      </th>
                      <td className="px-3 py-3.5">
                        <div className="flex flex-col items-start gap-1">
                          {disabled ? (
                            <span className="rounded-full border border-slate-500/30 bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">Đã vô hiệu hóa</span>
                          ) : (
                            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}>{badge.label}</span>
                          )}
                          {a.state === "LOCKED" && a.lockedUntil && <span className="text-[10px] text-text-secondary">đến {fmt(a.lockedUntil)}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-xs tabular-nums text-text-secondary">{a.mustChangePassword ? fmt(a.tempPasswordExpiresAt) : "-"}</td>
                      <td className="px-3 py-3.5 text-xs tabular-nums text-text-secondary">{fmt(a.lastLoginAt)}</td>
                      <td className="px-3 py-3.5 text-xs tabular-nums text-text-secondary">{fmt(a.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap justify-end gap-2">
                          {a.state === "LOCKED" && (
                            <Button variant="accent" size="sm" onClick={() => doUnlock(a)} disabled={unlock.isPending} aria-label={`Mở khóa tài khoản ${a.fullName}`}>
                              <LockOpen size={13} aria-hidden />Mở khóa
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => setResetTarget(a)} aria-label={`Cấp lại mật khẩu tạm cho ${a.fullName}`}>
                            <KeyRound size={13} aria-hidden />Cấp lại mật khẩu
                          </Button>
                          <Button variant={disabled ? "outline" : "destructive"} size="sm" onClick={() => setStatusTarget(a)} aria-label={`${disabled ? "Kích hoạt lại" : "Vô hiệu hóa"} ${a.fullName}`}>
                            <Ban size={13} aria-hidden />{disabled ? "Kích hoạt lại" : "Vô hiệu hóa"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={creating} onOpenChange={(o) => !create.isPending && setCreating(o)}>
        <DialogContent>
          <DialogTitle className="font-display text-lg font-black text-text-primary">Tạo tài khoản Coach</DialogTitle>
          <DialogDescription className="mt-1 text-xs text-text-secondary">Hệ thống tự tạo mật khẩu tạm và gửi tới email này. Bạn sẽ không nhìn thấy mật khẩu.</DialogDescription>
          <form onSubmit={submitCreate} noValidate className="mt-5 space-y-4">
            <div>
              <label htmlFor="coach-name" className="mb-1 block text-xs font-bold text-text-secondary">Họ và tên</label>
              <input id="coach-name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} autoFocus maxLength={100}
                aria-invalid={touched && nameError ? true : undefined} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
              {touched && nameError && <p role="alert" className="mt-1 text-[11px] font-semibold text-red-500">{nameError}</p>}
            </div>
            <div>
              <label htmlFor="coach-email" className="mb-1 block text-xs font-bold text-text-secondary">Email nhận mật khẩu tạm</label>
              <input id="coach-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} autoComplete="off"
                aria-invalid={touched && emailError ? true : undefined} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
              {touched && emailError && <p role="alert" className="mt-1 text-[11px] font-semibold text-red-500">{emailError}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)} disabled={create.isPending}>Huỷ</Button>
              <Button type="submit" variant="accent" size="sm" disabled={create.isPending}>
                {create.isPending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Mail size={14} aria-hidden />}Tạo và gửi email
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={statusTarget !== null} onOpenChange={(o) => !setStatus.isPending && !o && setStatusTarget(null)}>
        <DialogContent>
          <DialogTitle className="font-display text-lg font-black text-text-primary">
            {statusTarget?.status === "ACTIVE" ? "Vô hiệu hóa tài khoản Coach?" : "Kích hoạt lại tài khoản Coach?"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-text-secondary">{statusTarget?.fullName} · {statusTarget?.email}</DialogDescription>
          <p className="mt-4 text-sm text-text-secondary">
            {statusTarget?.status === "ACTIVE"
              ? "Coach không đăng nhập được nữa và phiên đang dùng bị đăng xuất trong vài chục giây. Dữ liệu và lịch sử được giữ nguyên."
              : "Coach đăng nhập lại được bằng mật khẩu hiện tại."}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStatusTarget(null)} disabled={setStatus.isPending}>Huỷ</Button>
            <Button variant={statusTarget?.status === "ACTIVE" ? "destructive" : "accent"} size="sm" onClick={confirmStatusChange} disabled={setStatus.isPending}>
              {setStatus.isPending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Ban size={14} aria-hidden />}Xác nhận
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resetTarget !== null} onOpenChange={(o) => !reset.isPending && !o && setResetTarget(null)}>
        <DialogContent>
          <DialogTitle className="font-display text-lg font-black text-text-primary">Cấp lại mật khẩu tạm?</DialogTitle>
          <DialogDescription className="mt-1 text-xs text-text-secondary">{resetTarget?.fullName} · {resetTarget?.email}</DialogDescription>
          <p className="mt-4 text-sm text-text-secondary">Mật khẩu hiện tại của Coach sẽ bị thay thế bằng một mật khẩu tạm mới gửi qua email. Coach phải đổi mật khẩu ở lần đăng nhập kế tiếp.</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setResetTarget(null)} disabled={reset.isPending}>Huỷ</Button>
            <Button variant="accent" size="sm" onClick={confirmReset} disabled={reset.isPending}>
              {reset.isPending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <KeyRound size={14} aria-hidden />}Cấp lại và gửi email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
