import { useState } from "react";

export type AssessmentStep = "experience" | "goals" | "capacity" | "knowledge" | "result";

const STEP_ORDER: AssessmentStep[] = ["experience", "goals", "capacity", "knowledge", "result"];

export function useAssessment() {
  const [step, setStep] = useState<AssessmentStep>("experience");
  const [goal, setGoal] = useState("Muscle-up");
  const [experience, setExperience] = useState("0–3 tháng");

  const next = () => {
    const i = STEP_ORDER.indexOf(step);
    setStep(STEP_ORDER[Math.min(i + 1, STEP_ORDER.length - 1)]);
  };

  const previous = () => {
    const i = STEP_ORDER.indexOf(step);
    setStep(STEP_ORDER[Math.max(i - 1, 0)]);
  };

  return { step, goal, setGoal, experience, setExperience, next, previous };
}
