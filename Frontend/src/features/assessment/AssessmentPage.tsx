import { useState } from "react";
import type { SVGProps, ComponentType } from "react";
import { BarChart3, BookOpen, Dumbbell, Home, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useAssessment } from "../../hooks/useAssessment";
import ExperienceStep from "./steps/ExperienceStep";
import GoalsStep from "./steps/GoalsStep";
import CapacityStep from "./steps/CapacityStep";
import KnowledgeStep from "./steps/KnowledgeStep";
import ResultStep from "./steps/ResultStep";

function ClipboardIcon(props: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4" />
    </svg>
  );
}

const NAV_ITEMS: { label: string; icon: ComponentType<{ size?: number }> }[] = [
  { label: "Tổng quan", icon: Home },
  { label: "Đánh giá", icon: ClipboardIcon },
  { label: "Luyện tập", icon: Dumbbell },
  { label: "Tiến độ", icon: BarChart3 },
  { label: "Bài tập", icon: BookOpen },
];

export default function AssessmentPage() {
  const { step, goal, setGoal, experience, setExperience, next, previous } = useAssessment();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f7f2] text-[#17201a]">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 w-72 border-r border-black/5 bg-[#fbfcf8] p-5 transition md:static md:translate-x-0`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-xl font-bold tracking-tight">
                CALIS<span className="text-[#78945b]">.</span>
              </div>
              <div className="text-[11px] uppercase tracking-[.2em] text-black/40">trí tuệ luyện tập</div>
            </div>
            <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="mt-10 rounded-2xl bg-[#17201a] p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                <UserRound size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold">Hồ sơ của bạn</div>
                <div className="text-xs text-white/50">Đang đánh giá</div>
              </div>
            </div>
          </div>

          <nav className="mt-7 space-y-1">
            {NAV_ITEMS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                  label === "Đánh giá" ? "bg-[#e8eddf] font-semibold" : "text-black/55 hover:bg-black/[.03]"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>

          <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-black/5 bg-white p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 text-[#78945b]" size={18} />
              <div>
                <div className="text-xs font-semibold">Dựa trên cơ sở khoa học</div>
                <div className="mt-1 text-[11px] leading-4 text-black/45">
                  Đề xuất được xây dựng dựa trên bài đánh giá và các nguyên tắc luyện tập của bạn.
                </div>
              </div>
            </div>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-black/5 bg-[#f6f7f2]/90 px-5 backdrop-blur md:px-9">
            <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <div className="hidden md:block text-xs font-medium uppercase tracking-[.18em] text-black/35">Đánh giá ban đầu</div>
            <div className="flex items-center gap-2 text-xs text-black/45">
              <span className="h-2 w-2 rounded-full bg-[#78945b]" /> Đã tự động lưu
            </div>
          </header>

          <section className="mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-12">
            {step === "experience" && (
              <ExperienceStep value={experience} onChange={setExperience} onNext={next} onBack={previous} />
            )}
            {step === "goals" && <GoalsStep value={goal} onChange={setGoal} onNext={next} onBack={previous} />}
            {step === "capacity" && <CapacityStep onNext={next} onBack={previous} />}
            {step === "knowledge" && <KnowledgeStep onNext={next} onBack={previous} />}
            {step === "result" && <ResultStep goal={goal} experience={experience} />}
          </section>
        </main>
      </div>
    </div>
  );
}
