import { useState, type Dispatch } from "react";
import { Dumbbell, ListPlus, Moon, Plus, Target } from "lucide-react";
import { Button3D, EmptyState, Field, Panel, SelectField, TextInput } from "../../ui";
import { PATTERN_LABEL, WEEKDAY_LABEL } from "../../../constants/labels";
import type { MovementPattern, PlanDay, PlanExercise } from "../../../types";
import { ExerciseSelectorModal } from "../exercises/ExerciseSelectorModal";
import type { BuilderAction, SessionPatch } from "./builderReducer";
import { ExerciseEditModal } from "./ExerciseEditModal";
import { ExerciseList } from "./ExerciseList";

interface SessionBuilderProps {
  day: PlanDay | null;
  weekNumber: number;
  dispatch: Dispatch<BuilderAction>;
}

const PATTERNS = Object.entries(PATTERN_LABEL) as [MovementPattern, string][];

/** Editor for the selected day's session: meta fields, ordered exercises, library picker. */
export function SessionBuilder({ day, weekNumber, dispatch }: SessionBuilderProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState<PlanExercise | null>(null);

  if (!day) {
    return (
      <Panel title="Chi tiết buổi tập" icon={Target}>
        <EmptyState icon={Target} title="Chọn một ngày để chỉnh sửa" description="Bấm vào tên buổi tập trong tuần, hoặc thêm buổi tập vào một ngày nghỉ." className="py-8" />
      </Panel>
    );
  }

  const dayLabel = `${WEEKDAY_LABEL[day.dayOfWeek].long}, tuần ${weekNumber}`;
  const session = day.session;

  if (!session) {
    return (
      <Panel title="Chi tiết buổi tập" description={dayLabel} icon={Moon}>
        <EmptyState
          icon={Moon}
          title="Ngày nghỉ"
          description="Ngày này đang là ngày nghỉ phục hồi."
          className="py-8"
          action={
            <Button3D variant="primary" leftIcon={<Plus size={15} />} onClick={() => dispatch({ type: "addSession", dayId: day.id })}>
              Thêm buổi tập
            </Button3D>
          }
        />
      </Panel>
    );
  }

  const dayId = day.id;
  const update = (patch: SessionPatch) => dispatch({ type: "updateSession", dayId, patch });

  return (
    <Panel
      title="Chi tiết buổi tập"
      description={dayLabel}
      icon={Dumbbell}
      actions={
        <Button3D size="sm" variant="ghost" leftIcon={<Moon size={14} />} onClick={() => dispatch({ type: "setRest", dayId: day.id })}>
          Đặt làm ngày nghỉ
        </Button3D>
      }
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px_140px]">
        <Field label="Tên buổi tập" required error={session.title.trim() ? undefined : "Nhập tên buổi tập."}>
          {(id, d) => (
            <TextInput id={id} value={session.title} maxLength={60} aria-invalid={session.title.trim() ? undefined : true} aria-describedby={d} onChange={(e) => update({ title: e.target.value })} />
          )}
        </Field>
        <Field label="Trọng tâm">
          {(id) => (
            <SelectField id={id} value={session.focus} onChange={(e) => update({ focus: e.target.value as MovementPattern })}>
              {PATTERNS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </SelectField>
          )}
        </Field>
        <Field label="Thời lượng (phút)">
          {(id) => (
            <TextInput
              id={id}
              type="number"
              inputMode="numeric"
              min={1}
              max={240}
              step={5}
              value={session.durationMinutes}
              onChange={(e) => {
                const n = e.target.valueAsNumber;
                if (Number.isFinite(n)) update({ durationMinutes: Math.max(1, Math.min(240, Math.round(n))) });
              }}
            />
          )}
        </Field>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-text-primary">
          Bài tập <span className="font-bold tabular-nums text-text-secondary">({session.exercises.length})</span>
        </h3>
        <Button3D variant="primary" size="sm" leftIcon={<ListPlus size={15} />} onClick={() => setPickerOpen(true)}>
          Thêm bài tập
        </Button3D>
      </div>

      <div className="mt-3">
        {session.exercises.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border">
            <EmptyState icon={ListPlus} title="Buổi tập chưa có bài nào" description="Mở thư viện để chọn bài tập, rồi điều chỉnh sets, reps, nghỉ và tempo." className="py-8" />
          </div>
        ) : (
          <ExerciseList
            exercises={session.exercises}
            onReorder={(fromId, toId) => dispatch({ type: "reorderExercises", dayId: day.id, fromId, toId })}
            onEdit={setEditing}
            onDuplicate={(exerciseId) => dispatch({ type: "duplicateExercise", dayId: day.id, exerciseId })}
            onRemove={(exerciseId) => dispatch({ type: "removeExercise", dayId: day.id, exerciseId })}
          />
        )}
      </div>

      <ExerciseSelectorModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        sessionTitle={session.title || "buổi tập"}
        onAdd={(item) => dispatch({ type: "addExercise", dayId: day.id, item })}
      />
      <ExerciseEditModal
        exercise={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => editing && dispatch({ type: "updateExercise", dayId: day.id, exerciseId: editing.id, patch })}
      />
    </Panel>
  );
}
