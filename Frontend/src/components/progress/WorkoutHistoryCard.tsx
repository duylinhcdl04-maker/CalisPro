import { useState } from "react";
import {
  Calendar,
  Clock,
  Flame,
  Dumbbell,
  Trophy,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  Repeat,
  Heart,
  Share2,
} from "lucide-react";
import type { WorkoutHistoryItem } from "../../services/mock/workoutHistoryData";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { toast } from "sonner";

export function WorkoutHistoryCard({ workout }: { workout: WorkoutHistoryItem }) {
  const [isExpanded, setIsExpanded] = useState(false);

  function handleShare() {
    toast.success("Đã sao chép liên kết tóm tắt buổi tập!", {
      description: `Đã hoàn thành ${workout.title} • ${workout.totalReps} reps!`,
    });
  }

  return (
    <div className="group rounded-2xl border border-border/80 bg-surface p-5 shadow-elevated transition-all duration-200 hover:border-accent/60 hover:shadow-soft">
      {/* Top Header: Title, Category Badge, PR Badge */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-bold text-text-primary group-hover:text-accent transition-colors">
              {workout.title}
            </h3>
            <Badge variant="accent" className="text-[11px] font-bold">
              {workout.category}
            </Badge>
            {workout.prBadge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-700 dark:text-amber-400">
                <Trophy size={12} className="text-amber-500" />
                {workout.prBadge}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1 font-medium">
              <Calendar size={13} />
              {workout.completedAt}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium">
              <Clock size={13} />
              {workout.durationMinutes} phút
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              {workout.totalExercises} bài tập ({workout.totalReps} reps)
            </span>
          </div>
        </div>

        {/* Quick Feeling / RPE Meter */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="rounded-xl bg-surface-elevated border border-border/60 px-3 py-1.5 text-right">
            <div className="text-[10px] uppercase tracking-wider text-text-secondary font-bold">Cường độ</div>
            <div className="text-xs font-extrabold text-accent-strong flex items-center gap-1">
              <Activity size={13} />
              RPE {workout.intensityRpe}/10
            </div>
          </div>
        </div>
      </div>

      {/* Muscle Group Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {workout.muscleGroups.map((mg) => (
          <span
            key={mg}
            className="rounded-lg bg-background/80 border border-border/50 px-2.5 py-0.5 text-[11px] font-medium text-text-secondary"
          >
            {mg}
          </span>
        ))}
      </div>

      {/* Athlete Note */}
      {workout.athleteNotes && (
        <div className="mt-3 rounded-xl bg-accent-soft/20 border border-accent/15 p-2.5 text-xs text-text-secondary italic">
          "{workout.athleteNotes}"
        </div>
      )}

      {/* Expandable Exercise Breakdown */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border/70 space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center justify-between">
            <span>Chi tiết các bài tập đã hoàn thành:</span>
            <span className="text-[11px] font-medium text-text-secondary">Hiệp x Số lần</span>
          </div>

          <div className="space-y-2">
            {workout.exercises.map((ex, idx) => (
              <div
                key={ex.id || idx}
                className="flex items-center justify-between rounded-xl bg-background/60 p-3 border border-border/50 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-accent-strong font-bold text-[11px]">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-text-primary flex items-center gap-1.5">
                      {ex.name}
                      {ex.weightAdded && ex.weightAdded !== "Bodyweight" && (
                        <span className="rounded-md bg-amber-500/10 text-amber-600 font-bold px-1.5 py-0.2 text-[10px]">
                          {ex.weightAdded}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-text-secondary mt-0.5">
                      {ex.targetMuscle} {ex.notes && `• ${ex.notes}`}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-accent-strong text-xs">
                    {ex.sets} Sets
                  </div>
                  <div className="text-[11px] text-text-secondary font-medium">
                    {ex.reps}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-text-secondary pt-2">
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              <Flame size={14} />
              Đã đốt cháy ~{workout.caloriesBurned} kcal
            </span>
            <span className="font-medium">Cảm nhận: {workout.feeling}</span>
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold gap-1 text-accent-strong hover:bg-accent-soft/40 px-2"
        >
          {isExpanded ? (
            <>
              Thu gọn chi tiết
              <ChevronUp size={15} />
            </>
          ) : (
            <>
              Xem chi tiết {workout.exercises.length} bài tập
              <ChevronDown size={15} />
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="text-xs gap-1.5 border-border/80 hover:border-accent"
        >
          <Share2 size={13} />
          Chia sẻ
        </Button>
      </div>
    </div>
  );
}
