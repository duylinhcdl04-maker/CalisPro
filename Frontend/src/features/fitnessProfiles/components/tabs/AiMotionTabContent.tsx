import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Bot, Sparkles, AlertTriangle, ShieldCheck, Activity, Eye } from "lucide-react";
import { MotionAnalysisRecord } from "../../types/fitnessProfile";

interface AiMotionTabContentProps {
  motionData: MotionAnalysisRecord;
  isLoading?: boolean;
}

export const AiMotionTabContent: React.FC<AiMotionTabContentProps> = ({
  motionData,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-[#E3E7DF] bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900" />
    );
  }

  const motionMetrics = [
    { label: "Form Score (Độ chuẩn tư thế)", value: motionData.formScore, max: 100, unit: "/ 100", color: "#547EFF" },
    { label: "Repetition Quality (Chất lượng từng rep)", value: motionData.repetitionQuality, max: 100, unit: "%", color: "#8CA9FF" },
    { label: "Range of Motion (Biên độ chuyển động)", value: motionData.rangeOfMotion, max: 100, unit: "%", color: "#AAC4F5" },
    { label: "Tempo Control (Kiểm soát nhịp độ)", value: motionData.tempoScore, max: 100, unit: "%", color: "#F59E0B" },
    { label: "Body Stability (Độ vững thân người)", value: motionData.stabilityScore, max: 100, unit: "%", color: "#8B5CF6" },
  ];

  return (
    <div className="space-y-6">
      {/* Header AI Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white p-5 sm:flex-row sm:items-center sm:justify-between dark:border-blue-900/50 dark:from-blue-950/40 dark:via-zinc-900 dark:to-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Bot className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
              AI Vision & Motion Intelligence
            </span>
          </div>
          <h3 className="mt-2 text-base font-bold text-[#172019] dark:text-white">
            Phân tích Kỹ thuật: {motionData.exerciseName}
          </h3>
          <p className="text-xs text-[#687268] dark:text-zinc-400">
            Dữ liệu quét từ camera AI nhận diện góc khớp và phát lực trong phiên tập gần nhất ({motionData.date})
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-white p-3 shadow-xs dark:border-zinc-700 dark:bg-zinc-800">
          <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <div>
            <div className="text-2xl font-black text-[#172019] dark:text-white">
              {motionData.formScore} <span className="text-xs font-normal text-zinc-400">/100</span>
            </div>
            <div className="text-[10px] font-bold text-blue-700 uppercase dark:text-blue-300">
              Điểm Form AI
            </div>
          </div>
        </div>
      </div>

      {/* 5 Core Motion Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {motionMetrics.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-[#E3E7DF] bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-xs font-semibold text-[#687268] dark:text-zinc-400">
              {m.label}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-[#172019] dark:text-white">
                {m.value}
              </span>
              <span className="text-xs text-zinc-400">{m.unit}</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E3E7DF]/70 dark:bg-zinc-800">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${m.value}%`, backgroundColor: m.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Common Errors detected by AI */}
      <div className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-bold text-[#172019] dark:text-white">
            Các lỗi kỹ thuật thường gặp (AI Lỗi quét)
          </h3>
        </div>
        <p className="text-xs text-[#687268] dark:text-zinc-400">
          Tỷ lệ xuất hiện lỗi trên tổng số rep được camera ghi lại
        </p>

        <div className="mt-4 space-y-3">
          {motionData.commonErrors.map((err) => (
            <div
              key={err.errorName}
              className="flex flex-col gap-2 rounded-xl border border-[#E3E7DF]/60 bg-[#F7F8F4] p-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-800/40"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#172019] dark:text-white">
                    {err.errorName}
                  </span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      err.severity === "high"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {err.severity === "high" ? "Nghiêm trọng" : "Cần lưu ý"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#687268] dark:text-zinc-400">
                  {err.description}
                </p>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                  {err.frequencyPercentage}%
                </span>
                <span className="block text-[10px] text-[#687268] dark:text-zinc-400">
                  Tần suất lỗi
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Progress Chart */}
      <div className="rounded-2xl border border-[#E3E7DF] bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-bold text-[#172019] dark:text-white">
          Tiến trình Cải thiện Form theo Tuần
        </h3>
        <p className="text-xs text-[#687268] dark:text-zinc-400">
          Điểm kỹ thuật trung bình tăng từ 71 lên 87 qua 4 tuần tập
        </p>

        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={motionData.weeklyTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2ED" vertical={false} />
              <XAxis dataKey="week" stroke="#687268" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[50, 100]} stroke="#687268" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#182018",
                  borderRadius: "10px",
                  border: "none",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                name="Form Score"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 5, fill: "#3B82F6", strokeWidth: 2, stroke: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insight text */}
        <div className="mt-3 rounded-xl bg-[#8CA9FF]/15 p-3 text-xs text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
          <span className="font-bold">✨ Nhận định AI: </span>
          {motionData.aiFeedback}
        </div>
      </div>
    </div>
  );
};
