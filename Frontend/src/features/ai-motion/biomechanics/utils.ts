import * as THREE from 'three';
import { LANDMARK_3D_DEFAULT_COORDS, JOINT_DEFINITIONS, MUSCLE_GROUPS } from './constants';
import type { Landmark3DPosition, JointAngleDefinition } from './types';
import type { AiLandmarkRequirementDto } from '../types/aiMotion.types';
import { MEDIAPIPE_LANDMARKS } from '../constants/landmarks';

/**
 * Calculates the angle (in degrees) between three 3D points forming a vertex at B: Vector BA and Vector BC.
 */
export function calculate3DAngle(
  pointA: [number, number, number] | THREE.Vector3,
  pointVertex: [number, number, number] | THREE.Vector3,
  pointC: [number, number, number] | THREE.Vector3
): number {
  const a = pointA instanceof THREE.Vector3 ? pointA : new THREE.Vector3(...pointA);
  const v = pointVertex instanceof THREE.Vector3 ? pointVertex : new THREE.Vector3(...pointVertex);
  const c = pointC instanceof THREE.Vector3 ? pointC : new THREE.Vector3(...pointC);

  const vecA = new THREE.Vector3().subVectors(a, v).normalize();
  const vecC = new THREE.Vector3().subVectors(c, v).normalize();

  const dot = vecA.dot(vecC);
  const clampedDot = Math.max(-1.0, Math.min(1.0, dot));
  const radians = Math.acos(clampedDot);
  return Math.round((radians * 180) / Math.PI);
}

/**
 * Merges backend landmarks configuration with default 3D coordinate space.
 */
export function mergeLandmarks3D(
  requirements: AiLandmarkRequirementDto[]
): Landmark3DPosition[] {
  return MEDIAPIPE_LANDMARKS.map((lm) => {
    const req = requirements.find((r) => r.landmarkIndex === lm.index);
    const coords = LANDMARK_3D_DEFAULT_COORDS[lm.index] || [0, 1.0, 0];

    return {
      index: lm.index,
      name: lm.name,
      nameVi: lm.nameVi,
      region: lm.region,
      x: coords[0],
      y: coords[1],
      z: coords[2],
      visibilityRequirement: req?.visibilityRequirement || 'REQUIRED',
      minConfidence: req?.minConfidence ?? 0.65,
      weight: req?.weight ?? 1.0,
    };
  });
}

/**
 * Computes all active joint metrics given current landmarks list.
 */
export function computeJointMetrics(landmarks: Landmark3DPosition[]) {
  const lmMap = new Map<number, Landmark3DPosition>();
  landmarks.forEach((lm) => lmMap.set(lm.index, lm));

  return JOINT_DEFINITIONS.map((joint) => {
    const lmA = lmMap.get(joint.landmarkA);
    const lmV = lmMap.get(joint.landmarkVertex);
    const lmC = lmMap.get(joint.landmarkC);

    if (!lmA || !lmV || !lmC) {
      return {
        ...joint,
        currentAngle: 90,
        alignmentScore: 90,
        symmetryScore: 92,
        isWithinRange: true,
      };
    }

    const angle = calculate3DAngle([lmA.x, lmA.y, lmA.z], [lmV.x, lmV.y, lmV.z], [lmC.x, lmC.y, lmC.z]);
    const min = joint.targetRangeDefault[0];
    const max = joint.targetRangeDefault[1];
    const isWithinRange = angle >= min && angle <= max;
    const deviation = Math.abs(angle - (min + max) / 2);
    const alignmentScore = Math.max(65, Math.min(99, Math.round(100 - deviation * 0.6)));
    const symmetryScore = Math.min(99, Math.round(88 + (lmA.minConfidence + lmV.minConfidence + lmC.minConfidence) * 4));

    return {
      ...joint,
      currentAngle: angle,
      alignmentScore,
      symmetryScore,
      isWithinRange,
    };
  });
}
