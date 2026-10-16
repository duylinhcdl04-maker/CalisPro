import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Flame,
  CheckCircle2,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  Activity,
  Dumbbell,
  Sparkles,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Tooltip } from "antd";

interface HeatmapDay {
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
  count: number;
  title: string;
}

interface StreakHistoryHeatmapProps {
  history: HeatmapDay[];
  currentStreak: number;
  longestStreak?: number;
}

export const StreakHistoryHeatmap: React.FC<StreakHistoryHeatmapProps> = ({
  history,
  currentStreak,
  longestStreak = 24,
}) => {
  // Current active view month (Default to Sept 2026 based on mock system date)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // 0-indexed: 8 = September
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    dayNum: number;
    title: string;
    duration?: string;
    calories?: number;
    isCompleted: boolean;
  } | null>({
    dateStr: "2026-09-30",
    dayNum: 30,
    title: "Full Body Calisthenics Flow",
    duration: "50 phút",
    calories: 380,
    isCompleted: true,
  });

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Build calendar matrix for selectedMonth / selectedYear
  const calendarData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfWeek = (new Date(selectedYear, selectedMonth, 1).getDay() + 6) % 7; // Mon = 0, Sun = 6

    const days = [];
    // Pad previous month empty slots
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Populate actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(selectedMonth + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      const dateStr = `${selectedYear}-${monthStr}-${dayStr}`;

      const historyItem = history?.find((h) => h.date === dateStr);
      const isToday = dateStr === "2026-09-30";

      // Mock workout metadata for rich details
      let isCompleted = false;
      let title = "Ngày nghỉ phục hồi";
      let duration = "0 phút";
      let calories = 0;

      if (historyItem && historyItem.level > 0) {
        isCompleted = true;
        title = historyItem.title || "Buổi tập Calisthenics";
        duration = `${35 + (d % 4) * 5} phút`;
        calories = 260 + (d % 5) * 30;
      } else if (selectedMonth === 8 && d >= 15 && d <= 30) {
        // Active streak window
        isCompleted = true;
        title = "Tập luyện Calisthenics & Kỹ năng";
        duration = "45 phút";
        calories = 340;
      }

      days.push({
        dayNum: d,
        dateStr,
        isCompleted,
        level: historyItem ? historyItem.level : isCompleted ? 3 : 0,
        title,
        duration,
        calories,
        isToday,
        isFrozen: d === 14 && selectedMonth === 8, // freeze example
      });
    }

    return days;
  }, [selectedYear, selectedMonth, history]);

  // Monthly stats calculation
  const completedDaysCount = calendarData.filter((d) => d && d.isCompleted).length;
  const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const monthlyConsistencyRate = Math.round((completedDaysCount / totalDaysInMonth) * 100);
  const totalEstimatedHours = (completedDaysCount * 0.75).toFixed(1);
  const totalEstimatedCalories = (completedDaysCount * 320).toLocaleString();

  const DAY_HEADERS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all">
      {/* ========================================================================= */}
      {/* 🌟 1. TOP HEADER WITH MONTH SELECTOR & QUICK BADGES */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[#547EFF] dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-800/40 shadow-xs">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Lịch Rèn Luyện & Phân Tích Nhịp Độ
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Theo dõi tính kỷ luật, chất lượng buổi tập và từng mốc son rèn luyện của bạn.
              </p>
            </div>
          </div>
        </div>

        {/* Month Navigation Control */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-1 shadow-inner">
            <button
              onClick={handlePrevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition-all"
              title="Tháng trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[110px] text-center">
              {monthNames[selectedMonth]}, {selectedYear}
            </span>

            <button
              onClick={handleNextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs transition-all"
              title="Tháng sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedMonth(8);
              setSelectedYear(2026);
            }}
            className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#547EFF] hover:bg-blue-100/70 dark:border-blue-800 dark:bg-blue-950/50 dark:text-sky-300 transition-colors"
          >
            Hôm nay
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 2. BALANCED 2-COLUMN DASHBOARD */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* ======================================================================= */}
        {/* 📅 LEFT COLUMN (COL-SPAN-7): INTERACTIVE MONTHLY CALENDAR MATRIX */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5 dark:border-slate-800/70 dark:bg-slate-900/50">
          <div>
            {/* Day of week headers */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-xs font-bold text-slate-400 select-none">
              {DAY_HEADERS.map((day, idx) => (
                <div
                  key={day}
                  className={`py-1 ${idx === 6 ? "text-[#547EFF]" : ""}`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarData.map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="aspect-square rounded-xl bg-transparent opacity-0"
                    />
                  );
                }

                const isSelected = selectedDayDetail?.dateStr === day.dateStr;

                return (
                  <Tooltip
                    key={day.dateStr}
                    arrow={false}
                    title={
                      <div className="text-xs p-1">
                        <div className="font-bold">{day.dateStr}</div>
                        <div>{day.title}</div>
                        {day.isCompleted && (
                          <div className="text-sky-300 font-semibold mt-0.5">
                            ⏱️ {day.duration} • 🔥 {day.calories} kcal
                          </div>
                        )}
                      </div>
                    }
                  >
                    <button
                      onClick={() => setSelectedDayDetail(day)}
                      className={`relative flex aspect-square flex-col items-center justify-between p-1.5 sm:p-2 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "ring-2 ring-[#547EFF] shadow-md scale-105 z-10"
                          : "hover:scale-105"
                      } ${
                        day.isToday
                          ? "border-2 border-[#547EFF] bg-blue-50/80 dark:bg-blue-950/40"
                          : day.isCompleted
                          ? "bg-gradient-to-b from-[#8CA9FF]/20 to-[#547EFF]/30 border border-[#8CA9FF]/50 dark:from-[#547EFF]/20 dark:to-[#3563E9]/30"
                          : "bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-slate-400"
                      }`}
                    >
                      {/* Day Number */}
                      <span
                        className={`text-xs font-bold leading-none ${
                          day.isToday
                            ? "text-[#547EFF] dark:text-sky-300 font-extrabold"
                            : day.isCompleted
                            ? "text-slate-800 dark:text-white"
                            : "text-slate-400"
                        }`}
                      >
                        {day.dayNum}
                      </span>

                      {/* Slender, Modern Status Indicator */}
                      <div className="flex items-center justify-center">
                        {day.isFrozen ? (
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/15 text-amber-500 border border-amber-400/50 shadow-xs">
                            <Shield className="h-2.5 w-2.5 fill-amber-500/30" />
                          </div>
                        ) : day.isCompleted ? (
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#547EFF]/15 text-[#547EFF] border border-[#547EFF]/35 dark:bg-[#547EFF]/25 dark:text-sky-300 shadow-xs">
                            <Flame className="h-2.5 w-2.5 fill-[#547EFF]/60 dark:fill-sky-400/60" />
                          </div>
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-200/80 dark:bg-slate-700" />
                        )}
                      </div>
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Calendar Bottom Legend */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#547EFF]/15 text-[#547EFF] border border-[#547EFF]/40">
                  <Flame className="h-2 w-2 fill-[#547EFF]" />
                </span>
                Đã tập ({completedDaysCount})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                Nghỉ ngơi
              </span>
              <span className="flex items-center gap-1.5">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500/15 text-amber-500 border border-amber-400/40">
                  <Shield className="h-2 w-2 fill-amber-500/30" />
                </span>
                Khiên bảo vệ
              </span>
            </div>
            <span className="text-slate-400 italic">Nhấn vào ngày để xem chi tiết</span>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 📊 RIGHT COLUMN (COL-SPAN-5): PERFORMANCE & HABIT ANALYTICS DASHBOARD */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Top 3 KPI Stats Mini Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-b from-amber-50/70 to-amber-100/30 p-3 dark:border-amber-800/40 dark:from-amber-950/30 dark:to-amber-900/10 shadow-xs text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-between text-amber-500 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Chuỗi Streak
                </span>
                <Flame className="h-3.5 w-3.5 fill-amber-500 hidden sm:block" />
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {currentStreak} <span className="text-xs font-semibold text-slate-500">Ngày</span>
              </div>
              <div className="text-[10px] text-slate-500">Kỷ lục: {longestStreak}N</div>
            </div>

            <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-b from-blue-50/70 to-blue-100/30 p-3 dark:border-blue-800/40 dark:from-blue-950/30 dark:to-blue-900/10 shadow-xs text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-between text-[#547EFF] mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Kỷ luật tháng
                </span>
                <TrendingUp className="h-3.5 w-3.5 hidden sm:block" />
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {monthlyConsistencyRate}%
              </div>
              <div className="text-[10px] text-slate-500">{completedDaysCount}/{totalDaysInMonth} Buổi</div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60 shadow-xs text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-between text-slate-500 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Năng lượng
                </span>
                <Zap className="h-3.5 w-3.5 text-amber-400 hidden sm:block" />
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {totalEstimatedCalories}
              </div>
              <div className="text-[10px] text-slate-500">~{totalEstimatedHours}h luyện tập</div>
            </div>
          </div>

          {/* Selected Day Workout Inspector Card */}
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#547EFF] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Chi tiết ngày: {selectedDayDetail?.dateStr}
              </span>
              {selectedDayDetail?.isCompleted ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-300/40">
                  <CheckCircle2 className="h-3 w-3" /> Đã hoàn thành
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400">Nghỉ ngơi</span>
              )}
            </div>

            <div className="font-display text-sm font-black text-slate-900 dark:text-white">
              {selectedDayDetail?.title}
            </div>

            {selectedDayDetail?.isCompleted && (
              <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-sky-500" />
                  {selectedDayDetail.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  {selectedDayDetail.calories} kcal
                </span>
                <span className="flex items-center gap-1 text-[#547EFF]">
                  <Dumbbell className="h-3.5 w-3.5" />
                  Calisthenics
                </span>
              </div>
            )}
          </div>

          {/* Workout Distribution Progress Breakdown */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800/80 dark:bg-slate-900/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>Phân bổ chuyên đề ({selectedMonth + 1}/{selectedYear})</span>
              <span className="text-[11px] font-normal text-slate-400">Tổng 16 buổi</span>
            </div>

            {/* Category 1: Upper Body */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Upper Body Hypertrophy (Kéo/Đẩy)</span>
                <span className="font-bold text-[#547EFF]">9 buổi (56%)</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#8CA9FF] to-[#547EFF]" style={{ width: "56%" }} />
              </div>
            </div>

            {/* Category 2: Skill & Handstand */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Core, Balance & Handstand</span>
                <span className="font-bold text-indigo-500">5 buổi (31%)</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600" style={{ width: "31%" }} />
              </div>
            </div>

            {/* Category 3: Mobility */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Mobility & Active Recovery</span>
                <span className="font-bold text-emerald-500">2 buổi (13%)</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: "13%" }} />
              </div>
            </div>
          </div>

          {/* Next Goal Callout Bar */}
          <div className="rounded-2xl border border-sky-300/40 bg-gradient-to-r from-blue-900/20 via-sky-500/10 to-indigo-900/20 p-3.5 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 border border-amber-400/40">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  Mục tiêu kế tiếp: <span className="text-[#547EFF] dark:text-sky-400">21 Ngày</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Còn 5 ngày để nhận +1,200 XP & Huy hiệu Bậc Thầy
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 rounded-xl bg-slate-900/10 dark:bg-slate-950/60 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-400/30">
              <Shield className="h-3.5 w-3.5" /> 2/2 Khiên
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
