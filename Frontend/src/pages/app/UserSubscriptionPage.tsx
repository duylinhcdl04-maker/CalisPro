import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Crown,
  Sparkles,
  Check,
  ShieldCheck,
  Zap,
  Clock,
  Calendar,
  CreditCard,
  QrCode,
  Copy,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Flame,
  Gift,
  FileText,
  AlertCircle,
  RefreshCw,
  Trophy,
  CheckCircle2,
  X,
  HelpCircle,
} from "lucide-react";
import { Switch, Progress, Tag, Tooltip } from "antd";
import { toast } from "sonner";
import { useAuth } from "../../features/auth/AuthContext";
import { MOCK_SUBSCRIPTION_PLANS, MOCK_PAYMENT_TRANSACTIONS } from "../../features/subscriptions/mock/subscription.mock";
import type { SubscriptionPlan, BillingCycle, PaymentMethod } from "../../features/subscriptions/types/subscription.types";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: SubscriptionPlan | null;
  selectedDurationMonths: number;
  onSuccess: (newPlanName: string, durationMonths: number) => void;
}

const FAQS = [
  {
    q: "Sau khi nâng cấp gói, thời hạn gói cũ của tôi có bị mất không?",
    a: "Không. Hệ thống tự động cộng dồn toàn bộ số ngày còn lại của gói cũ và quy đổi tương đương vào thời hạn gói mới của bạn.",
  },
  {
    q: "Tôi có thể hủy tính năng tự động gia hạn (Auto-renewal) bất kỳ lúc nào không?",
    a: "Hoàn toàn có thể. Bạn chỉ cần tắt nút gạt 'Tự động gia hạn' trong trang này mà không mất bất kỳ khoản phí nào. Gói hội viên vẫn có hiệu lực đến hết ngày cuối cùng của chu kỳ.",
  },
  {
    q: "Chính sách hoàn tiền (Refund Policy) áp dụng như thế nào?",
    a: "CALIS Platform cam kết hoàn tiền 100% trong vòng 24 giờ sau khi thanh toán nếu bạn chưa hài lòng với chương trình luyện tập hoặc gặp sự cố kỹ thuật.",
  },
  {
    q: "Thanh toán qua VietQR hoạt động như thế nào?",
    a: "Hệ thống tạo mã QR động có kèm sẵn số tiền và mã hóa đơn riêng biệt. Bạn chỉ cần mở ứng dụng ngân hàng quét mã, hệ thống sẽ tự động kích hoạt tài khoản trong vòng 10-30 giây.",
  },
];

