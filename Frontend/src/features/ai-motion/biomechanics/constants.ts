import type { JointAngleDefinition, MuscleGroupDef, ExerciseMuscleRelevance } from './types';

// Normalized 3D Coordinates for Biomechanical Human (Y up, centered at hips)
export const LANDMARK_3D_DEFAULT_COORDS: Record<number, [number, number, number]> = {
  // Head
  0: [0, 1.82, 0.12], // Nose
  1: [-0.04, 1.86, 0.1], // Left Eye Inner
  2: [-0.07, 1.86, 0.09], // Left Eye
  3: [-0.1, 1.86, 0.07], // Left Eye Outer
  4: [0.04, 1.86, 0.1], // Right Eye Inner
  5: [0.07, 1.86, 0.09], // Right Eye
  6: [0.1, 1.86, 0.07], // Right Eye Outer
  7: [-0.14, 1.84, -0.02], // Left Ear
  8: [0.14, 1.84, -0.02], // Right Ear
  9: [-0.05, 1.77, 0.1], // Mouth Left
  10: [0.05, 1.77, 0.1], // Mouth Right

  // Upper Body
  11: [-0.28, 1.55, 0.0], // Left Shoulder
  12: [0.28, 1.55, 0.0], // Right Shoulder
  13: [-0.38, 1.25, -0.02], // Left Elbow
  14: [0.38, 1.25, -0.02], // Right Elbow
  15: [-0.44, 0.96, 0.02], // Left Wrist
  16: [0.44, 0.96, 0.02], // Right Wrist
  17: [-0.46, 0.88, 0.02], // Left Pinky
  18: [0.46, 0.88, 0.02], // Right Pinky
  19: [-0.45, 0.87, 0.03], // Left Index
  20: [0.45, 0.87, 0.03], // Right Index
  21: [-0.42, 0.91, 0.04], // Left Thumb
  22: [0.42, 0.91, 0.04], // Right Thumb

  // Core & Pelvis
  23: [-0.16, 0.98, 0.0], // Left Hip
  24: [0.16, 0.98, 0.0], // Right Hip

  // Lower Body
  25: [-0.18, 0.52, 0.02], // Left Knee
  26: [0.18, 0.52, 0.02], // Right Knee
  27: [-0.18, 0.1, -0.02], // Left Ankle
  28: [0.18, 0.1, -0.02], // Right Ankle
  29: [-0.18, 0.04, -0.09], // Left Heel
  30: [0.18, 0.04, -0.09], // Right Heel
  31: [-0.18, 0.02, 0.12], // Left Foot Index
  32: [0.18, 0.02, 0.12], // Right Foot Index
};

