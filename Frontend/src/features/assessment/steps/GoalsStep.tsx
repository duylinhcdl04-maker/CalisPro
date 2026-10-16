import { Check } from "lucide-react";
import AssessmentStep from "../AssessmentStep";
import { GOALS } from "../constants";

interface GoalsStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function GoalsStep({ value, onChange, onNext, onBack }: GoalsStepProps) {
  return (
    <AssessmentStep title="Mục tiêu của bạn là gì?" eyebrow="02 / Mục tiêu" stepIndex={2} onNext={onNext} onBack={onBack}>
      <p className="mt-4 max-w-xl text-sm leading-6 text-black/50">
        Chọn mục tiêu quan trọng nhất với bạn lúc này. Bài đánh giá sẽ tập trung vào các khả năng cần thiết cho lộ
        trình đó.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {GOALS.map((option) => (
          <button
            key={option.name}
            onClick={() => onChange(option.name)}
            className={`group rounded-2xl border p-4 text-left ${
              value === option.name ? "border-[#78945b] bg-[#e9eedf]" : "border-black/8 bg-white hover:border-black/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f0f2eb] text-[#5f7848]">
                {option.icon}
              </span>
              {value === option.name && <Check size={18} className="text-[#5c7545]" />}
            </div>
            <div className="mt-4 text-sm font-semibold">{option.name}</div>
            <div className="mt-1 text-xs leading-5 text-black/45">{option.description}</div>
          </button>
        ))}
      </div>
    </AssessmentStep>
  );
}
