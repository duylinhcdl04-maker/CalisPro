import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, Dumbbell, ScanLine } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { SessionExerciseResult } from "../../types";
import type { Tone } from "../../constants/labels";
import { Button3D, TONE_CLASSES } from "../ui";
import { FormScoreBadge } from "./shared";

/** Presentation only: how far a set fell short of its target, for chip styling. */
function setTone(actual: number | undefined, target: number): Tone {
  if (actual === undefined || actual === 0) return "critical";
  if (actual >= target) return "neutral";
  return actual >= target * 0.8 ? "warning" : "critical";
}

function SetChip({ index, actual, target }: { index: number; actual: number | undefined; target: number }) {
  const tone = setTone(actual, target);
  const below = tone !== "neutral";
  const label = `Set ${index + 1}: ${actual ?? 0} trên ${target} rep${below ? ", thấp hơn mục tiêu" : ""}`;
  return (
    <li
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 min-w-[44px] items-center justify-center gap-0.5 rounded-xl border px-2 text-sm font-extrabold tabular-nums",
        below ? TONE_CLASSES[tone] : "well-3d text-text-primary"
      )}
    >
      {actual ?? "-"}
      {below && <ArrowDown size={12} aria-hidden />}
    </li>
  );
}

export function ExerciseResultCard({ exercise, style }: { exercise: SessionExerciseResult; style?: React.CSSProperties }) {
  const [imgFailed, setImgFailed] = useState(false);
  const sets = Array.from({ length: Math.max(exercise.targetSets, exercise.actualReps.length) }, (_, i) => exercise.actualReps[i]);
  const hasShortfall = sets.some((a) => setTone(a, exercise.targetReps) !== "neutral");

  return (
    <article className="panel-3d animate-rise p-4 sm:p-5" style={style}>
      <div className="flex items-start gap-4">
        <div className="well-3d grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl sm:h-20 sm:w-20">
          {exercise.imageUrl && !imgFailed ? (
            <img src={exercise.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setImgFailed(true)} />
          ) : (
            <Dumbbell size={24} className="text-text-secondary" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-extrabold leading-tight text-text-primary">{exercise.exerciseName}</h3>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="text-[10px] font-bold text-text-secondary">Form Score</span>
              <FormScoreBadge score={exercise.formScore} size="md" />
            </div>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Mục tiêu <span className="font-extrabold tabular-nums text-text-primary">{exercise.targetSets} × {exercise.targetReps}</span>
            <span className="mx-1.5" aria-hidden>·</span>
            Nghỉ <span className="tabular-nums">{exercise.restSeconds}s</span>
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-[11px] font-bold text-text-secondary">Thực tế từng set</div>
        <ul className="flex flex-wrap gap-2" aria-label={`Số rep thực tế của ${exercise.exerciseName}`}>
          {sets.map((a, i) => (
            <SetChip key={i} index={i} actual={a} target={exercise.targetReps} />
          ))}
        </ul>
        {hasShortfall && (
          <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-text-secondary">
            <ArrowDown size={11} aria-hidden /> Set thấp hơn mục tiêu {exercise.targetReps} rep
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
        <dl className="flex items-center gap-4 text-xs">
          <div className="flex items-baseline gap-1.5">
            <dt className="font-semibold text-text-secondary">Valid</dt>
            <dd className="text-base font-black tabular-nums text-emerald-600 dark:text-emerald-400">{exercise.validReps}</dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="font-semibold text-text-secondary">Invalid</dt>
            <dd className={cn("text-base font-black tabular-nums", exercise.invalidReps > 0 ? "text-rose-600 dark:text-rose-400" : "text-text-primary")}>{exercise.invalidReps}</dd>
          </div>
        </dl>
        {exercise.aiAnalysisId && (
          <Button3D asChild size="sm" variant="ghost">
            <Link to={`/coach/ai-analysis/${exercise.aiAnalysisId}`}>
              <ScanLine size={14} aria-hidden />
              Xem phân tích AI
            </Link>
          </Button3D>
        )}
      </div>
    </article>
  );
}
