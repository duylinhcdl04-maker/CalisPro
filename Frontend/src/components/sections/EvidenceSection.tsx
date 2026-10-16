import { useEffect, useRef } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { Activity, Clock3, Repeat2 } from "lucide-react";
import { useScrollReveal } from "../../hooks/useScrollReveal";

interface StatDef {
  icon: typeof Activity;
  target: number;
  suffix: string;
  unit: string;
  label: string;
}

const STATS: StatDef[] = [
  {
    icon: Activity,
    target: 3,
    suffix: "",
    unit: "biến số",
    label: "Kinh nghiệm, mục tiêu và thể lực được đánh giá riêng biệt trước khi lên lộ trình.",
  },
  {
    icon: Clock3,
    target: 10,
    suffix: "-15",
    unit: "phút",
    label: "Thời gian trung bình để hoàn thành bài đánh giá ban đầu.",
  },
  {
    icon: Repeat2,
    target: 4,
    suffix: "",
    unit: "tuần",
    label: "Độ dài một giai đoạn luyện tập trước khi đánh giá lại.",
  },
];

function AnimatedValue({ progress, target }: { progress: MotionValue<number>; target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const rounded = useTransform(progress, (p) => Math.round(p * target).toString());

  useEffect(() => rounded.on("change", (v) => {
    if (ref.current) ref.current.textContent = v;
  }), [rounded]);

  return (
    <span ref={ref} className="tabular-nums">
      0
    </span>
  );
}

export default function EvidenceSection() {
  const heading = useScrollReveal<HTMLDivElement>();
  const grid = useScrollReveal<HTMLDivElement>();

  return (
    <section id="danh-gia-khoa-hoc" className="relative overflow-hidden bg-[#0a0712] py-24 md:py-32">
      <div className="pointer-events-none absolute -left-48 top-1/2 h-[440px] w-[440px] -translate-y-1/2 rounded-full bg-[#8b3ffb]/15 blur-[110px]" />

      <div className="relative mx-auto grid max-w-[1400px] gap-12 px-5 md:grid-cols-2 md:gap-20 md:px-10">
        <motion.div ref={heading.ref} style={heading.style}>
          <div className="text-xs font-semibold uppercase tracking-[.2em] text-[#c084fc]">Vì sao cần cá nhân hóa</div>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-[-.02em] text-white md:text-4xl">
            Hai người cùng mục tiêu Muscle-up có thể cần hai lộ trình khác nhau.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/45 md:text-base">
            Kinh nghiệm, khả năng hiện tại và kiến thức luyện tập quyết định điểm bắt đầu, không chỉ mục tiêu cuối
            cùng.
          </p>
        </motion.div>

        <motion.div ref={grid.ref} style={grid.style} className="grid gap-4 sm:grid-cols-2">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`group rounded-[24px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-[#8b5cf6]/40 ${
                  i === 0 ? "sm:col-span-2" : ""
                }`}
              >
                <Icon size={18} className="text-[#c084fc]" />
                <div className="mt-5 flex items-baseline font-display text-4xl font-bold text-white md:text-5xl">
                  <AnimatedValue progress={grid.progress} target={stat.target} />
                  {stat.suffix}
                  <span className="ml-2 text-base font-medium text-white/35">{stat.unit}</span>
                </div>
                <div className="mt-3 max-w-xs text-sm leading-5 text-white/40">{stat.label}</div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
