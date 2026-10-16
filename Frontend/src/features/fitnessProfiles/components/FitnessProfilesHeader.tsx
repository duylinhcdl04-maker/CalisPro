import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Activity, RotateCcw, FileSpreadsheet } from "lucide-react";

interface FitnessProfilesHeaderProps {
  onExportClick?: () => void;
  onResetData?: () => void;
}

export const FitnessProfilesHeader: React.FC<FitnessProfilesHeaderProps> = ({
  onExportClick,
  onResetData,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Hồ sơ Thể chất Học viên
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8CA9FF]/15 px-3 py-1 text-xs font-semibold text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
              <Activity className="h-3.5 w-3.5 text-[#547EFF] dark:text-[#8CA9FF]" />
              6 Chỉ số Thể chất
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Theo dõi toàn diện sức mạnh, sức bền, mobility, core, thăng bằng và kỹ năng của học viên.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onResetData && (
            <button
              onClick={onResetData}
              title="Khôi phục dữ liệu mẫu"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Khôi phục mẫu</span>
            </button>
          )}

          {onExportClick && (
            <button
              onClick={onExportClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8CA9FF] to-[#547EFF] px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-[#8CA9FF]/30 hover:from-[#7B9CFF] hover:to-[#436FEF] transition-all"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-white" />
              Xuất báo cáo
            </button>
          )}

          <Link
            to="/coach/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#547EFF] dark:text-[#8CA9FF]" />
            Về Dashboard
          </Link>
        </div>
      </div>
      <div className="h-[1px] w-full bg-slate-200 dark:bg-slate-800" />
    </div>
  );
};
