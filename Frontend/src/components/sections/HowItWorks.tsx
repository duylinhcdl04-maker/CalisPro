import { motion } from "motion/react";
import { ClipboardCheck, Dumbbell, LineChart, Sparkles, Target } from "lucide-react";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const STEPS = [
  { icon: ClipboardCheck, title: "Đánh giá", description: "Hiểu đúng trình độ thể lực hiện tại của bạn." },
  { icon: Target, title: "Cá nhân hóa", description: "Xây lộ trình luyện tập quanh mục tiêu của bạn." },
  { icon: Dumbbell, title: "Luyện tập", description: "Theo các buổi tập calisthenics có cấu trúc." },
  { icon: LineChart, title: "Theo dõi", description: "Đo lường hiệu suất và tiến độ theo thời gian." },
  { icon: Sparkles, title: "Cải thiện", description: "Điều chỉnh luyện tập dựa trên dữ liệu và AI." },
];

export default function HowItWorks() {
  const reveal = useScrollReveal<HTMLDivElement>();

  return (
    <section id="cach-hoat-dong" className="bg-[#0a0712] py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="text-xs font-semibold uppercase tracking-[.2em] text-[#c084fc]">Cách CalisHealth hoạt động</div>
        <h2 className="mt-4 max-w-lg font-display text-3xl font-bold leading-tight tracking-[-.02em] text-white md:text-4xl">
          Một hệ thống, không phải một bài tập ngẫu nhiên.
        </h2>

        <motion.div
          ref={reveal.ref}
          style={reveal.style}
          className="mt-14 grid gap-6 md:grid-cols-5 md:gap-4"
        >
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative">
              {i < STEPS.length - 1 && (
                <div className="absolute right-[-1.1rem] top-6 hidden h-px w-8 bg-white/10 md:block" />
              )}
              <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[#c084fc]">
                <step.icon size={18} />
              </div>
              <div className="mt-5 font-display text-lg font-bold text-white">
                {String(i + 1).padStart(2, "0")}. {step.title}
              </div>
              <div className="mt-1.5 text-sm leading-5 text-white/40">{step.description}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
