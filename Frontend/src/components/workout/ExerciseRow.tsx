import type { WorkoutExercise } from "../../types";
import { cn } from "../../lib/utils";

interface ExerciseRowProps {
  exercise: WorkoutExercise;
  index: number;
  className?: string;
}

export function ExerciseRow({ exercise, index, className }: ExerciseRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 sm:flex-row sm:items-center sm:gap-6",
        className
      )}
    >
      <div className="flex items-center gap-4 sm:w-64 sm:flex-none">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-strong">
          {index + 1}
        </span>
        <img
          src={exercise.imageUrl}
          alt={exercise.name}
          className="h-14 w-14 flex-none rounded-md object-cover"
          loading="lazy"
        />
        <div className="min-w-0">
          <div className="truncate font-semibold text-text-primary">{exercise.name}</div>
          <div className="text-xs text-text-secondary">{exercise.muscleGroup}</div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-4 gap-2 text-center sm:gap-6">
        <Stat label="Sets" value={String(exercise.sets)} />
        <Stat label="Reps" value={exercise.reps} />
        <Stat label="Nghỉ" value={`${exercise.restSeconds}s`} />
        <Stat label="RPE" value={String(exercise.rpe)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-bold text-text-primary">{value}</div>
      <div className="text-[10px] uppercase tracking-[.1em] text-text-secondary">{label}</div>
    </div>
  );
}
