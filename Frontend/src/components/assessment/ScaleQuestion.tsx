import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import type { QuestionComponentProps } from "./QuestionRenderer";

export function ScaleQuestion({ question, value, onChange }: QuestionComponentProps) {
  const min = question.min ?? 1;
  const max = question.max ?? 5;
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {steps.map((step) => {
          const selected = value === step;
          return (
            <motion.button
              key={step}
              type="button"
              onClick={() => onChange(step)}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold transition-colors duration-200",
                selected
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-surface text-text-primary hover:border-accent/40"
              )}
            >
              {step}
            </motion.button>
          );
        })}
      </div>
      {question.unit && <div className="mt-2 text-xs text-text-secondary">{question.unit}</div>}
    </div>
  );
}
