import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addHours } from "date-fns";
import { toast } from "sonner";
import type { CalendarEvent, CalendarEventType } from "../../types";
import { EVENT_TYPE } from "../../constants/labels";
import { useCreateEvent, useStudentOptions, useUpdateEvent } from "../../hooks";
import { Button3D, Field, Modal, SelectField, TextArea, TextInput } from "../ui";
import { EVENT_TYPES, combineDateTime, toDateInput, toTimeInput } from "./calendarUtils";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Tiêu đề tối thiểu 3 ký tự.").max(80, "Tiêu đề tối đa 80 ký tự."),
    type: z.enum(EVENT_TYPES as [CalendarEventType, ...CalendarEventType[]], { message: "Vui lòng chọn loại lịch." }),
    studentId: z.string(),
    date: z.string().min(1, "Vui lòng chọn ngày."),
    start: z.string().regex(TIME, "Giờ bắt đầu không hợp lệ."),
    end: z.string().regex(TIME, "Giờ kết thúc không hợp lệ."),
    location: z.string().trim().max(120, "Địa điểm tối đa 120 ký tự."),
    notes: z.string().max(500, "Ghi chú tối đa 500 ký tự."),
  })
  .refine((v) => v.end > v.start, { path: ["end"], message: "Giờ kết thúc phải sau giờ bắt đầu." });

type EventForm = z.infer<typeof eventSchema>;

export type EventFormTarget = { mode: "create"; slot: Date } | { mode: "edit"; event: CalendarEvent };

function defaultsFor(target: EventFormTarget | null): EventForm {
  if (target?.mode === "edit") {
    const { event: e } = target;
    const s = new Date(e.start);
    return { title: e.title, type: e.type, studentId: e.studentId ?? "", date: toDateInput(s), start: toTimeInput(s), end: toTimeInput(new Date(e.end)), location: e.location, notes: e.notes };
  }
  const slot = target?.slot ?? new Date();
  return { title: "", type: "COACHING_SESSION", studentId: "", date: toDateInput(slot), start: toTimeInput(slot), end: toTimeInput(addHours(slot, 1)), location: "", notes: "" };
}

interface EventFormModalProps {
  target: EventFormTarget | null;
  onClose: () => void;
}

export function EventFormModal({ target, onClose }: EventFormModalProps) {
  const students = useStudentOptions();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const editing = target?.mode === "edit";
  const busy = createEvent.isPending || updateEvent.isPending;
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EventForm>({ resolver: zodResolver(eventSchema), defaultValues: defaultsFor(target) });

  useEffect(() => {
    if (target) reset(defaultsFor(target));
  }, [target, reset]);

  const onSubmit = handleSubmit(async (v) => {
    const input = {
      title: v.title,
      type: v.type,
      studentId: v.studentId || null,
      start: combineDateTime(v.date, v.start),
      end: combineDateTime(v.date, v.end),
      location: v.location,
      notes: v.notes.trim(),
    };
    try {
      if (target?.mode === "edit") await updateEvent.mutateAsync({ id: target.event.id, input });
      else await createEvent.mutateAsync(input);
      toast.success(editing ? "Đã cập nhật lịch." : "Đã tạo lịch mới.", { description: `${v.title}, ${v.start} ngày ${v.date.split("-").reverse().join("/")}` });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể lưu lịch. Vui lòng thử lại.");
    }
  });

  const notesLength = watch("notes")?.length ?? 0;

  return (
    <Modal
      open={!!target}
      onOpenChange={(o) => !o && !busy && onClose()}
      title={editing ? "Chỉnh sửa lịch" : "Tạo lịch mới"}
      description="Lịch hẹn đánh giá, review hoặc buổi huấn luyện với học viên."
      size="lg"
      footer={
        <>
          <Button3D variant="ghost" onClick={onClose} disabled={busy}>
            Huỷ
          </Button3D>
          <Button3D variant="primary" type="submit" form="event-form" loading={busy}>
            {editing ? "Lưu thay đổi" : "Tạo lịch"}
          </Button3D>
        </>
      }
    >
      <form id="event-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Tiêu đề" required error={errors.title?.message} className="sm:col-span-2">
          {(id, d) => <TextInput id={id} aria-describedby={d} aria-invalid={!!errors.title} placeholder="Ví dụ: Monthly Assessment" disabled={busy} {...register("title")} />}
        </Field>
        <Field label="Loại lịch" required error={errors.type?.message}>
          {(id, d) => (
            <SelectField id={id} aria-describedby={d} aria-invalid={!!errors.type} disabled={busy} {...register("type")}>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EVENT_TYPE[t].label}
                </option>
              ))}
            </SelectField>
          )}
        </Field>
        <Field label="Học viên" hint={students.isError ? "Không tải được danh sách học viên." : "Không bắt buộc."}>
          {(id, d) => (
            <SelectField id={id} aria-describedby={d} disabled={busy || students.isLoading} {...register("studentId")}>
              <option value="">{students.isLoading ? "Đang tải..." : "Không gắn học viên"}</option>
              {students.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>
          )}
        </Field>
        <Field label="Ngày" required error={errors.date?.message} className="sm:col-span-2">
          {(id, d) => <TextInput id={id} type="date" aria-describedby={d} aria-invalid={!!errors.date} disabled={busy} {...register("date")} />}
        </Field>
        <Field label="Bắt đầu" required error={errors.start?.message}>
          {(id, d) => <TextInput id={id} type="time" step={300} aria-describedby={d} aria-invalid={!!errors.start} disabled={busy} {...register("start")} />}
        </Field>
        <Field label="Kết thúc" required error={errors.end?.message}>
          {(id, d) => <TextInput id={id} type="time" step={300} aria-describedby={d} aria-invalid={!!errors.end} disabled={busy} {...register("end")} />}
        </Field>
        <Field label="Địa điểm" error={errors.location?.message} className="sm:col-span-2">
          {(id, d) => <TextInput id={id} aria-describedby={d} aria-invalid={!!errors.location} placeholder="Studio A hoặc Online" disabled={busy} {...register("location")} />}
        </Field>
        <Field label="Ghi chú" error={errors.notes?.message} hint={`${notesLength}/500 ký tự`} className="sm:col-span-2">
          {(id, d) => <TextArea id={id} aria-describedby={d} aria-invalid={!!errors.notes} rows={3} disabled={busy} {...register("notes")} />}
        </Field>
      </form>
    </Modal>
  );
}
