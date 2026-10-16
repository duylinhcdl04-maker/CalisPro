import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";
import type { QuestionComponentProps } from "./QuestionRenderer";

const OPTIONS = [
  { value: true, label: "Có" },
  { value: false, label: "Không" },
] as const;

export function BooleanQuestion({ value, onChange }: QuestionComponentProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <motion.button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border p-5 text-sm font-semibold transition-colors duration-200",
              selected
                ? "border-accent bg-accent-soft text-accent-strong"
                : "border-border bg-surface text-text-primary hover:border-accent/40"
            )}
          >
            {selected && <Check className="h-4 w-4" />}
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
}
