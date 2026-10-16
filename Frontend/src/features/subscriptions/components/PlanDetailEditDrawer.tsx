import React, { useState, useEffect } from "react";
import { X, Check, Save, Layers, DollarSign, ShieldCheck, Gauge, BarChart3 } from "lucide-react";
import { SubscriptionPlan, BillingCycle, PlanFeature } from "../types/subscription.types";
import { BILLING_CYCLE_LABELS } from "../constants/subscription.constants";

interface PlanDetailEditDrawerProps {
  plan: SubscriptionPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<SubscriptionPlan>) => Promise<void>;
}

type DrawerTab = "basic" | "pricing" | "features" | "limits" | "analytics";

export const PlanDetailEditDrawer: React.FC<PlanDetailEditDrawerProps> = ({
  plan,
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<DrawerTab>("basic");
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [trialDays, setTrialDays] = useState(7);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [badge, setBadge] = useState<"POPULAR" | "BEST_VALUE" | "TRIAL" | undefined>(undefined);
  const [features, setFeatures] = useState<PlanFeature[]>([]);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setCode(plan.code);
      setDescription(plan.description);
      setPrice(plan.price);
      setBillingCycle(plan.billingCycle);
      setTrialDays(plan.trialDays);
      setStatus(plan.status);
      setBadge(plan.badge);
      setFeatures(plan.features || []);
    }
  }, [plan]);

  if (!isOpen || !plan) return null;

  const handleToggleFeature = (id: string) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, included: !f.included } : f))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(plan.id, {
        name,
        code,
        description,
        price,
        billingCycle,
        trialDays,
        status,
        badge,
        features,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { key: DrawerTab; label: string; icon: React.ReactNode }[] = [
    { key: "basic", label: "Thông tin cơ bản", icon: <Layers className="h-3.5 w-3.5" /> },
    { key: "pricing", label: "Giá & Chu kỳ", icon: <DollarSign className="h-3.5 w-3.5" /> },
    { key: "features", label: "Quyền sử dụng", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
    { key: "limits", label: "Giới hạn", icon: <Gauge className="h-3.5 w-3.5" /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="flex w-screen max-w-xl flex-col bg-white shadow-2xl dark:bg-zinc-900">
          {/* Header */}
          <div className="border-b border-[#E3E7DF] p-5 dark:border-zinc-800">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C9B5B]">
                  Cấu hình gói hội viên
                </span>
                <h3 className="text-lg font-black text-[#172019] dark:text-white mt-0.5">
                  {plan.name}
                </h3>
                <span className="text-xs font-mono text-zinc-400">{plan.code}</span>
              </div>
              <button onClick={onClose} className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab switchers */}
            <div className="mt-4 flex items-center gap-1.5 overflow-x-auto border-b border-[#F0F2ED] pb-1 no-scrollbar dark:border-zinc-800">
              {tabs.map((t) => {
                const isActive = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-[#EEF4E8] text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "text-[#687268] hover:bg-zinc-50 hover:text-[#172019] dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 bg-[#F7F8F4] space-y-4 text-xs dark:bg-zinc-950">
            {activeTab === "basic" && (
              <div className="rounded-2xl border border-[#E3E7DF] bg-white p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                  <label className="block font-semibold text-[#172019] mb-1 dark:text-zinc-200">
                    Tên hiển thị gói
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 w-full rounded-xl border border-[#E3E7DF] px-3 text-sm focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172019] mb-1 dark:text-zinc-200">
                    Mã code gói (Unique)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="h-9 w-full rounded-xl border border-[#E3E7DF] px-3 font-mono text-sm uppercase focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172019] mb-1 dark:text-zinc-200">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-[#E3E7DF] p-2.5 text-sm focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172019] mb-1 dark:text-zinc-200">
                    Trạng thái phát hành
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                    className="h-9 w-full rounded-xl border border-[#E3E7DF] px-3 text-xs font-semibold focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                    <option value="INACTIVE">Tạm dừng phát hành (INACTIVE)</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === "pricing" && (
              <div className="rounded-2xl border border-[#E3E7DF] bg-white p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#172019] mb-1 dark:text-zinc-200">
                      Giá niêm yết (VND)
                    </label>
                    <input
                      type="number"
                      step={1000}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="h-9 w-full rounded-xl border border-[#E3E7DF] px-3 text-sm font-bold focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#172019] mb-1 dark:text-zinc-200">
                      Chu kỳ thanh toán
                    </label>
                    <select
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                      className="h-9 w-full rounded-xl border border-[#E3E7DF] px-3 text-xs font-semibold focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    >
                      <option value="TRIAL">Dùng thử 7 ngày (TRIAL)</option>
                      <option value="MONTHLY">Hàng tháng (MONTHLY)</option>
                      <option value="ANNUAL">Hàng năm (ANNUAL)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#172019] mb-1 dark:text-zinc-200">
                    Số ngày Free Trial
                  </label>
                  <input
                    type="number"
                    value={trialDays}
                    onChange={(e) => setTrialDays(Number(e.target.value))}
                    className="h-9 w-full rounded-xl border border-[#E3E7DF] px-3 text-sm focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            )}

            {activeTab === "features" && (
              <div className="rounded-2xl border border-[#E3E7DF] bg-white p-4 space-y-2 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="font-bold text-[#172019] block mb-2 dark:text-zinc-200">
                  Cấu hình các module tính năng:
                </span>
                {features.map((f) => (
                  <label
                    key={f.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[#E3E7DF] bg-white hover:bg-[#F7F8F4] cursor-pointer transition-colors dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <div className="flex items-center gap-2">
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
                  </label>
                ))}
              </div>
            )}

            {activeTab === "limits" && (
              <div className="rounded-2xl border border-[#E3E7DF] bg-white p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#F7F8F4] rounded-xl dark:bg-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">AI Coach Sessions</span>
                    <span className="font-bold text-[#172019] dark:text-white">Không giới hạn</span>
                  </div>
                  <div className="p-3 bg-[#F7F8F4] rounded-xl dark:bg-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">AI Vision Analysis</span>
                    <span className="font-bold text-[#172019] dark:text-white">Real-Time</span>
                  </div>
                  <div className="p-3 bg-[#F7F8F4] rounded-xl dark:bg-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Đánh giá thể chất</span>
                    <span className="font-bold text-[#172019] dark:text-white">Không giới hạn</span>
                  </div>
                  <div className="p-3 bg-[#F7F8F4] rounded-xl dark:bg-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Lưu trữ lịch sử</span>
                    <span className="font-bold text-[#172019] dark:text-white">365 ngày</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="rounded-2xl border border-[#E3E7DF] bg-white p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-[#F7F8F4] rounded-xl dark:bg-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Subscribers</span>
                    <span className="font-black text-sm text-[#172019] dark:text-white">{plan.subscriberCount}</span>
                  </div>
                  <div className="p-2.5 bg-[#F7F8F4] rounded-xl dark:bg-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">MRR</span>
                    <span className="font-black text-sm text-[#55733C] dark:text-emerald-400">{(plan.mrr / 1000000).toFixed(1)}tr</span>
                  </div>
                  <div className="p-2.5 bg-[#F7F8F4] rounded-xl dark:bg-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Churn Rate</span>
                    <span className="font-black text-sm text-orange-600">{plan.churnRate}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[#E3E7DF] p-4 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <button
              onClick={onClose}
              className="rounded-xl border border-[#E3E7DF] px-4 py-2 text-xs font-semibold text-[#687268] hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Hủy
            </button>
            <button
              disabled={isSaving}
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C9B5B] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#55733C] disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