// 3D Muscle Group Definitions (Positions and bounding meshes)
export const MUSCLE_GROUPS: MuscleGroupDef[] = [
  // Upper Body
  {
    id: 'CHEST',
    nameVi: 'Cơ Ngực (Pectoralis)',
    nameEn: 'Pectorals',
    region: 'UPPER_BODY',
    side: 'BILATERAL',
    associatedLandmarks: [11, 12, 23, 24],
    associatedJoints: ['SHOULDER_L', 'SHOULDER_R'],
    baseCenter: [0, 1.44, 0.08],
    dimensions: [0.36, 0.22, 0.16],
    shapeType: 'BOX',
  },
  {
    id: 'SHOULDERS',
    nameVi: 'Cơ Vai (Deltoids)',
    nameEn: 'Deltoids',
    region: 'UPPER_BODY',
    side: 'BILATERAL',
    associatedLandmarks: [11, 12, 13, 14],
    associatedJoints: ['SHOULDER_L', 'SHOULDER_R'],
    baseCenter: [0, 1.55, 0.0],
    dimensions: [0.68, 0.18, 0.2],
    shapeType: 'ELLIPSOID',
  },
  {
    id: 'TRICEPS',
    nameVi: 'Tay Sau (Triceps Brachii)',
    nameEn: 'Triceps',
    region: 'UPPER_BODY',
    side: 'BILATERAL',
    associatedLandmarks: [11, 12, 13, 14],
    associatedJoints: ['ELBOW_L', 'ELBOW_R'],
    baseCenter: [0, 1.4, -0.06],
    dimensions: [0.76, 0.25, 0.12],
    shapeType: 'CYLINDER',
  },
  {
    id: 'BICEPS',
    nameVi: 'Tay Trước (Biceps Brachii)',
    nameEn: 'Biceps',
    region: 'UPPER_BODY',
    side: 'BILATERAL',
    associatedLandmarks: [11, 12, 13, 14],
    associatedJoints: ['ELBOW_L', 'ELBOW_R'],
    baseCenter: [0, 1.4, 0.06],
    dimensions: [0.76, 0.25, 0.12],
    shapeType: 'CYLINDER',
  },
  {
    id: 'LATS_BACK',
    nameVi: 'Lưng Xô & Lưng Trên (Lats/Upper Back)',
    nameEn: 'Lats & Upper Back',
    region: 'CORE',
    side: 'BILATERAL',
    associatedLandmarks: [11, 12, 23, 24],
    associatedJoints: ['SHOULDER_L', 'SHOULDER_R'],
    baseCenter: [0, 1.35, -0.08],
    dimensions: [0.42, 0.36, 0.14],
    shapeType: 'BOX',
  },

  // Core
  {
    id: 'ABS_CORE',
    nameVi: 'Cơ Bụng & Lõi (Rectus Abdominis/Core)',
    nameEn: 'Abs & Core',
    region: 'CORE',
    side: 'CENTER',
    associatedLandmarks: [11, 12, 23, 24],
    associatedJoints: ['HIP_L', 'HIP_R'],
    baseCenter: [0, 1.18, 0.06],
    dimensions: [0.26, 0.28, 0.14],
    shapeType: 'BOX',
  },
  {
    id: 'LOWER_BACK',
    nameVi: 'Thắt Lưng Dưới (Erector Spinae)',
    nameEn: 'Lower Back',
    region: 'CORE',
    side: 'CENTER',
    associatedLandmarks: [23, 24],
    associatedJoints: ['HIP_L', 'HIP_R'],
    baseCenter: [0, 1.12, -0.06],
    dimensions: [0.24, 0.22, 0.12],
    shapeType: 'BOX',
  },

  // Lower Body
  {
    id: 'GLUTES',
    nameVi: 'Cơ Mông (Gluteus Maximus)',
    nameEn: 'Glutes',
    region: 'LOWER_BODY',
    side: 'BILATERAL',
    associatedLandmarks: [23, 24, 25, 26],
    associatedJoints: ['HIP_L', 'HIP_R'],
    baseCenter: [0, 0.94, -0.08],
    dimensions: [0.38, 0.22, 0.2],
    shapeType: 'ELLIPSOID',
  },
  {
    id: 'QUADRICEPS',
    nameVi: 'Đùi Trước (Quadriceps)',
    nameEn: 'Quadriceps',
    region: 'LOWER_BODY',
    side: 'BILATERAL',
    associatedLandmarks: [23, 24, 25, 26],
    associatedJoints: ['KNEE_L', 'KNEE_R'],
    baseCenter: [0, 0.74, 0.05],
    dimensions: [0.44, 0.38, 0.18],
    shapeType: 'CYLINDER',
  },
  {
    id: 'HAMSTRINGS',
    nameVi: 'Đùi Sau (Hamstrings)',
    nameEn: 'Hamstrings',
    region: 'LOWER_BODY',
    side: 'BILATERAL',
    associatedLandmarks: [23, 24, 25, 26],
    associatedJoints: ['KNEE_L', 'KNEE_R'],
    baseCenter: [0, 0.74, -0.05],
    dimensions: [0.42, 0.36, 0.16],
    shapeType: 'CYLINDER',
  },
  {
    id: 'CALVES',
    nameVi: 'Bắp Chân (Gastrocnemius/Soleus)',
    nameEn: 'Calves',
    region: 'LOWER_BODY',
    side: 'BILATERAL',
    associatedLandmarks: [25, 26, 27, 28],
    associatedJoints: ['ANKLE_L', 'ANKLE_R'],
    baseCenter: [0, 0.32, -0.03],
    dimensions: [0.4, 0.34, 0.16],
    shapeType: 'CYLINDER',
  },
];

