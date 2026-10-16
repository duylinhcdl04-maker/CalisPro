import { apiClient } from "../../lib/api/client";

/** Khảo sát năng lực ban đầu V2 (tự khai báo, level TẠM THỜI tối đa L2). ASSESSMENT_FRAMEWORK_V2 §5; chỉ có khi app.assessment-v2.enabled=true. */

export interface InitialOption { code: string; label: string }

export interface InitialQuestion {
  code: string;
  text: string;
  instruction: string | null;
  /** SINGLE_CHOICE | MULTIPLE_CHOICE | NUMERIC_INPUT */
  inputType: string;
  section: string;
  required: boolean;
  minValue: number | null;
  maxValue: number | null;
  options: InitialOption[];
}

export type AnswerValue = string | number | string[];

export interface InitialQuestions { sessionId: number; questions: InitialQuestion[]; answers: Record<string, AnswerValue> }
export interface InitialSaveResult { visibleQuestions: string[]; removedQuestions: string[]; answered: number; requiredRemaining: string[] }

export interface InitialLevel {
  candidateLevel: string;
  gatedLevel: string;
  adjustedLevel: string;
  finalLevel: string;
  levelCap: string | null;
  capApplied: boolean;
  levelStatus: string;
  verificationStatus: string;
  source: string;
  gates: Record<string, string>;
}

export interface InitialCompetency { code: string; score: number | null; coverage: number; answerConfidence: number; dataQuality: string; needsVerification: boolean }
export interface InitialFlag { code: string; severity: string; message: string }
export interface InitialReason { code: string; gate: string; subject: string | null; message: string }

export interface InitialResult {
  sessionId: number;
  level: InitialLevel;
  overallScore: number | null;
  answerConfidence: number;
  dataQuality: string;
  competencies: InitialCompetency[];
  consistencyFlags: InitialFlag[];
  reasons: InitialReason[];
}

export const initialApi = {
  start: () => apiClient.post<{ sessionId: number; resumed: boolean }>("/assessments/initial/start").then((r) => r.data),
  questions: (sessionId: number) => apiClient.get<InitialQuestions>(`/assessments/initial/${sessionId}/questions`).then((r) => r.data),
  saveAnswers: (sessionId: number, answers: { questionCode: string; value: AnswerValue }[]) =>
    apiClient.put<InitialSaveResult>(`/assessments/initial/${sessionId}/answers`, { answers }).then((r) => r.data),
  complete: (sessionId: number) => apiClient.post<InitialResult>(`/assessments/initial/${sessionId}/complete`).then((r) => r.data),
};
