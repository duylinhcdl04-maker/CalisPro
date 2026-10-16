import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";
import type { QuestionComponentProps } from "./QuestionRenderer";

export function SingleChoiceQuestion({ question, value, onChange }: QuestionComponentProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {question.options?.map((option) => {
        const selected = value === option.value;
        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "relative flex items-start gap-3 rounded-lg border p-4 text-left transition-colors duration-200",
              selected ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-accent/40"
            )}
          >
            <div className="flex-1">
              <div className={cn("text-sm font-semibold", selected ? "text-accent-strong" : "text-text-primary")}>
                {option.label}
              </div>
              {option.description && (
                <div className="mt-1 text-xs text-text-secondary">{option.description}</div>
              )}
            </div>
            {selected && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="shrink-0"
              >
                <Check className="h-5 w-5 text-accent-strong" />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
