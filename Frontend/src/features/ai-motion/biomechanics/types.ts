import type { BodyRegion, LandmarkVisibility } from '../types/aiMotion.types';

export type VisualizationMode = 'SKELETON' | 'BIOMECHANICS' | 'HEATMAP' | 'COMBINED';

export type MuscleRole = 'PRIMARY' | 'SECONDARY' | 'STABILIZER' | 'NONE';

export interface MuscleGroupDef {
  id: string;
  nameVi: string;
  nameEn: string;
  region: BodyRegion;
  side: 'LEFT' | 'RIGHT' | 'CENTER' | 'BILATERAL';
  associatedLandmarks: number[];
  associatedJoints: string[];
  baseCenter: [number, number, number]; // [x, y, z] in 3D coordinate space
  dimensions: [number, number, number]; // [width, height, depth] or radius/height
  shapeType: 'CAPSULE' | 'CYLINDER' | 'BOX' | 'ELLIPSOID';
}

export interface ExerciseMuscleRelevance {
  muscleId: string;
  role: MuscleRole;
  relevanceScore: number; // 0 - 100
  movementRoleDescriptionVi?: string;
}

export interface JointAngleDefinition {
  id: string;
  nameVi: string;
  nameEn: string;
  landmarkA: number;
  landmarkVertex: number;
  landmarkC: number;
  targetRangeDefault: [number, number]; // e.g. [80, 100]
  unit: string;
  associatedMuscles: string[];
}

export interface BiomechanicsOverlayConfig {
  showJointAngles: boolean;
  showAlignmentLine: boolean;
  showSymmetryLine: boolean;
  showReferenceRange: boolean;
  showFloorGrid: boolean;
}

export interface Landmark3DPosition {
  index: number;
  name: string;
  nameVi: string;
  region: BodyRegion;
  x: number;
  y: number;
  z: number;
  visibilityRequirement: LandmarkVisibility;
  minConfidence: number;
  weight: number;
}
