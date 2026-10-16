// Kiểm tra toán đo góc linh hoạt (angleMeasurement.ts) bằng khung xương tổng hợp. Chạy: npm run check:angles
import { build } from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const dir = mkdtempSync(join(tmpdir(), "angles-"));
const out = join(dir, "angleMeasurement.mjs");
await build({ entryPoints: ["src/features/assessment-v2/angleMeasurement.ts"], bundle: true, format: "esm", outfile: out, logLevel: "silent" });
const { interiorAngle, AngleTracker, ANGLE_TESTS, isAngleTest, movingMedian } = await import(pathToFileURL(out).href);

const near = (a, b, tol = 0.5, msg = "") => assert.ok(Math.abs(a - b) <= tol, `${msg} kỳ vọng ${b}, được ${a}`);
const P = (x, y, v = 0.95) => ({ x, y, z: 0, visibility: v });
const body = (over = {}) => {
  const lm = Array.from({ length: 33 }, () => P(0.5, 0.5));
  for (const [i, p] of Object.entries(over)) lm[Number(i)] = p;
  return lm;
};

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("ok -", name); };

t("góc trong: vuông, thẳng, gập sát", () => {
  near(interiorAngle(P(0, 1), P(0, 0), P(1, 0)), 90, 1e-6);
  near(interiorAngle(P(0, 1), P(0, 0), P(0, -1)), 180, 1e-6);
  near(interiorAngle(P(0, 1), P(0, 0), P(0, 2)), 0, 1e-6);
  assert.ok(Number.isNaN(interiorAngle(P(0, 0), P(0, 0), P(1, 1))), "điểm trùng đỉnh phải ra NaN");
});

t("gập vai: tay buông = 0°, ngang = 90°, giơ thẳng qua đầu = 180°", () => {
  const f = (wrist) => { const tr = new AngleTracker("shoulder-flexion-test"); for (let i = 0; i < 12; i++) tr.addFrame(body({ 23: P(0.5, 0.6), 11: P(0.5, 0.4), 15: wrist })); return tr.result().angleDeg; };
  near(f(P(0.5, 0.65)), 0); near(f(P(0.7, 0.4)), 90); near(f(P(0.5, 0.1)), 180);
});

t("gập hông (pike): đứng thẳng = 0°, gập sâu thì lớn", () => {
  const f = (shoulder) => { const tr = new AngleTracker("pike-fold-test"); for (let i = 0; i < 12; i++) tr.addFrame(body({ 11: shoulder, 23: P(0.5, 0.55), 27: P(0.5, 0.95) })); return tr.result().angleDeg; };
  near(f(P(0.5, 0.3)), 0);
  near(f(P(0.8, 0.6)), 99.5, 1);       // đã tính tay: góc trong ≈ 80,5° ⇒ gập ≈ 99,5°
  near(f(P(0.5, 0.9)), 180 - Math.round(0), 20, "gập gần sát");  // thân sát chân: góc lớn
});

t("gập gối (squat): dựng theo góc gập φ, đo lại đúng φ", () => {
  for (const phi of [0, 45, 90, 135]) {
    const r = (phi * Math.PI) / 180, K = P(0.5, 0.7), A = P(0.5, 0.9), H = P(0.5 + 0.2 * Math.sin(r), 0.7 - 0.2 * Math.cos(r));
    const tr = new AngleTracker("overhead-squat-test");
    for (let i = 0; i < 12; i++) tr.addFrame(body({ 23: H, 25: K, 27: A }));
    near(tr.result().angleDeg, phi, 0.2, `φ=${phi}`);
  }
});

t("chống nhiễu: một khung đột biến không tạo góc cao giả", () => {
  const tr = new AngleTracker("overhead-squat-test");
  const frame = (phi) => { const r = (phi * Math.PI) / 180; return body({ 23: P(0.5 + 0.2 * Math.sin(r), 0.7 - 0.2 * Math.cos(r)), 25: P(0.5, 0.7), 27: P(0.5, 0.9) }); };
  for (let i = 0; i < 10; i++) tr.addFrame(frame(100));
  tr.addFrame(frame(170));                 // spike
  for (let i = 0; i < 10; i++) tr.addFrame(frame(100));
  near(tr.result().angleDeg, 100, 1, "spike phải bị lọc");
});

t("khớp bị che bị loại khỏi góc nhưng làm giảm tỉ lệ theo dõi; không có khung thì không có góc", () => {
  const tr = new AngleTracker("shoulder-flexion-test", 0.5);
  for (let i = 0; i < 6; i++) tr.addFrame(body({ 23: P(0.5, 0.6), 11: P(0.5, 0.4), 15: P(0.5, 0.1) }));
  for (let i = 0; i < 6; i++) tr.addFrame(body({ 23: P(0.5, 0.6), 11: P(0.5, 0.4), 15: P(0.5, 0.1, 0.2) }));   // cổ tay bị che
  const r = tr.result();
  near(r.trackedRatio, 0.5, 1e-9); near(r.angleDeg, 180, 0.1);
  const empty = new AngleTracker("pike-fold-test"); empty.addFrame(null); empty.addFrame(body({ 11: P(0.5, 0.3, 0.1) }));
  assert.equal(empty.result().angleDeg, null);
  assert.equal(empty.result().trackedRatio, 0);
});

t("danh mục bài góc khớp với backend", () => {
  assert.deepEqual(Object.keys(ANGLE_TESTS).sort(), ["overhead-squat-test", "pike-fold-test", "shoulder-flexion-test"]);
  assert.ok(isAngleTest("pike-fold-test") && !isAngleTest("push-up"));
  assert.deepEqual(movingMedian([1, 2], 5), []);
});

rmSync(dir, { recursive: true, force: true });
console.log(`\n${n} nhóm kiểm tra đạt`);