// Joint Definitions for Biomechanical Measurements & Visual Arcs
export const JOINT_DEFINITIONS: JointAngleDefinition[] = [
  {
    id: 'ELBOW_L',
    nameVi: 'Khuỷu tay trái (Left Elbow)',
    nameEn: 'Left Elbow Joint',
    landmarkA: 11, // Shoulder
    landmarkVertex: 13, // Elbow
    landmarkC: 15, // Wrist
    targetRangeDefault: [80, 100],
    unit: '° (Độ gập/duỗi)',
    associatedMuscles: ['TRICEPS', 'BICEPS'],
  },
  {
    id: 'ELBOW_R',
    nameVi: 'Khuỷu tay phải (Right Elbow)',
    nameEn: 'Right Elbow Joint',
    landmarkA: 12,
    landmarkVertex: 14,
    landmarkC: 16,
    targetRangeDefault: [80, 100],
    unit: '° (Độ gập/duỗi)',
    associatedMuscles: ['TRICEPS', 'BICEPS'],
  },
  {
    id: 'SHOULDER_L',
    nameVi: 'Khớp vai trái (Left Shoulder)',
    nameEn: 'Left Shoulder Joint',
    landmarkA: 23, // Hip
    landmarkVertex: 11, // Shoulder
    landmarkC: 13, // Elbow
    targetRangeDefault: [45, 90],
    unit: '° (Góc giang/khép)',
    associatedMuscles: ['SHOULDERS', 'CHEST', 'LATS_BACK'],
  },
  {
    id: 'SHOULDER_R',
    nameVi: 'Khớp vai phải (Right Shoulder)',
    nameEn: 'Right Shoulder Joint',
    landmarkA: 24,
    landmarkVertex: 12,
    landmarkC: 14,
    targetRangeDefault: [45, 90],
    unit: '° (Góc giang/khép)',
    associatedMuscles: ['SHOULDERS', 'CHEST', 'LATS_BACK'],
  },
  {
    id: 'HIP_L',
    nameVi: 'Khớp hông trái (Left Hip)',
    nameEn: 'Left Hip Joint',
    landmarkA: 11, // Shoulder
    landmarkVertex: 23, // Hip
    landmarkC: 25, // Knee
    targetRangeDefault: [160, 180],
    unit: '° (Góc trục thân/đùi)',
    associatedMuscles: ['GLUTES', 'ABS_CORE', 'LOWER_BACK'],
  },
  {
    id: 'HIP_R',
    nameVi: 'Khớp hông phải (Right Hip)',
    nameEn: 'Right Hip Joint',
    landmarkA: 12,
    landmarkVertex: 24,
    landmarkC: 26,
    targetRangeDefault: [160, 180],
    unit: '° (Góc trục thân/đùi)',
    associatedMuscles: ['GLUTES', 'ABS_CORE', 'LOWER_BACK'],
  },
  {
    id: 'KNEE_L',
    nameVi: 'Đầu gối trái (Left Knee)',
    nameEn: 'Left Knee Joint',
    landmarkA: 23, // Hip
    landmarkVertex: 25, // Knee
    landmarkC: 27, // Ankle
    targetRangeDefault: [85, 105],
    unit: '° (Độ gập gối)',
    associatedMuscles: ['QUADRICEPS', 'HAMSTRINGS'],
  },
  {
    id: 'KNEE_R',
    nameVi: 'Đầu gối phải (Right Knee)',
    nameEn: 'Right Knee Joint',
    landmarkA: 24,
    landmarkVertex: 26,
    landmarkC: 28,
    targetRangeDefault: [85, 105],
    unit: '° (Độ gập gối)',
    associatedMuscles: ['QUADRICEPS', 'HAMSTRINGS'],
  },
];

