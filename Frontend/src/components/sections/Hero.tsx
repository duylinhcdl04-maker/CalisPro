import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import heroImage from "../../assets/hero-calisthenics.webp";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  return (
    <section className="relative isolate overflow-hidden bg-[#0a0712] pb-20 pt-32 md:pb-28 md:pt-40">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[640px] w-[900px] -translate-x-1/2 rounded-full bg-[#8b3ffb]/25 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-[#d946ef]/10 blur-[100px]" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-16 hidden select-none text-center font-display text-[13vw] font-extrabold uppercase leading-none tracking-[-.03em] text-white/[0.05] md:block"
      >
        CALISHEALTH
      </div>

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 text-center md:px-10">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#c084fc]" />
          <span className="text-[11px] font-semibold uppercase tracking-[.2em] text-white/70">
            Hệ thống luyện tập cá nhân hóa thế hệ mới
          </span>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="relative mt-10 w-full"
        >
          <div className="relative mx-auto aspect-[16/10] w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 shadow-[0_30px_100px_-20px_rgba(139,63,251,0.35)]">
            <img
              src={heroImage}
              alt="Vận động viên calisthenics giữ front lever trên xà đơn ngoài trời lúc hoàng hôn"
              className="h-full w-full object-cover object-[68%_35%] [filter:grayscale(1)_contrast(1.15)_brightness(0.85)]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0712] via-[#0a0712]/10 to-transparent" />
            <div className="absolute inset-0 bg-[#8b3ffb] mix-blend-color opacity-40" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
          </div>

          <div className="pointer-events-none absolute -left-6 top-8 hidden w-56 rounded-2xl border border-white/10 bg-[#140f1f]/90 p-4 backdrop-blur lg:block">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#8b3ffb]/20 text-[#c084fc]">
                <Sparkles size={15} />
              </div>
              <span className="whitespace-nowrap text-xs font-semibold text-white/80">Đánh giá thông minh</span>
            </div>
            <div className="mt-3 text-lg font-bold text-white">&lt; 10 phút</div>
            <div className="text-[11px] text-white/40">Cá nhân hóa 100% lộ trình</div>
          </div>

          <div className="pointer-events-none absolute -right-6 bottom-8 hidden w-56 rounded-2xl border border-white/10 bg-[#140f1f]/90 p-4 backdrop-blur lg:block">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-white/70">
              <span className="whitespace-nowrap">Học viên đang tập</span>
              <span className="whitespace-nowrap text-white">728 / 1.000</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[73%] rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#d946ef]" />
            </div>
          </div>
        </motion.div>

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className="mt-12 font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-[-.02em] text-white sm:text-5xl md:text-6xl"
        >
          Cơ thể bạn.
          <br />
          <span className="bg-gradient-to-r from-[#a78bfa] to-[#e879f9] bg-clip-text text-transparent">
            Con đường
          </span>{" "}
          của bạn.
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
          className="mt-6 max-w-md text-base leading-7 text-white/50 md:text-lg"
        >
          Không có công thức chung cho calisthenics. Bắt đầu với một bài đánh giá hiểu đúng con người bạn.
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate("/register")}
            className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] px-7 py-4 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(139,63,251,0.6)] transition hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Bắt đầu ngay
            <ArrowRight size={18} className="transition group-hover:translate-x-1" />
          </button>
          <a
            href="#cach-hoat-dong"
            className="group inline-flex items-center gap-2.5 rounded-full border border-white/15 px-6 py-4 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10">
              <Play size={9} className="fill-current" />
            </span>
            Xem cách hoạt động
          </a>
        </motion.div>
      </div>
    </section>
  );
}
