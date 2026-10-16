export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseLandmarkPoint {
  index: number;
  name: string;
  nameVi: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface CalculatedMotionMetrics {
  elbowAngleLeft: number;
  elbowAngleRight: number;
  elbowFlareAngle: number;
  kneeAngleLeft: number;
  kneeAngleRight: number;
  hipAngleLeft: number;
  hipAngleRight: number;
  spineAlignmentAngle: number;
  depthRomPercentage: number;
  shoulderLevelDelta: number;
  hipElevationDelta: number;
  isBodyVisible: boolean;
  visibilityScore: number;
}

export type RepPhase = 'START' | 'DESCENDING' | 'INFLECTION' | 'ASCENDING' | 'COMPLETED';

export interface RepCounterState {
  repCount: number;
  currentPhase: RepPhase;
  currentRom: number;
  peakRom: number;
  invalidRepCount: number;
  lastRepDurationMs: number;
  lastRepScore: number;
  repStartTime: number | null;
}

// MediaPipe 33 standard landmark connections
export const POSE_CONNECTIONS: [number, number][] = [
  // Head & Face
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left Arm
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  // Right Arm
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  // Left Leg
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  // Right Leg
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
];

export const FULL_33_LANDMARKS: { index: number; en: string; vi: string; region: 'HEAD' | 'UPPER_BODY' | 'CORE' | 'LOWER_BODY' }[] = [
  { index: 0, en: 'nose', vi: 'Mũi', region: 'HEAD' },
  { index: 1, en: 'left_eye_inner', vi: 'Mắt trái trong', region: 'HEAD' },
  { index: 2, en: 'left_eye', vi: 'Mắt trái', region: 'HEAD' },
  { index: 3, en: 'left_eye_outer', vi: 'Mắt trái ngoài', region: 'HEAD' },
  { index: 4, en: 'right_eye_inner', vi: 'Mắt phải trong', region: 'HEAD' },
  { index: 5, en: 'right_eye', vi: 'Mắt phải', region: 'HEAD' },
  { index: 6, en: 'right_eye_outer', vi: 'Mắt phải ngoài', region: 'HEAD' },
  { index: 7, en: 'left_ear', vi: 'Tai trái', region: 'HEAD' },
  { index: 8, en: 'right_ear', vi: 'Tai phải', region: 'HEAD' },
  { index: 9, en: 'mouth_left', vi: 'Khóe miệng trái', region: 'HEAD' },
  { index: 10, en: 'mouth_right', vi: 'Khóe miệng phải', region: 'HEAD' },
  { index: 11, en: 'left_shoulder', vi: 'Vai trái', region: 'UPPER_BODY' },
  { index: 12, en: 'right_shoulder', vi: 'Vai phải', region: 'UPPER_BODY' },
  { index: 13, en: 'left_elbow', vi: 'Khuỷu tay trái', region: 'UPPER_BODY' },
  { index: 14, en: 'right_elbow', vi: 'Khuỷu tay phải', region: 'UPPER_BODY' },
  { index: 15, en: 'left_wrist', vi: 'Cổ tay trái', region: 'UPPER_BODY' },
  { index: 16, en: 'right_wrist', vi: 'Cổ tay phải', region: 'UPPER_BODY' },
  { index: 17, en: 'left_pinky', vi: 'Ngón út trái', region: 'UPPER_BODY' },
  { index: 18, en: 'right_pinky', vi: 'Ngón út phải', region: 'UPPER_BODY' },
  { index: 19, en: 'left_index', vi: 'Ngón trỏ trái', region: 'UPPER_BODY' },
  { index: 20, en: 'right_index', vi: 'Ngón trỏ phải', region: 'UPPER_BODY' },
  { index: 21, en: 'left_thumb', vi: 'Ngón cái trái', region: 'UPPER_BODY' },
  { index: 22, en: 'right_thumb', vi: 'Ngón cái phải', region: 'UPPER_BODY' },
  { index: 23, en: 'left_hip', vi: 'Khớp hông trái', region: 'CORE' },
  { index: 24, en: 'right_hip', vi: 'Khớp hông phải', region: 'CORE' },
  { index: 25, en: 'left_knee', vi: 'Đầu gối trái', region: 'LOWER_BODY' },
  { index: 26, en: 'right_knee', vi: 'Đầu gối phải', region: 'LOWER_BODY' },
  { index: 27, en: 'left_ankle', vi: 'Cổ chân trái', region: 'LOWER_BODY' },
  { index: 28, en: 'right_ankle', vi: 'Cổ chân phải', region: 'LOWER_BODY' },
  { index: 29, en: 'left_heel', vi: 'Gót chân trái', region: 'LOWER_BODY' },
  { index: 30, en: 'right_heel', vi: 'Gót chân phải', region: 'LOWER_BODY' },
  { index: 31, en: 'left_foot_index', vi: 'Mũi bàn chân trái', region: 'LOWER_BODY' },
  { index: 32, en: 'right_foot_index', vi: 'Mũi bàn chân phải', region: 'LOWER_BODY' },
];

export const LANDMARK_NAMES: { [index: number]: { en: string; vi: string } } = {
  0: { en: 'nose', vi: 'Mũi' },
  11: { en: 'left_shoulder', vi: 'Vai trái' },
  12: { en: 'right_shoulder', vi: 'Vai phải' },
  13: { en: 'left_elbow', vi: 'Khuỷu tay trái' },
  14: { en: 'right_elbow', vi: 'Khuỷu tay phải' },
  15: { en: 'left_wrist', vi: 'Cổ tay trái' },
  16: { en: 'right_wrist', vi: 'Cổ tay phải' },
  23: { en: 'left_hip', vi: 'Hông trái' },
  24: { en: 'right_hip', vi: 'Hông phải' },
  25: { en: 'left_knee', vi: 'Đầu gối trái' },
  26: { en: 'right_knee', vi: 'Đầu gối phải' },
  27: { en: 'left_ankle', vi: 'Cổ chân trái' },
  28: { en: 'right_ankle', vi: 'Cổ chân phải' },
};

