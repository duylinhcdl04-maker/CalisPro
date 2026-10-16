import { Input } from "../ui/Input";
import type { QuestionComponentProps } from "./QuestionRenderer";

export function NumberQuestion({ question, value, onChange }: QuestionComponentProps) {
  const numericValue = typeof value === "number" && !Number.isNaN(value) ? value : "";

  return (
    <div className="relative">
      <Input
        type="number"
        inputMode="decimal"
        min={question.min}
        max={question.max}
        value={numericValue}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === "" ? undefined : Number(raw));
        }}
        className={question.unit ? "pr-16" : undefined}
      />
      {question.unit && (
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
          {question.unit}
        </span>
      )}
    </div>
  );
}
