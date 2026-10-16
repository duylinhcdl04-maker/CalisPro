import { useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import type { Modifier } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { PlanExercise } from "../../../types";
import { ExerciseCard, SortableExerciseItem } from "./ExerciseItem";

interface ExerciseListProps {
  exercises: PlanExercise[];
  onReorder: (fromId: string, toId: string) => void;
  onEdit: (exercise: PlanExercise) => void;
  onDuplicate: (exerciseId: string) => void;
  onRemove: (exerciseId: string) => void;
}

/** Lock reorder drags to the vertical axis (no @dnd-kit/modifiers dependency needed). */
const restrictToVerticalAxisSafe: Modifier = ({ transform }) => ({ ...transform, x: 0 });

/** Sortable exercise order inside a session (pointer and keyboard). */
export function ExerciseList({ exercises, onReorder, onEdit, onDuplicate, onRemove }: ExerciseListProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const pos = (id: UniqueIdentifier) => exercises.findIndex((e) => e.id === id) + 1;
  const name = (id: UniqueIdentifier) => exercises.find((e) => e.id === id)?.exerciseName ?? "bài tập";
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Đã nhấc ${name(active.id)} ở vị trí ${pos(active.id)} trên ${exercises.length}.`,
    onDragOver: ({ active, over }) => (over ? `${name(active.id)} đang ở vị trí ${pos(over.id)} trên ${exercises.length}.` : undefined),
    onDragEnd: ({ active, over }) => (over ? `Đã thả ${name(active.id)} vào vị trí ${pos(over.id)}.` : `Đã thả ${name(active.id)}.`),
    onDragCancel: ({ active }) => `Đã huỷ sắp xếp. ${name(active.id)} giữ nguyên vị trí.`,
  };

  function handleEnd(e: DragEndEvent) {
    setActiveId(null);
    if (e.over && e.active.id !== e.over.id) onReorder(String(e.active.id), String(e.over.id));
  }

  const active = exercises.find((e) => e.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxisSafe]}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragEnd={handleEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: "Nhấn Space hoặc Enter để nhấc bài tập. Dùng mũi tên lên xuống để đổi vị trí, Space hoặc Enter để thả, Escape để huỷ.",
        },
      }}
    >
      <SortableContext items={exercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <ol className="space-y-2.5" aria-label="Danh sách bài tập trong buổi">
          {exercises.map((ex, i) => (
            <SortableExerciseItem
              key={ex.id}
              exercise={ex}
              index={i}
              onEdit={() => onEdit(ex)}
              onDuplicate={() => onDuplicate(ex.id)}
              onRemove={() => onRemove(ex.id)}
            />
          ))}
        </ol>
      </SortableContext>
      <DragOverlay>
        {active ? (
          <ul className="list-none">
            <ExerciseCard exercise={active} index={exercises.indexOf(active)} lifted />
          </ul>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
