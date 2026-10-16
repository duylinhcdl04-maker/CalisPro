/**
 * Bộ sinh khung xương TỔNG HỢP cho kiểm thử tự động (KHÔNG thuộc bản build chạy thật; chỉ được nạp vào trang thử qua CDP).
 * Mô hình 2D nhìn nghiêng: dựng 33 landmark sao cho các góc mà rule/đo góc quan tâm đúng bằng giá trị mong muốn.
 * Chứng minh được: cả chuỗi (phiên đo, backend, bậc thang, video...) chạy đúng khi có "người" làm đúng động tác.
 * KHÔNG chứng minh: MediaPipe nhận diện đúng người thật.
 */
export type Lm = { x: number; y: number; z: number; visibility: number };

const VIS = 0.95;
const P = (x: number, y: number): Lm => ({ x, y, z: 0, visibility: VIS });
const deg = (d: number) => (d * Math.PI) / 180;

export interface RepSpec { top: number; bottom: number }

/** Ngưỡng đếm rep của backend (MotionBenchmarkSpecs + Push-Up tham chiếu) để sinh chuyển động đủ biên độ. */
export const REP_SPECS: Record<string, RepSpec & { chain: "elbow" | "knee" }> = {
  "push-up": { top: 160, bottom: 90, chain: "elbow" },
  "incline-push-up": { top: 160, bottom: 100, chain: "elbow" },
  "dips": { top: 155, bottom: 95, chain: "elbow" },
  "pull-up": { top: 160, bottom: 85, chain: "elbow" },
  "australian-pull-up": { top: 160, bottom: 80, chain: "elbow" },
  "bodyweight-squat": { top: 165, bottom: 100, chain: "knee" },
  "assisted-squat": { top: 165, bottom: 115, chain: "knee" },
  "bulgarian-split-squat": { top: 160, bottom: 100, chain: "knee" },
  "shrimp-squat": { top: 160, bottom: 85, chain: "knee" },
  // bài bậc L3-L4 chưa có bản nháp rule nên chỉ dùng cho kiểm thử luồng: profile được cấu hình thủ công trên DB thử
  "muscle-up": { top: 160, bottom: 70, chain: "elbow" },
  "handstand-push-up": { top: 160, bottom: 90, chain: "elbow" },
};

/** Giữ tư thế: chỉ số đếm (hip = vai-hông-cổ chân; elbow = vai-khuỷu-cổ tay) và giá trị khi giữ đúng, cùng góc gối. */
export const HOLD_SPECS: Record<string, { metric: "hip" | "elbow"; value: number; knee: number }> = {
  "dead-hang": { metric: "elbow", value: 175, knee: 178 },
  "plank": { metric: "hip", value: 176, knee: 178 },
  "hollow-body-hold": { metric: "hip", value: 155, knee: 176 },
  "l-sit": { metric: "hip", value: 90, knee: 175 },
  // bài kỹ năng bậc L3-L4 chưa có bản nháp rule: chỉ dùng cho kiểm thử luồng (profile cấu hình thủ công trên DB thử)
  "handstand": { metric: "hip", value: 176, knee: 178 },
  "chest-to-wall-handstand": { metric: "hip", value: 176, knee: 178 },
};

/** Góc gập mục tiêu của 3 bài đo góc (độ; 0 = đứng thẳng hoặc tay buông). */
export const ANGLE_TARGETS: Record<string, number> = { "shoulder-flexion-test": 170, "pike-fold-test": 95, "overhead-squat-test": 125 };

function base(): Lm[] { return Array.from({ length: 33 }, () => P(0.5, 0.5)); }

/** Chuỗi khuỷu: vai-hông-cổ chân thẳng hàng, góc khuỷu 11-13-15 = elbow. */
function elbowPose(elbow: number): Lm[] {
  const lm = base();
  const S = P(0.3, 0.5), H = P(0.55, 0.58), A = P(0.8, 0.66);   // cùng độ dốc 0.32 nên thẳng hàng
  const E = P(S.x, S.y + 0.12), r = deg(elbow);
  const W = P(E.x + 0.12 * Math.sin(r), E.y - 0.12 * Math.cos(r));
  lm[7] = P(S.x - 0.03, S.y - 0.02); lm[11] = S; lm[13] = E; lm[15] = W; lm[23] = H; lm[25] = P(0.675, 0.62); lm[27] = A;
  return lm;
}

/** Chuỗi gối: góc 23-25-27 = knee; vai nằm trên hông. */
function kneePose(knee: number): Lm[] {
  const lm = base();
  const K = P(0.5, 0.7), H = P(K.x, K.y - 0.2), r = deg(knee);
  const A = P(K.x + 0.2 * Math.sin(r), K.y - 0.2 * Math.cos(r));
  lm[11] = P(H.x, H.y - 0.25); lm[7] = P(H.x, H.y - 0.3); lm[23] = H; lm[25] = K; lm[27] = A;
  return lm;
}

