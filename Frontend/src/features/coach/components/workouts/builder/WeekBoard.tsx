import { useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { WEEKDAY_LABEL } from "../../../constants/labels";
import type { PlanWeek } from "../../../types";
import { DayColumn } from "./DayColumn";
import { SessionCardFace } from "./SessionCard";

interface WeekBoardProps {
  week: PlanWeek;
  selectedDayId: string | null;
  onSelectDay: (dayId: string) => void;
  onAddSession: (dayId: string) => void;
  onSwap: (fromDayId: string, toDayId: string) => void;
}

/** Pointer first (precise in a grid), closest center as fallback for keyboard and gaps. */
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : closestCenter(args);
};

/** 7-day week: grid on tablet/desktop (scrolls inside its own container), stacked list on mobile. */
export function WeekBoard({ week, selectedDayId, onSelectDay, onAddSession, onSwap }: WeekBoardProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const dayById = (id: UniqueIdentifier | undefined) => week.days.find((d) => d.id === id);
  const dayName = (id: UniqueIdentifier | undefined) => {
    const d = dayById(id);
    return d ? WEEKDAY_LABEL[d.dayOfWeek].long : "";
  };
  const sessionName = (id: UniqueIdentifier) => dayById(id)?.session?.title ?? "buổi tập";

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Đã nhấc buổi "${sessionName(active.id)}" từ ${dayName(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `Buổi "${sessionName(active.id)}" đang ở trên ${dayName(over.id)}.` : `Buổi "${sessionName(active.id)}" không ở trên ngày nào.`,
    onDragEnd: ({ active, over }) => {
      if (!over || over.id === active.id) return `Đã thả buổi "${sessionName(active.id)}", không thay đổi.`;
      const target = dayById(over.id);
      return target?.session
        ? `Đã đổi chỗ buổi "${sessionName(active.id)}" với ${dayName(over.id)}.`
        : `Đã chuyển buổi "${sessionName(active.id)}" sang ${dayName(over.id)}.`;
    },
    onDragCancel: ({ active }) => `Đã huỷ kéo. Buổi "${sessionName(active.id)}" giữ nguyên ở ${dayName(active.id)}.`,
  };

  function handleStart(e: DragStartEvent) {
    setActiveId(e.active.id);
  }
  function handleEnd(e: DragEndEvent) {
    setActiveId(null);
    const from = String(e.active.id);
    const to = e.over ? String(e.over.id) : null;
    if (to && to !== from) onSwap(from, to);
  }

  const activeSession = dayById(activeId ?? undefined)?.session ?? null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={handleStart}
      onDragEnd={handleEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Để kéo buổi tập, nhấn Space hoặc Enter. Dùng phím mũi tên để chọn ngày khác, nhấn Space hoặc Enter lần nữa để thả, hoặc Escape để huỷ.",
        },
      }}
    >
      <div className="-mx-1 px-1 pb-1 md:overflow-x-auto scrollbar-thin">
        <div className="flex flex-col gap-2.5 md:grid md:min-w-[868px] md:grid-cols-7">
          {week.days.map((day) => (
            <DayColumn
              key={day.id}
              day={day}
              selected={day.id === selectedDayId}
              onSelect={() => onSelectDay(day.id)}
              onAddSession={() => onAddSession(day.id)}
            />
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {activeSession ? <SessionCardFace session={activeSession} lifted className="cursor-grabbing" /> : null}
      </DragOverlay>
    </DndContext>
  );
}
