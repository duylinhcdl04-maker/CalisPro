export type ConditionOperator = 'GT' | 'GTE' | 'LT' | 'LTE' | 'BETWEEN' | 'EQ';

export interface ScoringRule {
  id: string;
  questionId: string;
  operator: ConditionOperator;
  minValue?: number;
  maxValue?: number;
  exactValue?: number | string;
  score: number; // 0 - 100 points
  label?: string; // e.g. "0 - 5 reps => 20 pts"
}

export interface QuestionScoringMap {
  questionId: string;
  rules: ScoringRule[];
}

export interface ScoringConfig {
  maxTotalScore: number; // usually 100
  questionScoring: QuestionScoringMap[];
  passScore?: number;
}

export interface CalculatedUserScore {
  totalScore: number;
  maxScore: number;
  percentage: number;
  fitnessLevelName: string;
  dimensionScores: Record<string, number>;
}
