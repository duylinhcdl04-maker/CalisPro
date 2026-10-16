import type { UseFormReturn } from "react-hook-form";
import { ClipboardList } from "lucide-react";
import { Field, Panel, SelectField, TextArea, TextInput } from "../../ui";
import { GOAL_LABEL, LEVEL_LABEL } from "../../../constants/labels";
import { useStudentOptions } from "../../../hooks";
import type { StudentLevel, TrainingGoal } from "../../../types";
import { MAX_WEEKS } from "./planModel";
import type { PlanHeaderValues } from "./planSchema";

interface PlanHeaderFormProps {
  form: UseFormReturn<PlanHeaderValues>;
}

const GOALS = Object.entries(GOAL_LABEL) as [TrainingGoal, string][];
const LEVELS = Object.entries(LEVEL_LABEL) as [StudentLevel, string][];

/** Plan-level fields. Validation lives in planHeaderSchema; the parent owns submit. */
export function PlanHeaderForm({ form }: PlanHeaderFormProps) {
  const { register, formState } = form;
  const { errors } = formState;
  const students = useStudentOptions();
  // Controlled so a prefilled id still shows once the options arrive asynchronously.
  const studentId = form.watch("studentId");
  const aria = (err: unknown, describedBy: string | undefined) => ({ "aria-invalid": err ? true : undefined, "aria-describedby": describedBy });

  return (
    <Panel title="Thông tin giáo án" description="Tên, học viên, mục tiêu và khung thời gian." icon={ClipboardList}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Field label="Tên giáo án" required error={errors.name?.message} className="sm:col-span-2 lg:col-span-4">
          {(id, d) => <TextInput id={id} placeholder="Ví dụ: 8 Week Strength Program" maxLength={80} {...aria(errors.name, d)} {...register("name")} />}
        </Field>
        <Field label="Học viên" error={errors.studentId?.message} hint="Có thể gán sau." className="sm:col-span-2 lg:col-span-2">
          {(id, d) => (
            <SelectField id={id} disabled={students.isLoading} {...aria(errors.studentId, d)} {...register("studentId")} value={studentId}>
              <option value="">{students.isLoading ? "Đang tải học viên..." : "Chưa gán học viên"}</option>
              {students.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({LEVEL_LABEL[s.level]})
                </option>
              ))}
            </SelectField>
          )}
        </Field>
        <Field label="Mục tiêu" error={errors.goal?.message} className="lg:col-span-2">
          {(id, d) => (
            <SelectField id={id} {...aria(errors.goal, d)} {...register("goal")}>
              {GOALS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </SelectField>
          )}
        </Field>
        <Field label="Trình độ" error={errors.level?.message} className="lg:col-span-2">
          {(id, d) => (
            <SelectField id={id} {...aria(errors.level, d)} {...register("level")}>
              {LEVELS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </SelectField>
          )}
        </Field>
        <Field label="Thời lượng (tuần)" required error={errors.durationWeeks?.message} hint={`1 đến ${MAX_WEEKS} tuần`}>
          {(id, d) => <TextInput id={id} type="number" inputMode="numeric" min={1} max={MAX_WEEKS} {...aria(errors.durationWeeks, d)} {...register("durationWeeks", { valueAsNumber: true })} />}
        </Field>
        <Field label="Buổi / tuần" required error={errors.frequencyPerWeek?.message} hint="1 đến 7 buổi">
          {(id, d) => <TextInput id={id} type="number" inputMode="numeric" min={1} max={7} {...aria(errors.frequencyPerWeek, d)} {...register("frequencyPerWeek", { valueAsNumber: true })} />}
        </Field>
        <Field label="Mô tả" error={errors.description?.message} className="sm:col-span-2 lg:col-span-6">
          {(id, d) => <TextArea id={id} rows={2} className="min-h-[72px]" placeholder="Mục tiêu chính, lưu ý chấn thương, cách tăng tải..." {...aria(errors.description, d)} {...register("description")} />}
        </Field>
      </div>
    </Panel>
  );
}
