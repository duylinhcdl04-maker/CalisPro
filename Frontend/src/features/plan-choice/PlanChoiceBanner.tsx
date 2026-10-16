import { Link } from "react-router-dom";
import { Route } from "lucide-react";
import { levelName } from "../level/levelLabels";
import { usePlanChoice } from "./api";

/** Nhắc học viên đã có level nhưng chưa chọn cách tập (giáo án hệ thống hay tự tạo). Tự ẩn trong mọi trường hợp khác. */
export function PlanChoiceBanner({ className = "" }: { className?: string }) {
  const choice = usePlanChoice();
  if (!choice.isSuccess || !choice.data.needsDecision) return null;
  const level = choice.data.levelCode;
  return (
    <section role="status" aria-label="Chọn cách tập" className={`rounded-3xl border border-accent/30 bg-accent/10 p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-black text-text-primary">Bạn đã có level{level ? ` ${level}${levelName(level) ? ` · ${levelName(level)}` : ""}` : ""}. Tập theo cách nào?</h2>
          <p className="mt-0.5 max-w-xl text-sm text-text-secondary">
            Chọn giáo án do hệ thống dựng theo level của bạn, hoặc tự chọn một giáo án có sẵn. Bạn đổi được bất cứ lúc nào.
          </p>
        </div>
        <Link to="/plan-choice" className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:opacity-90">
          <Route size={15} aria-hidden /> Chọn cách tập
        </Link>
      </div>
    </section>
  );
}

/** Dòng nhỏ cho biết đang tập theo giáo án nào và cho đổi cách tập bất cứ lúc nào. Ẩn khi chưa chọn (đã có banner nhắc). */
export function PlanModeNote({ className = "" }: { className?: string }) {
  const choice = usePlanChoice();
  if (!choice.isSuccess || !choice.data.effectiveMode) return null;
  const self = choice.data.effectiveMode === "SELF";
  return (
    <p className={`flex flex-wrap items-center gap-x-2 text-xs text-text-secondary ${className}`}>
      <span>Đang tập theo: <b className="text-text-primary">{self ? "giáo án bạn tự chọn" : "giáo án của hệ thống"}</b></span>
      <Link to="/plan-choice" className="font-bold text-accent underline">Đổi cách tập</Link>
      {self && <span className="basis-full">Danh sách tự tạo không dùng để nâng hoặc hạ level. Muốn đổi level, hãy tập theo giáo án của hệ thống.</span>}
    </p>
  );
}
