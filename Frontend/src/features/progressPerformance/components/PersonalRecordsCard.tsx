import React from "react";
import { Trophy, ArrowUpRight, Calendar, User, Sparkles } from "lucide-react";
import { PersonalRecordItem } from "../types/performance.types";

interface PersonalRecordsCardProps {
  records: PersonalRecordItem[];
  onViewStudent?: (studentId: string) => void;
}

export const PersonalRecordsCard: React.FC<PersonalRecordsCardProps> = ({
  records,
  onViewStudent,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Kỷ lục cá nhân (Personal Records)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Những cột mốc PR mới được xác lập và vượt qua
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF2C6] px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
            <Sparkles className="h-3 w-3" />
            34,890 PRs
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {records.slice(0, 5).map((rec) => (
            <div
              key={rec.id}
              onClick={() => onViewStudent && onViewStudent(rec.studentId)}
              className="flex cursor-pointer flex-col gap-2 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 transition-all hover:border-[#8CA9FF] hover:bg-[#8CA9FF]/5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-800/40"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {rec.exerciseName}
                  </span>
                  {rec.isRecent && (
                    <span className="rounded-md bg-[#8CA9FF]/20 px-1.5 py-0.2 text-[10px] font-bold text-[#1e3a8a] dark:text-[#8CA9FF]">
                      Mới
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-300">
                    <User className="h-3 w-3 text-[#547EFF]" />
                    {rec.studentName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {rec.dateAchieved}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {rec.currentRecord}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Trước: {rec.previousRecord}
                  </div>
                </div>

                <div className="rounded-lg bg-[#8CA9FF]/15 px-2 py-1 text-xs font-black text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
                  {rec.improvement}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
