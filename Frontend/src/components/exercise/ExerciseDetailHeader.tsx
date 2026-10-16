import type { Exercise } from "../../types";
import { Badge, type BadgeProps } from "../ui/Badge";

function difficultyVariant(difficulty: Exercise["difficulty"]): BadgeProps["variant"] {
  if (difficulty === "Beginner") return "accent";
  if (difficulty === "Intermediate") return "warning";
  return "danger";
}

export function ExerciseDetailHeader({ exercise }: { exercise: Exercise }) {
  return (
    <div>
      <div className="overflow-hidden rounded-lg">
        <img src={exercise.imageUrl} alt={exercise.name} className="h-64 w-full object-cover sm:h-80" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">{exercise.name}</h1>
        <Badge variant={difficultyVariant(exercise.difficulty)}>{exercise.difficulty}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-6 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-[.1em] text-text-secondary">Cơ chính</div>
          <div className="mt-1 font-medium text-text-primary">{exercise.primaryMuscles.join(", ")}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[.1em] text-text-secondary">Cơ phụ</div>
          <div className="mt-1 font-medium text-text-primary">{exercise.secondaryMuscles.join(", ")}</div>
        </div>
      </div>
    </div>
  );
}
