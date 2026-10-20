import type { Exercise } from "../../types";
import { Badge, type BadgeProps } from "../ui/Badge";

function difficultyVariant(difficulty: Exercise["difficulty"]): BadgeProps["variant"] {
  if (difficulty === "Beginner") return "accent";
  if (difficulty === "Intermediate") return "warning";
  return "danger";
}

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-elevated">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={exercise.imageUrl}
          alt={exercise.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold text-text-primary">{exercise.name}</div>
          <Badge variant={difficultyVariant(exercise.difficulty)}>{exercise.difficulty}</Badge>
        </div>
        <div className="mt-2">
          <Badge variant="neutral">{exercise.primaryMuscles.join(", ")}</Badge>
        </div>
        {exercise.description && <p className="mt-3 line-clamp-2 text-sm text-text-secondary">{exercise.description}</p>}
      </div>
    </div>
  );
}
