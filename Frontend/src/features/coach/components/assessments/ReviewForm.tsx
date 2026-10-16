import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Save, Sparkles, X } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { useSubmitAssessmentReview } from "../../hooks";
import { Button3D, Field, TextArea, TextInput, Tooltip } from "../ui";
import { errorMessage } from "./assessmentUtils";
import { COMMENT_MAX, reviewSchema, selectedRecommendations, toFormValues, type ReviewFormValues } from "./reviewSchema";

interface ReviewFormProps {
  assessmentId: string;
  initialComment: string | null;
  recommendations: string[];
  onSaved?: () => void;
  onCancel?: () => void;
}

/** Coach decides the final recommendation list and writes the comment the student will read. */
export function ReviewForm({ assessmentId, initialComment, recommendations, onSaved, onCancel }: ReviewFormProps) {
  const submit = useSubmitAssessmentReview();
  const [draft, setDraft] = useState("");
  const { control, register, handleSubmit, formState } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: toFormValues(initialComment, recommendations),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const comment = useWatch({ control, name: "coachComment" }) ?? "";
  const itemsError = formState.errors.items?.root?.message ?? formState.errors.items?.message;

  function addCustom() {
    const text = draft.trim();
    if (!text) return;
    append({ text, checked: true, custom: true });
    setDraft("");
  }

  const onSubmit = handleSubmit((values) => {
    submit.mutate(
      { assessmentId, coachComment: values.coachComment.trim(), recommendations: selectedRecommendations(values) },
      {
        onSuccess: () => {
          toast.success("Đã lưu đánh giá");
          onSaved?.();
        },
        onError: (err) => toast.error(errorMessage(err, "Không thể lưu đánh giá. Vui lòng thử lại.")),
      }
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <fieldset aria-describedby={itemsError ? "rec-error" : undefined}>
        <legend className="flex items-center gap-2 text-sm font-extrabold text-text-primary">
          Khuyến nghị cho học viên
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-strong dark:text-accent">
            <Sparkles size={11} aria-hidden />
            Hệ thống gợi ý
          </span>
        </legend>
        <p className="mt-1 text-xs text-text-secondary">Giữ lại gợi ý phù hợp, bỏ chọn mục không cần và thêm khuyến nghị riêng của bạn.</p>

        <ul className="mt-3 space-y-2">
          {fields.map((f, i) => (
            <li key={f.id} className="well-3d flex items-start gap-3 rounded-[14px] px-3.5 py-3">
              <input
                id={`rec-${f.id}`}
                type="checkbox"
                {...register(`items.${i}.checked`)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              />
              <label htmlFor={`rec-${f.id}`} className="flex-1 cursor-pointer text-sm leading-relaxed text-text-primary">
                {f.text}
                {f.custom && <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-text-secondary">Tuỳ chỉnh</span>}
              </label>
              {f.custom && (
                <Tooltip label="Xoá khuyến nghị" side="left">
                  <Button3D size="icon-sm" variant="ghost" aria-label={`Xoá khuyến nghị: ${f.text}`} onClick={() => remove(i)}>
                    <X size={14} />
                  </Button3D>
                </Tooltip>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-3 flex gap-2">
          <TextInput
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            maxLength={200}
            placeholder="Thêm khuyến nghị riêng..."
            aria-label="Nội dung khuyến nghị mới"
            className="flex-1"
          />
          <Button3D onClick={addCustom} disabled={!draft.trim()} leftIcon={<Plus size={15} />}>
            Thêm
          </Button3D>
        </div>
        {itemsError && (
          <p id="rec-error" role="alert" className="mt-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            {itemsError}
          </p>
        )}
      </fieldset>

      <Field label="Nhận xét của coach" required error={formState.errors.coachComment?.message} hint="Học viên sẽ nhận được nhận xét này cùng các khuyến nghị.">
        {(id, describedBy) => (
          <div>
            <TextArea
              id={id}
              rows={5}
              maxLength={COMMENT_MAX}
              aria-describedby={describedBy}
              aria-invalid={!!formState.errors.coachComment}
              placeholder="Ví dụ: Sức mạnh tăng rõ rệt, nhưng độ linh hoạt vai giảm. Tuần tới ưu tiên mobility trước khi tăng tải."
              {...register("coachComment")}
            />
            <div className={cn("mt-1 text-right text-[11px] tabular-nums", comment.length > COMMENT_MAX * 0.9 ? "text-amber-600 dark:text-amber-400" : "text-text-secondary")} aria-live="polite">
              {comment.length}/{COMMENT_MAX}
            </div>
          </div>
        )}
      </Field>

      <div className="flex flex-wrap justify-end gap-2.5">
        {onCancel && (
          <Button3D variant="ghost" onClick={onCancel} disabled={submit.isPending}>
            Huỷ
          </Button3D>
        )}
        <Button3D type="submit" variant="primary" loading={submit.isPending} leftIcon={<Save size={16} />}>
          Lưu đánh giá
        </Button3D>
      </div>
    </form>
  );
}
