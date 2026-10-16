import type { NormalizedLandmark, CalculatedMotionMetrics } from '../mediapipe/poseTypes';

export class AngleCalculator {
  /**
   * Calculates the 2D joint angle at Point B formed by Vector BA and Vector BC.
   * Returns angle in degrees [0 - 180°].
   */
  public static calculateAngle(
    a: NormalizedLandmark | undefined,
    b: NormalizedLandmark | undefined,
    c: NormalizedLandmark | undefined
  ): number {
    if (!a || !b || !c) return 180;
    if ((a.visibility ?? 1) < 0.4 || (b.visibility ?? 1) < 0.4 || (c.visibility ?? 1) < 0.4) {
      return 180;
    }

    const radians =
      Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);

    if (angle > 180.0) {
      angle = 360.0 - angle;
    }

    return Math.round(angle * 10) / 10;
  }

  /**
   * Calculates collinear alignment angle between 3 points (e.g., Shoulder-Hip-Ankle).
   * 180° is a perfectly straight line.
   */
  public static calculateAlignment(
    shoulder: NormalizedLandmark | undefined,
    hip: NormalizedLandmark | undefined,
    ankleOrKnee: NormalizedLandmark | undefined
  ): number {
    return this.calculateAngle(shoulder, hip, ankleOrKnee);
  }

  /**
   * Computes comprehensive biomechanical metrics from 33 MediaPipe Pose landmarks.
   */
  public static extractMetrics(landmarks: NormalizedLandmark[], exerciseCode = 'PUSH_UP'): CalculatedMotionMetrics {
    if (!landmarks || landmarks.length < 33) {
      return {
        elbowAngleLeft: 170,
        elbowAngleRight: 170,
        elbowFlareAngle: 50,
        kneeAngleLeft: 180,
        kneeAngleRight: 180,
        hipAngleLeft: 180,
        hipAngleRight: 180,
        spineAlignmentAngle: 180,
        depthRomPercentage: 0,
        shoulderLevelDelta: 0,
        hipElevationDelta: 0,
        isBodyVisible: false,
        visibilityScore: 0,
      };
    }

    // MediaPipe landmark key points
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    // Core body visibility
    const requiredPoints = [leftShoulder, rightShoulder, leftElbow, rightElbow, leftHip, rightHip];
    const visibleCount = requiredPoints.filter((p) => (p?.visibility ?? 0) > 0.5).length;
    const visibilityScore = visibleCount / requiredPoints.length;
    const isBodyVisible = visibilityScore >= 0.6;

    // 1. Elbow Angles (Shoulder -> Elbow -> Wrist)
    const elbowAngleLeft = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
    const elbowAngleRight = this.calculateAngle(rightShoulder, rightElbow, rightWrist);

    // 2. Elbow Flare Angle (Hip -> Shoulder -> Elbow)
    const leftFlare = this.calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightFlare = this.calculateAngle(rightHip, rightShoulder, rightElbow);
    const elbowFlareAngle = Math.round(((leftFlare + rightFlare) / 2) * 10) / 10;

    // 3. Knee Angles (Hip -> Knee -> Ankle)
    const kneeAngleLeft = this.calculateAngle(leftHip, leftKnee, leftAnkle);
    const kneeAngleRight = this.calculateAngle(rightHip, rightKnee, rightAnkle);

    // 4. Hip Angles (Shoulder -> Hip -> Knee)
    const hipAngleLeft = this.calculateAngle(leftShoulder, leftHip, leftKnee);
    const hipAngleRight = this.calculateAngle(rightShoulder, rightHip, rightKnee);

    // 5. Spine Alignment (Shoulder -> Hip -> Ankle)
    const spineLeft = this.calculateAngle(leftShoulder, leftHip, leftAnkle);
    const spineRight = this.calculateAngle(rightShoulder, rightHip, rightAnkle);
    const spineAlignmentAngle = Math.round(((spineLeft + spineRight) / 2) * 10) / 10;

    // 6. Depth ROM percentage
    let depthRomPercentage = 0;
    if (exerciseCode === 'PUSH_UP' || exerciseCode === 'DIP') {
      const activeElbow = Math.min(elbowAngleLeft, elbowAngleRight);
      // Top extension: ~165-175° (0% ROM), Full bottom depth: ~80-90° (100% ROM)
      const rom = ((170 - activeElbow) / (170 - 85)) * 100;
      depthRomPercentage = Math.max(0, Math.min(100, Math.round(rom)));
    } else if (exerciseCode === 'SQUAT') {
      const activeKnee = Math.min(kneeAngleLeft, kneeAngleRight);
      // Standing: ~175° (0% ROM), Parallel squat: ~85° (100% ROM)
      const rom = ((175 - activeKnee) / (175 - 85)) * 100;
      depthRomPercentage = Math.max(0, Math.min(100, Math.round(rom)));
    } else if (exerciseCode === 'PLANK') {
      depthRomPercentage = spineAlignmentAngle >= 165 ? 100 : 50;
    } else {
      const activeElbow = Math.min(elbowAngleLeft, elbowAngleRight);
      depthRomPercentage = Math.max(0, Math.min(100, Math.round(((170 - activeElbow) / 85) * 100)));
    }

    // 7. Shoulders level & Hip elevation deltas
    const shoulderLevelDelta = Math.abs((leftShoulder.y - rightShoulder.y) * 100);
    const hipElevationDelta = Math.abs((leftHip.y - rightHip.y) * 100);

    return {
      elbowAngleLeft,
      elbowAngleRight,
      elbowFlareAngle,
      kneeAngleLeft,
      kneeAngleRight,
      hipAngleLeft,
      hipAngleRight,
      spineAlignmentAngle,
      depthRomPercentage,
      shoulderLevelDelta,
      hipElevationDelta,
      isBodyVisible,
      visibilityScore,
    };
  }
}
