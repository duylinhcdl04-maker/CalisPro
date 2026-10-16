import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useChangePassword } from "../../hooks";
import { Button3D, Field, Panel, TextInput } from "../ui";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới tối thiểu 8 ký tự.")
      .regex(/[A-Za-z]/, "Mật khẩu mới cần có ít nhất 1 chữ cái.")
      .regex(/\d/, "Mật khẩu mới cần có ít nhất 1 chữ số."),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu mới."),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Mật khẩu nhập lại không khớp." })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "Mật khẩu mới phải khác mật khẩu hiện tại." });

type PasswordForm = z.infer<typeof passwordSchema>;
const EMPTY: PasswordForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function PasswordPanel() {
  const change = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema), defaultValues: EMPTY });

  const onSubmit = handleSubmit(({ currentPassword, newPassword }) => {
    change.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success("Đã đổi mật khẩu.");
          reset(EMPTY);
        },
        onError: (e) => setError("currentPassword", { message: e instanceof Error ? e.message : "Không thể đổi mật khẩu." }, { shouldFocus: true }),
      }
    );
  });

  const busy = change.isPending;

  return (
    <Panel title="Đổi mật khẩu" description="Tối thiểu 8 ký tự, gồm chữ cái và chữ số." icon={KeyRound}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Mật khẩu hiện tại" required error={errors.currentPassword?.message}>
          {(id, d) => (
            <TextInput id={id} type="password" autoComplete="current-password" aria-describedby={d} aria-invalid={!!errors.currentPassword} disabled={busy} {...register("currentPassword")} />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mật khẩu mới" required error={errors.newPassword?.message}>
            {(id, d) => <TextInput id={id} type="password" autoComplete="new-password" aria-describedby={d} aria-invalid={!!errors.newPassword} disabled={busy} {...register("newPassword")} />}
          </Field>
          <Field label="Nhập lại mật khẩu mới" required error={errors.confirmPassword?.message}>
            {(id, d) => (
              <TextInput id={id} type="password" autoComplete="new-password" aria-describedby={d} aria-invalid={!!errors.confirmPassword} disabled={busy} {...register("confirmPassword")} />
            )}
          </Field>
        </div>
        <div className="flex justify-end">
          <Button3D type="submit" variant="primary" loading={busy}>
            Cập nhật mật khẩu
          </Button3D>
        </div>
      </form>
    </Panel>
  );
}
