import { Link } from "react-router-dom";
import { ClipboardPlus, Eye, MessageSquare } from "lucide-react";
import { Button3D, Tooltip } from "../../ui";
import type { Student } from "../../../types";

/** Icon actions; clicks never bubble to the row's navigate handler. */
export function StudentRowActions({ student }: { student: Student }) {
  const actions = [
    { to: `/coach/students/${student.id}`, label: "Xem chi tiết", icon: Eye },
    { to: `/coach/messages?studentId=${student.id}`, label: "Nhắn tin", icon: MessageSquare },
    { to: `/coach/plans/new?studentId=${student.id}`, label: "Tạo giáo án", icon: ClipboardPlus },
  ];
  return (
    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      {actions.map(({ to, label, icon: Icon }) => (
        <Tooltip key={label} label={label}>
          <Button3D asChild variant="ghost" size="icon-sm">
            <Link to={to} aria-label={`${label}: ${student.name}`}>
              <Icon size={15} aria-hidden />
            </Link>
          </Button3D>
        </Tooltip>
      ))}
    </div>
  );
}
