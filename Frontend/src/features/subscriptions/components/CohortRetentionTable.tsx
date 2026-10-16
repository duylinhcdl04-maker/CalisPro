import React from 'react';
import { Users, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';

interface CohortRow {
  cohortMonth: string; // e.g. "T04/2026"
  initialSubscribers: number;
  retentionMonths: number[]; // e.g. [100, 88.5, 82.1, 78.4, 75.0, 72.8]
}

export const CohortRetentionTable: React.FC = () => {
  const cohortData: CohortRow[] = [
    { cohortMonth: 'Tháng 04/2026', initialSubscribers: 420, retentionMonths: [100, 89.2, 84.1, 80.5, 76.2, 74.0] },
    { cohortMonth: 'Tháng 05/2026', initialSubscribers: 510, retentionMonths: [100, 91.0, 85.6, 81.8, 78.0] },
    { cohortMonth: 'Tháng 06/2026', initialSubscribers: 640, retentionMonths: [100, 88.4, 83.2, 79.5] },
    { cohortMonth: 'Tháng 07/2026', initialSubscribers: 780, retentionMonths: [100, 92.1, 87.0] },
    { cohortMonth: 'Tháng 08/2026', initialSubscribers: 920, retentionMonths: [100, 93.5] },
    { cohortMonth: 'Tháng 09/2026', initialSubscribers: 1011, retentionMonths: [100] },
  ];

  const getColorIntensity = (pct: number) => {
    if (pct >= 90) return 'bg-[#7C9B5B]/80 text-white font-bold';
    if (pct >= 85) return 'bg-[#7C9B5B]/60 text-white font-semibold';
    if (pct >= 80) return 'bg-[#7C9B5B]/40 text-foreground font-semibold';
    if (pct >= 75) return 'bg-[#7C9B5B]/25 text-foreground font-medium';
    return 'bg-[#7C9B5B]/15 text-foreground font-medium';
  };

  return (
    <div className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#EEF4E8] text-[#55733C] dark:bg-emerald-950/40 dark:text-emerald-300">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#172019] dark:text-white">
                Ma trận Giữ chân theo Cohort (Cohort Retention Matrix)
              </h3>
              <p className="text-xs text-[#687268] dark:text-zinc-400">
                Tỷ lệ người dùng duy trì đăng ký gói trả phí sau M1, M2, M3, M4, M5
              </p>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg dark:bg-emerald-950/60 dark:text-emerald-300">
            TB Giữ chân M3: 82.2%
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-[#F0F2ED] text-[#687268] dark:border-zinc-800 dark:text-zinc-400">
              <th className="pb-3 font-semibold">Tháng gia nhập (Cohort)</th>
              <th className="pb-3 font-semibold text-center">Quy mô ban đầu</th>
              <th className="pb-3 font-semibold text-center">Tháng 0 (M0)</th>
              <th className="pb-3 font-semibold text-center">Tháng 1 (M1)</th>
              <th className="pb-3 font-semibold text-center">Tháng 2 (M2)</th>
              <th className="pb-3 font-semibold text-center">Tháng 3 (M3)</th>
              <th className="pb-3 font-semibold text-center">Tháng 4 (M4)</th>
              <th className="pb-3 font-semibold text-center">Tháng 5 (M5)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2ED] dark:divide-zinc-800">
            {cohortData.map((row) => (
              <tr key={row.cohortMonth} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="py-3 font-semibold text-[#172019] dark:text-white flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#7C9B5B]" />
                  <span>{row.cohortMonth}</span>
                </td>
                <td className="py-3 text-center font-mono font-medium text-foreground">
                  {row.initialSubscribers.toLocaleString()} HV
                </td>
                {[0, 1, 2, 3, 4, 5].map((monthIdx) => {
                  const val = row.retentionMonths[monthIdx];
                  if (val === undefined) {
                    return (
                      <td key={monthIdx} className="py-3 text-center text-zinc-300 dark:text-zinc-700">
                        —
                      </td>
                    );
                  }
                  return (
                    <td key={monthIdx} className="py-2.5 px-2 text-center">
                      <span className={`inline-block w-16 py-1 rounded-lg text-[11px] ${getColorIntensity(val)}`}>
                        {val}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
