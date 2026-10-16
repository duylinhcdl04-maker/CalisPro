import React, { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
} from "lucide-react";
import { SubscriberRecord } from "../types/subscription.types";
import { SUBSCRIPTION_STATUS_STYLES, BILLING_CYCLE_LABELS } from "../constants/subscription.constants";

interface SubscriberTableProps {
  subscribers: SubscriberRecord[];
  isLoading?: boolean;
  onSelectSubscriber: (subscriber: SubscriberRecord) => void;
}

type SortField = "name" | "plan" | "expiry" | "paid" | "renewals";
type SortDirection = "asc" | "desc";

export const SubscriberTable: React.FC<SubscriberTableProps> = ({
  subscribers,
  isLoading,
  onSelectSubscriber,
}) => {
  const [sortField, setSortField] = useState<SortField>("expiry");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedList = useMemo(() => {
    const list = [...subscribers];
    list.sort((a, b) => {
      let valA: string | number = a.expiryDate;
      let valB: string | number = b.expiryDate;

      if (sortField === "name") {
        valA = a.userName;
        valB = b.userName;
      } else if (sortField === "plan") {
        valA = a.planName;
        valB = b.planName;
      } else if (sortField === "paid") {
        valA = a.totalPaid;
        valB = b.totalPaid;
      } else if (sortField === "renewals") {
        valA = a.consecutiveRenewals;
        valB = b.consecutiveRenewals;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
    return list;
  }, [subscribers, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedList.length / rowsPerPage) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedList.slice(start, start + rowsPerPage);
  }, [sortedList, currentPage, rowsPerPage]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-[#E3E7DF] bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8F4] text-[#687268] dark:bg-zinc-800/60 dark:text-zinc-300">
              <tr className="border-b border-[#E3E7DF] dark:border-zinc-800">
                <th
                  onClick={() => handleSort("name")}
                  className="cursor-pointer py-3.5 pr-4 pl-5 font-semibold transition-colors hover:text-[#172019] dark:hover:text-white"
                >
                  Học viên
                </th>
                <th className="px-3 py-3.5 font-semibold">Gói đăng ký</th>
                <th className="px-3 py-3.5 text-center font-semibold">Chu kỳ</th>
                <th className="px-3 py-3.5 text-center font-semibold">Bắt đầu</th>
                <th
                  onClick={() => handleSort("expiry")}
                  className="cursor-pointer px-3 py-3.5 text-center font-semibold transition-colors hover:text-[#172019] dark:hover:text-white"
                >
                  Hết hạn
                </th>
                <th className="px-3 py-3.5 text-center font-semibold">Auto-Renewal</th>
                <th className="px-3 py-3.5 text-right font-semibold">Đã thanh toán</th>
                <th className="px-3 py-3.5 text-center font-semibold">Trạng thái</th>
                <th className="py-3.5 pr-5 pl-3 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F0F2ED] dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#687268]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7C9B5B] border-t-transparent" />
                      <span>Đang tải danh sách hội viên...</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#687268] dark:text-zinc-400">
                    Không tìm thấy hội viên nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginated.map((sub) => {
                  const statusStyle = SUBSCRIPTION_STATUS_STYLES[sub.status] || SUBSCRIPTION_STATUS_STYLES.ACTIVE;

                  return (
                    <tr
                      key={sub.id}
                      onClick={() => onSelectSubscriber(sub)}
                      className="group cursor-pointer hover:bg-[#F7F8F4]/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 pr-4 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF4E8] font-bold text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
                            {sub.initials}
                          </div>
                          <div>
                            <div className="font-bold text-[#172019] group-hover:text-[#55733C] dark:text-white dark:group-hover:text-emerald-400">
                              {sub.userName}
                            </div>
                            <div className="text-[11px] text-[#687268] dark:text-zinc-400">
                              {sub.userEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 font-semibold text-[#172019] dark:text-zinc-200">
                        {sub.planName}
                      </td>

                      <td className="px-3 py-3 text-center text-[11px] font-medium text-zinc-500">
                        {BILLING_CYCLE_LABELS[sub.billingCycle]}
                      </td>

                      <td className="px-3 py-3 text-center text-[#687268] dark:text-zinc-400">
                        {sub.startDate}
                      </td>

                      <td className="px-3 py-3 text-center font-bold text-[#172019] dark:text-white">
                        {sub.expiryDate}
                      </td>

                      <td className="px-3 py-3 text-center">
                        {sub.autoRenewal ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            ON
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            OFF
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-right font-black text-[#172019] dark:text-white">
                        {sub.totalPaid.toLocaleString()}đ
                      </td>

                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusStyle.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotClass}`} />
                          {statusStyle.label}
                        </span>
                      </td>

                      <td className="py-3 pr-5 pl-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSubscriber(sub);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E3E7DF] bg-white px-2.5 py-1 text-xs font-semibold text-[#172019] hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#7C9B5B]" />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E3E7DF] bg-white px-5 py-3 sm:flex-row dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs text-[#687268] dark:text-zinc-400">
            Hiển thị <span className="font-semibold text-[#172019] dark:text-white">{paginated.length}</span> trong{" "}
            <span className="font-semibold text-[#172019] dark:text-white">{sortedList.length}</span> hội viên
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3E7DF] text-[#687268] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold px-2 text-[#172019] dark:text-white">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3E7DF] text-[#687268] disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
