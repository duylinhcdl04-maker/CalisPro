import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, FileSpreadsheet, FileText, CheckCircle, Download } from "lucide-react";
import { toast } from "sonner";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalRecords: number;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  totalRecords,
}) => {
  const [format, setFormat] = useState<"csv" | "excel" | "pdf">("csv");
  const [includeAI, setIncludeAI] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success(`Đã xuất báo cáo thể chất ${format.toUpperCase()} (${totalRecords} bản ghi) thành công!`);
      onClose();
    }, 1000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-[#E3E7DF] bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">

        <div className="flex items-start justify-between border-b border-[#F0F2ED] pb-4 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-[#8CA9FF]/15 p-2 text-[#547EFF] dark:bg-[#8CA9FF]/25 dark:text-[#8CA9FF]">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#172019] dark:text-white">
                Xuất Báo cáo Thể chất Học viên
              </h3>
            </div>
            <p className="mt-1 text-xs text-[#687268] dark:text-zinc-400">
              Tổng hợp dữ liệu 6 chỉ số, lịch sử bài test và AI Motion phân tích.
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
            <label className="block text-xs font-semibold text-[#172019] dark:text-zinc-200">
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
                        ? "border-[#8CA9FF] bg-[#8CA9FF]/15 text-[#1e3a8a] shadow-xs dark:border-[#8CA9FF] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]"
                        : "border-[#E3E7DF] bg-white text-[#687268] hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    <Icon className={`h-5 w-5 mb-1 ${isSelected ? "text-[#547EFF] dark:text-[#8CA9FF]" : "text-[#687268]"}`} />
                    <span className="text-xs font-semibold">{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2 rounded-xl bg-[#F7F8F4] p-3 text-xs dark:bg-zinc-800/60">
            <label className="flex items-center gap-2 font-medium text-[#172019] dark:text-zinc-200">
              <input
                type="checkbox"
                checked={includeAI}
                onChange={(e) => setIncludeAI(e.target.checked)}
                className="rounded text-[#547EFF] focus:ring-[#8CA9FF]"
              />
              Bao gồm dữ liệu AI Motion Analysis & Form Scores
            </label>

            <label className="flex items-center gap-2 font-medium text-[#172019] dark:text-zinc-200">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
                className="rounded text-[#547EFF] focus:ring-[#8CA9FF]"
              />
              Bao gồm toàn bộ nhật ký & ghi chú Huấn luyện viên
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#F0F2ED] pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E3E7DF] px-4 py-2 text-xs font-medium text-[#687268] hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#8CA9FF]/30 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Đang tạo báo cáo..." : `Xuất (${totalRecords} hồ sơ)`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

