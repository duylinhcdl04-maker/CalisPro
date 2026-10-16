import { useState } from "react";
import { Dumbbell, Plus, ScanLine } from "lucide-react";
import { Button3D, StatusBadge } from "../../ui";
import { DIFFICULTY_LABEL, EQUIPMENT_LABEL, PATTERN_LABEL } from "../../../constants/labels";
import type { ExerciseLibraryItem } from "../../../types";
import { FOCUS_TONE } from "../workoutUi";

interface ExercisePreviewProps {
  exercise: ExerciseLibraryItem | null;
  addedCount: number;
  onAdd: () => void;
}

function Muscles({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold text-text-secondary">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((m) => (
          <span key={m} className="rounded-full border border-border bg-surface-sunken px-2 py-0.5 text-[11px] font-semibold text-text-primary">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Detail pane for the highlighted library exercise, with the add action. */
export function ExercisePreview({ exercise, addedCount, onAdd }: ExercisePreviewProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!exercise) {
    return (
      <div className="well-3d hidden h-full min-h-[220px] md:flex flex-col items-center justify-center gap-2 rounded-2xl p-6 text-center">
        <Dumbbell size={22} className="text-text-secondary" aria-hidden />
        <p className="text-sm font-bold text-text-primary">Chọn một bài tập</p>
        <p className="text-xs text-text-secondary">Xem hướng dẫn, nhóm cơ và thêm vào buổi tập.</p>
      </div>
    );
  }

  const showImage = exercise.imageUrl && failedSrc !== exercise.imageUrl;
  return (
    <div className="panel-3d flex flex-col gap-4 p-4" aria-live="polite">
      <div className="well-3d aspect-video overflow-hidden rounded-xl">
        {showImage ? (
          <img src={exercise.imageUrl} alt={exercise.name} className="h-full w-full object-cover" onError={() => setFailedSrc(exercise.imageUrl)} />
        ) : (
          <div className="grid h-full place-items-center text-text-secondary">
            <Dumbbell size={28} aria-hidden />
          </div>
        )}
      </div>
      <div>
        <h3 className="text-base font-extrabold text-text-primary">{exercise.name}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <StatusBadge tone={FOCUS_TONE[exercise.movementPattern]}>{PATTERN_LABEL[exercise.movementPattern]}</StatusBadge>
          <StatusBadge tone="neutral">{DIFFICULTY_LABEL[exercise.difficulty]}</StatusBadge>
          <StatusBadge tone="neutral">{EQUIPMENT_LABEL[exercise.equipment]}</StatusBadge>
          {exercise.aiAnalysisAvailable && (
            <StatusBadge tone="info" icon={<ScanLine size={11} aria-hidden />}>AI Motion hỗ trợ</StatusBadge>
          )}
        </div>
      </div>
      <Muscles label="Cơ chính" items={exercise.primaryMuscles} />
      <Muscles label="Cơ phụ" items={exercise.secondaryMuscles} />
      {exercise.instructions.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-bold text-text-secondary">Hướng dẫn</p>
          <ol className="space-y-1.5">
            {exercise.instructions.map((step, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-text-primary">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-[10px] font-black text-accent-strong dark:text-accent">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <Button3D variant="primary" leftIcon={<Plus size={15} />} onClick={onAdd} className="w-full">
        {addedCount > 0 ? `Thêm lần nữa (đã thêm ${addedCount})` : "Thêm vào buổi tập"}
      </Button3D>
    </div>
  );
}
