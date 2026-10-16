import { useState } from "react";
import AssessmentStep from "../AssessmentStep";
import { KNOWLEDGE_OPTIONS } from "../constants";

interface KnowledgeStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function KnowledgeStep({ onNext, onBack }: KnowledgeStepProps) {
  const [answer, setAnswer] = useState("");

  return (
    <AssessmentStep title="Bạn đã biết những gì?" eyebrow="04 / Kiến thức luyện tập" stepIndex={4} onNext={onNext} onBack={onBack}>
      <p className="mt-4 max-w-xl text-sm leading-6 text-black/50">
        Đây không phải là một bài kiểm tra. Câu trả lời của bạn giúp chúng tôi xác định phần kiến thức nào cần đi kèm
        với lộ trình luyện tập của bạn.
      </p>
      <div className="mt-8 rounded-3xl bg-[#17201a] p-6 text-white md:p-8">
        <div className="text-xs uppercase tracking-[.18em] text-white/40">Câu hỏi 1</div>
        <h2 className="mt-4 font-display text-2xl font-semibold">Progressive overload (tăng tiến độ khó) là gì?</h2>
        <div className="mt-6 grid gap-2">
          {KNOWLEDGE_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => setAnswer(option)}
              className={`rounded-2xl border p-4 text-left text-sm ${
                answer === option ? "border-white bg-white text-[#17201a]" : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </AssessmentStep>
  );
}
