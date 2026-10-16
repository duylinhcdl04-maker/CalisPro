import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email.").email("Email không hợp lệ."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Tên cần ít nhất 2 ký tự."),
    email: z.string().min(1, "Vui lòng nhập email.").email("Email không hợp lệ."),
    password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự."),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu."),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Bạn cần đồng ý với điều khoản để tiếp tục.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

/** Khớp quy tắc của backend: ≥ 8 ký tự, có chữ và số, khác mật khẩu hiện tại. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại (mật khẩu tạm trong email)."),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới cần ít nhất 8 ký tự.")
      .max(72, "Mật khẩu mới tối đa 72 ký tự.")
      .regex(/[A-Za-zÀ-ỹ]/, "Mật khẩu mới cần có chữ cái.")
      .regex(/\d/, "Mật khẩu mới cần có chữ số."),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu mới."),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Mật khẩu nhập lại không khớp.", path: ["confirmPassword"] })
  .refine((v) => v.newPassword !== v.currentPassword, { message: "Mật khẩu mới phải khác mật khẩu hiện tại.", path: ["newPassword"] });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
