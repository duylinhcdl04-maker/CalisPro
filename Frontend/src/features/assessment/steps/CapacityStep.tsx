import { ShieldCheck } from "lucide-react";
import AssessmentStep from "../AssessmentStep";
import { CAPACITY_TESTS } from "../constants";

interface CapacityStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function CapacityStep({ onNext, onBack }: CapacityStepProps) {
  return (
    <AssessmentStep title="Cùng tìm hiểu về cơ thể bạn." eyebrow="03 / Thể lực" stepIndex={3} onNext={onNext} onBack={onBack}>
      <p className="mt-4 max-w-xl text-sm leading-6 text-black/50">
        Ghi lại thành tích tốt nhất hiện tại của bạn. Chúng tôi lưu lại kết quả gốc để các lần đánh giá sau có thể đo
        được sự thay đổi thực sự.
      </p>
      <div className="mt-8 space-y-3">
        {CAPACITY_TESTS.map((test) => (
          <div key={test.name} className="flex items-center justify-between rounded-2xl border border-black/8 bg-white p-4">
            <div>
              <div className="text-sm font-semibold">{test.name}</div>
              <div className="mt-1 text-xs text-black/40">{test.description}</div>
            </div>
            <div className="rounded-xl bg-[#f0f2eb] px-3 py-2 text-sm font-semibold">{test.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-dashed border-black/10 p-4 text-xs leading-5 text-black/40">
        <ShieldCheck size={16} className="mb-2 text-[#78945b]" />
        Nếu bạn cảm thấy đau trong lúc kiểm tra, hãy dừng lại và ghi nhận điều đó thay vì gắng ép cơ thể.
      </div>
    </AssessmentStep>
  );
}
