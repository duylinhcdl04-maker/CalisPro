import type { NormalizedLandmark } from './poseTypes';
import { POSE_CONNECTIONS } from './poseTypes';

export interface SkeletonDrawOptions {
  canvas: HTMLCanvasElement;
  landmarks: NormalizedLandmark[];
  videoWidth: number;
  videoHeight: number;
  highlightJoints?: { [index: number]: 'GOOD' | 'WARNING' | 'ERROR' };
  activeAngles?: { index: number; label: string; angle: number; status: 'GOOD' | 'WARNING' | 'ERROR' }[];
}

export class SkeletonDrawer {
  public static draw(options: SkeletonDrawOptions): void {
    const { canvas, landmarks, videoWidth, videoHeight, highlightJoints = {}, activeAngles = [] } = options;
    const ctx = canvas.getContext('2d');
    if (!ctx || !landmarks || landmarks.length === 0) return;

    // Match canvas dimensions to video
    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Skeleton Lines
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];

      if (!p1 || !p2 || (p1.visibility ?? 1) < 0.35 || (p2.visibility ?? 1) < 0.35) {
        continue;
      }

      const status1 = highlightJoints[startIdx] || 'GOOD';
      const status2 = highlightJoints[endIdx] || 'GOOD';
      const isError = status1 === 'ERROR' || status2 === 'ERROR';
      const isWarning = status1 === 'WARNING' || status2 === 'WARNING';

      ctx.beginPath();
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);

      if (isError) {
        ctx.strokeStyle = '#f43f5e'; // Rose 500
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 8;
      } else if (isWarning) {
        ctx.strokeStyle = '#f59e0b'; // Amber 500
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 6;
      } else {
        ctx.strokeStyle = '#10b981'; // Emerald 500
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 4;
      }

      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }

    // 2. Draw Landmark Joint Dots
    landmarks.forEach((p, idx) => {
      if (!p || (p.visibility ?? 1) < 0.35) return;

      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      const status = highlightJoints[idx] || 'GOOD';

      const isKeyJoint = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(idx);
      const radius = isKeyJoint ? 6.5 : 3.5;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);

      if (status === 'ERROR') {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e11d48';
      } else if (status === 'WARNING') {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#d97706';
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#059669';
      }

      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();

      // Outer glow pulse for key joints
      if (isKeyJoint) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 3.5, 0, 2 * Math.PI);
        ctx.strokeStyle = status === 'ERROR' ? 'rgba(225, 29, 72, 0.4)' : status === 'WARNING' ? 'rgba(217, 119, 6, 0.4)' : 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    // 3. Draw Angle Badges directly near joints
    activeAngles.forEach((item) => {
      const p = landmarks[item.index];
      if (!p || (p.visibility ?? 1) < 0.4) return;

      const x = p.x * canvas.width + 12;
      const y = p.y * canvas.height - 8;

      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      const text = `${item.label}: ${item.angle}°`;
      const textWidth = ctx.measureText(text).width;

      // Badge background pill
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(x - 4, y - 12, textWidth + 8, 16, 4);
      ctx.fill();

      // Pill border
      ctx.strokeStyle = item.status === 'ERROR' ? '#f43f5e' : item.status === 'WARNING' ? '#f59e0b' : '#10b981';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text
      ctx.fillStyle = item.status === 'ERROR' ? '#fecdd3' : item.status === 'WARNING' ? '#fef3c7' : '#d1fae5';
      ctx.fillText(text, x, y);
    });
  }
}
