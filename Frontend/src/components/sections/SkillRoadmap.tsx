import { motion } from "motion/react";
import { ArrowUp, Compass, Flame, MoveHorizontal } from "lucide-react";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const SKILLS = [
  {
    name: "Muscle-up",
    description: "Lực kéo bùng nổ kết hợp chuyển động chuyển tiếp lên đẩy, kỹ năng được chọn nhiều nhất.",
    icon: Flame,
    featured: true,
  },
  {
    name: "Handstand",
    description: "Kiểm soát thăng bằng và sức mạnh vai trên hai tay.",
    icon: Compass,
    tint: true,
  },
  {
    name: "Pull-up đầu tiên",
    description: "Nền tảng lực kéo cho mọi kỹ năng phía trên.",
    icon: ArrowUp,
  },
  {
    name: "Front Lever",
    description: "Giữ thân thẳng ngang bằng lực kéo, không trợ lực.",
    icon: MoveHorizontal,
  },
];

export default function SkillRoadmap() {
  const heading = useScrollReveal<HTMLHeadingElement>();
  const featuredReveal = useScrollReveal<HTMLDivElement>();
  const restReveal = useScrollReveal<HTMLDivElement>();

  const featured = SKILLS.find((skill) => skill.featured)!;
  const rest = SKILLS.filter((skill) => !skill.featured);

  return (
    <section id="ky-nang" className="bg-[#0d0a16] py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <motion.h2
          ref={heading.ref}
          style={heading.style}
          className="max-w-lg font-display text-3xl font-bold leading-tight tracking-[-.02em] text-white md:text-4xl"
        >
          Lộ trình được xây quanh kỹ năng bạn muốn đạt được.
        </motion.h2>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <motion.div
            ref={featuredReveal.ref}
            style={featuredReveal.style}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#1a1228] to-[#0d0a16] p-8 text-white md:col-span-3 md:p-10"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#8b3ffb]/30 blur-[100px]" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <featured.icon size={24} className="text-[#c084fc]" />
                <div className="mt-5 font-display text-3xl font-bold md:text-5xl">{featured.name}</div>
              </div>
              <p className="max-w-xs text-sm leading-6 text-white/50 md:text-base">{featured.description}</p>
            </div>
          </motion.div>

          <motion.div
            ref={restReveal.ref}
            style={restReveal.style}
            className="grid gap-4 md:col-span-3 md:grid-cols-3"
          >
            {rest.map((skill) => {
              const Icon = skill.icon;
              return (
                <motion.div
                  key={skill.name}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className={`rounded-[28px] border p-7 backdrop-blur ${
                    skill.tint ? "border-[#8b5cf6]/25 bg-[#8b5cf6]/10" : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <Icon size={20} className="text-[#c084fc]" />
                  <div className="mt-6 font-display text-xl font-bold text-white">{skill.name}</div>
                  <div className="mt-2 text-sm leading-5 text-white/40">{skill.description}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
