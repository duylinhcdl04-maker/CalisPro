import React from 'react';
import { Search, RotateCcw, Download } from 'lucide-react';
import { PaymentStatus, PaymentMethod } from '../types/subscription.types';
import { PAYMENT_STATUS_STYLES, PAYMENT_METHOD_LABELS } from '../constants/subscription.constants';

export interface PaymentFilterState {
  searchQuery: string;
  status: PaymentStatus | 'ALL';
  paymentMethod: PaymentMethod | 'ALL';
  dateRange: 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH';
}

interface PaymentFiltersProps {
  filters: PaymentFilterState;
  onFilterChange: (filters: PaymentFilterState) => void;
  onReset: () => void;
  onExport: () => void;
  totalFiltered: number;
}

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  onExport,
  totalFiltered,
}) => {
  const isFiltered = 
    filters.searchQuery !== '' || 
    filters.status !== 'ALL' || 
    filters.paymentMethod !== 'ALL' || 
    filters.dateRange !== 'ALL';

  return (
    <div className="bg-card/70 backdrop-blur-md rounded-2xl border border-border p-4 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo mã GD, tên hội viên, email..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background/80 rounded-xl border border-input focus:outline-none focus:ring-2 focus:ring-[#7C9B5B] focus:border-transparent transition-all"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          {/* Status Dropdown */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value as any })}
            className="text-xs bg-background/80 border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C9B5B] text-foreground cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(PAYMENT_STATUS_STYLES).map(([key, item]) => (
              <option key={key} value={key}>{item.label}</option>
            ))}
          </select>

          {/* Payment Method Dropdown */}
          <select
            value={filters.paymentMethod}
            onChange={(e) => onFilterChange({ ...filters, paymentMethod: e.target.value as any })}
            className="text-xs bg-background/80 border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C9B5B] text-foreground cursor-pointer"
          >
            <option value="ALL">Tất cả cổng thanh toán</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([key, item]) => (
              <option key={key} value={key}>{item.label}</option>
            ))}
          </select>

          {/* Date Range Dropdown */}
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value as any })}
            className="text-xs bg-background/80 border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C9B5B] text-foreground cursor-pointer"
          >
            <option value="ALL">Mọi khoảng thời gian</option>
            <option value="TODAY">Hôm nay</option>
            <option value="THIS_WEEK">Tuần này</option>
            <option value="THIS_MONTH">Tháng này</option>
            <option value="LAST_MONTH">Tháng trước</option>
          </select>

          {/* Reset button */}
          {isFiltered && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors font-medium"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa lọc</span>
            </button>
          )}

          {/* Export button */}
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl font-medium transition-colors border border-border"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Filter summary bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
        <div className="flex items-center gap-2">
          <span>Tìm thấy <strong className="text-foreground">{totalFiltered}</strong> giao dịch</span>
        </div>
        <div className="text-[11px] text-muted-foreground italic">
          Tự động đồng bộ với cổng thanh toán mỗi 60 giây
        </div>
      </div>
    </div>
  );
};
