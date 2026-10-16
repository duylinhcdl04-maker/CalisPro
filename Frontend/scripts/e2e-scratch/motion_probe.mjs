import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
const src = readFileSync(process.env.FAKE, "utf8");
const FakePose = new Function(src + "; return FakePose;")();
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const h = b64({ alg: "HS256", typ: "JWT" }), p = b64({ sub: process.env.U, email: "e@x.test", role: "USER", iat: now, exp: now + 3600 });
const tok = `${h}.${p}.${createHmac("sha256", process.env.JWT).update(`${h}.${p}`).digest("base64url")}`;
const call = async (m, path, body) => (await fetch("http://localhost:8099/api/v1" + path, { method: m, headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })).json();
const code = process.env.CODE, exId = Number(process.env.EX), ar = Number(process.env.AR ?? 1.333);
const s = await call("POST", "/motion/sessions", { exerciseId: exId, context: "TRAINING" });
console.log("start:", JSON.stringify(s).slice(0, 200));
const gen = FakePose.makeFakePose(code, { repMs: 2300, startDelayMs: 500 });
let t = 1000, batch = [], last;
for (let i = 0; i < Number(process.env.FRAMES ?? 400); i++, t += 66) {
  const lm = gen(t);
  batch.push({ t, l: lm ? lm.map((q) => [q.x, q.y, q.z, q.visibility]) : [] });
  if (batch.length >= 6) { last = await call("POST", `/motion/sessions/${s.sessionId}/frames`, { frames: batch, aspectRatio: ar }); batch = []; }
}
console.log("last batch:", JSON.stringify({ phase: last.phase, repCount: last.repCount, validReps: last.validReps }));
console.log("finish:", JSON.stringify(await call("POST", `/motion/sessions/${s.sessionId}/finish`)).slice(0, 400));
