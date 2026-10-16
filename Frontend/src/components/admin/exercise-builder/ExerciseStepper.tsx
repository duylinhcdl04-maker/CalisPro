import { Check, AlertCircle } from "lucide-react";

export interface StepItem {
  id: number;
  label: string;
  subLabel: string;
}

interface ExerciseStepperProps {
  currentStep: number;
  steps: StepItem[];
  completedSteps: number[];
  errorSteps?: number[];
  onSelectStep: (stepId: number) => void;
}

export function ExerciseStepper({
  currentStep,
  steps,
  completedSteps,
  errorSteps = [],
  onSelectStep,
}: ExerciseStepperProps) {
  return (
    <div className="w-full border-b border-border bg-surface px-4 py-3 sm:px-6 shadow-xs">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-2 sm:gap-4 py-1">
          {steps.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isCompleted = completedSteps.includes(step.id);
            const isError = errorSteps.includes(step.id);
            const canClick = isCompleted || isActive || step.id <= Math.max(...completedSteps, 1) + 1;

            return (
              <div key={step.id} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => canClick && onSelectStep(step.id)}
                  disabled={!canClick}
                  className={`group flex items-center gap-2.5 rounded-2xl px-3 py-2 text-left transition-all ${
                    isActive
                      ? "bg-accent/10 border border-accent/30 text-accent-strong ring-2 ring-accent/20"
                      : isCompleted
                      ? "bg-surface hover:bg-surface-elevated text-text-primary border border-border cursor-pointer"
                      : "opacity-60 text-text-secondary cursor-not-allowed"
                  }`}
                >
                  {/* Step Number or Icon */}
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black transition-transform group-hover:scale-105 ${
                      isError
                        ? "bg-rose-500 text-white"
                        : isActive
                        ? "bg-accent text-white shadow-xs"
                        : isCompleted
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40"
                        : "bg-surface-elevated text-text-secondary border border-border"
                    }`}
                  >
                    {isError ? (
                      <AlertCircle size={14} />
                    ) : isCompleted && !isActive ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      `0${step.id}`
                    )}
                  </div>

                  {/* Step Labels */}
                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-bold leading-tight ${
                        isActive ? "text-accent-strong" : "text-text-primary"
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-text-secondary hidden md:block">
                      {step.subLabel}
                    </span>
                  </div>
                </button>

                {/* Connector Line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`h-[1.5px] w-4 sm:w-6 hidden lg:block rounded-full ${
                      completedSteps.includes(step.id) ? "bg-accent/60" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
