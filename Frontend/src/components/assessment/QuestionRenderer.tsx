import type { ComponentType } from "react";
import type { AnswerValue, AssessmentQuestion, QuestionType } from "../../types";
import { SingleChoiceQuestion } from "./SingleChoiceQuestion";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { NumberQuestion } from "./NumberQuestion";
import { BooleanQuestion } from "./BooleanQuestion";
import { ScaleQuestion } from "./ScaleQuestion";

export interface QuestionComponentProps {
  question: AssessmentQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue | undefined) => void;
}

const QUESTION_COMPONENTS: Record<QuestionType, ComponentType<QuestionComponentProps>> = {
  SINGLE_CHOICE: SingleChoiceQuestion,
  MULTIPLE_CHOICE: MultipleChoiceQuestion,
  NUMBER: NumberQuestion,
  BOOLEAN: BooleanQuestion,
  SCALE: ScaleQuestion,
};

/** Data-driven dispatch: adding a new QuestionType only requires a new entry above. */
export function QuestionRenderer({ question, value, onChange }: QuestionComponentProps) {
  const Component = QUESTION_COMPONENTS[question.type];
  return <Component question={question} value={value} onChange={onChange} />;
}
