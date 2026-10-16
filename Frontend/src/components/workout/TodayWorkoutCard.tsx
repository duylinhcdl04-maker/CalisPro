import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Clock, Dumbbell, ListChecks, Moon, Play, Sparkles, Flame } from "lucide-react";
import type { TodayWorkout } from "../../types";

export function TodayWorkoutCard({ today, className = "" }: { today: TodayWorkout; className?: string }) {
  const navigate = useNavigate();

  if (today.type === "REST") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`clay-card p-8 md:p-10 relative overflow-hidden ${className}`}
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-sky-700 dark:text-sky-400">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 shadow-2xs">
            <Moon size={13} />
          </span>
          Ngày nghỉ & Phục hồi
        </div>
        <p className="mt-4 max-w-md text-xl font-bold leading-relaxed text-text-primary">
          Sự phục hồi là một phần cốt lõi của tiến bộ.
        </p>
        <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
          Hôm nay không có buổi tập nào được lên lịch. Hãy để cơ bắp tái tạo sức mạnh tối đa trước buổi tập tiếp theo.
        </p>
        <button
          type="button"
          onClick={() => navigate("/progress")}
          className="clay-btn clay-btn-sky mt-6 text-sm"
        >
          Xem phân tích phục hồi
        </button>
      </motion.div>
    );
  }

  const isInProgress = today.status === "IN_PROGRESS";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0c2340] via-[#08182b] to-[#040e1a] p-8 text-white shadow-[0_22px_45px_-12px_rgba(8,24,43,0.5)] border border-white/10 md:p-10 ${className}`}
    >
      {/* Background 3D Ambient Glow Spheres */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-52 w-52 rounded-full bg-cyan-400/15 blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[.14em] text-sky-300 border border-white/10 shadow-inner">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            <Dumbbell size={13} />
            <span>Buổi tập hôm nay</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-black/30 border border-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            <Flame size={14} className="text-amber-400" />
            <span>Đốt cháy ~320 kcal</span>
          </div>
        </div>

        <h2 className="mt-4 font-display text-2xl font-extrabold leading-tight md:text-3xl lg:text-4xl text-white tracking-tight">
          {today.name}
        </h2>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/80">
          {typeof today.exerciseCount === "number" && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.07] px-3 py-1.5 border border-white/5 font-medium">
              <ListChecks size={16} className="text-sky-400" />
              {today.exerciseCount} bài tập
            </span>
          )}
          {typeof today.durationMinutes === "number" && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.07] px-3 py-1.5 border border-white/5 font-medium">
              <Clock size={16} className="text-sky-400" />
              {today.durationMinutes} phút
            </span>
          )}
        </div>

        {today.focus && today.focus.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {today.focus.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold text-white/90 shadow-2xs backdrop-blur-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-7 flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/workout/${today.workoutPlanId}`)}
            className="clay-btn clay-btn-sky text-sm sm:text-base gap-2 px-6 py-3"
          >
            <Play size={16} className="fill-white" />
            <span>{isInProgress ? "Tiếp tục tập luyện" : "Bắt đầu tập ngay"}</span>
          </button>

          <span className="text-xs text-white/60 font-medium">
            ✨ Giáo án cá nhân hóa theo tiến độ của bạn
          </span>
        </div>
      </div>
    </motion.div>
  );
}
