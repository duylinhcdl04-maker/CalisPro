import React, { useState } from "react";
import { X, Check, ArrowRight, ArrowLeft, Plus, Sparkles, CheckCircle2 } from "lucide-react";
import { SubscriptionPlan, BillingCycle, PlanFeature } from "../types/subscription.types";
import { STANDARD_PLAN_FEATURES, BILLING_CYCLE_LABELS } from "../constants/subscription.constants";

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlan: (plan: Omit<SubscriptionPlan, "id" | "createdAt" | "updatedAt">) => Promise<void>;
}

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen,
  onClose,
  onCreatePlan,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<number>(199000);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [trialDays, setTrialDays] = useState<number>(7);
  const [badge, setBadge] = useState<"POPULAR" | "BEST_VALUE" | undefined>(undefined);
  const [features, setFeatures] = useState<PlanFeature[]>(STANDARD_PLAN_FEATURES);

  if (!isOpen) return null;

  const handleToggleFeature = (id: string) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, included: !f.included } : f))
    );
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await onCreatePlan({
        name,
        code: code.toUpperCase(),
        description,
        price,
        currency: "VND",
        billingCycle,
        trialDays,
        status: "ACTIVE",
        badge,
        subscriberCount: 0,
        mrr: 0,
        churnRate: 0,
        features,
        limits: {
          aiCoachingSessions: "UNLIMITED",
          aiMotionAnalysis: "UNLIMITED",
          assessmentsPerMonth: 2,
          workoutPlans: "UNLIMITED",
          workoutHistoryDays: 365,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-3xl border border-[#E3E7DF] bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0F2ED] pb-4 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#EEF4E8] px-2.5 py-0.5 text-xs font-bold text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
                Bước {step} / 5
              </span>
              <h3 className="text-base font-bold text-[#172019] dark:text-white">
                Tạo Gói Hội viên mới
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-[#687268] dark:text-zinc-400">
              Thiết lập chính sách giá, quyền lợi và giới hạn tính năng
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between my-5">
          {["Thông tin cơ bản", "Giá & Chu kỳ", "Quyền lợi", "Giới hạn", "Xem trước & Tạo"].map(
            (label, idx) => {
              const current = idx + 1;
              const isCompleted = step > current;
              const isActive = step === current;

              return (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full font-bold transition-all ${
                      isActive
                        ? "bg-[#7C9B5B] text-white"
                        : isCompleted
                        ? "bg-[#EEF4E8] text-[#55733C]"
                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : `0${current}`}
                  </div>
                  <span className="hidden sm:inline font-semibold text-[#172019] dark:text-zinc-300 text-[11px]">
                    {label}
                  </span>
                </div>
              );
            }
          )}
        </div>

        {/* Step Contents */}
        <div className="min-h-[260px] py-2">
          {step === 1 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172019] mb-1.5 dark:text-zinc-200">
                  Tên gói hội viên *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Calis VIP Elite Coaching"
                  className="h-10 w-full rounded-xl border border-[#E3E7DF] px-3 text-sm focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172019] mb-1.5 dark:text-zinc-200">
                  Mã định danh gói (Code) *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ví dụ: CALIS_VIP_ELITE"
                  className="h-10 w-full rounded-xl border border-[#E3E7DF] px-3 font-mono text-sm uppercase focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172019] mb-1.5 dark:text-zinc-200">
                  Mô tả ngắn về gói
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả giá trị nổi bật của gói dành cho học viên..."
                  className="w-full rounded-xl border border-[#E3E7DF] p-3 text-sm focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172019] mb-1.5 dark:text-zinc-200">
                    Giá cước (VND) *
                  </label>
                  <input
                    type="number"
                    step={1000}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-[#E3E7DF] px-3 text-sm font-bold focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172019] mb-1.5 dark:text-zinc-200">
                    Chu kỳ thanh toán
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                    className="h-10 w-full rounded-xl border border-[#E3E7DF] px-3 text-xs font-semibold focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="TRIAL">Dùng thử (Trial)</option>
                    <option value="MONTHLY">Hàng tháng (Monthly)</option>
                    <option value="ANNUAL">Hàng năm (Annual)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172019] mb-1.5 dark:text-zinc-200">
                  Số ngày dùng thử miễn phí (Trial Days)
                </label>
                <input
                  type="number"
                  value={trialDays}
                  onChange={(e) => setTrialDays(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-[#E3E7DF] px-3 text-sm focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172019] mb-1.5 dark:text-zinc-200">
                  Huy hiệu nổi bật (Badge)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBadge(badge === "POPULAR" ? undefined : "POPULAR")}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      badge === "POPULAR"
                        ? "border-[#7C9B5B] bg-[#EEF4E8] text-[#55733C]"
                        : "border-[#E3E7DF] text-zinc-500"
                    }`}
                  >
                    ★ POPULAR (Phổ biến)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBadge(badge === "BEST_VALUE" ? undefined : "BEST_VALUE")}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      badge === "BEST_VALUE"
                        ? "border-amber-400 bg-amber-50 text-amber-800"
                        : "border-[#E3E7DF] text-zinc-500"
                    }`}
                  >
                    ⚡ BEST VALUE (Giá tốt nhất)
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2.5 text-xs max-h-[260px] overflow-y-auto pr-1">
              <span className="font-semibold text-[#172019] block mb-2 dark:text-zinc-200">
                Chọn các tính năng được kích hoạt trong gói:
              </span>
              {features.map((f) => (
                <label
                  key={f.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#E3E7DF] bg-white hover:bg-[#F7F8F4] cursor-pointer transition-colors dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={f.included}
                      onChange={() => handleToggleFeature(f.id)}
                      className="rounded text-[#7C9B5B] focus:ring-[#7C9B5B]"
                    />
                    <span className="font-semibold text-[#172019] dark:text-zinc-200">
                      {f.name}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400">
                    {f.category}
                  </span>
                </label>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#F7F8F4] border border-[#E3E7DF] dark:border-zinc-700 dark:bg-zinc-800">
                  <span className="text-zinc-500 block">AI Coaching Sessions:</span>
                  <span className="font-bold text-sm text-[#172019] dark:text-white">Không giới hạn (Unlimited)</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F7F8F4] border border-[#E3E7DF] dark:border-zinc-700 dark:bg-zinc-800">
                  <span className="text-zinc-500 block">AI Motion Analysis:</span>
                  <span className="font-bold text-sm text-[#172019] dark:text-white">Không giới hạn (Real-Time)</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F7F8F4] border border-[#E3E7DF] dark:border-zinc-700 dark:bg-zinc-800">
                  <span className="text-zinc-500 block">Đánh giá thể lực / tháng:</span>
                  <span className="font-bold text-sm text-[#172019] dark:text-white">Không giới hạn</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F7F8F4] border border-[#E3E7DF] dark:border-zinc-700 dark:bg-zinc-800">
                  <span className="text-zinc-500 block">Lưu lịch sử tập luyện:</span>
                  <span className="font-bold text-sm text-[#172019] dark:text-white">365 ngày</span>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="p-4 rounded-2xl border border-[#7C9B5B]/30 bg-[#EEF4E8]/50 space-y-3 text-xs dark:bg-emerald-950/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-[#172019] dark:text-white">{name || "Chưa đặt tên gói"}</h4>
                  <span className="font-mono text-zinc-500">{code || "CODE"}</span>
                </div>
                <span className="text-xl font-black text-[#55733C] dark:text-emerald-400">
                  {price.toLocaleString()}đ <span className="text-xs font-normal">/ {BILLING_CYCLE_LABELS[billingCycle]}</span>
                </span>
              </div>
              <p className="text-[#687268] dark:text-zinc-400">{description || "Chưa có mô tả"}</p>
              <div className="border-t border-[#7C9B5B]/20 pt-2 font-semibold text-[#55733C]">
                {features.filter((f) => f.included).length} tính năng kích hoạt
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#F0F2ED] pt-4 mt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="rounded-xl border border-[#E3E7DF] px-4 py-2 text-xs font-semibold text-[#687268] hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {step === 1 ? "Hủy" : "Quay lại"}
          </button>

          {step < 5 ? (
            <button
              type="button"
              disabled={step === 1 && (!name || !code)}
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C9B5B] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#55733C] disabled:opacity-50"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinish}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C9B5B] px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#55733C] disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? "Đang tạo..." : "Xác nhận & Tạo gói"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
