// Leo staircase Baseline bằng API với số liệu tốt (đo hợp lệ, tin cậy) tới khi bước kế tiếp là bậc ≥ STOP_AT.
// Dùng để chuẩn bị trạng thái "đã qua L1-L3" mà không phải đứng đợi từng bài trên giao diện.
import { createHmac } from "node:crypto";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const h = b64({ alg: "HS256", typ: "JWT" }), p = b64({ sub: process.env.U, email: "e@x.test", role: "USER", iat: now, exp: now + 7200 });
const tok = `${h}.${p}.${createHmac("sha256", process.env.JWT).update(`${h}.${p}`).digest("base64url")}`;
const call = async (m, path, body) => {
  const r = await fetch("http://localhost:8099/api/v1" + path, { method: m, headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { raw: t, status: r.status }; }
};
const STOP_AT = Number(process.env.STOP_AT ?? 4);
const ANGLE = { "shoulder-flexion-test": 175, "pike-fold-test": 85, "overhead-squat-test": 130 };
let clock = Date.now() - 3 * 3600_000, seq = 0;

const s = await call("POST", "/assessments/baseline/start");
console.log("session", s.sessionId, "bước đầu", JSON.stringify(s.next));
let prog = await call("GET", `/assessments/baseline/${s.sessionId}/next`);
for (let i = 0; i < 60 && prog.outcome === "IN_PROGRESS" && prog.next && prog.next.level < STOP_AT; i++) {
  const st = prog.next, ex = st.exerciseCode, metric = st.metric;
  const startedAt = new Date(clock + 5000), endedAt = new Date(clock + 65000);
  clock += 70000;
  const req = {
    exerciseCode: ex, movementSessionId: 900_000_000 + (++seq) + Math.floor(Math.random() * 1000) * 1000, startedAt: startedAt.toISOString(), endedAt: endedAt.toISOString(),
    totalReps: metric === "VALID_REPS" ? 100 : null, validReps: metric === "VALID_REPS" ? 100 : null, holdSec: metric === "HOLD_SEC" ? 300 : null,
    angleDeg: metric === "ANGLE_DEG" ? ANGLE[ex] : null, formScore: 90, romScore: 85, majorViolations: 0, poseConfidenceAvg: 0.9, visibilityAvg: 0.9, trackedRatio: 0.95,
  };
  prog = await call("POST", `/assessments/baseline/${s.sessionId}/attempts`, req);
  if (prog.status || prog.raw) { console.log("LỖI", ex, JSON.stringify(prog).slice(0, 300)); break; }
  console.log(`L${st.level} ${ex} lần ${st.attemptNo} -> ${prog.lastAttempt?.measurementStatus} | outcome ${prog.outcome} | tiếp: ${prog.next ? `L${prog.next.level} ${prog.next.exerciseCode} (${prog.next.metric})` : "-"}`);
}
console.log("DỪNG:", JSON.stringify({ outcome: prog.outcome, next: prog.next, finalLevel: prog.finalLevel }));
