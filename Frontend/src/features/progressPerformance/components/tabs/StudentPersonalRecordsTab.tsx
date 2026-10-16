import React from "react";
import { Trophy, ArrowUpRight, Award } from "lucide-react";
import { StudentPerformanceRecord } from "../../types/performance.types";

interface StudentPersonalRecordsTabProps {
  student: StudentPerformanceRecord;
}

export const StudentPersonalRecordsTab: React.FC<StudentPersonalRecordsTabProps> = ({ student }) => {
  const prList = [
    { id: "1", exercise: "Pull Up (Hít xà đơn)", record: "18 reps", improvement: "+3 reps", date: "24/09/2026" },
    { id: "2", exercise: "Push Up (Hít đất chuẩn)", record: "45 reps", improvement: "+5 reps", date: "20/09/2026" },
    { id: "3", exercise: "Dips (Xà kép ngực & tay sau)", record: "26 reps", improvement: "+4 reps", date: "15/09/2026" },
    { id: "4", exercise: "Plank (Gồng cơ bụng tĩnh)", record: "03:45", improvement: "+30s", date: "10/09/2026" },
    { id: "5", exercise: "Muscle Up (Lên xà bùng nổ)", record: "6 reps", improvement: "+2 reps", date: "02/09/2026" },
  ];

  return (
    <div className="space-y-3">
      {/* Banner */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/30">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#172019] dark:text-white">
            Tổng số kỷ lục cá nhân: <span className="text-amber-700 dark:text-amber-300">{student.personalRecordsCount} PRs</span>
          </h4>
          <p className="text-[11px] text-amber-800 dark:text-amber-300/80">
            Học viên liên tục thiết lập kỷ lục mới trong các bài tập nền tảng
          </p>
        </div>
      </div>

      {/* PRs list */}
      <div className="space-y-2">
        {prList.map((pr) => (
          <div
            key={pr.id}
            className="flex items-center justify-between rounded-xl border border-[#E3E7DF] bg-white p-3 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#172019] dark:text-white">{pr.exercise}</div>
                <div className="text-[11px] text-[#687268] dark:text-zinc-400">Đạt ngày: {pr.date}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-extrabold text-[#172019] dark:text-white">{pr.record}</div>
              <div className="flex items-center justify-end text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                {pr.improvement}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
