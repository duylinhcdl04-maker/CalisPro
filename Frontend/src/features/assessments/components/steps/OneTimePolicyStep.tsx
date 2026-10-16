import React from 'react';
import { CalendarClock, Info, RotateCcw, ShieldCheck } from 'lucide-react';

/**
 * Bước 5 của bài đánh giá BAN ĐẦU (type INITIAL): bài này làm MỘT LẦN, không lặp theo chu kỳ.
 * Thay cho bộ cấu hình "Chu kỳ" (lịch tự động, nhắc hẹn theo level) vốn chỉ dành cho bài đánh giá định kỳ.
 * Chỉ hiển thị chính sách; giá trị thật nằm ở bộ quy tắc V2 (Level Engine), không sửa ở đây.
 */
export const OneTimePolicyStep: React.FC = () => (
  <div className="space-y-5">
    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
        <ShieldCheck className="h-5 w-5 text-accent" /> Bài đánh giá ban đầu chỉ làm một lần
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Không có lịch lặp theo chu kỳ và không có nhắc hẹn định kỳ. Về sau, level được cập nhật bằng bài đánh giá định kỳ (cấu hình ở bài loại Định kỳ).
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary"><CalendarClock className="h-4 w-4 text-accent" /> Hoãn bài đo thực hành</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Học viên chọn "Bỏ qua, đo sau" thì dùng level tạm thời từ khảo sát (tối đa L2) và được nhắc lại nhẹ nhàng sau <b className="text-text-primary">7 ngày</b>.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary"><RotateCcw className="h-4 w-4 text-accent" /> Đo lại</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Nếu kết quả đo thực hành thấp hơn level tạm thời, học viên được đo lại <b className="text-text-primary">1 lần</b> trong <b className="text-text-primary">7 ngày</b> kể từ lần đo đầu.
          Level cuối là mức cao nhất của hai lần đo.
        </p>
      </div>
    </div>

    <p className="flex items-start gap-2 rounded-xl border border-border bg-background p-3 text-xs text-text-secondary">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        Các con số này nằm trong bộ quy tắc đánh giá V2 (tham số <code>baseline.defer.remindDays</code>, <code>baseline.retake.windowDays</code>, <code>baseline.retake.max</code>).
        Coach chỉnh ở "Quy tắc bài đánh giá" và Admin duyệt, không chỉnh trong trình tạo bài test.
      </span>
    </p>
  </div>
);
