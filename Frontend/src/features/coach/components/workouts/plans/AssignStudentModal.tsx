import { useEffect, useState } from "react";
import { Button3D, Field, Modal, SelectField } from "../../ui";
import { LEVEL_LABEL } from "../../../constants/labels";
import { useStudentOptions } from "../../../hooks";
import type { WorkoutPlanSummary } from "../../../types";

interface AssignStudentModalProps {
  plan: WorkoutPlanSummary | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (studentId: string, studentName: string) => void;
}

/** Pick a student for a plan. A draft plan becomes active once assigned. */
export function AssignStudentModal({ plan, pending, onClose, onConfirm }: AssignStudentModalProps) {
  const students = useStudentOptions();
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setStudentId(plan?.studentId ?? "");
    setError(undefined);
  }, [plan]);

  function submit() {
    const student = students.data?.find((s) => s.id === studentId);
    if (!student) {
      setError("Chọn một học viên.");
      return;
    }
    onConfirm(student.id, student.name);
  }

  return (
    <Modal
      open={plan !== null}
      onOpenChange={(o) => !o && onClose()}
      title="Gán học viên"
      description={plan ? `Giáo án "${plan.name}"` : undefined}
      size="sm"
      footer={
        <>
          <Button3D variant="ghost" onClick={onClose}>Huỷ</Button3D>
          <Button3D variant="primary" onClick={submit} loading={pending}>Gán học viên</Button3D>
        </>
      }
    >
      <Field label="Học viên" required error={error} hint={plan?.status === "DRAFT" ? "Giáo án nháp sẽ được kích hoạt sau khi gán." : undefined}>
        {(id, d) => (
          <SelectField
            id={id}
            value={studentId}
            disabled={students.isLoading}
            aria-invalid={error ? true : undefined}
            aria-describedby={d}
            onChange={(e) => {
              setStudentId(e.target.value);
              setError(undefined);
            }}
          >
            <option value="">{students.isLoading ? "Đang tải học viên..." : "Chọn học viên"}</option>
            {students.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({LEVEL_LABEL[s.level]})
              </option>
            ))}
          </SelectField>
        )}
      </Field>
    </Modal>
  );
}
