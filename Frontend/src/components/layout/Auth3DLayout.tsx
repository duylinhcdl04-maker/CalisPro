import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Sparkles, Flame, Trophy, Zap, ShieldCheck, Heart } from "lucide-react";

interface Auth3DLayoutProps {
  children: ReactNode;
  activeTab: "login" | "register";
  title: string;
  subtitle: string;
  speechBubbleText: string;
}

export function Auth3DLayout({
  children,
  activeTab,
  title,
  subtitle,
  speechBubbleText,
}: Auth3DLayoutProps) {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 lg:p-10 bg-gradient-to-br from-[#dbeafe] via-[#eff6ff] to-[#e0f2fe] dark:from-[#060e1a] dark:via-[#091527] dark:to-[#0a182d] overflow-x-hidden text-text-primary">
      {/* 3D Ambient Lighting Spheres */}
      <div className="pointer-events-none fixed top-12 left-1/4 h-96 w-96 rounded-full bg-sky-400/20 blur-[120px] dark:bg-sky-600/15" />
      <div className="pointer-events-none fixed bottom-10 right-1/4 h-96 w-96 rounded-full bg-blue-400/20 blur-[120px] dark:bg-blue-600/15" />
      <div className="pointer-events-none fixed top-1/2 -right-10 h-72 w-72 rounded-full bg-cyan-300/25 blur-[100px] dark:bg-cyan-600/10" />

      {/* Top Header Bar */}
      <header className="relative z-20 flex w-full max-w-7xl mx-auto items-center justify-between py-2">
        <Link to="/" className="group inline-flex items-center gap-2.5 font-display text-xl font-black tracking-tight text-text-primary">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_8px_20px_-4px_rgba(14,165,233,0.5),inset_0_2px_2px_rgba(255,255,255,0.7)] group-hover:scale-105 transition-transform">
            <Flame size={20} className="fill-white" />
          </div>
          <span className="tracking-wide">CALIS<span className="text-sky-500">.</span>PRO</span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-surface/80 backdrop-blur-md px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary shadow-[0_4px_14px_rgba(0,0,0,0.04),inset_0_1.5px_2px_rgba(255,255,255,0.9)] hover:scale-105 transition-all"
        >
          <ArrowLeft size={14} />
          <span>Về trang chủ</span>
        </Link>
      </header>

      {/* Main Split Grid (3D Human Flag Showcase on Left + Claymorphic Form on Right) */}
      <main className="relative z-10 flex-1 flex items-center justify-center my-6 max-w-7xl w-full mx-auto">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          
          {/* LEFT COLUMN: 3D Human Flag Hero Showcase */}
          <div className="flex flex-col items-center lg:items-start lg:col-span-7 xl:col-span-7">
            {/* Mascot Container with Anchor Bar */}
            <div className="relative w-full max-w-lg flex flex-col items-center lg:items-start">
              
              {/* 3D Speech Bubble */}
              <div className="relative mb-3 inline-flex items-center gap-2 rounded-2xl bg-white/95 dark:bg-surface/90 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-sky-900 dark:text-sky-300 shadow-[0_10px_25px_-5px_rgba(14,165,233,0.25),inset_0_2px_2px_rgba(255,255,255,1)] border border-sky-200/70 dark:border-sky-500/20 animate-bounce">
                <Sparkles size={16} className="text-amber-500 shrink-0" />
                <span>{speechBubbleText}</span>
                {/* Speech arrow */}
                <div className="absolute -bottom-2 left-10 h-4 w-4 rotate-45 bg-white dark:bg-surface border-r border-b border-sky-200/70 dark:border-sky-500/20" />
              </div>

              {/* 3D Human Flag Character Image with Physics Sway */}
              <div className="relative w-full overflow-visible py-4 flex justify-center lg:justify-start">
                <div className="animate-human-flag relative w-full max-w-[460px] drop-shadow-[0_25px_35px_rgba(14,40,70,0.2)]">
                  <img
                    src="/assets/3d/calis_human_flag_mascot.png"
                    alt="3D Calisthenics Human Flag Athlete"
                    className="w-full h-auto object-contain select-none pointer-events-none"
                  />

                  {/* Floating 3D Pill Metric 1 (Level 5) */}
                  <div className="absolute top-2 right-4 hidden sm:flex items-center gap-2 rounded-2xl bg-white/90 dark:bg-surface/90 backdrop-blur-md px-3.5 py-2 text-xs font-black text-text-primary shadow-[0_8px_20px_rgba(0,0,0,0.08),inset_0_1.5px_2px_rgba(255,255,255,1)] border border-white">
                    <Trophy size={14} className="text-amber-500" />
                    <span>Skill: Human Flag (Lv.5)</span>
                  </div>

                  {/* Floating 3D Pill Metric 2 (Core Power) */}
                  <div className="absolute -bottom-2 right-12 hidden sm:flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white px-3.5 py-1.5 text-xs font-black shadow-[0_10px_22px_-4px_rgba(14,165,233,0.5),inset_0_1.5px_2px_rgba(255,255,255,0.6)]">
                    <Zap size={14} className="fill-white" />
                    <span>Core & Shoulder: 100%</span>
                  </div>
                </div>
              </div>

              {/* Motivational Calisthenics Manifesto */}
              <div className="mt-4 hidden md:block max-w-md">
                <h2 className="font-display text-2xl font-black text-text-primary tracking-tight">
                  Chinh phục trọng lực <span className="text-sky-600">từng ngày</span>.
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
                  Nền tảng huấn luyện Calisthenics chuẩn khoa học với lộ trình từ số 0 đến làm chủ các kỹ năng Muscle-Up, Front Lever, Planche và Human Flag.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-sky-500 text-[9px] font-bold text-white shadow-xs">HN</div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-cyan-500 text-[9px] font-bold text-white shadow-xs">SG</div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[9px] font-bold text-white shadow-xs">DN</div>
                  </div>
                  <span className="text-xs font-semibold text-text-secondary">
                    Cùng <strong className="text-text-primary font-bold">10,000+</strong> anh em rèn luyện kỷ luật.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 3D Claymorphic Auth Form Card */}
          <div className="flex w-full justify-center lg:col-span-5 xl:col-span-5">
            <div className="w-full max-w-[430px] rounded-[36px] bg-[#ffffff] dark:bg-[#0c192c] p-6 sm:p-8 shadow-[0_24px_50px_-10px_rgba(14,116,144,0.15),0_8px_20px_rgba(0,0,0,0.04),inset_0_2.5px_3px_rgba(255,255,255,1),inset_0_-3px_5px_rgba(0,0,0,0.04)] border border-white/90 dark:border-white/10">
              
              {/* Tab Switcher (Đăng nhập / Đăng ký) */}
              <div className="mb-6 flex rounded-2xl bg-sky-500/10 dark:bg-white/[0.05] p-1.5 shadow-inner">
                <Link
                  to="/login"
                  className={`flex-1 py-2 text-center text-xs font-extrabold rounded-xl transition-all duration-200 ${
                    activeTab === "login"
                      ? "bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-[0_4px_12px_rgba(14,165,233,0.4),inset_0_1.5px_2px_rgba(255,255,255,0.5)]"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className={`flex-1 py-2 text-center text-xs font-extrabold rounded-xl transition-all duration-200 ${
                    activeTab === "register"
                      ? "bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-[0_4px_12px_rgba(14,165,233,0.4),inset_0_1.5px_2px_rgba(255,255,255,0.5)]"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Đăng ký
                </Link>
              </div>

              {/* Card Title & Subtitle */}
              <div className="text-left mb-6">
                <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-text-primary">
                  {title}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-text-secondary font-medium">
                  {subtitle}
                </p>
              </div>

              {/* Form Content */}
              {children}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full text-center text-xs text-text-secondary/60 py-3">
        © {new Date().getFullYear()} CALIS Platform • Hệ thống huấn luyện Calisthenics 3D chuyên sâu
      </footer>
    </div>
  );
}
