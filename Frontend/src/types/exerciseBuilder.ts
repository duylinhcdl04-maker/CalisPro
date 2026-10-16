export type ExerciseCategory = 
  | "Strength" 
  | "Skill" 
  | "Mobility" 
  | "Flexibility" 
  | "Endurance" 
  | "Conditioning" 
  | "Recovery";

export type ExerciseDifficulty = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export type MovementPattern = 
  | "Horizontal Push"
  | "Vertical Push"
  | "Horizontal Pull"
  | "Vertical Pull"
  | "Squat"
  | "Hinge"
  | "Lunge"
  | "Core Flexion"
  | "Core Extension"
  | "Rotation"
  | "Anti-Rotation"
  | "Static Hold"
  | "Locomotion";

export type EquipmentType = 
  | "No Equipment"
  | "Pull-up Bar"
  | "Parallel Bars"
  | "Gymnastic Rings"
  | "Resistance Band"
  | "Parallettes"
  | "Weight Vest / Dip Belt"
  | "Dumbbell"
  | "Kettlebell"
  | "Bench"
  | "Other";

export type MuscleActivationLevel = "Low" | "Moderate" | "High" | "Very High";

export interface MuscleTargetItem {
  id: string;
  name: string;
  vietnameseName: string;
  role: "primary" | "secondary" | "stabilizer";
  activationLevel: MuscleActivationLevel;
  bodyRegion: "chest" | "back" | "shoulders" | "arms" | "core" | "glutes" | "legs";
}

export interface MovementPhaseItem {
  id: string;
  order: number;
  name: string; // e.g., "01 Setup", "02 Eccentric"
  vietnameseName: string;
  description: string;
  keyCue: string;
  breathing: "Inhale" | "Exhale" | "Hold / Braced" | "Natural";
  muscleFocus: string;
  mediaUrl?: string;
}

export interface CoachingCueItem {
  id: string;
  text: string;
  type: "positive" | "negative" | "alignment" | "safety";
}

export interface CommonMistakeItem {
  id: string;
  name: string;
  problem: string;
  whyItHappens: string;
  correction: string;
  severity: "Low" | "Medium" | "High";
  mediaUrl?: string;
}

export interface SafetyGuidance {
  contraindications: string;
  safetyCues: string[];
  stopConditions: string[];
}

export interface MuscleSensation {
  muscleName: string;
  expectedSensation: string;
  intensity: "Mild" | "Moderate" | "Strong";
  normalSensations: string[];
  unexpectedSensations: string[];
}

export interface MediaPipeLandmark {
  id: number;
  name: string;
  vietnameseName: string;
  bodyPart: "upper_body" | "lower_body" | "core" | "face";
  enabled: boolean;
}

export interface AIJointRule {
  id: string;
  measurement: string; // e.g. "Elbow Angle", "Hip Angle", "Shoulder Extension"
  condition: "LESS_THAN" | "GREATER_THAN" | "BETWEEN" | "OUTSIDE_RANGE" | "INCREASING" | "DECREASING" | "STABLE";
  targetValue: number;
  secondaryValue?: number;
  tolerance: number;
  action: "WARNING" | "CRITICAL_STOP" | "FORM_CUE" | "REP_COUNT_TRIGGER";
  message: string;
}

export interface AIROMRule {
  id: string;
  movementName: string;
  metricType: "depth_cm" | "angle_degrees" | "height_percent";
  minROM: number;
  maxROM: number;
  tolerance: number;
  unit: string;
  description: string;
}

export interface AITempoRule {
  eccentricSec: number;
  pauseBottomSec: number;
  concentricSec: number;
  pauseTopSec: number;
  toleranceSec: number;
}

export interface AIErrorDetectionRule {
  id: string;
  ruleName: string;
  category: "Alignment" | "Joint Position" | "Range of Motion" | "Tempo" | "Stability" | "Symmetry";
  conditionDescription: string;
  severity: "Info" | "Warning" | "Critical";
  feedbackMessage: string;
  correctionCue: string;
}

export interface AIRuleConfiguration {
  enabled: boolean;
  landmarks: MediaPipeLandmark[];
  jointRules: AIJointRule[];
  romRules: AIROMRule[];
  tempoRule: AITempoRule;
  errorDetectionRules: AIErrorDetectionRule[];
}

export interface ExerciseFormData {
  id?: string;
  // Step 01: Basic
  name: string;
  vietnameseName: string;
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  movementPattern: MovementPattern;
  equipment: EquipmentType[];
  shortDescription: string;
  tags: string[];

  // Step 02: Media & Phases
  videoUrl: string;
  thumbnailUrl: string;
  animationUrl?: string;
  phases: MovementPhaseItem[];

  // Step 03: Muscles & Sensation
  muscles: MuscleTargetItem[];
  sensations: MuscleSensation[];

  // Step 04: Technique & Coaching
  setupInstruction: string;
  executionInstruction: string;
  inhaleTiming: string;
  exhaleTiming: string;
  tempoFormat?: string; // e.g. "3-0-1-0"
  coachingCues: CoachingCueItem[];
  commonMistakes: CommonMistakeItem[];
  safetyGuidance: SafetyGuidance;

  // Step 05: AI Motion Analysis
  aiRules: AIRuleConfiguration;

  // Metadata & Status
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: string;
  updatedAt?: string;
  createdAt?: string;
}
