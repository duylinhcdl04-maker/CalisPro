import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { CheckCircle2, Circle, Eye, EyeOff, Lock, LogOut, ShieldCheck } from "lucide-react";
import { Auth3DLayout } from "../../components/layout/Auth3DLayout";
import { useAuth } from "../../features/auth/AuthContext";
import { changePasswordSchema, type ChangePasswordFormValues } from "../../features/auth/schemas";
import { destinationFor } from "../../app/guards";

function messageOf(error: unknown): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === "string" && message) return message;
  }
  return error instanceof Error && error.message ? error.message : "Không thể đổi mật khẩu. Vui lòng thử lại.";
}

function PasswordField({ id, label, error, shown, onToggle, autoComplete, registration }: {
  id: string; label: string; error?: string; shown: boolean; onToggle: () => void; autoComplete: string;
  registration: ReturnType<ReturnType<typeof useForm<ChangePasswordFormValues>>["register"]>;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block pl-1 text-xs font-bold text-text-secondary">{label}</label>
      <div className="clay-input-well flex items-center px-3.5 py-2">
        <div className="mr-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 shadow-2xs dark:text-sky-400"><Lock size={16} /></div>
        <input id={id} type={shown ? "text" : "password"} autoComplete={autoComplete} aria-invalid={error ? true : undefined}
          className="w-full bg-transparent text-sm font-medium text-text-primary placeholder-text-secondary/60 focus:outline-none" {...registration} />
        <button type="button" onClick={onToggle} tabIndex={-1} aria-label={shown ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="cursor-pointer rounded-lg p-1.5 text-text-secondary transition-colors hover:text-text-primary">
          {shown ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p role="alert" className="mt-1 pl-2 text-[11px] font-semibold text-rose-500">{error}</p>}
    </div>
  );
}

/** Lần đăng nhập đầu của tài khoản Coach do Admin cấp: bắt buộc đặt mật khẩu riêng trước khi vào khu vực Coach. */
export default function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema), mode: "onChange", defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const next = watch("newPassword") ?? "";
  const rules = [
    { ok: next.length >= 8, label: "Ít nhất 8 ký tự" },
    { ok: /[A-Za-zÀ-ỹ]/.test(next), label: "Có chữ cái" },
    { ok: /\d/.test(next), label: "Có chữ số" },
  ];

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const updated = await changePassword(values.currentPassword, values.newPassword);
      toast.success("Đã đổi mật khẩu. Chào mừng bạn!");
      navigate(destinationFor(updated), { replace: true });
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Auth3DLayout
      activeTab="login"
      title="Đặt mật khẩu của bạn 🔐"
      subtitle={`Xin chào ${user?.name ?? ""}! Đây là lần đăng nhập đầu tiên bằng mật khẩu tạm. Hãy đặt mật khẩu riêng để tiếp tục.`}
      speechBubbleText="Chỉ mất vài giây thôi! ⚡"
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <PasswordField id="currentPassword" label="Mật khẩu tạm (trong email)" autoComplete="current-password" shown={show.current}
          onToggle={() => setShow((s) => ({ ...s, current: !s.current }))} error={errors.currentPassword?.message} registration={register("currentPassword")} />
        <PasswordField id="newPassword" label="Mật khẩu mới" autoComplete="new-password" shown={show.next}
          onToggle={() => setShow((s) => ({ ...s, next: !s.next }))} error={errors.newPassword?.message} registration={register("newPassword")} />
        <ul className="grid gap-1 pl-1" aria-label="Yêu cầu mật khẩu">
          {rules.map((r) => (
            <li key={r.label} className={`flex items-center gap-1.5 text-[11px] font-semibold ${r.ok ? "text-emerald-600 dark:text-emerald-400" : "text-text-secondary"}`}>
              {r.ok ? <CheckCircle2 size={13} aria-hidden /> : <Circle size={13} aria-hidden />}{r.label}
              <span className="sr-only">{r.ok ? "(đã đạt)" : "(chưa đạt)"}</span>
            </li>
          ))}
        </ul>
        <PasswordField id="confirmPassword" label="Nhập lại mật khẩu mới" autoComplete="new-password" shown={show.confirm}
          onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))} error={errors.confirmPassword?.message} registration={register("confirmPassword")} />

        <button type="submit" disabled={submitting} className="clay-btn clay-btn-sky mt-2 w-full py-3.5 text-base shadow-[0_12px_26px_-4px_rgba(14,165,233,0.45)] disabled:opacity-60">
          <span className="inline-flex items-center justify-center gap-2"><ShieldCheck size={18} aria-hidden />{submitting ? "Đang lưu..." : "Đổi mật khẩu và vào hệ thống"}</span>
        </button>
        <button type="button" onClick={() => { void logout().then(() => navigate("/login", { replace: true })); }}
          className="mx-auto flex items-center gap-1.5 pt-1 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary">
          <LogOut size={14} aria-hidden />Đăng xuất
        </button>
      </form>
    </Auth3DLayout>
  );
}