// Exercise Context Muscle Mappings (Exercise Code -> Muscle Contribution)
export const DEFAULT_EXERCISE_MUSCLE_MAP: Record<string, ExerciseMuscleRelevance[]> = {
  'push-up': [
    { muscleId: 'CHEST', role: 'PRIMARY', relevanceScore: 95, movementRoleDescriptionVi: 'Cơ phát lực đẩy chính (Horizontal Adduction)' },
    { muscleId: 'TRICEPS', role: 'PRIMARY', relevanceScore: 88, movementRoleDescriptionVi: 'Duỗi khớp khuỷu tay (Elbow Extension)' },
    { muscleId: 'SHOULDERS', role: 'SECONDARY', relevanceScore: 78, movementRoleDescriptionVi: 'Vai trước trợ lực đẩy (Anterior Deltoid)' },
    { muscleId: 'ABS_CORE', role: 'STABILIZER', relevanceScore: 82, movementRoleDescriptionVi: 'Giữ trục thân thẳng (Anti-Extension Core)' },
    { muscleId: 'GLUTES', role: 'STABILIZER', relevanceScore: 60, movementRoleDescriptionVi: 'Khoá khung xương chậu' },
  ],
  'pull-up': [
    { muscleId: 'LATS_BACK', role: 'PRIMARY', relevanceScore: 98, movementRoleDescriptionVi: 'Cơ phát lực kéo chính (Shoulder Adduction)' },
    { muscleId: 'BICEPS', role: 'PRIMARY', relevanceScore: 86, movementRoleDescriptionVi: 'Gập khớp khuỷu tay (Elbow Flexion)' },
    { muscleId: 'SHOULDERS', role: 'SECONDARY', relevanceScore: 75, movementRoleDescriptionVi: 'Kéo hạ xương bả vai (Scapular Retraction)' },
    { muscleId: 'ABS_CORE', role: 'STABILIZER', relevanceScore: 80, movementRoleDescriptionVi: 'Giữ tư thế Hollow Body' },
  ],
  'dip': [
    { muscleId: 'TRICEPS', role: 'PRIMARY', relevanceScore: 96, movementRoleDescriptionVi: 'Duỗi khớp khuỷu tay kháng trọng lực' },
    { muscleId: 'CHEST', role: 'PRIMARY', relevanceScore: 85, movementRoleDescriptionVi: 'Ngực dưới ép đẩy thân trên' },
    { muscleId: 'SHOULDERS', role: 'SECONDARY', relevanceScore: 82, movementRoleDescriptionVi: 'Ổn định ổ chảo cánh tay' },
    { muscleId: 'ABS_CORE', role: 'STABILIZER', relevanceScore: 70, movementRoleDescriptionVi: 'Hạn chế đung đưa thân dưới' },
  ],
  'squat': [
    { muscleId: 'QUADRICEPS', role: 'PRIMARY', relevanceScore: 96, movementRoleDescriptionVi: 'Duỗi đầu gối kháng trọng lực' },
    { muscleId: 'GLUTES', role: 'PRIMARY', relevanceScore: 92, movementRoleDescriptionVi: 'Duỗi khớp hông (Hip Extension)' },
    { muscleId: 'HAMSTRINGS', role: 'SECONDARY', relevanceScore: 72, movementRoleDescriptionVi: 'Kiểm soát hạ trọng tâm (Deceleration)' },
    { muscleId: 'ABS_CORE', role: 'STABILIZER', relevanceScore: 78, movementRoleDescriptionVi: 'Giữ cột sống trung tính' },
    { muscleId: 'CALVES', role: 'STABILIZER', relevanceScore: 54, movementRoleDescriptionVi: 'Ổn định cổ chân và bàn chân' },
  ],
  'plank': [
    { muscleId: 'ABS_CORE', role: 'PRIMARY', relevanceScore: 98, movementRoleDescriptionVi: 'Gồng chống uốn cong cột sống' },
    { muscleId: 'SHOULDERS', role: 'SECONDARY', relevanceScore: 76, movementRoleDescriptionVi: 'Đẩy vai nhô cao (Protraction)' },
    { muscleId: 'GLUTES', role: 'STABILIZER', relevanceScore: 70, movementRoleDescriptionVi: 'Siết mông khoá hông' },
    { muscleId: 'QUADRICEPS', role: 'STABILIZER', relevanceScore: 65, movementRoleDescriptionVi: 'Duỗi thẳng đầu gối' },
  ],
  'muscle-up': [
    { muscleId: 'LATS_BACK', role: 'PRIMARY', relevanceScore: 96, movementRoleDescriptionVi: 'Kéo bùng nổ lên cao (High Pull)' },
    { muscleId: 'TRICEPS', role: 'PRIMARY', relevanceScore: 92, movementRoleDescriptionVi: 'Đẩy chuyển tiếp trên thanh xà' },
    { muscleId: 'CHEST', role: 'SECONDARY', relevanceScore: 84, movementRoleDescriptionVi: 'Đè ngực qua xà' },
    { muscleId: 'SHOULDERS', role: 'SECONDARY', relevanceScore: 88, movementRoleDescriptionVi: 'Ổn định vai chuyển góc' },
    { muscleId: 'ABS_CORE', role: 'STABILIZER', relevanceScore: 90, movementRoleDescriptionVi: 'Kiểm soát nhịp bùng nổ' },
  ],
  'handstand': [
    { muscleId: 'SHOULDERS', role: 'PRIMARY', relevanceScore: 98, movementRoleDescriptionVi: 'Đẩy vai cao hết biên độ (Elevation)' },
    { muscleId: 'TRICEPS', role: 'PRIMARY', relevanceScore: 90, movementRoleDescriptionVi: 'Khoá thẳng khuỷu tay tuyệt đối' },
    { muscleId: 'ABS_CORE', role: 'STABILIZER', relevanceScore: 94, movementRoleDescriptionVi: 'Giữ đường thẳng Hollow Body' },
    { muscleId: 'GLUTES', role: 'STABILIZER', relevanceScore: 85, movementRoleDescriptionVi: 'Khoá thẳng hông và chân' },
  ],
};

export function getExerciseMuscles(exerciseCode?: string): ExerciseMuscleRelevance[] {
  if (!exerciseCode) return DEFAULT_EXERCISE_MUSCLE_MAP['push-up'];
  const code = exerciseCode.toLowerCase();
  for (const [key, mapping] of Object.entries(DEFAULT_EXERCISE_MUSCLE_MAP)) {
    if (code.includes(key)) return mapping;
  }
  return DEFAULT_EXERCISE_MUSCLE_MAP['push-up'];
}
