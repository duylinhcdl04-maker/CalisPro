import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button3D, Field, Modal, SelectField, TextArea, TextInput } from "../../ui";
import { INTENSITY } from "../../../constants/labels";
import type { Intensity, PlanExercise } from "../../../types";
import { exerciseEditSchema, type ExerciseEditValues } from "./planSchema";

interface ExerciseEditModalProps {
  exercise: PlanExercise | null;
  onClose: () => void;
  onSave: (values: ExerciseEditValues) => void;
}

const INTENSITIES = Object.entries(INTENSITY) as [Intensity, { label: string }][];

function toValues(e: PlanExercise): ExerciseEditValues {
  return { sets: e.sets, reps: e.reps, restSeconds: e.restSeconds, tempo: e.tempo, intensity: e.intensity, notes: e.notes };
}

/** Prescription editor for one exercise inside a session. */
export function ExerciseEditModal({ exercise, onClose, onSave }: ExerciseEditModalProps) {
  const { register, handleSubmit, reset, formState } = useForm<ExerciseEditValues>({ resolver: zodResolver(exerciseEditSchema) });
  const { errors } = formState;

  useEffect(() => {
    if (exercise) reset(toValues(exercise));
  }, [exercise, reset]);

  const aria = (err: unknown, d: string | undefined) => ({ "aria-invalid": err ? true : undefined, "aria-describedby": d });
  const submit = handleSubmit((v) => {
    onSave(v);
    onClose();
  });

  return (
    <Modal
      open={exercise !== null}
      onOpenChange={(o) => !o && onClose()}
      title={exercise ? `Chỉnh sửa: ${exercise.exerciseName}` : "Chỉnh sửa bài tập"}
      description="Sets, reps, thời gian nghỉ, tempo và cường độ."
      footer={
        <>
          <Button3D variant="ghost" onClick={onClose}>Huỷ</Button3D>
          <Button3D variant="primary" type="submit" form="exercise-edit-form">Lưu bài tập</Button3D>
        </>
      }
    >
      <form id="exercise-edit-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Số hiệp (sets)" required error={errors.sets?.message} hint="1 đến 10">
          {(id, d) => <TextInput id={id} type="number" inputMode="numeric" min={1} max={10} {...aria(errors.sets, d)} {...register("sets", { valueAsNumber: true })} />}
        </Field>
        <Field label="Số lần / thời gian (reps)" required error={errors.reps?.message} hint='Ví dụ: "10", "8-12", "30s"'>
          {(id, d) => <TextInput id={id} {...aria(errors.reps, d)} {...register("reps")} />}
        </Field>
        <Field label="Nghỉ giữa hiệp (giây)" required error={errors.restSeconds?.message} hint="0 đến 600">
          {(id, d) => <TextInput id={id} type="number" inputMode="numeric" min={0} max={600} step={5} {...aria(errors.restSeconds, d)} {...register("restSeconds", { valueAsNumber: true })} />}
        </Field>
        <Field label="Tempo" required error={errors.tempo?.message} hint='Hạ-dừng-lên-dừng, ví dụ "2-0-1-0" hoặc "-"'>
          {(id, d) => <TextInput id={id} {...aria(errors.tempo, d)} {...register("tempo")} />}
        </Field>
        <Field label="Cường độ" error={errors.intensity?.message} className="sm:col-span-2">
          {(id, d) => (
            <SelectField id={id} {...aria(errors.intensity, d)} {...register("intensity")}>
              {INTENSITIES.map(([v, t]) => (
                <option key={v} value={v}>{t.label}</option>
              ))}
            </SelectField>
          )}
        </Field>
        <Field label="Ghi chú cho học viên" error={errors.notes?.message} className="sm:col-span-2">
          {(id, d) => <TextArea id={id} rows={3} placeholder="Ví dụ: giữ khuỷu tay sát thân, dừng 1 giây ở đáy." {...aria(errors.notes, d)} {...register("notes")} />}
        </Field>
      </form>
    </Modal>
  );
}
