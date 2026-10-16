import { Link } from "react-router-dom";
import { AlarmClock, CalendarClock, MessageSquare, UserRound } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { formatDate } from "../../lib/format";
import type { AssessmentDetail } from "../../types";
import { Button3D, Panel, TONE_CLASSES } from "../ui";
import { dueHint } from "./assessmentUtils";

/** Shown while the student has not performed the assessment yet: explains the state and offers next steps. */
export function AssessmentPendingCard({ assessment }: { assessment: AssessmentDetail }) {
  const overdue = assessment.status === "OVERDUE";
  const hint = dueHint(assessment);
  const Icon = overdue ? AlarmClock : CalendarClock;
  return (
    <Panel className="animate-rise" bodyClassName="p-6 sm:p-8">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <span className={cn("icon-tile-3d h-14 w-14 shrink-0 border", TONE_CLASSES[overdue ? "critical" : "info"])}>
          <Icon size={26} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black tracking-tight text-text-primary">
            {overdue ? "Học viên chưa làm bài đánh giá" : "Bài đánh giá đã được lên lịch"}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-text-secondary">
            {overdue
              ? `Hạn làm bài là ${formatDate(assessment.dueDate)} (${hint.text.toLowerCase()}). Hãy nhắc học viên hoàn thành để có dữ liệu so sánh và điều chỉnh giáo án.`
              : `Hạn làm bài là ${formatDate(assessment.dueDate)} (${hint.text.toLowerCase()}). Kết quả 6 chỉ số thể lực và các bài test sẽ hiển thị tại đây khi học viên hoàn thành.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button3D asChild variant={overdue ? "primary" : "secondary"}>
              <Link to={`/coach/messages?studentId=${assessment.studentId}`}>
                <MessageSquare size={16} aria-hidden />
                Nhắn nhắc học viên
              </Link>
            </Button3D>
            <Button3D asChild variant="ghost">
              <Link to={`/coach/students/${assessment.studentId}`}>
                <UserRound size={16} aria-hidden />
                Xem học viên
              </Link>
            </Button3D>
          </div>
        </div>
      </div>
    </Panel>
  );
}