export default function UserSubscriptionPage() {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [autoRenew, setAutoRenew] = useState(true);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);
  const [selectedDurationMonths, setSelectedDurationMonths] = useState<number>(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Active subscription state
  const [currentPlanCode, setCurrentPlanCode] = useState<string>("CALIS_PREMIUM");
  const [currentExpiryDate, setCurrentExpiryDate] = useState<string>("24/10/2026");
  const [daysRemaining, setDaysRemaining] = useState<number>(24);

  const currentPlan = useMemo(() => {
    return MOCK_SUBSCRIPTION_PLANS.find((p) => p.code === currentPlanCode) || MOCK_SUBSCRIPTION_PLANS[2];
  }, [currentPlanCode]);

  const handleOpenCheckout = (plan: SubscriptionPlan, durationMonths: number = 1) => {
    setSelectedPlanForCheckout(plan);
    setSelectedDurationMonths(durationMonths);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = (newPlanName: string, durationMonths: number) => {
    setIsCheckoutOpen(false);
    toast.success(`Chúc mừng bạn đã kích hoạt thành công ${newPlanName} (${durationMonths} tháng)!`);
    setDaysRemaining((prev) => prev + durationMonths * 30);
  };

  const filteredPlans = useMemo(() => {
    return MOCK_SUBSCRIPTION_PLANS.filter((p) => {
      if (billingCycle === "ANNUAL") {
        return p.billingCycle === "ANNUAL" || p.id === "plan-premium";
      }
      return p.billingCycle === "MONTHLY" || p.id === "plan-trial";
    });
  }, [billingCycle]);

  return (
    <div className="mx-auto max-w-6xl space-y-9 p-5 sm:p-8 md:p-10">
      {/* 1. Header & Hero Overview Banner */}
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#ffffff] dark:from-[#081729] dark:via-[#0c1f36] dark:to-[#071322] p-6 sm:p-8 md:p-10 border border-sky-300/50 dark:border-sky-500/20 shadow-[0_20px_45px_-10px_rgba(14,165,233,0.15),inset_0_2px_3px_rgba(255,255,255,0.9)]">
        {/* 3D Ambient Glowing Blobs */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-56 w-56 rounded-full bg-cyan-400/15 blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/15 px-3.5 py-1 text-xs font-black uppercase tracking-[.14em] text-sky-800 dark:text-sky-300 border border-sky-500/25 shadow-2xs">
              <Crown size={14} className="text-amber-500 animate-pulse" />
              <span>Gói Hội Viên & Quyền Lợi Calisthenics</span>
            </div>

            <h1 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-text-primary">
              Mở khóa toàn bộ <span className="text-sky-600">sức mạnh 3D</span> của bạn.
            </h1>

            <p className="mt-3 text-sm sm:text-base leading-relaxed text-text-secondary font-medium">
              Làm chủ các kỹ năng đỉnh cao với lộ trình khoa học, trợ lý AI Coach cá nhân hóa 24/7 và hệ sinh thái đánh giá thể lực chuyên nghiệp.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-800 dark:text-sky-300 bg-white/80 dark:bg-surface/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-sky-200 dark:border-sky-500/20 shadow-2xs">
                <CheckCircle2 size={14} className="text-sky-500" />
                <span>Không ràng buộc, hủy bất cứ lúc nào</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-sky-800 dark:text-sky-300 bg-white/80 dark:bg-surface/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-sky-200 dark:border-sky-500/20 shadow-2xs">
                <ShieldCheck size={14} className="text-sky-500" />
                <span>Cam kết bảo mật & hoàn tiền 24h</span>
              </div>
            </div>
          </div>

          {/* Current Active Plan Status Card */}
          <div className="w-full max-w-sm rounded-[28px] bg-surface p-6 shadow-[0_16px_36px_-8px_rgba(14,165,233,0.18),inset_0_2px_2px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(0,0,0,0.03)] border border-sky-200/80 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">Gói hiện tại</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-extrabold text-emerald-600 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Đang hoạt động
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <div className="font-display text-2xl font-black text-text-primary">{currentPlan.name}</div>
              <Tag color="cyan" className="font-bold">PRO LEVEL</Tag>
            </div>

            <div className="mt-4 rounded-2xl bg-sky-500/5 p-3.5 border border-sky-500/10">
              <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
                <span>Thời hạn còn lại</span>
                <span className="text-sky-600 font-black">{daysRemaining} ngày</span>
              </div>
              <div className="mt-2">
                <Progress
                  percent={Math.min(100, Math.round((daysRemaining / 30) * 100))}
                  showInfo={false}
                  strokeColor={{ "0%": "#38bdf8", "100%": "#0284c7" }}
                  strokeWidth={7}
                  trailColor="rgba(0,0,0,0.04)"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-text-secondary">
                <span>Hết hạn: {currentExpiryDate}</span>
                <span className="text-emerald-600">Đầy đủ quyền lợi</span>
              </div>
            </div>

            {/* Auto-renew Switch */}
            <div className="mt-4 flex items-center justify-between border-t border-black/[0.04] dark:border-white/[0.06] pt-3.5">
              <div className="flex items-center gap-2">
                <RefreshCw size={14} className="text-sky-500" />
                <span className="text-xs font-bold text-text-primary">Tự động gia hạn</span>
              </div>
              <Switch
                checked={autoRenew}
                onChange={(checked) => {
                  setAutoRenew(checked);
                  toast.info(checked ? "Đã bật tự động gia hạn gói hàng tháng." : "Đã tắt tự động gia hạn. Gói sẽ hết hạn sau chu kỳ hiện tại.");
                }}
              />
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => handleOpenCheckout(currentPlan, 1)}
                className="clay-btn clay-btn-sky flex-1 py-2.5 text-xs sm:text-sm shadow-[0_8px_20px_-4px_rgba(14,165,233,0.4)]"
              >
                Gia hạn ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Billing Cycle Switcher Toggle */}
      <div className="flex flex-col items-center justify-center">
        <div className="inline-flex items-center rounded-2xl bg-surface p-1.5 border border-sky-200/80 dark:border-white/10 shadow-[0_8px_24px_-6px_rgba(14,165,233,0.12),inset_0_1.5px_2px_rgba(255,255,255,0.9)]">
          <button
            type="button"
            onClick={() => setBillingCycle("MONTHLY")}
            className={`px-5 py-2 text-xs font-extrabold rounded-xl transition-all ${
              billingCycle === "MONTHLY"
                ? "bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-[0_4px_12px_rgba(14,165,233,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.4)]"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Thanh toán hàng tháng
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("ANNUAL")}
            className={`flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold rounded-xl transition-all ${
              billingCycle === "ANNUAL"
                ? "bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-[0_4px_12px_rgba(14,165,233,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.4)]"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <span>Thanh toán hàng năm</span>
            <span className="rounded-full bg-amber-400 text-amber-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider animate-pulse">
              Tiết kiệm 66%
            </span>
          </button>
        </div>
      </div>

      {/* 3. Subscription Pricing Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {filteredPlans.map((plan) => {
          const isCurrent = plan.code === currentPlanCode;
          const isPopular = plan.badge === "POPULAR" || plan.badge === "BEST_VALUE";

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-[32px] p-6 sm:p-8 transition-all duration-300 ${
                isPopular
                  ? "bg-gradient-to-b from-[#ffffff] via-[#f0f9ff] to-[#e0f2fe] dark:from-[#0f243d] dark:via-[#0b1b2d] dark:to-[#071322] border-2 border-sky-400 dark:border-sky-500 shadow-[0_24px_50px_-10px_rgba(14,165,233,0.25),inset_0_2px_2px_rgba(255,255,255,1)] scale-[1.02] z-10"
                  : "clay-card hover:scale-[1.01]"
              }`}
            >
              {/* Popular / Best value badge floating atop */}
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-1 text-xs font-black uppercase tracking-wider shadow-[0_6px_16px_rgba(14,165,233,0.5),inset_0_1px_1px_rgba(255,255,255,0.6)]">
                    <Sparkles size={13} className="text-amber-300" />
                    {plan.badge === "BEST_VALUE" ? "Gói Đáng Mua Nhất" : "Gói Phổ Biến Nhất"}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-black text-text-primary tracking-tight">{plan.name}</h3>
                  {isCurrent && (
                    <span className="rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 text-[11px] font-extrabold px-2.5 py-0.5 border border-sky-500/30">
                      Gói hiện tại
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs sm:text-sm text-text-secondary min-h-[40px] leading-relaxed">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="mt-5 border-b border-black/[0.05] dark:border-white/[0.06] pb-5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-3xl sm:text-4xl font-black text-text-primary tracking-tight">
                      {plan.price === 0 ? "Miễn phí" : `${(plan.price).toLocaleString("vi-VN")} đ`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-xs font-bold text-text-secondary">
                        / {plan.billingCycle === "ANNUAL" ? "năm" : "tháng"}
                      </span>
                    )}
                  </div>

                  {plan.annualSavingsText && (
                    <div className="mt-1 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                      ✨ {plan.annualSavingsText}
                    </div>
                  )}
                </div>

                {/* Plan Highlights & Features List */}
                <div className="mt-6 space-y-3">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">
                    Quyền lợi bao gồm:
                  </div>

                  {plan.features.map((feat) => (
                    <div key={feat.id} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          feat.included
                            ? "bg-sky-500/20 text-sky-600 dark:text-sky-400"
                            : "bg-black/5 text-text-secondary/40 dark:bg-white/5"
                        }`}
                      >
                        <Check size={11} className={feat.included ? "stroke-[3]" : "opacity-30"} />
                      </div>
                      <span className={feat.included ? "font-semibold text-text-primary" : "text-text-secondary/60 line-through"}>
                        {feat.name}
                        {feat.limitLabel && (
                          <span className="ml-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                            ({feat.limitLabel})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action CTA Button */}
              <div className="mt-8 pt-4">
                <button
                  type="button"
                  onClick={() => handleOpenCheckout(plan, plan.billingCycle === "ANNUAL" ? 12 : 1)}
                  className={`w-full py-3.5 text-sm font-extrabold rounded-2xl transition-all cursor-pointer ${
                    isPopular
                      ? "clay-btn clay-btn-sky shadow-[0_12px_28px_-4px_rgba(14,165,233,0.5)]"
                      : isCurrent
                      ? "clay-btn clay-btn-sky"
                      : "clay-card-interactive text-text-primary hover:text-sky-600 hover:border-sky-300 py-3.5 flex items-center justify-center font-bold text-sm"
                  }`}
                >
                  {isCurrent
                    ? "Gia hạn gói này"
                    : plan.price === 0
                    ? "Bắt đầu dùng thử miễn phí"
                    : `Đăng ký ngay (${(plan.price).toLocaleString("vi-VN")} đ)`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Feature Comparison Matrix */}
      <div className="clay-card p-6 sm:p-8">
        <div className="flex items-center gap-2.5 pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 shadow-2xs">
            <Trophy size={16} />
          </div>
          <h2 className="font-display text-lg font-black text-text-primary">
            So sánh chi tiết tính năng giữa các gói
          </h2>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.08]">
                <th className="py-3.5 pr-4 font-bold text-text-secondary text-xs uppercase tracking-wider">Tính năng</th>
                <th className="py-3.5 px-4 font-bold text-text-primary text-center">Calis Trial</th>
                <th className="py-3.5 px-4 font-bold text-text-primary text-center">Calis Pro</th>
                <th className="py-3.5 px-4 font-black text-sky-600 text-center">Calis Premium / Annual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05] text-xs sm:text-sm">
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-text-primary">Kho bài tập Calisthenics chuẩn hóa</td>
                <td className="py-3.5 px-4 text-center text-text-secondary">Cơ bản (50 bài)</td>
                <td className="py-3.5 px-4 text-center font-semibold text-text-primary">Đầy đủ (300+ bài)</td>
                <td className="py-3.5 px-4 text-center font-bold text-sky-600">Toàn bộ 500+ bài & Video 4K</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-text-primary">Lộ trình kỹ năng 3D (Muscle-up, Planche, Flag)</td>
                <td className="py-3.5 px-4 text-center text-text-secondary">1 kỹ năng cơ bản</td>
                <td className="py-3.5 px-4 text-center font-semibold text-text-primary">Mở khóa theo cấp</td>
                <td className="py-3.5 px-4 text-center font-bold text-sky-600">Mở khóa toàn bộ & Tùy chỉnh</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-text-primary">Phân tích chuyển động AI Vision Motion</td>
                <td className="py-3.5 px-4 text-center text-text-secondary">3 lần test</td>
                <td className="py-3.5 px-4 text-center font-semibold text-text-primary">15 lần / tháng</td>
                <td className="py-3.5 px-4 text-center font-bold text-sky-600">Không giới hạn 24/7</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-text-primary">Trợ lý AI Huấn luyện viên thông minh</td>
                <td className="py-3.5 px-4 text-center text-text-secondary">—</td>
                <td className="py-3.5 px-4 text-center text-text-secondary">—</td>
                <td className="py-3.5 px-4 text-center font-bold text-sky-600">Đầy đủ tính năng 24/7</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-text-primary">Chấm form & tư vấn 1-1 từ Master Coach</td>
                <td className="py-3.5 px-4 text-center text-text-secondary">—</td>
                <td className="py-3.5 px-4 text-center text-text-secondary">—</td>
                <td className="py-3.5 px-4 text-center font-bold text-sky-600">Ưu tiên hỗ trợ hàng tuần</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Payment Transaction History */}
      <div className="clay-card p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 shadow-2xs">
              <FileText size={16} />
            </div>
            <h2 className="font-display text-lg font-black text-text-primary">
              Lịch sử giao dịch & Hóa đơn
            </h2>
          </div>
          <span className="text-xs font-bold text-text-secondary">
            Hiển thị các giao dịch gần nhất
          </span>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.08] text-text-secondary text-xs uppercase tracking-wider">
                <th className="py-3 pr-4 font-bold">Mã GD</th>
                <th className="py-3 px-4 font-bold">Gói dịch vụ</th>
                <th className="py-3 px-4 font-bold">Số tiền</th>
                <th className="py-3 px-4 font-bold">Phương thức</th>
                <th className="py-3 px-4 font-bold">Thời gian</th>
                <th className="py-3 px-4 font-bold text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
              {MOCK_PAYMENT_TRANSACTIONS.slice(0, 4).map((tx) => (
                <tr key={tx.id} className="hover:bg-sky-500/[0.02] transition-colors">
                  <td className="py-3.5 pr-4 font-mono font-bold text-sky-700 dark:text-sky-400">{tx.transactionCode}</td>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">{tx.planName}</td>
                  <td className="py-3.5 px-4 font-bold text-text-primary">{tx.amount.toLocaleString("vi-VN")} đ</td>
                  <td className="py-3.5 px-4 font-medium text-text-secondary">{tx.paymentMethod}</td>
                  <td className="py-3.5 px-4 text-text-secondary">{tx.createdAt}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-500/25">
                      <CheckCircle2 size={11} />
                      Thành công
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. FAQ Section */}
      <div className="clay-card p-6 sm:p-8">
        <div className="flex items-center gap-2.5 pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 shadow-2xs">
            <HelpCircle size={16} />
          </div>
          <h2 className="font-display text-lg font-black text-text-primary">
            Câu hỏi thường gặp về gói dịch vụ
          </h2>
        </div>

        <div className="mt-5 space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-surface border border-sky-200/60 dark:border-white/5 overflow-hidden transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left font-bold text-sm text-text-primary hover:text-sky-600 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={16} className="text-sky-600" /> : <ChevronDown size={16} className="text-text-secondary" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs sm:text-sm leading-relaxed text-text-secondary font-medium border-t border-black/[0.03] dark:border-white/[0.03] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Interactive Checkout / Plan Renewal Modal with VietQR */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedPlan={selectedPlanForCheckout}
        selectedDurationMonths={selectedDurationMonths}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}

function CheckoutModal({
  isOpen,
  onClose,
  selectedPlan,
  selectedDurationMonths,
  onSuccess,
}: CheckoutModalProps) {
  const [durationMonths, setDurationMonths] = useState<number>(selectedDurationMonths);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [discountCode, setDiscountCode] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentStep, setPaymentStep] = useState<"SELECT" | "PAYING" | "CONFIRMED">("SELECT");

  if (!isOpen || !selectedPlan) return null;

  const basePrice = selectedPlan.price * durationMonths;
  const durationDiscount = durationMonths >= 12 ? 0.25 : durationMonths >= 6 ? 0.15 : durationMonths >= 3 ? 0.1 : 0;
  const totalDiscountPercent = discountPercent + durationDiscount;
  const finalPrice = Math.round(basePrice * (1 - totalDiscountPercent));

  const handleApplyVoucher = () => {
    const code = discountCode.trim().toUpperCase();
    if (code === "CALISVIP" || code === "FLAG2026" || code === "SKYBLUE") {
      setDiscountPercent(0.2); // 20% off
      toast.success("Áp dụng mã giảm giá 20% thành công!");
    } else {
      toast.error("Mã giảm giá không hợp lệ hoặc đã hết hạn.");
    }
  };

  const handleStartPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStep("PAYING");
    }, 600);
  };

  const handleSimulatePaymentComplete = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStep("CONFIRMED");
      setTimeout(() => {
        onSuccess(selectedPlan.name, durationMonths);
      }, 1200);
    }, 1000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-[36px] bg-surface p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(14,165,233,0.3),inset_0_2.5px_3px_rgba(255,255,255,1)] border border-sky-200/80 dark:border-white/10 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {paymentStep === "SELECT" && (
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-sky-800 dark:text-sky-300">
              <Sparkles size={12} className="text-amber-500" />
              <span>Đăng Ký & Gia Hạn Gói</span>
            </div>

            <h2 className="mt-3 font-display text-2xl font-black text-text-primary">
              Xác nhận đơn hàng: {selectedPlan.name}
            </h2>

            {/* Duration Selector Buttons */}
            <div className="mt-5">
              <label className="block text-xs font-bold text-text-secondary mb-2">
                Chọn thời hạn gia hạn
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { m: 1, label: "1 Tháng", badge: null },
                  { m: 3, label: "3 Tháng", badge: "-10%" },
                  { m: 6, label: "6 Tháng", badge: "-15%" },
                  { m: 12, label: "12 Tháng", badge: "-25%" },
                ].map((item) => (
                  <button
                    key={item.m}
                    type="button"
                    onClick={() => setDurationMonths(item.m)}
                    className={`relative rounded-2xl p-3 text-center transition-all cursor-pointer ${
                      durationMonths === item.m
                        ? "bg-sky-500/15 border-2 border-sky-500 text-sky-700 dark:text-sky-300 font-black shadow-2xs"
                        : "bg-surface border border-black/5 dark:border-white/5 text-text-secondary font-bold hover:border-sky-300"
                    }`}
                  >
                    {item.badge && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 text-amber-950 px-1.5 py-0.2 text-[9px] font-black">
                        {item.badge}
                      </span>
                    )}
                    <div className="text-xs">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mt-5">
              <label className="block text-xs font-bold text-text-secondary mb-2">
                Phương thức thanh toán
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("BANK_TRANSFER")}
                  className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                    paymentMethod === "BANK_TRANSFER"
                      ? "bg-sky-500/15 border-2 border-sky-500 text-sky-700 dark:text-sky-300 font-extrabold"
                      : "bg-surface border border-black/5 dark:border-white/5 text-text-secondary font-semibold hover:border-sky-300"
                  }`}
                >
                  <QrCode size={20} className="text-sky-600" />
                  <span className="text-[11px]">VietQR Tức thì</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("MOMO")}
                  className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                    paymentMethod === "MOMO"
                      ? "bg-sky-500/15 border-2 border-sky-500 text-sky-700 dark:text-sky-300 font-extrabold"
                      : "bg-surface border border-black/5 dark:border-white/5 text-text-secondary font-semibold hover:border-sky-300"
                  }`}
                >
                  <CreditCard size={20} className="text-pink-500" />
                  <span className="text-[11px]">Ví MoMo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CREDIT_CARD")}
                  className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                    paymentMethod === "CREDIT_CARD"
                      ? "bg-sky-500/15 border-2 border-sky-500 text-sky-700 dark:text-sky-300 font-extrabold"
                      : "bg-surface border border-black/5 dark:border-white/5 text-text-secondary font-semibold hover:border-sky-300"
                  }`}
                >
                  <CreditCard size={20} className="text-blue-600" />
                  <span className="text-[11px]">Visa / Master</span>
                </button>
              </div>
            </div>

            {/* Voucher Code Box */}
            <div className="mt-5">
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Mã ưu đãi (Voucher giảm giá)
              </label>
              <div className="flex gap-2">
                <div className="clay-input-well flex-1 flex items-center px-3 py-1.5">
                  <Gift size={15} className="text-sky-600 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Nhập mã (ví dụ: CALISVIP)"
                    className="w-full bg-transparent text-xs font-bold uppercase placeholder:normal-case placeholder:font-normal text-text-primary focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  className="rounded-2xl bg-sky-500/15 px-4 py-2 text-xs font-extrabold text-sky-700 dark:text-sky-300 hover:bg-sky-500/25 border border-sky-500/30 transition-colors cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Order Summary Box */}
            <div className="mt-5 rounded-2xl bg-sky-500/5 p-4 border border-sky-500/15 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-text-secondary">
                <span>Gói dịch vụ</span>
                <span className="text-text-primary font-bold">{selectedPlan.name} ({durationMonths} tháng)</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-text-secondary">
                <span>Đơn giá gốc</span>
                <span>{basePrice.toLocaleString("vi-VN")} đ</span>
              </div>
              {totalDiscountPercent > 0 && (
                <div className="flex justify-between text-xs font-bold text-emerald-600">
                  <span>Ưu đãi & Giảm giá</span>
                  <span>-{Math.round(basePrice * totalDiscountPercent).toLocaleString("vi-VN")} đ (-{Math.round(totalDiscountPercent * 100)}%)</span>
                </div>
              )}
              <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-2 flex justify-between items-baseline">
                <span className="text-sm font-black text-text-primary">Tổng thanh toán:</span>
                <span className="font-display text-2xl font-black text-sky-600">
                  {finalPrice.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleStartPayment}
              disabled={isProcessing}
              className="clay-btn clay-btn-sky w-full mt-6 py-3.5 text-base shadow-[0_12px_28px_-4px_rgba(14,165,233,0.5)]"
            >
              {isProcessing ? "Đang tạo cổng thanh toán..." : "Tiếp tục thanh toán VietQR"}
            </button>
          </div>
        )}

        {paymentStep === "PAYING" && (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black uppercase text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Chờ quét mã VietQR tự động</span>
            </div>

            <h3 className="mt-2 text-xl font-black text-text-primary">
              Quét mã QR để hoàn tất đăng ký
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Mở ứng dụng Mobile Banking của ngân hàng bất kỳ để quét mã
            </p>

            {/* Generated Real VietQR Code Frame */}
            <div className="mt-5 inline-block p-4 rounded-3xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] border-2 border-sky-300">
              <img
                src={`https://api.vietqr.io/image/970436-102873491823-compact2.png?amount=${finalPrice}&addInfo=CALIS%20${selectedPlan.code}%20${durationMonths}T&accountName=CALISTHENICS%20PRO%20VIETNAM`}
                alt="VietQR Payment Code"
                className="w-52 h-52 sm:w-60 sm:h-60 mx-auto object-contain"
              />
              <div className="mt-2 text-[11px] font-bold text-sky-800">
                Hỗ trợ 40+ Ngân hàng VN & Ví Điện Tử
              </div>
            </div>

            {/* Account Details Copy Table */}
            <div className="mt-4 rounded-2xl bg-sky-500/5 p-3.5 border border-sky-500/15 text-left text-xs space-y-2 max-w-sm mx-auto">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary font-medium">Ngân hàng:</span>
                <span className="font-bold text-text-primary">Vietcombank (VCB)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary font-medium">Số tài khoản:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard("102873491823", "Số tài khoản")}
                  className="font-mono font-bold text-sky-600 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>102873491823</span>
                  <Copy size={12} />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary font-medium">Nội dung CK:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`CALIS ${selectedPlan.code} ${durationMonths}T`, "Nội dung chuyển khoản")}
                  className="font-mono font-bold text-sky-600 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>CALIS {selectedPlan.code} {durationMonths}T</span>
                  <Copy size={12} />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary font-medium">Số tiền:</span>
                <span className="font-extrabold text-text-primary">{finalPrice.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>

            {/* Simulator Button */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setPaymentStep("SELECT")}
                className="clay-card-interactive flex-1 py-3 text-xs font-bold text-text-secondary"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleSimulatePaymentComplete}
                disabled={isProcessing}
                className="clay-btn clay-btn-sky flex-1 py-3 text-xs sm:text-sm font-black shadow-[0_8px_20px_-4px_rgba(14,165,233,0.4)]"
              >
                {isProcessing ? "Đang xác nhận GD..." : "Tôi đã chuyển khoản xong ✓"}
              </button>
            </div>
          </div>
        )}

        {paymentStep === "CONFIRMED" && (
          <div className="text-center py-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 shadow-inner animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="mt-4 font-display text-2xl font-black text-text-primary">
              Gia hạn thành công! 🎉
            </h3>
            <p className="mt-2 text-sm text-text-secondary font-medium max-w-sm mx-auto">
              Hệ thống đã kích hoạt toàn bộ quyền lợi của <strong>{selectedPlan.name}</strong> vào tài khoản của bạn.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
