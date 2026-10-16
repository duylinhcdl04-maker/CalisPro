import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { BarChart3, TrendingUp, Sparkles } from "lucide-react";
import { StudentPerformanceRecord } from "../../types/performance.types";

interface StudentPerformanceTrendTabProps {
  student: StudentPerformanceRecord;
}

export const StudentPerformanceTrendTab: React.FC<StudentPerformanceTrendTabProps> = ({
  student,
}) => {
  const weeklyTrendData = [
    { week: "T1", reps: Math.round(student.totalWorkouts * 85), score: student.startingScore },
    { week: "T2", reps: Math.round(student.totalWorkouts * 95), score: student.startingScore + 2 },
    { week: "T3", reps: Math.round(student.totalWorkouts * 110), score: student.startingScore + 4 },
    { week: "T4", reps: Math.round(student.totalWorkouts * 125), score: student.startingScore + 7 },
    { week: "T5", reps: Math.round(student.totalWorkouts * 140), score: student.startingScore + 10 },
    { week: "T6", reps: Math.round(student.totalWorkouts * 155), score: student.startingScore + 14 },
    { week: "T7", reps: Math.round(student.totalWorkouts * 170), score: student.startingScore + 18 },
    { week: "T8 (Hiện tại)", reps: Math.round(student.totalWorkouts * 190), score: student.performanceScore },
  ];

  return (
    <div className="space-y-4">
      {/* Volume Chart */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8CA9FF]/15 text-[#547EFF] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Khối lượng Reps qua 8 tuần
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tiến độ phát triển tổng thể
              </p>
            </div>
          </div>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            +{student.improvementPercentage}% tăng trưởng
          </span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
                formatter={(val: any) => [`${Number(val || 0).toLocaleString()} reps`, "Tổng Reps"]}
              />
              <Bar dataKey="reps" fill="#547EFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Score Curve */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8CA9FF]/15 text-[#547EFF] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Biểu đồ tiến độ Performance Score
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tăng từ {student.startingScore} lên {student.performanceScore} điểm
              </p>
            </div>
          </div>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
                formatter={(val: any) => [`${val}/100 điểm`, "Điểm số"]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#547EFF"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#547EFF" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
