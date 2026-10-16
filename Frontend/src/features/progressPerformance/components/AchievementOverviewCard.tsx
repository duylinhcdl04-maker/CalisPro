import React from "react";
import { Award, Flame, Zap, Trophy, Medal, Target } from "lucide-react";
import { AchievementItem } from "../types/performance.types";

interface AchievementOverviewCardProps {
  achievements: AchievementItem[];
}

export const AchievementOverviewCard: React.FC<AchievementOverviewCardProps> = ({
  achievements,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172019] dark:text-white">
                Thành tích học viên (Achievements)
              </h3>
              <p className="text-xs text-[#687268] dark:text-zinc-400">
                28,421 huy hiệu đã mở khóa (4,281 trong tháng này)
              </p>
            </div>
          </div>

          <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
            Hệ thống huy hiệu
          </span>
        </div>

        {/* 6 Achievement Badge Cards */}
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="flex items-center justify-between rounded-xl border border-[#E3E7DF]/70 bg-[#F7F8F4] p-3 transition-colors hover:border-purple-300 dark:border-zinc-800 dark:bg-zinc-800/40"
            >
              <div>
                <div className="text-xs font-bold text-[#172019] dark:text-white">
                  {ach.title}
                </div>
                <div className="text-[11px] text-[#687268] dark:text-zinc-400 line-clamp-1">
                  {ach.description}
                </div>
              </div>

              <div className="text-right shrink-0 ml-2">
                <div className="text-xs font-black text-[#547EFF] dark:text-[#8CA9FF]">
                  {ach.unlockedCount.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {ach.percentageOfUsers}% học viên
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
