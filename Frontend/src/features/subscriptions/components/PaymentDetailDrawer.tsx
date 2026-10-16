import React from 'react';
import { 
  X, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RotateCcw, 
  Download, 
  Send, 
  User,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { PaymentTransaction, PaymentStatus } from '../types/subscription.types';
import { PAYMENT_STATUS_STYLES, PAYMENT_METHOD_LABELS } from '../constants/subscription.constants';

interface PaymentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransaction | null;
  onRetryPayment?: (transaction: PaymentTransaction) => void;
  onRefundPayment?: (transaction: PaymentTransaction) => void;
}

export const PaymentDetailDrawer: React.FC<PaymentDetailDrawerProps> = ({
  isOpen,
  onClose,
  transaction,
  onRetryPayment,
  onRefundPayment,
}) => {
  if (!isOpen || !transaction) return null;

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const style = PAYMENT_STATUS_STYLES[status] || PAYMENT_STATUS_STYLES.SUCCESS;
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            <CheckCircle className="w-3.5 h-3.5" />
            {style.label}
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
            <XCircle className="w-3.5 h-3.5" />
            {style.label}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
            <Clock className="w-3.5 h-3.5" />
            {style.label}
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
            <RotateCcw className="w-3.5 h-3.5" />
            {style.label}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="absolute inset-y-0 right-0 max-w-full flex pl-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-screen max-w-md bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#7C9B5B]/10 text-[#7C9B5B]">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">Chi tiết Giao dịch</h3>
                <p className="text-xs text-muted-foreground font-mono">{transaction.transactionCode}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status Banner */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
              <div>
                <span className="text-xs text-muted-foreground">Trạng thái thanh toán</span>
                <div className="mt-1">{getStatusBadge(transaction.status)}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Tổng tiền</span>
                <div className="text-xl font-bold font-mono text-foreground mt-0.5">
                  {formatVND(transaction.amount)}
                </div>
              </div>
            </div>

            {/* Error Message if Failed */}
            {transaction.status === 'FAILED' && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Nguyên nhân thất bại:</span>
                </div>
                <p className="pl-6 font-medium">{transaction.failureReason || 'Thẻ hết hạn hoặc không đủ số dư'}</p>
              </div>
            )}

            {/* Member Info Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Thông tin Khách hàng
              </h4>
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/70 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Họ và tên:</span>
                  <span className="font-semibold text-foreground">{transaction.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-mono text-foreground">{transaction.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã hội viên:</span>
                  <span className="font-mono text-muted-foreground">{transaction.userId}</span>
                </div>
              </div>
            </div>

            {/* Subscription & Order Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5" />
                Thông tin Gói & Thanh toán
              </h4>
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/70 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gói đăng ký:</span>
                  <span className="font-semibold text-foreground">{transaction.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chu kỳ:</span>
                  <span className="font-medium text-foreground">
                    {transaction.billingCycle === 'MONTHLY' ? 'Hàng tháng' : transaction.billingCycle === 'ANNUAL' ? 'Hàng năm' : '7 Ngày dùng thử'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cổng thanh toán:</span>
                  <span className="font-medium text-foreground">
                    {PAYMENT_METHOD_LABELS[transaction.paymentMethod]?.label || transaction.paymentMethod}
                  </span>
                </div>
                {transaction.gatewayTransactionId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mã GD Cổng (Gateway ID):</span>
                    <span className="font-mono text-[11px] text-foreground">{transaction.gatewayTransactionId}</span>
                  </div>
                )}
                {transaction.invoiceId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số hóa đơn VAT:</span>
                    <span className="font-mono font-medium text-foreground">{transaction.invoiceId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thời gian tạo:</span>
                  <span className="text-foreground">{transaction.createdAt}</span>
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="p-4 rounded-2xl bg-muted/10 border border-border/50 space-y-2 text-xs">
              <div className="pt-2 flex justify-between font-bold text-foreground text-sm">
                <span>Thực thu:</span>
                <span className="font-mono text-[#7C9B5B]">{formatVND(transaction.amount)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-border bg-muted/10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  alert(`Đang xuất PDF Hóa đơn: ${transaction.invoiceId || transaction.transactionCode}`);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-background hover:bg-muted font-semibold text-xs text-foreground transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Tải Hóa đơn (PDF)</span>
              </button>

              <button
                onClick={() => {
                  alert(`Đã gửi lại biên lai điện tử tới ${transaction.userEmail}`);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-background hover:bg-muted font-semibold text-xs text-foreground transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Gửi lại Email</span>
              </button>
            </div>

            {transaction.status === 'FAILED' && onRetryPayment && (
              <button
                onClick={() => {
                  onRetryPayment(transaction);
                  onClose();
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <Clock className="w-4 h-4" />
                <span>Tạo link & Gửi SMS/Email nhắc thanh toán</span>
              </button>
            )}

            {transaction.status === 'SUCCESS' && onRefundPayment && (
              <button
                onClick={() => {
                  onRefundPayment(transaction);
                  onClose();
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Hoàn tiền giao dịch này (Refund)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
