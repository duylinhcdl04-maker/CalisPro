import React from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  RotateCcw, 
  Clock 
} from 'lucide-react';
import { PaymentTransaction } from '../types/subscription.types';

interface PaymentKPICardsProps {
  transactions: PaymentTransaction[];
}

export const PaymentKPICards: React.FC<PaymentKPICardsProps> = ({ transactions }) => {
  // Aggregate KPI numbers
  const totalSuccessful = transactions.filter(t => t.status === 'SUCCESS');
  const totalSuccessfulAmount = totalSuccessful.reduce((acc, curr) => acc + curr.amount, 0);

  const totalFailed = transactions.filter(t => t.status === 'FAILED');
  const totalRefunded = transactions.filter(t => t.status === 'REFUNDED');
  const totalPending = transactions.filter(t => t.status === 'PENDING');

  const totalTransactionsCount = transactions.length;
  const successRate = totalTransactionsCount > 0 
    ? ((totalSuccessful.length / totalTransactionsCount) * 100).toFixed(1) 
    : '0';

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  const cards = [
    {
      title: 'Doanh thu thanh toán kỳ này',
      value: formatVND(totalSuccessfulAmount),
      subtext: `${totalSuccessful.length} giao dịch thành công`,
      icon: TrendingUp,
      bgColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800/40',
    },
    {
      title: 'Tỷ lệ thanh toán thành công',
      value: `${successRate}%`,
      subtext: `${totalTransactionsCount} tổng số giao dịch xử lý`,
      icon: CreditCard,
      bgColor: 'bg-[#7C9B5B]/10 text-[#7C9B5B]',
      borderColor: 'border-[#7C9B5B]/20',
    },
    {
      title: 'Giao dịch thất bại',
      value: totalFailed.length.toString(),
      subtext: 'Cần dunning / gửi nhắc thanh toán',
      icon: AlertTriangle,
      bgColor: 'bg-rose-500/10 text-rose-500',
      borderColor: 'border-rose-200 dark:border-rose-800/40',
    },
    {
      title: 'Đang xử lý / Chờ',
      value: totalPending.length.toString(),
      subtext: 'Đang chờ webhook ngân hàng / cổng',
      icon: Clock,
      bgColor: 'bg-amber-500/10 text-amber-500',
      borderColor: 'border-amber-200 dark:border-amber-800/40',
    },
    {
      title: 'Hoàn tiền (Refunded)',
      value: totalRefunded.length.toString(),
      subtext: 'Bảo hành / khiếu nại',
      icon: RotateCcw,
      bgColor: 'bg-purple-500/10 text-purple-500',
      borderColor: 'border-purple-200 dark:border-purple-800/40',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div 
            key={idx}
            className={`bg-card/70 backdrop-blur-md rounded-2xl border ${card.borderColor} p-4 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground line-clamp-1">{card.title}</span>
              <div className={`p-2 rounded-xl ${card.bgColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-foreground mb-1 tracking-tight">
              {card.value}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
};
