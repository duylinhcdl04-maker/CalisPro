import React, { useState } from "react";
import { X, FileSpreadsheet, FileText, Download } from "lucide-react";
import { toast } from "sonner";

interface ExportPerformanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalRecords: number;
}

export const ExportPerformanceReportModal: React.FC<ExportPerformanceReportModalProps> = ({
  isOpen,
  onClose,
  totalRecords,
}) => {
  const [format, setFormat] = useState<"csv" | "excel" | "pdf">("csv");
  const [includePRs, setIncludePRs] = useState<boolean>(true);
  const [includeAI, setIncludeAI] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success(
        `Đã xuất báo cáo Tiến độ & Thành tích (${format.toUpperCase()}) thành công!`
      );
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-[#E3E7DF] bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between border-b border-[#F0F2ED] pb-4 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#172019] dark:text-white">
                Xuất Báo cáo Tiến độ & Thành tích
              </h3>
            </div>
            <p className="mt-1 text-xs text-[#687268] dark:text-zinc-400">
              Tổng hợp điểm hiệu suất, khối lượng volume, PRs và chuỗi tập luyện.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200">
              Định dạng tệp tin:
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { id: "csv", label: "CSV File", icon: FileSpreadsheet },
                { id: "excel", label: "Excel (.xlsx)", icon: FileSpreadsheet },
                { id: "pdf", label: "Báo cáo PDF", icon: FileText },
              ].map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = format === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setFormat(fmt.id as "csv" | "excel" | "pdf")}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                      isSelected
                        ? "border-[#547EFF] bg-[#8CA9FF]/15 text-[#1e3a8a] dark:border-[#8CA9FF] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <Icon className={`mb-1 h-5 w-5 ${isSelected ? "text-[#547EFF] dark:text-[#8CA9FF]" : "text-slate-400"}`} />
                    <span className="text-xs font-semibold">{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
            <label className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={includePRs}
                onChange={(e) => setIncludePRs(e.target.checked)}
                className="rounded text-[#547EFF] focus:ring-[#8CA9FF]"
              />
              Bao gồm toàn bộ danh mục Kỷ lục cá nhân (PRs)
            </label>

            <label className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={includeAI}
                onChange={(e) => setIncludeAI(e.target.checked)}
                className="rounded text-[#547EFF] focus:ring-[#8CA9FF]"
              />
              Bao gồm điểm số phân tích AI Motion Form Score
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#8CA9FF]/30 transition-all hover:opacity-95 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Đang xuất..." : `Xuất (${totalRecords} bản ghi)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
