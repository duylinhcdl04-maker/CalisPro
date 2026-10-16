import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, Calendar, CheckSquare, Square } from 'lucide-react';

interface ExportSubscriptionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
}

export interface ExportOptions {
  dataset: 'all' | 'subscribers' | 'transactions' | 'plans_kpi';
  dateRange: 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'all_time';
  fileFormat: 'csv' | 'xlsx' | 'pdf';
  includeChurnData: boolean;
  includePaymentGateways: boolean;
}

export const ExportSubscriptionReportModal: React.FC<ExportSubscriptionReportModalProps> = ({
  isOpen,
  onClose,
  onExport,
}) => {
  const [dataset, setDataset] = useState<ExportOptions['dataset']>('all');
  const [dateRange, setDateRange] = useState<ExportOptions['dateRange']>('this_month');
  const [fileFormat, setFileFormat] = useState<ExportOptions['fileFormat']>('xlsx');
  const [includeChurnData, setIncludeChurnData] = useState(true);
  const [includePaymentGateways, setIncludePaymentGateways] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setTimeout(() => {
      onExport({
        dataset,
        dateRange,
        fileFormat,
        includeChurnData,
        includePaymentGateways,
      });
      setIsExporting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#7C9B5B]/10 text-[#7C9B5B]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Xuất Báo cáo Doanh thu & Gói hội viên</h3>
              <p className="text-xs text-muted-foreground">Tải xuống dữ liệu kế toán và phân tích tăng trưởng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Dataset choice */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Phạm vi dữ liệu cần xuất
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'all', label: 'Toàn bộ dữ liệu tổng hợp' },
                { id: 'subscribers', label: 'Danh sách Hội viên' },
                { id: 'transactions', label: 'Lịch sử Giao dịch' },
                { id: 'plans_kpi', label: 'Hiệu suất & Doanh thu gói' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setDataset(item.id as any)}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                    dataset === item.id
                      ? 'border-[#7C9B5B] bg-[#7C9B5B]/10 text-foreground font-semibold shadow-sm ring-1 ring-[#7C9B5B]'
                      : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time range */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Khoảng thời gian
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'this_month', label: 'Tháng này' },
                { id: 'last_month', label: 'Tháng trước' },
                { id: 'this_quarter', label: 'Quý này' },
                { id: 'this_year', label: 'Năm nay' },
                { id: 'all_time', label: 'Toàn thời gian' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setDateRange(item.id as any)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                    dateRange === item.id
                      ? 'border-[#7C9B5B] bg-[#7C9B5B]/10 text-foreground font-semibold'
                      : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Định dạng tệp
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'xlsx', label: 'Excel (.xlsx)', desc: 'Bao gồm định dạng màu' },
                { id: 'csv', label: 'CSV (.csv)', desc: 'Dữ liệu thô phân tách phẩy' },
                { id: 'pdf', label: 'PDF Report', desc: 'Bản in báo cáo đẹp' },
              ].map((fmt) => (
                <button
                  type="button"
                  key={fmt.id}
                  onClick={() => setFileFormat(fmt.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    fileFormat === fmt.id
                      ? 'border-[#7C9B5B] bg-[#7C9B5B]/10 ring-1 ring-[#7C9B5B]'
                      : 'border-border bg-background hover:bg-muted/50'
                  }`}
                >
                  <div className="text-xs font-bold text-foreground">{fmt.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tùy chọn đính kèm
            </label>
            <div className="space-y-2 text-xs">
              <label 
                className="flex items-center gap-2 cursor-pointer text-foreground select-none"
                onClick={() => setIncludeChurnData(!includeChurnData)}
              >
                {includeChurnData ? (
                  <CheckSquare className="w-4 h-4 text-[#7C9B5B]" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground" />
                )}
                <span>Đính kèm thống kê tỷ lệ rời bỏ & lý do huỷ gói (Churn Analytics)</span>
              </label>

              <label 
                className="flex items-center gap-2 cursor-pointer text-foreground select-none"
                onClick={() => setIncludePaymentGateways(!includePaymentGateways)}
              >
                {includePaymentGateways ? (
                  <CheckSquare className="w-4 h-4 text-[#7C9B5B]" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground" />
                )}
                <span>Bao gồm mã tham chiếu cổng thanh toán & mã hóa đơn VAT điện tử</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C9B5B] to-[#55733C] text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang khởi tạo tệp...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Bắt đầu Xuất Báo cáo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
