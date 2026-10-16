import React, { useState } from 'react';
import { 
  Eye, 
  RefreshCw, 
  RotateCcw, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PaymentTransaction, PaymentStatus, PaymentMethod } from '../types/subscription.types';
import { PAYMENT_STATUS_STYLES, PAYMENT_METHOD_LABELS } from '../constants/subscription.constants';

interface PaymentTransactionTableProps {
  transactions: PaymentTransaction[];
  isLoading: boolean;
  onViewDetail: (transaction: PaymentTransaction) => void;
  onRetryPayment?: (transaction: PaymentTransaction) => void;
  onRefundPayment?: (transaction: PaymentTransaction) => void;
}

export const PaymentTransactionTable: React.FC<PaymentTransactionTableProps> = ({
  transactions,
  isLoading,
  onViewDetail,
  onRetryPayment,
  onRefundPayment,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const totalPages = Math.ceil(transactions.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const style = PAYMENT_STATUS_STYLES[status] || PAYMENT_STATUS_STYLES.SUCCESS;
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            <CheckCircle className="w-3 h-3" />
            {style.label}
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
            <XCircle className="w-3 h-3" />
            {style.label}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
            <Clock className="w-3 h-3" />
            {style.label}
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
            <RotateCcw className="w-3 h-3" />
            {style.label}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getMethodBadge = (method: PaymentMethod) => {
    const item = PAYMENT_METHOD_LABELS[method];
    return (
      <span className="px-2 py-0.5 text-[11px] font-medium rounded-lg bg-secondary text-secondary-foreground border border-border">
        {item ? item.label : method}
      </span>
    );
  };

  return (
    <div className="bg-card/70 backdrop-blur-md rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase border-b border-border">
            <tr>
              <th className="px-4 py-3 font-semibold">Mã GD / Hóa đơn</th>
              <th className="px-4 py-3 font-semibold">Hội viên</th>
              <th className="px-4 py-3 font-semibold">Gói đăng ký</th>
              <th className="px-4 py-3 font-semibold">Số tiền</th>
              <th className="px-4 py-3 font-semibold">Cổng TT</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold">Thời gian GD</th>
              <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#7C9B5B] border-t-transparent rounded-full animate-spin" />
                    <span>Đang tải danh sách giao dịch...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-muted-foreground/40" />
                    <p className="font-medium text-foreground">Không tìm thấy giao dịch nào</p>
                    <p className="text-xs">Hãy thử thay đổi điều kiện tìm kiếm hoặc bộ lọc</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((tx) => (
                <tr 
                  key={tx.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => onViewDetail(tx)}
                >
                  {/* Transaction ID & Invoice */}
                  <td className="px-4 py-3.5">
                    <div className="font-mono font-medium text-xs text-foreground group-hover:text-[#7C9B5B] transition-colors">
                      {tx.transactionCode}
                    </div>
                    {tx.invoiceId && (
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {tx.invoiceId}
                      </div>
                    )}
                  </td>

                  {/* Member Name & Email */}
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-foreground text-xs">{tx.userName}</div>
                    <div className="text-[11px] text-muted-foreground">{tx.userEmail}</div>
                  </td>

                  {/* Plan Name */}
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-xs text-foreground">{tx.planName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {tx.billingCycle === 'MONTHLY' ? 'Tháng' : tx.billingCycle === 'ANNUAL' ? 'Năm' : '7 Ngày'}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-xs text-foreground font-mono">
                      {formatVND(tx.amount)}
                    </div>
                  </td>

                  {/* Payment Method */}
                  <td className="px-4 py-3.5">
                    {getMethodBadge(tx.paymentMethod)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    {getStatusBadge(tx.status)}
                    {tx.failureReason && (
                      <div className="text-[10px] text-rose-500 font-medium mt-0.5 truncate max-w-[140px]" title={tx.failureReason}>
                        {tx.failureReason}
                      </div>
                    )}
                  </td>

                  {/* Created Date */}
                  <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                    {tx.createdAt}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewDetail(tx)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Xem chi tiết giao dịch"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {tx.status === 'FAILED' && onRetryPayment && (
                        <button
                          onClick={() => onRetryPayment(tx)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 transition-colors"
                          title="Gửi lại link thanh toán"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}

                      {tx.status === 'SUCCESS' && onRefundPayment && (
                        <button
                          onClick={() => onRefundPayment(tx)}
                          className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 text-purple-600 transition-colors"
                          title="Hoàn tiền giao dịch"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 bg-muted/20 border-t border-border flex items-center justify-between text-xs text-muted-foreground mt-auto">
        <div>
          Hiển thị <span className="font-semibold text-foreground">{transactions.length > 0 ? startIndex + 1 : 0}</span> - <span className="font-semibold text-foreground">{Math.min(startIndex + itemsPerPage, transactions.length)}</span> trên <span className="font-semibold text-foreground">{transactions.length}</span> giao dịch
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-border bg-background disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Trang <strong className="text-foreground">{currentPage}</strong> / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded-lg border border-border bg-background disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
