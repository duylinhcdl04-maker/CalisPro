import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, User, KeyRound, ArrowLeft, RefreshCw } from "lucide-react";
import { Auth3DLayout } from "../../components/layout/Auth3DLayout";
import { registerSchema, type RegisterFormValues } from "../../features/auth/schemas";
import { useRegisterMutation, useVerifyOtpMutation, useResendOtpMutation, getErrorMessage } from "../../features/auth/hooks";

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();
  const verifyOtpMutation = useVerifyOtpMutation();
  const resendOtpMutation = useResendOtpMutation();

  const [step, setStep] = useState<"FORM" | "OTP">("FORM");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const onRegisterSubmit = (values: RegisterFormValues) => {
    const trimmedName = values.name.trim();
    const parts = trimmedName.split(/\s+/);
    let firstName = "";
    let lastName = "";
    if (parts.length === 1) {
      firstName = parts[0];
      lastName = "";
    } else {
      lastName = parts[0];
      firstName = parts.slice(1).join(" ");
    }

    registerMutation.mutate(
      {
        email: values.email.trim().toLowerCase(),
        password: values.password,
        firstName,
        lastName,
      },
      {
        onSuccess: (data) => {
          setRegisteredEmail(data.email || values.email.trim().toLowerCase());
          setStep("OTP");
          setCountdown(60);
          toast.success(data.message || "Mã OTP đã được gửi đến email của bạn.");
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, "Không thể tạo tài khoản."));
        },
      }
    );
  };

  const onVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số mã OTP.");
      return;
    }

    verifyOtpMutation.mutate(
      {
        email: registeredEmail,
        otp: otp.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Xác thực tài khoản thành công! 🎉");
          navigate("/onboarding", { replace: true });
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, "Xác thực OTP thất bại."));
        },
      }
    );
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    resendOtpMutation.mutate(registeredEmail, {
      onSuccess: (res) => {
        setCountdown(60);
        toast.success(res.message || "Mã OTP mới đã được gửi đến email của bạn.");
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, "Không thể gửi lại mã OTP."));
      },
    });
  };

  return (
    <Auth3DLayout
      activeTab="register"
      title={step === "FORM" ? "Tạo tài khoản mới 🚀" : "Xác thực Email ✉️"}
      subtitle={
        step === "FORM"
          ? "Bắt đầu lộ trình rèn luyện sức mạnh và mở khóa các kỹ năng đỉnh cao."
          : `Mã OTP đã được gửi đến ${registeredEmail}. Vui lòng nhập mã để kích hoạt tài khoản.`
      }
      speechBubbleText={
        step === "FORM"
          ? "Gia nhập cùng 10,000+ anh em Calisthenics ngay! 💪"
          : "Kiểm tra hòm thư của bạn nhé! 📬"
      }
    >
      {step === "FORM" ? (
        <form onSubmit={handleSubmit(onRegisterSubmit)} className="space-y-3.5">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-xs font-bold text-text-secondary mb-1 pl-1">
              Họ và tên
            </label>
            <div className="clay-input-well flex items-center px-3.5 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 mr-2.5 shadow-2xs">
                <User size={16} />
              </div>
              <input
                id="name"
                placeholder="Nguyễn Văn A"
                className="w-full bg-transparent text-sm font-medium text-text-primary placeholder-text-secondary/60 focus:outline-none"
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-[11px] font-semibold text-rose-500 pl-2">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-text-secondary mb-1 pl-1">
              Email
            </label>
            <div className="clay-input-well flex items-center px-3.5 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 mr-2.5 shadow-2xs">
                <Mail size={16} />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="ban@email.com"
                className="w-full bg-transparent text-sm font-medium text-text-primary placeholder-text-secondary/60 focus:outline-none"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] font-semibold text-rose-500 pl-2">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-text-secondary mb-1 pl-1">
              Mật khẩu
            </label>
            <div className="clay-input-well flex items-center px-3.5 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 mr-2.5 shadow-2xs">
                <Lock size={16} />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự"
                className="w-full bg-transparent text-sm font-medium text-text-primary placeholder-text-secondary/60 focus:outline-none"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="rounded-lg p-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] font-semibold text-rose-500 pl-2">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-bold text-text-secondary mb-1 pl-1">
              Xác nhận mật khẩu
            </label>
            <div className="clay-input-well flex items-center px-3.5 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 mr-2.5 shadow-2xs">
                <Lock size={16} />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                className="w-full bg-transparent text-sm font-medium text-text-primary placeholder-text-secondary/60 focus:outline-none"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="rounded-lg p-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-[11px] font-semibold text-rose-500 pl-2">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms and conditions */}
          <div className="pt-1">
            <div className="flex items-start gap-2.5">
              <Controller
                name="acceptTerms"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                )}
              />
              <label htmlFor="acceptTerms" className="text-xs font-medium text-text-secondary leading-relaxed cursor-pointer">
                Tôi đồng ý với{" "}
                <a href="#" className="font-bold text-sky-600 underline underline-offset-2 hover:text-sky-700">
                  Điều khoản
                </a>{" "}
                và{" "}
                <a href="#" className="font-bold text-sky-600 underline underline-offset-2 hover:text-sky-700">
                  Chính sách bảo mật
                </a>
                .
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="mt-1 text-[11px] font-semibold text-rose-500 pl-2">{errors.acceptTerms.message}</p>
            )}
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="clay-btn clay-btn-sky w-full py-3.5 text-base mt-2 shadow-[0_12px_26px_-4px_rgba(14,165,233,0.45)]"
          >
            {registerMutation.isPending ? "Đang gửi thông tin..." : "Tạo tài khoản ngay"}
          </button>
        </form>
      ) : (
        <form onSubmit={onVerifyOtpSubmit} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-xs font-bold text-text-secondary mb-1.5 pl-1">
              Mã OTP 6 chữ số
            </label>
            <div className="clay-input-well flex items-center px-3.5 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 mr-2.5 shadow-2xs">
                <KeyRound size={16} />
              </div>
              <input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                autoFocus
                className="w-full bg-transparent text-center tracking-[0.4em] text-lg font-bold text-text-primary placeholder-text-secondary/40 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={verifyOtpMutation.isPending || otp.length < 6}
            className="clay-btn clay-btn-sky w-full py-3.5 text-base mt-2 shadow-[0_12px_26px_-4px_rgba(14,165,233,0.45)] disabled:opacity-50"
          >
            {verifyOtpMutation.isPending ? "Đang xác thực..." : "Xác thực & Bắt đầu"}
          </button>

          <div className="flex items-center justify-between pt-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStep("FORM")}
              className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Đổi thông tin</span>
            </button>

            <button
              type="button"
              disabled={countdown > 0 || resendOtpMutation.isPending}
              onClick={handleResendOtp}
              className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 disabled:text-text-secondary/50 transition-colors"
            >
              <RefreshCw size={14} className={resendOtpMutation.isPending ? "animate-spin" : ""} />
              <span>{countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại mã OTP"}</span>
            </button>
          </div>
        </form>
      )}
    </Auth3DLayout>
  );
}
