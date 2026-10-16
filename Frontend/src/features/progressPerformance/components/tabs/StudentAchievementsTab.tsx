import React from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { StudentPerformanceRecord } from "../../types/performance.types";

interface StudentAchievementsTabProps {
  student: StudentPerformanceRecord;
}

export const StudentAchievementsTab: React.FC<StudentAchievementsTabProps> = ({ student }) => {
  const achievements = [
    {
      id: "a1",
      icon: "🔥",
      title: "Chiến Binh Kỷ Luật (21-Day Streak)",
      desc: "Hoàn thành tập luyện liên tục 21 ngày không gián đoạn.",
      unlocked: student.currentStreakDays >= 21 || student.longestStreakDays >= 21,
      date: "25/09/2026",
    },
    {
      id: "a2",
      icon: "🦾",
      title: "Vua Hít Xà (Pull Up Master)",
      desc: "Thực hiện thành công chuỗi 15+ pull ups chuẩn form.",
      unlocked: true,
      date: "18/09/2026",
    },
    {
      id: "a3",
      icon: "⚡",
      title: "Vượt Ngưỡng Giới Hạn (PR Breaker)",
      desc: "Phá vỡ trên 10 kỷ lục cá nhân cá nhân.",
      unlocked: student.personalRecordsCount >= 10,
      date: "12/09/2026",
    },
    {
      id: "a4",
      icon: "💎",
      title: "Bậc Thầy Form Chuẩn AI (Precision Master)",
      desc: "Đạt điểm AI Motion trung bình trên 90 điểm.",
      unlocked: student.formScoreAverage >= 90,
      date: "05/09/2026",
    },
    {
      id: "a5",
      icon: "👑",
      title: "Học Viên Xuất Sắc Tháng",
      desc: "Top 5% học viên có tốc độ cải thiện nhanh nhất toàn hệ thống.",
      unlocked: student.improvementPercentage >= 25,
      date: "01/09/2026",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          Danh hiệu & Huy hiệu đạt được
        </h4>
        <span className="text-xs font-semibold text-[#547EFF] dark:text-[#8CA9FF]">
          {achievements.filter((a) => a.unlocked).length}/{achievements.length} Mở khóa
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all ${
              ach.unlocked
                ? "border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                : "border-slate-200 bg-slate-50/50 opacity-60 dark:border-slate-800 dark:bg-slate-900/40"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xl dark:bg-slate-800">
              {ach.icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h5 className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {ach.title}
                </h5>
                {ach.unlocked ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">
                {ach.desc}
              </p>
              {ach.unlocked && (
                <span className="mt-1.5 inline-block rounded-md bg-[#8CA9FF]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
                  Mở khóa: {ach.date}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
