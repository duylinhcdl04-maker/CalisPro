import { motion } from "motion/react";
import { Activity, Sparkles, Target } from "lucide-react";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const VALUES = [
  {
    icon: Target,
    title: "Luyện tập cá nhân hóa",
    description: "Lộ trình được xây quanh cơ thể và mục tiêu của bạn, không phải một khuôn mẫu chung.",
  },
  {
    icon: Sparkles,
    title: "AI đồng hành",
    description: "Nhận phản hồi thông minh dựa trên hiệu suất thực tế của bạn, không phải lời khuyên chung.",
  },
  {
    icon: Activity,
    title: "Theo dõi tiến độ",
    description: "Hiểu rõ sức mạnh và thể lực của bạn cải thiện ra sao theo từng tuần.",
  },
];

export default function ValueProps() {
  const reveal = useScrollReveal<HTMLDivElement>();

  return (
    <section className="relative overflow-hidden bg-[#0d0a16] py-24 md:py-32">
      <div className="pointer-events-none absolute -right-40 top-1/3 h-[420px] w-[420px] rounded-full bg-[#8b3ffb]/10 blur-[110px]" />
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
        <motion.div ref={reveal.ref} style={reveal.style} className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <h2 className="font-display text-3xl font-bold leading-tight tracking-[-.02em] text-white md:text-4xl">
            CalisHealth hiểu cơ thể bạn và giúp bạn tiến bộ.
          </h2>

          <div className="space-y-8 divide-y divide-white/10">
            {VALUES.map((value, i) => (
              <div key={value.title} className={`flex gap-5 ${i > 0 ? "pt-8" : ""}`}>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[#c084fc]">
                  <value.icon size={20} />
                </div>
                <div>
                  <div className="font-display text-lg font-bold text-white">{value.title}</div>
                  <div className="mt-1.5 max-w-md text-sm leading-6 text-white/40">{value.description}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
