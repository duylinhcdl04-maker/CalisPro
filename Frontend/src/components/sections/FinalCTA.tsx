import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "../../hooks/useScrollReveal";

export default function FinalCTA() {
  const reveal = useScrollReveal<HTMLDivElement>();
  const navigate = useNavigate();

  return (
    <section className="bg-[#0a0712] px-5 py-16 md:px-10 md:py-24">
      <motion.div
        ref={reveal.ref}
        style={reveal.style}
        className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#1a1228] to-[#0d0a16] px-8 py-16 text-center md:px-16 md:py-20"
      >
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#8b3ffb]/25 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#d946ef]/15 blur-[100px]" />
        <h2 className="relative mx-auto max-w-xl font-display text-3xl font-bold leading-tight tracking-[-.02em] text-white md:text-5xl">
          Quá trình luyện tập nên tiến hóa cùng bạn.
        </h2>
        <p className="relative mx-auto mt-4 max-w-md text-sm leading-6 text-white/50 md:text-base">
          Bắt đầu với một bài đánh giá đơn giản và nhận trải nghiệm luyện tập được cá nhân hóa cho riêng bạn.
        </p>
        <button
          onClick={() => navigate("/register")}
          className="group relative mx-auto mt-9 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] px-7 py-4 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(139,63,251,0.6)] transition hover:-translate-y-0.5 active:scale-[0.98]"
        >
          Tạo tài khoản
          <ArrowRight size={18} className="transition group-hover:translate-x-1" />
        </button>
      </motion.div>
    </section>
  );
}
