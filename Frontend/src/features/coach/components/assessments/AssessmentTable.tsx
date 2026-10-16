import { Link } from "react-router-dom";
import { ClipboardCheck, Eye } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { ASSESSMENT_STATUS, ASSESSMENT_TYPE_LABEL } from "../../constants/labels";
import { formatDate } from "../../lib/format";
import type { AssessmentSummary } from "../../types";
import { Button3D, ScoreRing, StatusBadge, StudentAvatar, TONE_TEXT } from "../ui";
import { dueHint } from "./assessmentUtils";

interface AssessmentTableProps {
  items: AssessmentSummary[];
}

function DueCell({ a }: { a: AssessmentSummary }) {
  const hint = dueHint(a);
  return (
    <div className="min-w-0">
      <div className="text-sm font-bold tabular-nums text-text-primary">{formatDate(a.dueDate)}</div>
      <div className={cn("text-[11px] font-semibold", TONE_TEXT[hint.tone])}>{hint.text}</div>
    </div>
  );
}

function ActionButton({ a, full }: { a: AssessmentSummary; full?: boolean }) {
  const review = a.status === "NEEDS_REVIEW";
  return (
    <Button3D asChild size="sm" variant={review ? "primary" : "secondary"} className={full ? "w-full" : undefined}>
      <Link to={`/coach/assessments/${a.id}`} aria-label={`${review ? "Review" : "Xem"} ${a.title} của ${a.studentName}`}>
        {review ? <ClipboardCheck size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
        {review ? "Review" : "Xem"}
      </Link>
    </Button3D>
  );
}

function Score({ value }: { value: number | null }) {
  if (value === null) return <span className="text-sm font-bold text-text-secondary" aria-label="Chưa có điểm">-</span>;
  return <ScoreRing value={value} size={40} stroke={4} label="Điểm tổng" />;
}

/** Assessment list: semantic table on md+, stacked cards below. */
export function AssessmentTable({ items }: AssessmentTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <caption className="sr-only">Danh sách bài đánh giá thể lực</caption>
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wide text-text-secondary">
              <th scope="col" className="px-5 py-3 sm:px-6">Học viên</th>
              <th scope="col" className="px-3 py-3">Bài đánh giá</th>
              <th scope="col" className="px-3 py-3">Hạn</th>
              <th scope="col" className="px-3 py-3 text-center">Điểm tổng</th>
              <th scope="col" className="px-3 py-3">Trạng thái</th>
              <th scope="col" className="px-5 py-3 text-right sm:px-6">
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((a, i) => (
              <tr key={a.id} className="animate-rise border-b border-border/60 transition-colors last:border-0 hover:bg-surface-sunken/60" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                <th scope="row" className="px-5 py-3.5 font-normal sm:px-6">
                  <div className="flex items-center gap-3">
                    <StudentAvatar name={a.studentName} src={a.studentAvatar} />
                    <Link to={`/coach/students/${a.studentId}`} className="truncate text-sm font-extrabold text-text-primary hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent">
                      {a.studentName}
                    </Link>
                  </div>
                </th>
                <td className="px-3 py-3.5">
                  <div className="text-sm font-bold text-text-primary">{a.title}</div>
                  <div className="text-[11px] text-text-secondary">{ASSESSMENT_TYPE_LABEL[a.type]}</div>
                </td>
                <td className="px-3 py-3.5">
                  <DueCell a={a} />
                </td>
                <td className="px-3 py-3.5">
                  <div className="flex justify-center">
                    <Score value={a.overallScore} />
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  <StatusBadge status={ASSESSMENT_STATUS[a.status]} />
                </td>
                <td className="px-5 py-3.5 text-right sm:px-6">
                  <ActionButton a={a} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border/70 md:hidden" aria-label="Danh sách bài đánh giá thể lực">
        {items.map((a, i) => (
          <li key={a.id} className="animate-rise space-y-3 p-4" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
            <div className="flex items-start gap-3">
              <StudentAvatar name={a.studentName} src={a.studentAvatar} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold text-text-primary">{a.studentName}</div>
                <div className="truncate text-xs text-text-secondary">
                  {a.title} · {ASSESSMENT_TYPE_LABEL[a.type]}
                </div>
              </div>
              <Score value={a.overallScore} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <DueCell a={a} />
              <StatusBadge status={ASSESSMENT_STATUS[a.status]} />
            </div>
            <ActionButton a={a} full />
          </li>
        ))}
      </ul>
    </>
  );
}

