import { useEffect, useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import { useCreateNote } from "../../../hooks";
import { NOTE_CATEGORY } from "../../../constants/labels";
import type { CoachNoteCategory } from "../../../types";
import { Button3D, Field, Modal, SelectField, TextArea, Toggle } from "../../ui";

const MAX = 1000;
const CATEGORIES = Object.keys(NOTE_CATEGORY) as CoachNoteCategory[];

const noteSchema = z.object({
  category: z.enum(["GENERAL", "TECHNIQUE", "INJURY", "PROGRESS", "MOTIVATION"]),
  content: z.string().trim().min(5, "Ghi chú cần tối thiểu 5 ký tự.").max(MAX, `Ghi chú tối đa ${MAX} ký tự.`),
  pinned: z.boolean(),
});

type NoteFormValues = z.infer<typeof noteSchema>;

const DEFAULTS: NoteFormValues = { category: "GENERAL", content: "", pinned: false };

interface AddNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
}

export function AddNoteModal({ open, onOpenChange, studentId, studentName }: AddNoteModalProps) {
  const formId = useId();
  const createNote = useCreateNote();
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<NoteFormValues>({ resolver: zodResolver(noteSchema), defaultValues: DEFAULTS });

  useEffect(() => {
    if (open) reset(DEFAULTS);
  }, [open, reset]);

  const length = watch("content").length;
  const pending = createNote.isPending;

  const onSubmit = handleSubmit((values) => {
    createNote.mutate(
      { studentId, ...values },
      {
        onSuccess: () => {
          toast.success("Đã thêm ghi chú", { description: `Ghi chú mới cho ${studentName} đã được lưu.` });
          onOpenChange(false);
        },
        onError: () => toast.error("Không thể lưu ghi chú. Vui lòng thử lại."),
      }
    );
  });

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !pending && onOpenChange(v)}
      title="Thêm ghi chú"
      description={`Ghi chú nội bộ về ${studentName}. Học viên không nhìn thấy nội dung này.`}
      footer={
        <>
          <Button3D variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Huỷ
          </Button3D>
          <Button3D variant="primary" type="submit" form={formId} loading={pending} leftIcon={<Save size={15} aria-hidden />}>
            Lưu ghi chú
          </Button3D>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Phân loại" required error={errors.category?.message}>
          {(id, describedBy) => (
            <SelectField id={id} aria-describedby={describedBy} aria-invalid={!!errors.category} disabled={pending} {...register("category")}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {NOTE_CATEGORY[c].label}
                </option>
              ))}
            </SelectField>
          )}
        </Field>

        <Field label="Nội dung" required error={errors.content?.message} hint="Từ 5 đến 1000 ký tự.">
          {(id, describedBy) => (
            <div>
              <TextArea
                id={id}
                rows={5}
                maxLength={MAX}
                placeholder="Ví dụ: Giữ khuỷu tay khoảng 45 độ khi push-up, giảm volume push trong tuần này."
                aria-describedby={describedBy}
                aria-invalid={!!errors.content}
                disabled={pending}
                {...register("content")}
              />
              <p className={cn("mt-1 text-right text-[11px] font-semibold tabular-nums", length >= MAX ? "text-rose-600 dark:text-rose-400" : "text-text-secondary")} aria-live="polite">
                {length}/{MAX}
              </p>
            </div>
          )}
        </Field>

        <Controller
          control={control}
          name="pinned"
          render={({ field }) => (
            <div className="well-3d flex items-center justify-between gap-4 rounded-[14px] px-4 py-3">
              <div>
                <p className="text-sm font-bold text-text-primary">Ghim ghi chú</p>
                <p className="text-xs text-text-secondary">Ghi chú ghim luôn hiển thị đầu tiên trong hồ sơ.</p>
              </div>
              <Toggle checked={field.value} onChange={field.onChange} label="Ghim ghi chú" disabled={pending} />
            </div>
          )}
        />
      </form>
    </Modal>
  );
}
