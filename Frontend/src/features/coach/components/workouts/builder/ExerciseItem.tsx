import { forwardRef, useState, type CSSProperties, type ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, Dumbbell, GripVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import { Button3D, StatusBadge, Tooltip } from "../../ui";
import { INTENSITY } from "../../../constants/labels";
import type { PlanExercise } from "../../../types";

function Thumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="well-3d grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl text-text-secondary">
      {src && !failed ? <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" onError={() => setFailed(true)} /> : <Dumbbell size={18} aria-hidden />}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-surface-sunken px-2 py-1">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="truncate text-xs font-extrabold tabular-nums text-text-primary">{value}</dd>
    </div>
  );
}

interface ExerciseCardProps {
  exercise: PlanExercise;
  index: number;
  handle?: ReactNode;
  lifted?: boolean;
  dragging?: boolean;
  style?: CSSProperties;
  actions?: ReactNode;
}

/** Visual exercise prescription card. */
export const ExerciseCard = forwardRef<HTMLLIElement, ExerciseCardProps>(({ exercise, index, handle, lifted, dragging, style, actions }, ref) => (
  <li
    ref={ref}
    style={style}
    className={cn(
      "panel-3d flex flex-col gap-3 p-3 sm:flex-row sm:items-center",
      dragging && "opacity-40",
      lifted && "rotate-1 scale-[1.02] list-none shadow-[0_22px_40px_-12px_hsl(214_45%_20%/0.45)] ring-2 ring-accent/40"
    )}
  >
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {handle}
      <span className="w-5 shrink-0 text-center text-xs font-black tabular-nums text-text-secondary">{index + 1}</span>
      <Thumb src={exercise.imageUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-extrabold text-text-primary">{exercise.exerciseName}</p>
          <StatusBadge status={INTENSITY[exercise.intensity]} />
        </div>
        {exercise.notes && <p className="mt-0.5 line-clamp-1 text-xs text-text-secondary">{exercise.notes}</p>}
      </div>
    </div>
    <dl className="grid grid-cols-4 gap-1.5 sm:w-[296px] sm:shrink-0">
      <Stat label="Sets" value={String(exercise.sets)} />
      <Stat label="Reps" value={exercise.reps} />
      <Stat label="Nghỉ" value={`${exercise.restSeconds}s`} />
      <Stat label="Tempo" value={exercise.tempo} />
    </dl>
    {actions}
  </li>
));
ExerciseCard.displayName = "ExerciseCard";

interface SortableExerciseItemProps {
  exercise: PlanExercise;
  index: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export function SortableExerciseItem({ exercise, index, onEdit, onDuplicate, onRemove }: SortableExerciseItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: exercise.id });
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  const name = exercise.exerciseName;

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Kéo để sắp xếp lại ${name}, vị trí ${index + 1}`}
      className="grid h-8 w-6 shrink-0 cursor-grab touch-none place-items-center rounded-md text-text-secondary hover:bg-surface-sunken hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing"
    >
      <GripVertical size={16} aria-hidden />
    </button>
  );

  const actions = (
    <div className="flex shrink-0 items-center justify-end gap-1.5">
      <Tooltip label="Chỉnh sửa">
        <Button3D size="icon-sm" variant="ghost" aria-label={`Chỉnh sửa ${name}`} onClick={onEdit}>
          <Pencil size={14} />
        </Button3D>
      </Tooltip>
      <Tooltip label="Nhân bản">
        <Button3D size="icon-sm" variant="ghost" aria-label={`Nhân bản ${name}`} onClick={onDuplicate}>
          <Copy size={14} />
        </Button3D>
      </Tooltip>
      <Tooltip label="Xoá">
        <Button3D size="icon-sm" variant="ghost" aria-label={`Xoá ${name} khỏi buổi tập`} onClick={onRemove} className="text-rose-600 dark:text-rose-400">
          <Trash2 size={14} />
        </Button3D>
      </Tooltip>
    </div>
  );

  return <ExerciseCard ref={setNodeRef} style={style} exercise={exercise} index={index} handle={handle} dragging={isDragging} actions={actions} />;
}
