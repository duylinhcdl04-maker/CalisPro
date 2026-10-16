import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, KeyRound, ArrowLeft, RefreshCw } from "lucide-react";
import { Auth3DLayout } from "../../components/layout/Auth3DLayout";
import { loginSchema, type LoginFormValues } from "../../features/auth/schemas";
import { useLoginMutation, useVerifyOtpMutation, useResendOtpMutation, getErrorMessage } from "../../features/auth/hooks";
import { destinationFor } from "../../app/guards";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLoginMutation();
  const verifyOtpMutation = useVerifyOtpMutation();
  const resendOtpMutation = useResendOtpMutation();

  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(
      {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      },
      {
        onSuccess: (user) => {
          if (user.mustChangePassword) {
            // Mật khẩu tạm do Admin cấp: bắt buộc đặt mật khẩu riêng trước khi dùng hệ thống
            toast.info("Vui lòng đổi mật khẩu tạm để tiếp tục.");
            navigate("/change-password", { replace: true });
            return;
          }
          toast.success("Đăng nhập thành công! 👋");
          const from = (location.state as { from?: Location })?.from?.pathname;
          navigate(from ?? destinationFor(user), { replace: true });
        },
        onError: (error) => {
          const message = getErrorMessage(error, "Đăng nhập thất bại.");
          if (message.toLowerCase().includes("chưa được kích hoạt") || message.toLowerCase().includes("otp")) {
            setUnverifiedEmail(values.email.trim().toLowerCase());
            setCountdown(60);
            toast.warning(message);
          } else {
            toast.error(message);
          }
        },
      }
    );
  };

  const onVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unverifiedEmail) return;
    if (!otp || otp.trim().length < 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số mã OTP.");
      return;
    }

    verifyOtpMutation.mutate(
      {
        email: unverifiedEmail,
        otp: otp.trim(),
      },
      {
        onSuccess: (user) => {
          toast.success("Kích hoạt tài khoản thành công! 🎉");
          const from = (location.state as { from?: Location })?.from?.pathname;
          navigate(from ?? destinationFor(user), { replace: true });
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, "Xác thực OTP thất bại."));
        },
      }
    );
  };

  const handleResendOtp = () => {
    if (!unverifiedEmail || countdown > 0) return;
    resendOtpMutation.mutate(unverifiedEmail, {
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
      activeTab="login"
      title={unverifiedEmail ? "Xác thực tài khoản ✉️" : "Chào mừng trở lại! 👋"}
      subtitle={
        unverifiedEmail
          ? `Tài khoản ${unverifiedEmail} chưa kích hoạt. Vui lòng nhập mã OTP để tiếp tục.`
          : "Đăng nhập để tiếp tục chuỗi ngày kỷ luật và bứt phá thể lực."
      }
      speechBubbleText={
        unverifiedEmail
          ? "Kiểm tra hộp thư email của bạn nhé! 📬"
          : "Hôm nay tập Human Flag không bạn ơi? 🔥"
      }
    >
      {!unverifiedEmail ? (
        <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
          {/* Email Field with Soft Inset Well */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-text-secondary mb-1.5 pl-1">
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

          {/* Password Field with Soft Inset Well */}
          <div>
            <div className="flex items-center justify-between mb-1.5 pl-1">
              <label htmlFor="password" className="text-xs font-bold text-text-secondary">
                Mật khẩu
              </label>
              <a href="#" className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors">
                Quên mật khẩu?
              </a>
            </div>
            <div className="clay-input-well flex items-center px-3.5 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 mr-2.5 shadow-2xs">
                <Lock size={16} />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
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

          {/* 3D Extruded Puffy Login Button */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="clay-btn clay-btn-sky w-full py-3.5 text-base mt-2 shadow-[0_12px_26px_-4px_rgba(14,165,233,0.45)]"
          >
            {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập ngay"}
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
            {verifyOtpMutation.isPending ? "Đang xác thực..." : "Xác thực & Đăng nhập"}
          </button>

          <div className="flex items-center justify-between pt-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setUnverifiedEmail(null)}
              className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Quay lại đăng nhập</span>
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

      {/* Divider: "hoặc tiếp tục với" */}
      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-black/[0.06] dark:border-white/[0.08]" />
        </div>
        <span className="relative bg-[#ffffff] dark:bg-[#0c192c] px-3 text-[11px] font-bold text-text-secondary/70 uppercase tracking-wider">
          hoặc tiếp tục với
        </span>
      </div>

      {/* 3D Round Social Buttons (Google, Apple, Facebook) */}
      <div className="flex items-center justify-center gap-4">
        {/* Google */}
        <button
          type="button"
          className="clay-round-btn h-11 w-11"
          title="Đăng nhập với Google"
          onClick={() => toast.info("Tính năng đăng nhập Google đang kết nối...")}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        </button>

        {/* Apple */}
        <button
          type="button"
          className="clay-round-btn h-11 w-11 text-text-primary"
          title="Đăng nhập với Apple"
          onClick={() => toast.info("Tính năng đăng nhập Apple đang kết nối...")}
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 170 170">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.9-12-14.58-6.19-9.69-10.99-20.93-14.42-33.72-3.42-12.79-5.13-24.32-5.13-34.58 0-14.36 3.8-26.33 11.41-35.91 7.6-9.58 17.06-14.45 28.36-14.61 4.58 0 9.77 1.25 15.58 3.75 5.8 2.5 9.74 3.75 11.81 3.75 1.7 0 5.86-1.31 12.48-3.92 6.62-2.61 12.28-3.79 16.98-3.54 12.98.65 23.36 5.68 31.14 15.09-11.43 6.96-17.03 16.48-16.8 28.56.24 9.47 3.86 17.38 10.86 23.72 7 6.34 15.22 9.94 24.67 10.8-2.18 6.53-4.8 13.06-7.85 19.59zM119.22 31.84c0-7.39 2.74-14.34 8.22-20.85 5.48-6.51 12.24-10.63 20.28-12.35.13 1.09.2 2.07.2 2.94 0 7.39-2.88 14.55-8.63 21.48-5.75 6.93-12.77 10.9-21.07 11.91-.4-1.09-.6-2.15-.6-3.13z" />
          </svg>
        </button>

        {/* Facebook */}
        <button
          type="button"
          className="clay-round-btn h-11 w-11 text-[#1877F2]"
          title="Đăng nhập với Facebook"
          onClick={() => toast.info("Tính năng đăng nhập Facebook đang kết nối...")}
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </button>
      </div>
    </Auth3DLayout>
  );
}
