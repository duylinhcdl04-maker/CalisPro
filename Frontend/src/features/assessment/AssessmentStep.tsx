import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import AssessmentProgress from "./AssessmentProgress";

interface AssessmentStepProps {
  title: string;
  eyebrow: string;
  stepIndex: number;
  onNext: () => void;
  onBack: () => void;
  nextLabel?: string;
  children: ReactNode;
}

export default function AssessmentStep({
  title,
  eyebrow,
  stepIndex,
  onNext,
  onBack,
  nextLabel = "Tiếp tục",
  children,
}: AssessmentStepProps) {
  return (
    <div>
      <AssessmentProgress current={stepIndex} />
      <div className="max-w-3xl">
        <div className="text-xs font-semibold uppercase tracking-[.2em] text-[#78945b]">{eyebrow}</div>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.035em] md:text-5xl">{title}</h1>
        {children}
        <div className="mt-10 flex items-center justify-between">
          <button onClick={onBack} className="rounded-xl px-4 py-3 text-sm font-semibold text-black/45 hover:bg-black/5">
            Quay lại
          </button>
          <button onClick={onNext} className="inline-flex items-center gap-2 rounded-xl bg-[#17201a] px-5 py-3 text-sm font-semibold text-white">
            {nextLabel}
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
