import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MessageSquareText, Send } from "lucide-react";
import { useAddSessionFeedback } from "../../hooks";
import type { FeedbackType, SessionFeedback } from "../../types";
import { FEEDBACK_TYPE } from "../../constants/labels";
import { formatDateTime, formatRelative } from "../../lib/format";
import { Button3D, EmptyState, Field, Panel, Segmented, StatusBadge, TextArea, type SegmentOption } from "../ui";
import { rise } from "./shared";

const TYPE_KEYS = Object.keys(FEEDBACK_TYPE) as FeedbackType[];
const TYPE_OPTIONS: SegmentOption<FeedbackType>[] = TYPE_KEYS.map((k) => ({ value: k, label: FEEDBACK_TYPE[k].label }));

const schema = z.object({
  type: z.enum(["PRAISE", "CORRECTION", "GENERAL"]),
  content: z.string().trim().min(5, "Phản hồi cần ít nhất 5 ký tự.").max(1000, "Phản hồi tối đa 1000 ký tự."),
});
type FormValues = z.infer<typeof schema>;

function FeedbackItem({ item, index }: { item: SessionFeedback; index: number }) {
  return (
    <li className="well-3d animate-rise rounded-2xl p-4" style={rise(index)}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={FEEDBACK_TYPE[item.type]} />
        <span className="text-xs font-bold text-text-primary">{item.authorName}</span>
        <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)} className="ml-auto text-[11px] text-text-secondary">
          {formatRelative(item.createdAt)}
        </time>
      </div>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-primary">{item.content}</p>
    </li>
  );
}

export function SessionFeedbackSection({ sessionId, feedback }: { sessionId: string; feedback: SessionFeedback[] }) {
  const mutation = useAddSessionFeedback();
  const { control, register, handleSubmit, reset, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "GENERAL", content: "" },
  });
  const length = watch("content").length;

  const onSubmit = handleSubmit((values) =>
    mutation.mutate(
      { sessionId, ...values },
      {
        onSuccess: () => {
          toast.success("Đã gửi phản hồi cho học viên.");
          reset({ type: values.type, content: "" });
        },
        onError: () => toast.error("Không gửi được phản hồi. Vui lòng thử lại."),
      }
    )
  );

  return (
    <Panel title="Phản hồi của Coach" description="Học viên sẽ nhận được phản hồi này trong ứng dụng." icon={MessageSquareText}>
      {feedback.length ? (
        <ul className="mb-5 space-y-3">
          {feedback.map((f, i) => (
            <FeedbackItem key={f.id} item={f} index={i} />
          ))}
        </ul>
      ) : (
        <EmptyState className="mb-5 py-6" title="Chưa có phản hồi nào." description="Gửi nhận xét đầu tiên để học viên biết cần giữ hoặc điều chỉnh điều gì." />
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4 border-t border-border/70 pt-5">
        <div className="flex flex-col gap-1.5">
          <span id="fb-type-label" className="text-xs font-bold text-text-secondary">Loại phản hồi</span>
          <Controller
            control={control}
            name="type"
            render={({ field }) => <Segmented ariaLabel="Loại phản hồi" options={TYPE_OPTIONS} value={field.value} onChange={field.onChange} size="sm" />}
          />
        </div>
        <Field label="Nội dung" required error={formState.errors.content?.message} hint={`${length}/1000 ký tự`}>
          {(id, describedBy) => (
            <TextArea
              id={id}
              aria-describedby={describedBy}
              aria-invalid={!!formState.errors.content}
              placeholder="Ví dụ: Giữ khuỷu tay sát thân hơn ở pha hạ người."
              maxLength={1000}
              {...register("content")}
            />
          )}
        </Field>
        <div className="flex justify-end">
          <Button3D type="submit" variant="primary" loading={mutation.isPending} leftIcon={<Send size={15} />}>
            Gửi phản hồi
          </Button3D>
        </div>
      </form>
    </Panel>
  );
}
