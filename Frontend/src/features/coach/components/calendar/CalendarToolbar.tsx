import { ChevronLeft, ChevronRight } from "lucide-react";
import { EVENT_TYPE } from "../../constants/labels";
import { Button3D, Segmented, Tooltip, type SegmentOption } from "../ui";
import { EVENT_TYPES, eventDotClass, type CalendarView } from "./calendarUtils";

const VIEW_OPTIONS: SegmentOption<CalendarView>[] = [
  { value: "month", label: "Tháng" },
  { value: "week", label: "Tuần" },
  { value: "day", label: "Ngày" },
];

interface CalendarToolbarProps {
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  fetching: boolean;
}

export function CalendarToolbar({ view, onViewChange, title, onPrev, onNext, onToday, fetching }: CalendarToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Tooltip label="Kỳ trước">
            <Button3D size="icon-sm" onClick={onPrev} aria-label="Kỳ trước">
              <ChevronLeft size={16} />
            </Button3D>
          </Tooltip>
          <Button3D size="sm" onClick={onToday}>
            Hôm nay
          </Button3D>
          <Tooltip label="Kỳ sau">
            <Button3D size="icon-sm" onClick={onNext} aria-label="Kỳ sau">
              <ChevronRight size={16} />
            </Button3D>
          </Tooltip>
          <h2 className="ml-1 truncate text-base font-extrabold capitalize text-text-primary sm:text-lg" aria-live="polite" aria-busy={fetching}>
            {title}
          </h2>
        </div>
        <Segmented options={VIEW_OPTIONS} value={view} onChange={onViewChange} ariaLabel="Chế độ xem lịch" size="sm" />
      </div>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5" aria-label="Chú thích loại lịch">
        {EVENT_TYPES.map((t) => (
          <li key={t} className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary">
            <span className={`h-2.5 w-2.5 rounded-full ${eventDotClass(t)}`} aria-hidden />
            {EVENT_TYPE[t].label}
          </li>
        ))}
        <li className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary">
          <span className="text-text-secondary line-through">Abc</span>
          Đã huỷ
        </li>
      </ul>
    </div>
  );
}
