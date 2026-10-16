import { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Check,
  Plus,
  SkipForward,
  Lightbulb,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import type { ExerciseGuideDetail } from "../../services/mock/workoutTrainingData";
import { Button } from "../ui/Button";

interface WorkoutSidebarWidgetsProps {
  exercises: ExerciseGuideDetail[];
  activeExerciseIndex: number;
  onSelectExercise: (index: number) => void;
  completedExerciseIds: string[];
  isResting: boolean;
  restSeconds: number;
  onAddRestSeconds: (seconds: number) => void;
  onSkipRest: () => void;
  totalWorkoutSeconds: number;
  isWorkoutPaused: boolean;
  onTogglePause: () => void;
}

export function WorkoutSidebarWidgets({
  exercises,
  activeExerciseIndex,
  onSelectExercise,
  completedExerciseIds,
  isResting,
  restSeconds,
  onAddRestSeconds,
  onSkipRest,
  totalWorkoutSeconds,
  isWorkoutPaused,
  onTogglePause,
}: WorkoutSidebarWidgetsProps) {
  const [timerTab, setTimerTab] = useState<"rest" | "total">("rest");
  const [userNote, setUserNote] = useState("");

  const activeExercise = exercises[activeExerciseIndex];
  const completedCount = completedExerciseIds.length;

  // Format seconds to mm:ss
  function formatTime(totalSec: number) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className="space-y-6">
      {/* 📋 1. TODAY'S WORKOUT EXERCISE LIST */}
      <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-elevated">
        <div className="flex items-center justify-between border-b border-border/70 pb-3 mb-3">
          <div className="font-display text-sm font-bold text-text-primary">
            Danh sách bài tập hôm nay
          </div>
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-strong border border-accent/20">
            {completedCount} / {exercises.length} hoàn thành
          </span>
        </div>

        <div className="space-y-2">
          {exercises.map((ex, idx) => {
            const isCurrent = idx === activeExerciseIndex;
            const isDone = completedExerciseIds.includes(ex.id);

            return (
              <div
                key={ex.id}
                onClick={() => onSelectExercise(idx)}
                className={`group flex items-center justify-between rounded-xl p-2.5 border transition-all cursor-pointer ${
                  isCurrent
                    ? "border-accent bg-accent-soft/30 ring-2 ring-accent/20 shadow-xs"
                    : isDone
                    ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                    : "border-border/60 bg-background/50 hover:bg-surface-elevated hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Step Index Badge */}
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-accent text-white"
                        : "bg-surface text-text-secondary border border-border"
                    }`}
                  >
                    {isDone ? <Check size={13} className="stroke-[3]" /> : idx + 1}
                  </div>

                  {/* Thumbnail */}
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-black/10">
                    <img src={ex.videoThumbnail} alt={ex.name} className="h-full w-full object-cover" />
                  </div>

                  {/* Name & Sets Info */}
                  <div>
                    <div className={`text-xs font-bold ${isCurrent ? "text-accent-strong" : "text-text-primary"}`}>
                      {ex.name}
                    </div>
                    <div className="text-[10px] text-text-secondary mt-0.5">
                      {ex.defaultSets} sets x {ex.targetReps} reps • {ex.restSeconds}s rest
                    </div>
                  </div>
                </div>

                {/* Status Indicator Circle */}
                <div className="shrink-0 pl-2">
                  {isDone ? (
                    <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                  ) : isCurrent ? (
                    <div className="h-4 w-4 rounded-full border-2 border-accent animate-pulse" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-border/70" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ⏱️ 2. WORKOUT TIMER (REST & TOTAL) */}
      <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-elevated">
        {/* Switcher Tab */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-elevated p-1 border border-border mb-4">
          <button
            type="button"
            onClick={() => setTimerTab("rest")}
            className={`rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
              timerTab === "rest" ? "bg-surface text-accent-strong shadow-xs" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Thời gian nghỉ (Rest)
          </button>
          <button
            type="button"
            onClick={() => setTimerTab("total")}
            className={`rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
              timerTab === "total" ? "bg-surface text-accent-strong shadow-xs" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Tổng thời gian (Total)
          </button>
        </div>

        {/* Circular Countdown Display */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-accent/20 bg-gradient-to-br from-accent-soft/20 to-surface shadow-inner">
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="5"
                className="text-accent"
                strokeDasharray="276"
                strokeDashoffset={
                  timerTab === "rest"
                    ? 276 - (Math.max(restSeconds, 0) / (activeExercise.restSeconds || 60)) * 276
                    : 276 - ((totalWorkoutSeconds % 3600) / 3600) * 276
                }
                strokeLinecap="round"
              />
            </svg>

            <div className="text-center z-10">
              <div className="font-mono text-2xl font-black text-text-primary tracking-tight">
                {timerTab === "rest" ? formatTime(restSeconds) : formatTime(totalWorkoutSeconds)}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mt-0.5">
                {timerTab === "rest" ? (isResting ? "Đang đếm ngược" : "Nghỉ ngơi") : "Đang tính giờ"}
              </div>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center gap-2 mt-4">
            {timerTab === "rest" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddRestSeconds(10)}
                  className="text-xs h-8 px-3 border-border hover:border-accent"
                >
                  +10s
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSkipRest}
                  className="text-xs h-8 px-3 border-border hover:border-accent text-text-secondary"
                >
                  Bỏ qua
                </Button>
              </>
            )}

            <Button
              size="sm"
              onClick={onTogglePause}
              className={`text-xs h-8 px-3.5 gap-1.5 ${
                isWorkoutPaused
                  ? "bg-accent hover:bg-accent-strong text-white"
                  : "bg-surface-elevated text-text-primary border border-border hover:bg-accent-soft"
              }`}
            >
              {isWorkoutPaused ? <Play size={13} className="fill-current" /> : <Pause size={13} />}
              {isWorkoutPaused ? "Tiếp tục" : "Tạm dừng"}
            </Button>
          </div>
        </div>
      </div>

      {/* 📝 3. EXERCISE NOTES WIDGET */}
      <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-elevated space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
          <MessageSquare size={15} className="text-accent" />
          Ghi chú buổi tập (Exercise Notes)
        </div>

        <textarea
          rows={2}
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          placeholder="Ghi chú lại cảm giác khớp vai, mức tạ mang thêm, hoặc số rep đạt được..."
          className="w-full rounded-xl border border-border bg-background/50 p-3 text-xs text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
        />

        {/* Motivational Tip Badge */}
        <div className="flex items-start gap-2.5 rounded-xl bg-accent-soft/30 border border-accent/20 p-3 text-xs">
          <Lightbulb size={15} className="text-accent-strong shrink-0 mt-0.5" />
          <p className="text-text-secondary text-[11px] leading-relaxed">
            {activeExercise.notesPrompt}
          </p>
        </div>
      </div>
    </div>
  );
}
