import { Sparkles } from "lucide-react";

/** Nhãn nhỏ đánh dấu bài được đề xuất cho người dùng (theo giáo án hệ thống, hoặc theo hướng tập họ chọn). */
export function RecommendedBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-black text-accent ${className}`}>
      <Sparkles size={10} aria-hidden />Đề xuất cho bạn
    </span>
  );
}
