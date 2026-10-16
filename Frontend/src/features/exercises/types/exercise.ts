export type ExerciseCategory = 
  | "Strength" 
  | "Skill" 
  | "Mobility" 
  | "Flexibility" 
  | "Endurance" 
  | "Conditioning" 
  | "Recovery";

export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

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

export type Equipment = 
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

export type MuscleRole = "PRIMARY" | "SECONDARY" | "STABILIZER";

export type MuscleActivation = "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";

export type MuscleLaterality = "BILATERAL" | "LEFT" | "RIGHT" | "CENTRAL";

export type ExpectedSensationType = 
  | "MUSCLE_TENSION"
  | "STRETCH"
  | "FATIGUE"
  | "PUMP"
  | "BURNING"
  | "STABILIZATION_EFFORT";

export type UnexpectedSensationType = 
  | "SHARP_PAIN"
  | "JOINT_PAIN"
  | "NUMBNESS"
  | "TINGLING"
  | "UNUSUAL_DISCOMFORT";

export interface CalisHealthMuscle {
  id: string; // e.g. "muscle_pectoralis_major"
  code: string; // e.g. "PECTORALIS_MAJOR"
  name: string; // English scientific name
  nameVi: string; // Vietnamese friendly name
  region: "CHEST" | "BACK" | "SHOULDERS" | "ARMS" | "ABDOMINALS" | "LEGS" | "GLUTES";
  side: "FRONT" | "BACK" | "BOTH";
  bodyMusclesIds: string[]; // List of matching body-muscles library SVG IDs
}

export interface MuscleTarget {
  muscleId: string;
  role: MuscleRole;
  activationLevel: MuscleActivation;
  laterality: MuscleLaterality;
  expectedSensations: ExpectedSensationType[];
  unexpectedSensations: UnexpectedSensationType[];
  userGuidance: string; // "What should the user feel?" max 500 chars
}

export interface MovementPhase {
  id: string;
  order: number;
  name: string;
  vietnameseName: string;
  description: string;
  coachingCue: string;
  breathing: "Inhale" | "Exhale" | "Hold / Braced" | "Natural";
  muscleFocus: string;
  mediaUrl?: string;
}

export interface CoachingCue {
  id: string;
  text: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: "ALIGNMENT" | "SAFETY" | "BREATHING" | "MOTIVATION";
}

export interface CommonMistake {
  id: string;
  name: string;
  problem: string;
  whyItHappens: string;
  correction: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  mediaUrl?: string;
}

export interface SafetyGuidance {
  safetyCues: string[];
  stopConditions: string[];
  generalConsiderations: string;
  contraindications: string;
}

export interface MediaPipeLandmarkConfig {
  id: number;
  name: string;
  nameVi: string;
  bodyPart: "upper_body" | "lower_body" | "core" | "face";
  enabled: boolean;
}

export interface AIJointRule {
  id: string;
  measurement: string;
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

export interface AIErrorRule {
  id: string;
  ruleName: string;
  category: "Alignment" | "Joint Position" | "Range of Motion" | "Tempo" | "Stability" | "Symmetry";
  conditionDescription: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  aiFeedback: string;
  correctionCue: string;
}

export interface MuscleImpactImage {
  id: string;
  url: string;
  caption?: string;
  isPrimary?: boolean;
}

export interface ExerciseFormData {
  id?: string;
  
  // 01 Basic Information
  basicInformation: {
    name: string;
    displayName: string;
    category: ExerciseCategory;
    difficulty: DifficultyLevel;
    movementPattern: MovementPattern;
    equipment: Equipment[];
    description: string;
    tags: string[];
    /** Bài dùng được ở phần nào của buổi tập (khởi động, bài chính, bổ trợ, thả lỏng). Rỗng = chưa phân loại. */
    sessionRoles?: import("../constants/sessionRoles").SessionRole[];
  };

  // 02 Media & Movement Phases
  media: {
    videoUrl: string;
    thumbnailUrl: string;
    animationUrl?: string;
    phases: MovementPhase[];
  };

  // 03 Muscles & Movement (body-muscles integration + visual impact images up to 5)
  muscles: {
    targets: MuscleTarget[];
    anatomyImages?: MuscleImpactImage[]; // Up to 5 muscle impact demonstration images
    anatomyImageUrl?: string; // Backwards compatible fallback
    anatomyImageCaption?: string;
  };

  // 04 Technique & Coaching
  technique: {
    setup: string;
    execution: string;
    inhaleTiming: string;
    exhaleTiming: string;
    tempo: string;
    coachingCues: CoachingCue[];
    commonMistakes: CommonMistake[];
    safety: SafetyGuidance;
  };

  // 05 AI Motion Analysis
  aiAnalysis: {
    enabled: boolean;
    landmarks: MediaPipeLandmarkConfig[];
    jointRules: AIJointRule[];
    romRules: AIROMRule[];
    tempoRule: AITempoRule;
    errorRules: AIErrorRule[];
  };

  // 06 Version & Status
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: string;
  updatedAt?: string;
  createdAt?: string;
}
