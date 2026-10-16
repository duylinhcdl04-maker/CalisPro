import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Dumbbell, Flame, Sparkles, Trophy } from "lucide-react";
import heroImage from "../../assets/hero-calisthenics.webp";

const EASE = [0.16, 1, 0.3, 1] as const;

export function AuthLayout({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#07050f] text-white">
      {/* FULL-BLEED BACKGROUND IMAGE (Trải rộng toàn màn hình, không bị cắt đứt) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={heroImage}
          alt="Vận động viên calisthenics giữ front lever trên xà đơn"
          className="h-full w-full object-cover object-[30%_center] sm:object-[45%_35%] lg:object-[62%_35%] scale-100"
        />

        {/* Lớp phủ cinematic đa tầng: giữ độ rực rỡ của hoàng hôn bên trái, tăng độ tương phản đọc chữ bên phải */}
        <div className="absolute inset-0 bg-[#07050e]/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07050e]/90 via-[#07050e]/60 to-[#07050e]/95 max-lg:bg-[#07050e]/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07050e] via-transparent to-[#07050e]/75" />
        <div className="absolute inset-0 bg-[#8b3ffb]/10 mix-blend-overlay" />

        {/* Quầng sáng ambient tạo cảm giác hiện đại */}
        <div className="absolute -left-20 top-1/4 h-[520px] w-[520px] rounded-full bg-[#8b3ffb]/20 blur-[140px]" />
        <div className="absolute right-0 top-1/3 h-[480px] w-[480px] rounded-full bg-[#c026d3]/15 blur-[150px]" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 flex min-h-screen flex-col justify-between">
        {/* Header Navigation */}
        <header className="flex w-full items-center justify-between px-6 py-5 sm:px-8 lg:px-14">
          <Link
            to="/"
            className="group inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#d946ef] shadow-[0_0_20px_rgba(168,85,247,0.5)]">
              <Flame size={19} className="text-white" />
            </span>
            <span className="tracking-wide">CALIS</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#c084fc] transition-transform group-hover:scale-150" />
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-medium text-white/70 backdrop-blur-md transition hover:border-white/20 hover:bg-white/[0.1] hover:text-white"
          >
            <ArrowLeft size={14} />
            <span>Về trang chủ</span>
          </Link>
        </header>

        {/* Main Grid: Motivational Side + Auth Card */}
        <main className="my-auto flex w-full items-center justify-center px-4 py-8 sm:px-8 lg:px-14">
          <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Cột trái: Giới thiệu nền tảng & Động lực (hiển thị trên màn hình lớn) */}
            <div className="hidden lg:col-span-7 lg:flex lg:flex-col lg:justify-center">
              <motion.div
                initial={reduce ? false : { opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="max-w-xl space-y-6"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-[#8b5cf6]/35 bg-[#8b5cf6]/10 px-3.5 py-1.5 backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c084fc] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c084fc]" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[.15em] text-[#c084fc]">
                    Sức mạnh tự thân &amp; Kỷ luật
                  </span>
                </div>

                <h1 className="font-display text-4xl font-extrabold leading-[1.18] tracking-tight text-white lg:text-5xl">
                  Không có công thức chung{" "}
                  <span className="bg-gradient-to-r from-[#c084fc] via-[#e879f9] to-[#67e8f9] bg-clip-text text-transparent">
                    cho calisthenics.
                  </span>
                </h1>

                <p className="text-base leading-relaxed text-white/70">
                  Lộ trình luyện tập được xây dựng xoay quanh kinh nghiệm, khả năng chịu tải và thể lực thực tế của chính bạn. Chinh phục từng kỹ năng đỉnh cao từ căn bản đến nâng cao.
                </p>

                {/* Feature highlight cards */}
                <div className="grid grid-cols-2 gap-3.5 pt-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md transition hover:bg-white/[0.06]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8b5cf6]/20 text-[#c084fc]">
                      <Trophy size={18} />
                    </div>
                    <h4 className="mt-2.5 text-sm font-semibold text-white">Lộ trình cá nhân hoá</h4>
                    <p className="mt-1 text-xs text-white/50">Tùy biến bài tập theo cấp độ và mục tiêu</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md transition hover:bg-white/[0.06]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#06b6d4]/20 text-[#38bdf8]">
                      <Dumbbell size={18} />
                    </div>
                    <h4 className="mt-2.5 text-sm font-semibold text-white">Chuẩn hoá kỹ thuật</h4>
                    <p className="mt-1 text-xs text-white/50">Trực quan form chuẩn, hạn chế chấn thương</p>
                  </div>
                </div>

                {/* Social proof */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex -space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#080511] bg-gradient-to-br from-purple-500 to-indigo-600 text-[10px] font-bold text-white">
                      HN
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#080511] bg-gradient-to-br from-pink-500 to-rose-600 text-[10px] font-bold text-white">
                      SG
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#080511] bg-gradient-to-br from-amber-500 to-orange-600 text-[10px] font-bold text-white">
                      DN
                    </div>
                  </div>
                  <p className="text-xs text-white/60">
                    Cùng hơn <strong className="font-medium text-white">10,000+</strong> anh em rèn luyện trên khắp cả nước.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Cột phải: Auth Card Glassmorphism */}
            <div className="flex w-full justify-center lg:col-span-5 lg:justify-end">
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="w-full max-w-[430px]"
              >
                <div className="relative rounded-3xl border border-white/15 bg-[#0e091e]/80 p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85),0_0_35px_-10px_rgba(168,85,247,0.25)] backdrop-blur-2xl sm:p-8">
                  {children}
                </div>
              </motion.div>
            </div>
          </div>
        </main>

        {/* Footer watermark */}
        <footer className="w-full px-6 py-4 text-center text-xs text-white/30 sm:px-8 lg:px-14">
          © {new Date().getFullYear()} CALIS Platform. Nền tảng huấn luyện Calisthenics chuyên sâu.
        </footer>
      </div>
    </div>
  );
}
