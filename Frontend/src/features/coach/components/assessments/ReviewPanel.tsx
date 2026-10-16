import { useState } from "react";
import { CheckCircle2, MessageSquareText, Pencil } from "lucide-react";
import { formatDateTime } from "../../lib/format";
import type { AssessmentDetail } from "../../types";
import { Button3D, Panel } from "../ui";
import { ReviewForm } from "./ReviewForm";

/** Coach recommendation + comment. Shows the saved review read-only with an edit switch once reviewed. */
export function ReviewPanel({ assessment }: { assessment: AssessmentDetail }) {
  const reviewed = !!assessment.reviewedAt && !!assessment.coachComment;
  const [editing, setEditing] = useState(!reviewed);

  return (
    <Panel
      title="Khuyến nghị & nhận xét của coach"
      description={reviewed && assessment.reviewedAt ? `Đã review lúc ${formatDateTime(assessment.reviewedAt)}` : "Bạn quyết định khuyến nghị cuối cùng gửi đến học viên"}
      icon={MessageSquareText}
      className="animate-rise"
      actions={
        reviewed && !editing ? (
          <Button3D size="sm" onClick={() => setEditing(true)} leftIcon={<Pencil size={14} />}>
            Chỉnh sửa
          </Button3D>
        ) : undefined
      }
    >
      {editing ? (
        <ReviewForm
          key={assessment.reviewedAt ?? "new"}
          assessmentId={assessment.id}
          initialComment={assessment.coachComment}
          recommendations={assessment.recommendations}
          onSaved={() => setEditing(false)}
          onCancel={reviewed ? () => setEditing(false) : undefined}
        />
      ) : (
        <div className="space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-text-secondary">Khuyến nghị</h3>
            <ul className="mt-2 space-y-2">
              {assessment.recommendations.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-sm leading-relaxed text-text-primary">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-text-secondary">Nhận xét</h3>
            <blockquote className="well-3d mt-2 whitespace-pre-line rounded-[14px] px-4 py-3 text-sm leading-relaxed text-text-primary">{assessment.coachComment}</blockquote>
          </div>
        </div>
      )}
    </Panel>
  );
}