/** Tư thế giữ: góc hông (11-23-27) và gối (23-25-27) theo giá trị cho trước; góc khuỷu theo elbow. */
function holdPose(hip: number, knee: number, elbow: number): Lm[] {
  const lm = base();
  const H = P(0.5, 0.6), S = P(H.x, H.y - 0.25), D = 0.4, r = deg(hip);
  const A = P(H.x + D * Math.sin(r), H.y - D * Math.cos(r));
  // gối ở giữa đoạn hông-cổ chân, lệch vuông góc để đạt góc gối mong muốn
  const half = deg(knee) / 2, l = D / (2 * Math.sin(half)), off = l * Math.cos(half);
  const mx = (H.x + A.x) / 2, my = (H.y + A.y) / 2, ux = (A.x - H.x) / D, uy = (A.y - H.y) / D;
  const K = P(mx - uy * off, my + ux * off);
  const E = P(S.x, S.y + 0.12), re = deg(elbow);
  const W = P(E.x + 0.12 * Math.sin(re), E.y - 0.12 * Math.cos(re));
  lm[7] = P(S.x, S.y - 0.05); lm[11] = S; lm[13] = E; lm[15] = W; lm[23] = H; lm[25] = K; lm[27] = A;
  return lm;
}

function anglePose(code: string, flexion: number): Lm[] {
  const lm = base();
  const r = deg(flexion);
  if (code === "shoulder-flexion-test") {
    const H = P(0.5, 0.6), S = P(0.5, 0.4);
    lm[23] = H; lm[11] = S; lm[15] = P(S.x + 0.2 * Math.sin(r), S.y + 0.2 * Math.cos(r)); lm[27] = P(0.5, 0.95);
  } else if (code === "pike-fold-test") {
    const H = P(0.5, 0.6), A = P(0.5, 1.0), I = deg(180 - flexion);
    lm[23] = H; lm[27] = A; lm[11] = P(H.x + 0.25 * Math.sin(I), H.y + 0.25 * Math.cos(I)); lm[25] = P(0.5, 0.8);
  } else {
    const K = P(0.5, 0.7), A = P(0.5, 0.9);
    lm[25] = K; lm[27] = A; lm[23] = P(K.x + 0.2 * Math.sin(r), K.y - 0.2 * Math.cos(r)); lm[11] = P(0.5, 0.3);
  }
  return lm;
}

export interface FakePoseOptions {
  /** Thời gian một rep (ms). Mặc định 2800: lớn hơn min_rep_duration của mọi profile. */
  repMs?: number;
  /** Thời gian leo lên mục tiêu của bài đo góc (ms). */
  rampMs?: number;
  /** Sau lần gọi đầu tiên chờ bao lâu mới bắt đầu động tác (ms), để người dùng "vào tư thế". */
  startDelayMs?: number;
  /** Không có người trong khung cho tới thời điểm này (ms). */
  absentMs?: number;
  /** Tỉ lệ khung hình (rộng/cao) của video: toạ độ x chuẩn hoá theo chiều rộng nên góc thật = góc sau khi nhân x với tỉ lệ này. Mặc định 16/9. */
  aspectRatio?: number;
}

/** Trả về hàm (tMs: thời gian hiện tại) -> 33 landmark hoặc null (không thấy người). Gốc thời gian = lần gọi đầu tiên. */
export function makeFakePose(code: string, opts: FakePoseOptions = {}): (tMs: number) => Lm[] | null {
  const repMs = opts.repMs ?? 2800, rampMs = opts.rampMs ?? 3000, delay = opts.startDelayMs ?? 600, absent = opts.absentMs ?? 0;
  const ar = opts.aspectRatio ?? 16 / 9;
  // dựng theo toạ độ vuông rồi co x lại 1/ar quanh tâm: sau khi backend/đo góc nhân x với ar thì góc đúng như thiết kế
  const squeeze = (lm: Lm[] | null) => (lm ? lm.map((p) => ({ ...p, x: 0.5 + (p.x - 0.5) / ar })) : null);
  let t0: number | null = null;
  const frameAt = (tMs: number): Lm[] | null => {
    if (t0 === null) t0 = tMs;
    const t = tMs - t0;
    if (t < absent) return null;
    const rep = REP_SPECS[code];
    if (rep) {
      const f = Math.max(0, t - delay) / repMs;
      // đỉnh+8 -> đáy-5 -> đỉnh+8: nửa chu kỳ xuống, giữ nhẹ ở đáy, rồi lên
      const phase = f % 1, hi = rep.top + 8, lo = rep.bottom - 5;
      const tri = phase < 0.45 ? phase / 0.45 : phase < 0.55 ? 1 : 1 - (phase - 0.55) / 0.45;
      const ang = hi - (hi - lo) * (t < delay ? 0 : tri);
      return rep.chain === "elbow" ? elbowPose(ang) : kneePose(ang);
    }
    const hold = HOLD_SPECS[code];
    if (hold) return hold.metric === "hip" ? holdPose(hold.value, hold.knee, 175) : holdPose(178, hold.knee, hold.value);
    if (code in ANGLE_TARGETS) {
      const k = Math.min(1, Math.max(0, (t - delay) / rampMs));
      return anglePose(code, ANGLE_TARGETS[code] * k + Math.sin(t / 90) * 0.8 * k);
    }
    return null;
  };
  return (tMs: number) => squeeze(frameAt(tMs));
}
