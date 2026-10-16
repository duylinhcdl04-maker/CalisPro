export type LandmarkVisibility = 'REQUIRED' | 'OPTIONAL' | 'DISABLED';
export type BodyRegion = 'HEAD' | 'UPPER_BODY' | 'CORE' | 'LOWER_BODY';
export type MetricType = 'ANGLE' | 'ALIGNMENT' | 'DEPTH' | 'ROM' | 'TEMPO' | 'VELOCITY';
export type RuleOperator = 'GTE' | 'LTE' | 'EQ' | 'BETWEEN' | 'OUTSIDE' | 'LT' | 'GT';
export type RuleSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type ExercisePhase = 'ALL' | 'SETUP' | 'START' | 'ECCENTRIC' | 'INFLECTION' | 'CONCENTRIC' | 'LOCKOUT' | 'HOLD';
export type FeedbackType = 'TEXT_ONLY' | 'VOICE_ONLY' | 'BOTH' | 'HAPTIC';

export interface ExerciseAiProfileDto {
  id: number;
  exerciseId: number;
  exerciseCode: string;
  exerciseName: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version: number;
  description: string;
  cameraAngleRequirement: string;
  minBodyVisibilityPercent: number;
  trackingFpsTarget: number;
  smoothingAlpha: number;
  repCountPrimaryMetric: string;
  repStartThreshold: number;
  repPeakThreshold: number;
  repEndThreshold: number;
  minRomPercentage: number;
  repDirection: 'DESCENDING_FIRST' | 'ASCENDING_FIRST';
  repDebounceMs: number;
  minRepDurationMs: number;
  autoVoiceFeedbackEnabled: boolean;
  warningCooldownSeconds: number;
  maxWarningsPerRep: number;
  rulesCount?: number;
  landmarksCount?: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AiLandmarkRequirementDto {
  id?: number;
  profileId: number;
  landmarkIndex: number;
  landmarkName: string;
  bodyRegion: BodyRegion;
  visibilityRequirement: LandmarkVisibility;
  minConfidence: number;
  weight: number;
  description?: string;
}

export interface AiMotionRuleDto {
  id?: number;
  profileId: number;
  ruleCode: string;
  ruleName: string;
  description?: string;
  phase: ExercisePhase;
  metricType: MetricType;
  landmarkA: number;
  landmarkB: number;
  landmarkC?: number;
  landmarkD?: number;
  operator: RuleOperator;
  targetValue: number;
  targetValueMax?: number;
  tolerance: number;
  severity: RuleSeverity;
  feedbackTextVi: string;
  feedbackTextEn?: string;
  voicePromptVi?: string;
  voicePromptEn?: string;
  priority: number;
  isInvalidRepFlag: boolean;
  isActive: boolean;
}

export interface AiFeedbackTemplateDto {
  id?: number;
  profileId: number;
  ruleId?: number;
  feedbackKey: string;
  phase: ExercisePhase;
  severity: RuleSeverity;
  templateTextVi: string;
  templateTextEn?: string;
  voiceTextVi: string;
  voiceTextEn?: string;
  feedbackType: FeedbackType;
  cooldownSeconds: number;
  isActive: boolean;
}

export interface ViettelVoiceDto {
  code: string;
  name: string;
  region: 'Miền Bắc' | 'Miền Trung' | 'Miền Nam';
  gender: 'Nam' | 'Nữ';
  desc: string;
}

export interface AiVoiceConfigurationDto {
  id?: number;
  provider: 'VIETTEL_AI' | 'GEMINI' | 'GOOGLE_CLOUD_TTS' | 'ELEVENLABS' | 'BROWSER_NATIVE';
  modelName: string;
  apiKeyMasked?: string;
  apiKey?: string;
  geminiApiKey?: string;
  geminiApiKeyMasked?: string;
  viettelToken?: string;
  viettelTokenMasked?: string;
  voiceName: string;
  languageCode: string;
  speakingRate: number;
  pitch: number;
  volumeGainDb: number;
  audioEncoding: 'MP3' | 'OGG_OPUS' | 'LINEAR16';
  isDefault: boolean;
  systemInstruction?: string;
  updatedAt?: string;
}

export interface AiVoiceCacheStatsDto {
  totalCachedAudios: number;
  totalCacheHits: number;
  totalStorageBytes: number;
  mostFrequentPrompts: { promptText: string; hitCount: number }[];
}

export interface AiSystemStatsDto {
  totalProfiles: number;
  publishedProfiles: number;
  totalActiveRules: number;
  cachedVoiceWarningsCount: number;
  averageLatencyMs: number;
  todayEvaluationsCount: number;
  geminiConnected: boolean;
}

export interface AiConfigurationVersionDto {
  id: number;
  profileId: number;
  versionNumber: number;
  versionLabel: string;
  changeSummary: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface AiConfigurationAuditLogDto {
  id: number;
  profileId?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'ROLLBACK' | 'API_KEY_UPDATE';
  entityType: string;
  entityId?: number;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  performedBy: string;
  createdAt: string;
}

export interface RuleEvaluationRequest {
  profileId: number;
  currentPhase: ExercisePhase;
  currentMetrics: Record<string, number>;
  activeLandmarks?: Record<number, { x: number; y: number; z?: number; visibility: number }>;
}

export interface RuleEvaluationResult {
  passed: boolean;
  score: number;
  invalidRep: boolean;
  triggeredRules: {
    ruleId: number;
    ruleCode: string;
    ruleName: string;
    severity: RuleSeverity;
    feedbackTextVi: string;
    voicePromptVi?: string;
    currentValue: number;
    targetRange: string;
  }[];
  voiceWarningToPlay?: {
    text: string;
    audioBase64?: string;
    cached: boolean;
    hash: string;
  };
}
