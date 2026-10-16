import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCheck, MessageSquarePlus, ShieldCheck, ThumbsUp } from "lucide-react";
import { useMarkAnalysisReviewed, useSubmitAIFeedback, useUpdateRecommendation } from "../../hooks";
import type { AIAnalysis } from "../../types";
import { Button3D, Field, Modal, TextArea } from "../ui";
import { AI_DISCLAIMER } from "./labels";

const schema = z.object({
  feedback: z.string().trim().min(5, "Phản hồi cần ít nhất 5 ký tự.").max(1000, "Phản hồi tối đa 1000 ký tự."),
});
type FormValues = z.infer<typeof schema>;

function FeedbackModal({ analysis, open, onOpenChange }: { analysis: AIAnalysis; open: boolean; onOpenChange: (v: boolean) => void }) {
  const submit = useSubmitAIFeedback();
  const { register, handleSubmit, reset, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: { feedback: analysis.coachFeedback ?? "" },
  });
  const length = watch("feedback").length;

  const onSubmit = handleSubmit((v) =>
    submit.mutate(
      { analysisId: analysis.id, feedback: v.feedback },
      {
        onSuccess: () => {
          toast.success("Đã lưu phản hồi của Coach.");
          onOpenChange(false);
        },
        onError: () => toast.error("Không lưu được phản hồi. Vui lòng thử lại."),
      }
    )
  );

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
      title="Thêm phản hồi Coach"
      description={`Nhận xét của bạn về phân tích ${analysis.exerciseName} của ${analysis.studentName}.`}
      footer={
        <>
          <Button3D variant="ghost" onClick={() => onOpenChange(false)}>Huỷ</Button3D>
          <Button3D variant="primary" type="submit" form="ai-feedback-form" loading={submit.isPending}>Lưu phản hồi</Button3D>
        </>
      }
    >
      <form id="ai-feedback-form" onSubmit={onSubmit} noValidate>
        <Field label="Phản hồi" required error={formState.errors.feedback?.message} hint={`${length}/1000 ký tự`}>
          {(id, describedBy) => (
            <TextArea
              id={id}
              aria-describedby={describedBy}
              aria-invalid={!!formState.errors.feedback}
              maxLength={1000}
              className="min-h-[140px]"
              placeholder="Ví dụ: Đồng ý với AI. Tuần này giảm tốc độ, tập trung giữ khuỷu tay sát thân."
              {...register("feedback")}
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}

/** Coach decisions on an analysis. The AI only suggests; these buttons record the coach's call. */
export function CoachActionBar({ analysis }: { analysis: AIAnalysis }) {
  const [open, setOpen] = useState(false);
  const [acceptingAll, setAcceptingAll] = useState(false);
  const update = useUpdateRecommendation();
  const markReviewed = useMarkAnalysisReviewed();
  const pending = analysis.recommendations.filter((r) => r.status === "PENDING");
  const reviewed = analysis.reviewStatus === "REVIEWED";

  async function acceptAll() {
    setAcceptingAll(true);
    try {
      for (const r of pending) {
        await update.mutateAsync({ analysisId: analysis.id, recommendationId: r.id, status: "ACCEPTED" });
      }
      toast.success(`Đã chấp nhận ${pending.length} khuyến nghị.`);
    } catch {
      toast.error("Không chấp nhận được tất cả khuyến nghị. Vui lòng thử lại.");
    } finally {
      setAcceptingAll(false);
    }
  }

  function onMarkReviewed() {
    markReviewed.mutate(analysis.id, {
      onSuccess: () => toast.success("Đã đánh dấu phân tích là đã review."),
      onError: () => toast.error("Không cập nhật được trạng thái."),
    });
  }

  return (
    <section aria-label="Quyết định của Coach" className="panel-3d animate-rise p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="icon-tile-3d h-9 w-9 shrink-0 bg-accent-soft text-accent-strong dark:text-accent">
            <ShieldCheck size={17} />
          </span>
          <div>
            <h2 className="text-[15px] font-extrabold text-text-primary">Quyết định của Coach</h2>
            <p className="mt-0.5 text-xs text-text-secondary">{AI_DISCLAIMER}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <Button3D variant="secondary" onClick={acceptAll} disabled={!pending.length} loading={acceptingAll} leftIcon={<ThumbsUp size={15} />}>
            Chấp nhận khuyến nghị{pending.length ? ` (${pending.length})` : ""}
          </Button3D>
          <Button3D variant="secondary" onClick={() => setOpen(true)} leftIcon={<MessageSquarePlus size={15} />}>
            {analysis.coachFeedback ? "Sửa phản hồi Coach" : "Thêm phản hồi Coach"}
          </Button3D>
          <Button3D variant={reviewed ? "secondary" : "primary"} onClick={onMarkReviewed} disabled={reviewed} loading={markReviewed.isPending} leftIcon={<CheckCheck size={15} />}>
            {reviewed ? "Đã review" : "Đánh dấu đã review"}
          </Button3D>
        </div>
      </div>
      {analysis.coachFeedback && (
        <div className="mt-4 rounded-2xl border border-border bg-surface-sunken/60 p-3.5">
          <div className="text-[11px] font-extrabold text-text-secondary">Phản hồi đã lưu</div>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-text-primary">{analysis.coachFeedback}</p>
        </div>
      )}
      <FeedbackModal analysis={analysis} open={open} onOpenChange={setOpen} />
    </section>
  );
}
