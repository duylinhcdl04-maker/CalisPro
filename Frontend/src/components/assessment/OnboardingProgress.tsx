import { Progress } from "../ui/Progress";

export function OnboardingProgress({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[.14em] text-text-secondary">
        Bước {step} / {totalSteps}
      </div>
      <Progress value={(step / totalSteps) * 100} className="mt-3" />
    </div>
  );
}
