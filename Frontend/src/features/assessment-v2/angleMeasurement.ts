import type { NormalizedLandmark } from "../ai-motion/mediapipe/poseTypes";

/**
 * Đo góc linh hoạt (bài ANGLE_DEG) từ khung xương, nhìn nghiêng (SIDE), landmark bên trái. Quy ước của backend (§33.1): "góc gập",
 * đứng thẳng = 0°. Điểm bài = min(100, góc / mục tiêu × 100) nên góc càng lớn càng tốt.
 *  - shoulder-flexion-test: góc giữa thân và cánh tay giơ lên = góc hông-vai-cổ tay (tay buông = 0°, giơ thẳng qua đầu = 180°).
 *  - pike-fold-test: góc gập hông = 180° − góc vai-hông-cổ chân (đứng thẳng = 0°, gập sâu thì lớn).
 *  - overhead-squat-test: góc gập gối = 180° − góc hông-gối-cổ chân (đứng thẳng = 0°, squat sâu thì lớn).
 * Không đo được gót có nhấc hay không (backend chỉ ghi nhận lỗi chất lượng khi có).
 */

export type AngleTestCode = "shoulder-flexion-test" | "pike-fold-test" | "overhead-squat-test";

const L = { SHOULDER: 11, ELBOW: 13, WRIST: 15, HIP: 23, KNEE: 25, ANKLE: 27 } as const;

interface Spec {
  /** Ba landmark (a, đỉnh, c) của góc trong. */
  points: [number, number, number];
  /** Từ góc trong sang góc gập báo cho backend. */
  toFlexion: (interior: number) => number;
  instruction: string;
}

export const ANGLE_TESTS: Record<AngleTestCode, Spec> = {
  "shoulder-flexion-test": {
    points: [L.HIP, L.SHOULDER, L.WRIST],
    toFlexion: (a) => a,
    instruction: "Đứng nghiêng người về phía camera (bên trái hướng vào camera), áp lưng vào tường, giơ thẳng tay lên qua đầu hết mức có thể mà không ưỡn lưng, giữ 2 giây.",
  },
  "pike-fold-test": {
    points: [L.SHOULDER, L.HIP, L.ANKLE],
    toFlexion: (a) => 180 - a,
    instruction: "Đứng nghiêng người, hai gối thẳng, cúi người gập từ hông xuống thấp hết mức, tay buông thả, giữ 2 giây.",
  },
  "overhead-squat-test": {
    points: [L.HIP, L.KNEE, L.ANKLE],
    toFlexion: (a) => 180 - a,
    instruction: "Đứng nghiêng người, hai tay giơ thẳng qua đầu, squat xuống sâu hết mức mà gót chân vẫn chạm sàn, giữ 2 giây.",
  },
};

export function isAngleTest(code: string): code is AngleTestCode {
  return code in ANGLE_TESTS;
}

/** Góc trong (độ, 0..180) tại đỉnh b của đoạn a-b-c, trong mặt phẳng ảnh (bỏ z: nhìn nghiêng). */
export function interiorAngle(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark, aspectRatio = 1): number {
  const v1x = (a.x - b.x) * aspectRatio, v1y = a.y - b.y;
  const v2x = (c.x - b.x) * aspectRatio, v2y = c.y - b.y;
  const n1 = Math.hypot(v1x, v1y), n2 = Math.hypot(v2x, v2y);
  if (n1 < 1e-6 || n2 < 1e-6) return NaN;
  const cos = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (n1 * n2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export interface AngleMeasurement {
  /** Góc gập tốt nhất đạt được và giữ được (độ), null khi không có khung đủ tin cậy. */
  angleDeg: number | null;
  poseConfidenceAvg: number;
  visibilityAvg: number;
  /** Tỉ lệ khung đo được trên tổng số khung đã xử lý. */
  trackedRatio: number;
  samples: number;
}

/**
 * Gom các khung trong lúc đo. Để chống nhiễu từng khung, lấy trung vị trượt (cửa sổ 5) rồi chọn GIÁ TRỊ LỚN NHẤT của chuỗi đã làm mượt:
 * một khung sai lẻ không thể tạo ra góc cao giả, còn tư thế giữ được thì vẫn được ghi nhận.
 * Khung có khớp bị che (visibility dưới ngưỡng) không tính vào góc nhưng tính vào trackedRatio.
 */
export class AngleTracker {
  private readonly spec: Spec;
  private series: number[] = [];
  private frames = 0;
  private visSum = 0;
  private visCount = 0;
  private confSum = 0;

  constructor(code: AngleTestCode, private readonly minVisibility = 0.5, private readonly aspectRatio = 1) {
    this.spec = ANGLE_TESTS[code];
  }

  /** landmarks = 33 điểm của một khung; null/rỗng = không thấy người. */
  addFrame(landmarks: NormalizedLandmark[] | null): void {
    this.frames++;
    if (!landmarks || landmarks.length < 33) return;
    const pts = this.spec.points.map((i) => landmarks[i]);
    const vis = pts.map((p) => p.visibility ?? 0);
    const minVis = Math.min(...vis);
    this.visSum += vis.reduce((a, b) => a + b, 0) / vis.length;
    this.visCount++;
    this.confSum += minVis;
    if (minVis < this.minVisibility) return;
    const interior = interiorAngle(pts[0], pts[1], pts[2], this.aspectRatio);
    if (Number.isNaN(interior)) return;
    this.series.push(this.spec.toFlexion(interior));
  }

  result(): AngleMeasurement {
    const smoothed = movingMedian(this.series, 5);
    const best = smoothed.length ? Math.max(...smoothed) : null;
    return {
      angleDeg: best === null ? null : Math.round(best * 10) / 10,
      poseConfidenceAvg: this.visCount ? this.confSum / this.visCount : 0,
      visibilityAvg: this.visCount ? this.visSum / this.visCount : 0,
      trackedRatio: this.frames ? this.series.length / this.frames : 0,
      samples: this.series.length,
    };
  }

  /** Góc hiện tại (khung gần nhất, đã làm mượt nhẹ) để hiển thị khi đang đo. */
  live(): number | null {
    const tail = this.series.slice(-5);
    if (!tail.length) return null;
    const s = [...tail].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }
}

export function movingMedian(values: number[], window: number): number[] {
  if (values.length < window) return values.length >= 3 ? [median(values)] : [];
  const out: number[] = [];
  for (let i = 0; i + window <= values.length; i++) out.push(median(values.slice(i, i + window)));
  return out;
}

function median(v: number[]): number {
  const s = [...v].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
