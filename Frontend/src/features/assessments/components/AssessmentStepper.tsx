import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { StepValidationResult } from '../hooks/useAssessmentValidation';

interface AssessmentStepperProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  validations: StepValidationResult[];
  /** Bài đánh giá ban đầu (làm một lần): bước 5 là chính sách làm một lần, không phải lịch chu kỳ. */
  oneTime?: boolean;
}

const STEPS = [
  { step: 1, number: '01', title: 'Thông tin', subtitle: 'Mục đích & Đối tượng' },
  { step: 2, number: '02', title: 'Câu hỏi', subtitle: 'Ngân hàng & Trọng số' },
  { step: 3, number: '03', title: 'Chấm điểm', subtitle: 'Thang điểm & Quy tắc' },
  { step: 4, number: '04', title: 'Phân loại', subtitle: 'Cấp độ & 6 Chiều đo' },
  { step: 5, number: '05', title: 'Chu kỳ', subtitle: 'Lịch tự động & Nhắc nhở' },
  { step: 6, number: '06', title: 'Review', subtitle: 'Kiểm tra & Phát hành' },
];

export const AssessmentStepper: React.FC<AssessmentStepperProps> = ({
  currentStep,
  onStepChange,
  validations,
  oneTime = false,
}) => {
  return (
    <div className="bg-surface rounded-2xl border border-border p-3 md:p-4 shadow-xs">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
        {STEPS.map((base) => {
          const s = oneTime && base.step === 5 ? { ...base, title: 'Làm một lần', subtitle: 'Hoãn và đo lại' }
            : oneTime && base.step === 4 ? { ...base, title: 'Level', subtitle: 'Do Level Engine quyết định' } : base;
          const isActive = currentStep === s.step;
          const isCompleted = currentStep > s.step;
          const validation = validations.find((v) => v.step === s.step);
          const hasError = validation && !validation.isValid && s.step < currentStep;

          return (
            <button
              key={s.step}
              type="button"
              onClick={() => onStepChange(s.step)}
              className={`relative flex items-center gap-3 p-2.5 md:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-accent/10 border-accent ring-2 ring-accent/30 shadow-xs'
                  : isCompleted
                  ? 'bg-surface-elevated border-border hover:border-accent/40'
                  : 'bg-background border-border hover:bg-surface-elevated/60'
              }`}
            >
              {/* Step indicator circle */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  isActive
                    ? 'bg-accent text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : hasError
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-surface-elevated text-text-secondary border border-border'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : s.number}
              </div>

              {/* Title & subtitle */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs font-bold truncate ${
                      isActive ? 'text-accent' : isCompleted ? 'text-emerald-400' : 'text-text-secondary'
                    }`}
                  >
                    {s.title}
                  </span>
                  {hasError && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                </div>
                <span className="text-[10px] text-text-secondary truncate block">{s.subtitle}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
