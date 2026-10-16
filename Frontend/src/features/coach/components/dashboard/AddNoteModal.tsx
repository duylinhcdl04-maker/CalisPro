import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button3D, Field, Modal, SelectField, TextArea, Toggle } from "../ui";
import { LEVEL_LABEL, NOTE_CATEGORY } from "../../constants/labels";
import { useCreateNote, useStudentOptions } from "../../hooks";
import type { CoachNoteCategory } from "../../types";

const CATEGORIES = Object.keys(NOTE_CATEGORY) as [CoachNoteCategory, ...CoachNoteCategory[]];

const noteSchema = z.object({
  studentId: z.string().min(1, "Vui lòng chọn học viên."),
  category: z.enum(CATEGORIES, { message: "Vui lòng chọn phân loại." }),
  content: z.string().trim().min(5, "Nội dung tối thiểu 5 ký tự.").max(1000, "Nội dung tối đa 1000 ký tự."),
  pinned: z.boolean(),
});

type NoteForm = z.infer<typeof noteSchema>;

const DEFAULTS: NoteForm = { studentId: "", category: "GENERAL", content: "", pinned: false };

interface AddNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddNoteModal({ open, onOpenChange }: AddNoteModalProps) {
  const options = useStudentOptions();
  const createNote = useCreateNote();
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NoteForm>({ resolver: zodResolver(noteSchema), defaultValues: DEFAULTS });

  useEffect(() => {
    if (!open) reset(DEFAULTS);
  }, [open, reset]);

  const contentLength = watch("content").length;
  const busy = isSubmitting || createNote.isPending;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createNote.mutateAsync(values);
      const student = options.data?.find((s) => s.id === values.studentId);
      toast.success("Đã lưu ghi chú", { description: student ? `Ghi chú cho ${student.name}` : undefined });
      onOpenChange(false);
    } catch {
      toast.error("Không thể lưu ghi chú. Vui lòng thử lại.");
    }
  });

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      title="Thêm ghi chú"
      description="Ghi chú chỉ hiển thị với huấn luyện viên."
      footer={
        <>
          <Button3D variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Huỷ
          </Button3D>
          <Button3D variant="primary" type="submit" form="add-note-form" loading={busy}>
            Lưu ghi chú
          </Button3D>
        </>
      }
    >
      <form id="add-note-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Học viên" required error={errors.studentId?.message} hint={options.isError ? "Không tải được danh sách học viên." : undefined}>
          {(id, describedBy) => (
            <SelectField id={id} aria-describedby={describedBy} aria-invalid={!!errors.studentId} disabled={options.isLoading || busy} {...register("studentId")}>
              <option value="">{options.isLoading ? "Đang tải học viên..." : "Chọn học viên"}</option>
              {options.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({LEVEL_LABEL[s.level]})
                </option>
              ))}
            </SelectField>
          )}
        </Field>

        <Field label="Phân loại" required error={errors.category?.message}>
          {(id, describedBy) => (
            <SelectField id={id} aria-describedby={describedBy} aria-invalid={!!errors.category} disabled={busy} {...register("category")}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {NOTE_CATEGORY[c].label}
                </option>
              ))}
            </SelectField>
          )}
        </Field>

        <Field label="Nội dung" required error={errors.content?.message} hint={`${contentLength}/1000 ký tự`}>
          {(id, describedBy) => (
            <TextArea
              id={id}
              aria-describedby={describedBy}
              aria-invalid={!!errors.content}
              disabled={busy}
              maxLength={1000}
              placeholder="Ví dụ: Cần chú ý khoá khuỷu tay ở pha đẩy lên của push-up."
              {...register("content")}
            />
          )}
        </Field>

        <Controller
          control={control}
          name="pinned"
          render={({ field }) => (
            <div className="well-3d flex items-center justify-between gap-3 rounded-[14px] px-3.5 py-3">
              <div>
                <p className="text-sm font-bold text-text-primary">Ghim ghi chú</p>
                <p className="text-xs text-text-secondary">Hiển thị đầu tiên trong hồ sơ học viên.</p>
              </div>
              <Toggle checked={field.value} onChange={field.onChange} label="Ghim ghi chú" disabled={busy} />
            </div>
          )}
        />
      </form>
    </Modal>
  );
}
