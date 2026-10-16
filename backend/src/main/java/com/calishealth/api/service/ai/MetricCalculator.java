package com.calishealth.api.service.ai;

import org.springframework.stereotype.Component;

@Component
public class MetricCalculator {

    /**
     * Calculates 2D / 3D joint angle between three points A (shoulder), B (elbow), C (wrist).
     * Returns angle in degrees [0..180].
     */
    public double calculateJointAngle(double ax, double ay, double bx, double by, double cx, double cy) {
        double v1x = ax - bx;
        double v1y = ay - by;
        double v2x = cx - bx;
        double v2y = cy - by;

        double dot = v1x * v2x + v1y * v2y;
        double mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
        double mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

        if (mag1 * mag2 == 0) return 180.0;
        double cosine = dot / (mag1 * mag2);
        cosine = Math.max(-1.0, Math.min(1.0, cosine));
        return Math.toDegrees(Math.acos(cosine));
    }

    /**
     * Calculates Spine Alignment angle: Ear/Shoulder - Hip - Ankle.
     * Straight body alignment should be close to 180 degrees.
     */
    public double calculateSpineAlignment(double shoulderX, double shoulderY, double hipX, double hipY, double ankleX, double ankleY) {
        return calculateJointAngle(shoulderX, shoulderY, hipX, hipY, ankleX, ankleY);
    }

    /**
     * Normalizes metric values based on body segment length.
     */
    public double normalizeDistance(double distPx, double bodyHeightPx) {
        if (bodyHeightPx <= 0) return distPx;
        return (distPx / bodyHeightPx) * 100.0;
    }
}
