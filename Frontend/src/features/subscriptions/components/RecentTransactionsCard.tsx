import React from "react";
import { CreditCard, ChevronRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { PaymentTransaction } from "../types/subscription.types";
import { PAYMENT_STATUS_STYLES, PAYMENT_METHOD_LABELS } from "../constants/subscription.constants";

interface RecentTransactionsCardProps {
  transactions: PaymentTransaction[];
  onSelectTransaction?: (tx: PaymentTransaction) => void;
  onViewAll?: () => void;
}

export const RecentTransactionsCard: React.FC<RecentTransactionsCardProps> = ({
  transactions,
  onSelectTransaction,
  onViewAll,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172019] dark:text-white">
                Giao dịch thanh toán gần đây
              </h3>
              <p className="text-xs text-[#687268] dark:text-zinc-400">
                Lịch sử thanh toán thời gian thực qua cổng VNPay, MoMo, Ngân hàng
              </p>
            </div>
          </div>

          {onViewAll && (
            <button
              onClick={onViewAll}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#55733C] hover:underline dark:text-emerald-400"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Compact Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F0F2ED] text-[#687268] dark:border-zinc-800 dark:text-zinc-400">
                <th className="pb-2.5 font-semibold">Mã GD</th>
                <th className="pb-2.5 font-semibold">Người dùng</th>
                <th className="pb-2.5 font-semibold">Gói đăng ký</th>
                <th className="pb-2.5 font-semibold text-center">Phương thức</th>
                <th className="pb-2.5 font-semibold text-center">Trạng thái</th>
                <th className="pb-2.5 font-semibold text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2ED] dark:divide-zinc-800">
              {transactions.slice(0, 6).map((tx) => {
                const statusStyle = PAYMENT_STATUS_STYLES[tx.status] || PAYMENT_STATUS_STYLES.SUCCESS;
                const methodInfo = PAYMENT_METHOD_LABELS[tx.paymentMethod] || { label: tx.paymentMethod };

                return (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                    className="hover:bg-[#F7F8F4] dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 font-mono text-[11px] font-semibold text-zinc-500">
                      {tx.transactionCode}
                    </td>
                    <td className="py-2.5">
                      <div className="font-bold text-[#172019] dark:text-white">{tx.userName}</div>
                      <div className="text-[10px] text-zinc-400">{tx.createdAt}</div>
                    </td>
                    <td className="py-2.5 font-semibold text-[#172019] dark:text-zinc-200">
                      {tx.planName}
                    </td>
                    <td className="py-2.5 text-center text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      {methodInfo.label}
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotClass}`} />
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-black text-[#172019] dark:text-white">
                      {tx.amount.toLocaleString()}đ
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
