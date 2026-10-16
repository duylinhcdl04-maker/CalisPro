// Kiểm tra bộ sinh khung xương tổng hợp: các góc dựng ra phải đúng giá trị dùng để đếm rep/giữ/đo góc. Chạy: npm run check:fakepose
import { build } from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const dir = mkdtempSync(join(tmpdir(), "fakepose-"));
const a = join(dir, "fake.mjs"), b = join(dir, "ang.mjs");
await build({ entryPoints: ["dev-tools/fakePose.ts"], bundle: true, format: "esm", outfile: a, logLevel: "silent" });
await build({ entryPoints: ["src/features/assessment-v2/angleMeasurement.ts"], bundle: true, format: "esm", outfile: b, logLevel: "silent" });
const { makeFakePose, REP_SPECS, HOLD_SPECS, ANGLE_TARGETS } = await import(pathToFileURL(a).href);
const { interiorAngle } = await import(pathToFileURL(b).href);
const AR = 16 / 9;
const ang = (lm, i, j, k) => interiorAngle(lm[i], lm[j], lm[k], AR);
const near = (x, y, tol, msg) => assert.ok(Math.abs(x - y) <= tol, `${msg}: kỳ vọng ${y}, được ${x}`);
let n = 0;
const t = (name, fn) => { fn(); n++; console.log("ok -", name); };

t("rep: góc chỉ số đi từ đỉnh+8 xuống đáy-5 rồi quay lại trong mỗi chu kỳ", () => {
  for (const [code, s] of Object.entries(REP_SPECS)) {
    const f = makeFakePose(code, { repMs: 2800, startDelayMs: 0, aspectRatio: AR });
    const idx = s.chain === "elbow" ? [11, 13, 15] : [23, 25, 27];
    const series = [];
    for (let ms = 0; ms <= 2800; ms += 50) series.push(ang(f(ms), ...idx));
    near(Math.max(...series), s.top + 8, 0.6, `${code} đỉnh`);
    near(Math.min(...series), s.bottom - 5, 0.6, `${code} đáy`);
    near(series[0], s.top + 8, 0.6, `${code} bắt đầu ở đỉnh`);
    near(series[series.length - 1], s.top + 8, 1.5, `${code} kết thúc ở đỉnh`);
  }
});

t("rep khuỷu: vai-hông-cổ chân thẳng hàng (không phát sinh lỗi thân)", () => {
  const f = makeFakePose("push-up", { startDelayMs: 0, aspectRatio: AR });
  for (const ms of [0, 700, 1300]) near(ang(f(ms), 11, 23, 27), 180, 0.5, "thẳng hàng");
});

t("giữ: góc chỉ số và góc gối đúng", () => {
  for (const [code, h] of Object.entries(HOLD_SPECS)) {
    const lm = makeFakePose(code, { aspectRatio: AR })(0);
    near(h.metric === "hip" ? ang(lm, 11, 23, 27) : ang(lm, 11, 13, 15), h.value, 0.6, code);
    near(ang(lm, 23, 25, 27), h.knee, 0.6, code + " gối");
  }
});

t("đo góc: ra đúng góc gập mục tiêu khi đã leo xong", () => {
  const flex = {
    "shoulder-flexion-test": (lm) => ang(lm, 23, 11, 15),
    "pike-fold-test": (lm) => 180 - ang(lm, 11, 23, 27),
    "overhead-squat-test": (lm) => 180 - ang(lm, 23, 25, 27),
  };
  for (const code of Object.keys(flex)) {
    const f = makeFakePose(code, { rampMs: 1000, startDelayMs: 0, aspectRatio: AR });
    f(0);
    near(flex[code](f(5000)), ANGLE_TARGETS[code], 1.2, code);
  }
});

t("tỉ lệ khung hình khác nhau vẫn cho cùng góc (không lệch ngưỡng đếm rep)", () => {
  for (const ar of [1, 4 / 3, 16 / 9, 21 / 9]) {
    const f = makeFakePose("push-up", { startDelayMs: 0, aspectRatio: ar });
    const s = []; for (let ms = 0; ms <= 2800; ms += 50) s.push(interiorAngle(...[11, 13, 15].map((i) => f(ms)[i]), ar));
    near(Math.max(...s), 168, 0.6, `ar=${ar} đỉnh`); near(Math.min(...s), 85, 0.6, `ar=${ar} đáy`);
  }
});

t("vắng mặt rồi xuất hiện; bài lạ thì không có người", () => {
  const f = makeFakePose("plank", { absentMs: 1000 });
  assert.equal(f(0), null);
  assert.equal(f(500), null);
  assert.ok(f(1500));
  assert.equal(makeFakePose("khong-ton-tai")(0), null);
});

rmSync(dir, { recursive: true, force: true });
console.log(`\n${n} nhóm kiểm tra đạt`);
