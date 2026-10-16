export interface FitnessLevel {
  id: string;
  code: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE' | string;
  name: string;
  minScore: number;
  maxScore: number;
  description: string;
  recommendation: string;
  colorScheme: 'green' | 'blue' | 'purple' | 'amber' | 'emerald';
  badgeLabel: string;
}

export interface DimensionMetric {
  dimension: string;
  displayName: string;
  score: number; // 0 - 100
  fullMark: number; // 100
  category: string;
  benchmarkScore?: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_WORK';
  insightText: string;
}

export interface FitnessProfileSummary {
  overallScore: number;
  level: FitnessLevel;
  dimensions: DimensionMetric[];
  completedAt: string;
  nextAssessmentDate: string;
}
