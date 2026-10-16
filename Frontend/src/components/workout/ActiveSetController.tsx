import { useState } from "react";
import { Minus, Plus, Check, SkipForward, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import type { ExerciseGuideDetail } from "../../services/mock/workoutTrainingData";
import { Button } from "../ui/Button";

interface ActiveSetControllerProps {
  exercise: ExerciseGuideDetail;
  currentSet: number;
  totalSets: number;
  repsCount: number;
  onRepsChange: (reps: number) => void;
  completedSets: number[];
  onCompleteSet: () => void;
  onSkipExercise: () => void;
  onNextExercise: () => void;
  isLastExercise: boolean;
}

export function ActiveSetController({
  exercise,
  currentSet,
  totalSets,
  repsCount,
  onRepsChange,
  completedSets,
  onCompleteSet,
  onSkipExercise,
  onNextExercise,
  isLastExercise,
}: ActiveSetControllerProps) {
  function handleDecrement() {
    if (repsCount > 1) onRepsChange(repsCount - 1);
  }

  function handleIncrement() {
    onRepsChange(repsCount + 1);
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-6 shadow-elevated space-y-5 sm:space-y-6">
      {/* 3 Metric Headers & Circular Gauge Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-5 border-b border-border/70 pb-5 sm:pb-6">
        {/* Metric Badges */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6 text-center sm:text-left w-full md:w-auto bg-background/50 md:bg-transparent p-3 md:p-0 rounded-xl border border-border/40 md:border-0">
          <div>
            <div className="text-[11px] sm:text-xs text-text-secondary font-medium">Hiệp hiện tại</div>
            <div className="mt-0.5 text-xl sm:text-2xl font-black text-text-primary">
              {currentSet} <span className="text-xs sm:text-base text-text-secondary font-medium">/ {totalSets}</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] sm:text-xs text-text-secondary font-medium">Mục tiêu Reps</div>
            <div className="mt-0.5 text-xl sm:text-2xl font-black text-text-primary">{exercise.targetReps}</div>
          </div>

          <div>
            <div className="text-[11px] sm:text-xs text-text-secondary font-medium">Thời gian nghỉ</div>
            <div className="mt-0.5 text-xl sm:text-2xl font-black text-accent-strong">{exercise.restSeconds}s</div>
          </div>
        </div>

        {/* 🟢 INTERACTIVE CIRCULAR RADIAL REP COUNTER WITH MINUS & PLUS */}
        <div className="flex items-center justify-center gap-3 w-full sm:w-auto py-1">
          <button
            type="button"
            onClick={handleDecrement}
            className="flex h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-surface-elevated border border-border hover:bg-accent-soft hover:text-accent-strong transition-colors active:scale-95 cursor-pointer shadow-xs text-text-primary"
            aria-label="Giảm reps"
          >
            <Minus size={20} />
          </button>

          {/* Radial Ring Gauge */}
          <div className="relative flex h-24 w-24 sm:h-24 sm:w-24 items-center justify-center rounded-full border-4 border-accent/20 bg-gradient-to-br from-accent-soft/30 to-surface shadow-md">
            {/* Animated conic border gauge */}
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="6"
                className="text-accent"
                strokeDasharray="264"
                strokeDashoffset={264 - (Math.min(repsCount, 20) / 20) * 264}
                strokeLinecap="round"
              />
            </svg>

            <div className="text-center z-10">
              <div className="text-2xl sm:text-3xl font-black text-text-primary leading-none">{repsCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mt-0.5">reps</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleIncrement}
            className="flex h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-surface-elevated border border-border hover:bg-accent-soft hover:text-accent-strong transition-colors active:scale-95 cursor-pointer shadow-xs text-text-primary"
            aria-label="Tăng reps"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* 📋 SET HISTORY CHIP LIST */}
        <div className="w-full md:w-44 rounded-xl bg-background/50 p-3 border border-border/60 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
            Lịch sử hiệp tập:
          </div>
          <div className="grid grid-cols-3 md:grid-cols-1 gap-1.5">
            {Array.from({ length: totalSets }).map((_, idx) => {
              const setIdx = idx + 1;
              const isDone = completedSets.length >= setIdx;
              const isCurrent = currentSet === setIdx && !isDone;
              const repsRecorded = completedSets[idx];

              return (
                <div
                  key={setIdx}
                  className={`flex items-center justify-between rounded-lg px-2 py-1 text-[11px] sm:text-xs font-semibold ${
                    isDone
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : isCurrent
                      ? "bg-accent text-white font-bold"
                      : "text-text-secondary/60 bg-surface/50"
                  }`}
                >
                  <span>Hiệp {setIdx}</span>
                  <span className="flex items-center gap-1">
                    {isDone ? `${repsRecorded}r ✓` : isCurrent ? "Tập" : "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🎯 ACTION BUTTONS BAR (Desktop visible, mobile also available) */}
      <div className="hidden sm:flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={onSkipExercise}
          className="w-full sm:w-auto text-xs text-text-secondary hover:text-text-primary border-border hover:border-text-secondary"
        >
          Bỏ qua bài tập
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            size="lg"
            onClick={onCompleteSet}
            className="flex-1 sm:flex-initial px-8 bg-accent hover:bg-accent-strong text-white font-bold shadow-md gap-2"
          >
            <Check size={18} className="stroke-[3]" />
            Hoàn thành hiệp {currentSet}
          </Button>

          <Button
            variant="outline"
            onClick={onNextExercise}
            className="text-xs gap-1.5 border-border hover:border-accent"
          >
            {isLastExercise ? "Kết thúc buổi tập" : "Bài tiếp theo"}
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
