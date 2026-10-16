export interface LandmarkDef {
  index: number;
  name: string;
  nameVi: string;
  region: 'HEAD' | 'UPPER_BODY' | 'CORE' | 'LOWER_BODY';
  x: number; // Normalized default coords for 2D skeleton SVG visualizer (0-100)
  y: number;
}

export const MEDIAPIPE_LANDMARKS: LandmarkDef[] = [
  { index: 0, name: 'NOSE', nameVi: 'Mũi', region: 'HEAD', x: 50, y: 12 },
  { index: 1, name: 'LEFT_EYE_INNER', nameVi: 'Mắt trái (trong)', region: 'HEAD', x: 48, y: 10 },
  { index: 2, name: 'LEFT_EYE', nameVi: 'Mắt trái', region: 'HEAD', x: 47, y: 10 },
  { index: 3, name: 'LEFT_EYE_OUTER', nameVi: 'Mắt trái (ngoài)', region: 'HEAD', x: 46, y: 10 },
  { index: 4, name: 'RIGHT_EYE_INNER', nameVi: 'Mắt phải (trong)', region: 'HEAD', x: 52, y: 10 },
  { index: 5, name: 'RIGHT_EYE', nameVi: 'Mắt phải', region: 'HEAD', x: 53, y: 10 },
  { index: 6, name: 'RIGHT_EYE_OUTER', nameVi: 'Mắt phải (ngoài)', region: 'HEAD', x: 54, y: 10 },
  { index: 7, name: 'LEFT_EAR', nameVi: 'Tai trái', region: 'HEAD', x: 44, y: 11 },
  { index: 8, name: 'RIGHT_EAR', nameVi: 'Tai phải', region: 'HEAD', x: 56, y: 11 },
  { index: 9, name: 'MOUTH_LEFT', nameVi: 'Miệng trái', region: 'HEAD', x: 48, y: 14 },
  { index: 10, name: 'MOUTH_RIGHT', nameVi: 'Miệng phải', region: 'HEAD', x: 52, y: 14 },
  { index: 11, name: 'LEFT_SHOULDER', nameVi: 'Vai trái', region: 'UPPER_BODY', x: 41, y: 22 },
  { index: 12, name: 'RIGHT_SHOULDER', nameVi: 'Vai phải', region: 'UPPER_BODY', x: 59, y: 22 },
  { index: 13, name: 'LEFT_ELBOW', nameVi: 'Khuỷu tay trái', region: 'UPPER_BODY', x: 33, y: 35 },
  { index: 14, name: 'RIGHT_ELBOW', nameVi: 'Khuỷu tay phải', region: 'UPPER_BODY', x: 67, y: 35 },
  { index: 15, name: 'LEFT_WRIST', nameVi: 'Cổ tay trái', region: 'UPPER_BODY', x: 26, y: 48 },
  { index: 16, name: 'RIGHT_WRIST', nameVi: 'Cổ tay phải', region: 'UPPER_BODY', x: 74, y: 48 },
  { index: 17, name: 'LEFT_PINKY', nameVi: 'Ngón út trái', region: 'UPPER_BODY', x: 24, y: 51 },
  { index: 18, name: 'RIGHT_PINKY', nameVi: 'Ngón út phải', region: 'UPPER_BODY', x: 76, y: 51 },
  { index: 19, name: 'LEFT_INDEX', nameVi: 'Ngón trỏ trái', region: 'UPPER_BODY', x: 25, y: 52 },
  { index: 20, name: 'RIGHT_INDEX', nameVi: 'Ngón trỏ phải', region: 'UPPER_BODY', x: 75, y: 52 },
  { index: 21, name: 'LEFT_THUMB', nameVi: 'Ngón cái trái', region: 'UPPER_BODY', x: 27, y: 50 },
  { index: 22, name: 'RIGHT_THUMB', nameVi: 'Ngón cái phải', region: 'UPPER_BODY', x: 73, y: 50 },
  { index: 23, name: 'LEFT_HIP', nameVi: 'Hông trái', region: 'CORE', x: 44, y: 52 },
  { index: 24, name: 'RIGHT_HIP', nameVi: 'Hông phải', region: 'CORE', x: 56, y: 52 },
  { index: 25, name: 'LEFT_KNEE', nameVi: 'Đầu gối trái', region: 'LOWER_BODY', x: 42, y: 72 },
  { index: 26, name: 'RIGHT_KNEE', nameVi: 'Đầu gối phải', region: 'LOWER_BODY', x: 58, y: 72 },
  { index: 27, name: 'LEFT_ANKLE', nameVi: 'Cổ chân trái', region: 'LOWER_BODY', x: 40, y: 90 },
  { index: 28, name: 'RIGHT_ANKLE', nameVi: 'Cổ chân phải', region: 'LOWER_BODY', x: 60, y: 90 },
  { index: 29, name: 'LEFT_HEEL', nameVi: 'Gót chân trái', region: 'LOWER_BODY', x: 39, y: 93 },
  { index: 30, name: 'RIGHT_HEEL', nameVi: 'Gót chân phải', region: 'LOWER_BODY', x: 61, y: 93 },
  { index: 31, name: 'LEFT_FOOT_INDEX', nameVi: 'Mũi chân trái', region: 'LOWER_BODY', x: 37, y: 95 },
  { index: 32, name: 'RIGHT_FOOT_INDEX', nameVi: 'Mũi chân phải', region: 'LOWER_BODY', x: 63, y: 95 },
];

export const SKELETON_CONNECTIONS: [number, number][] = [
  // Head
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  // Torso
  [11, 12], // Shoulders
  [11, 23], // Left torso
  [12, 24], // Right torso
  [23, 24], // Hips
  // Left Arm
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  // Right Arm
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  // Left Leg
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  // Right Leg
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
];

export function getLandmarkName(index: number): string {
  const lm = MEDIAPIPE_LANDMARKS.find((l) => l.index === index);
  return lm ? `${lm.index} - ${lm.nameVi} (${lm.name})` : `Khớp #${index}`;
}

export function getLandmarkShortName(index: number): string {
  const lm = MEDIAPIPE_LANDMARKS.find((l) => l.index === index);
  return lm ? lm.nameVi : `#${index}`;
}
