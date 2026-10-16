import { Check } from "lucide-react";
import AssessmentStep from "../AssessmentStep";
import { EXPERIENCE_OPTIONS } from "../constants";

interface ExperienceStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ExperienceStep({ value, onChange, onNext, onBack }: ExperienceStepProps) {
  return (
    <AssessmentStep title="Bạn đang bắt đầu từ đâu?" eyebrow="01 / Kinh nghiệm" stepIndex={1} onNext={onNext} onBack={onBack}>
      <p className="mt-4 max-w-xl text-sm leading-6 text-black/50">
        Kinh nghiệm giúp chúng tôi hiểu nền tảng của bạn. Nó không tự quyết định trình độ của bạn — các bài kiểm tra
        thể lực sẽ hoàn thiện bức tranh đó.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {EXPERIENCE_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
              value === option ? "border-[#78945b] bg-[#e9eedf]" : "border-black/8 bg-white hover:border-black/20"
            }`}
          >
            <span className="text-sm font-semibold">{option}</span>
            {value === option && <Check size={18} className="text-[#5c7545]" />}
          </button>
        ))}
      </div>
    </AssessmentStep>
  );
}
