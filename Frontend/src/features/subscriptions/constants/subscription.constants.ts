import {
  SubscriptionStatus,
  PaymentStatus,
  PaymentMethod,
  BillingCycle,
  SubscriptionFilterState,
  PlanFeature,
} from "../types/subscription.types";

export const SUBSCRIPTION_STATUS_STYLES: Record<
  SubscriptionStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  TRIAL: {
    label: "Dùng thử (7 ngày)",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    dotClass: "bg-blue-500",
  },
  ACTIVE: {
    label: "Đang hoạt động",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  PAST_DUE: {
    label: "Quá hạn thanh toán",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  GRACE_PERIOD: {
    label: "Gia hạn tạm thời",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    dotClass: "bg-purple-500 animate-pulse",
  },
  CANCELLED: {
    label: "Đã hủy tự gia hạn",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
    dotClass: "bg-orange-500",
  },
  EXPIRED: {
    label: "Đã hết hạn",
    badgeClass: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    dotClass: "bg-zinc-400",
  },
};

export const PAYMENT_STATUS_STYLES: Record<
  PaymentStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  SUCCESS: {
    label: "Thành công",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  PENDING: {
    label: "Đang xử lý",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500 animate-pulse",
  },
  FAILED: {
    label: "Thất bại",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-500",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    dotClass: "bg-purple-500",
  },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { label: string; color: string }> = {
  VNPAY: { label: "VNPay QR", color: "text-blue-600" },
  MOMO: { label: "Ví MoMo", color: "text-pink-600" },
  BANK_TRANSFER: { label: "Chuyển khoản NH", color: "text-emerald-600" },
  CREDIT_CARD: { label: "Thẻ Visa / Master", color: "text-indigo-600" },
};

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  TRIAL: "Dùng thử 7 ngày",
  MONTHLY: "Hàng tháng",
  ANNUAL: "Hàng năm",
};

export const DEFAULT_SUBSCRIPTION_FILTERS: SubscriptionFilterState = {
  searchQuery: "",
  plan: "all",
  billingCycle: "all",
  status: "all",
  paymentStatus: "all",
  timeframe: "30d",
  autoRenewalOnly: false,
  atRiskOnly: false,
};

export const STANDARD_PLAN_FEATURES: PlanFeature[] = [
  { id: "f1", name: "Thư viện bài tập cơ bản", included: true, category: "core" },
  { id: "f2", name: "Thư viện bài tập trung cấp & nâng cao", included: true, category: "library" },
  { id: "f3", name: "Lộ trình tập luyện cá nhân hóa (Personalized Workout)", included: true, category: "core" },
  { id: "f4", name: "Đánh giá thể lực định kỳ (Periodic Assessment)", included: true, category: "assessment" },
  { id: "f5", name: "Trợ lý AI Huấn luyện viên (AI Coach 24/7)", included: true, category: "ai" },
  { id: "f6", name: "Phân tích chuyển động AI Vision (AI Motion Analysis)", included: true, category: "ai" },
  { id: "f7", name: "Theo dõi tiến độ & Kỷ lục PRs không giới hạn", included: true, category: "core" },
  { id: "f8", name: "Hệ thống danh hiệu & Huy hiệu CalisHealth", included: true, category: "coaching" },
];
