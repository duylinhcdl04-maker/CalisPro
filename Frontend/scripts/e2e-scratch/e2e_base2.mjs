import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = process.env.E2E_OUT;
const ADMIN_ID = process.env.E2E_ADMIN_ID;
const LOG = process.env.E2E_LOG;
const BASE = "http://localhost:5199";
mkdirSync(OUT, { recursive: true });

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function mint(sub, email, role) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ sub, email, role, iat: now, exp: now + 3600 });
  return `${head}.${body}.${createHmac("sha256", process.env.E2E_JWT_SECRET).update(`${head}.${body}`).digest("base64url")}`;
}
const adminToken = mint(ADMIN_ID, "e2e+admin@example.test", "ADMIN");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const edge = spawn(EDGE, ["--headless=new", "--disable-gpu", "--remote-debugging-port=9333", `--user-data-dir=${join(OUT, "edge-profile")}`, "--no-first-run", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function connect() {
  for (let i = 0; i < 40; i++) {
    try { const l = await (await fetch("http://127.0.0.1:9333/json")).json(); const p = l.find((t) => t.type === "page"); if (p) return p.webSocketDebuggerUrl; } catch { /* chờ */ }
    await sleep(500);
  }
  throw new Error("Không kết nối được Edge");
}
const ws = new WebSocket(await connect());
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const consoleErrors = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 250));
  if (msg.method === "Runtime.exceptionThrown") consoleErrors.push("EXC " + (msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text).slice(0, 250));
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Page.enable"); await send("Runtime.enable"); await send("Emulation.setFocusEmulationEnabled", { enabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false });

const go = async (path, wait = 2500) => { await send("Page.navigate", { url: BASE + path }); await sleep(wait); };
const shot = async (name) => { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(join(OUT, name), Buffer.from(r.result.data, "base64")); };
const text = () => evalJs("document.body.innerText");
const path = () => evalJs("location.pathname");
const clickText = (label, scope = "button,a,label") => evalJs(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(scope)})].find(e => e.innerText && e.innerText.trim().startsWith(${JSON.stringify(label)})); if (!el) return false; el.click(); return true; })()`);
const setValue = (sel, v) => evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement; Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
const setToken = (t) => evalJs(t ? `localStorage.setItem('calis_token', ${JSON.stringify(t)})` : "localStorage.removeItem('calis_token')");
const log = (...a) => console.log(...a);
const U = process.env.E2E_A;
const FAKE_JS = readFileSync(process.env.E2E_FAKE, "utf8");
const grep = async (re) => ((await text()).split("\n").filter((l) => re.test(l)).join(" | ")).slice(0, 400) || "(không thấy)";
await send("Page.addScriptToEvaluateOnNewDocument", { source: FAKE_JS });
const setFake = (code, opts = {}) => evalJs(`window.__fakePose = FakePose.makeFakePose(${JSON.stringify(code)}, ${JSON.stringify(opts)}); 1`);
const api = (method, path) => evalJs(`fetch('/api/v1${path}', { method: '${method}', headers: { Authorization: 'Bearer ' + localStorage.getItem('calis_token') } }).then(r => r.json())`);

// Chặn upload Cloudinary: không gửi file thật ra ngoài; trả secure_url đúng thư mục để backend kiểm tra và gắn video
const uploads = [];
const field = (body, name) => { const k = `name="${name}"`; const i = body.indexOf(k); if (i < 0) return null; const s = body.indexOf("\r\n\r\n", i) + 4; return body.slice(s, body.indexOf("\r\n", s)); };
await send("Fetch.enable", { patterns: [{ urlPattern: "https://api.cloudinary.com/*" }] });
ws.addEventListener("message", async (m) => {
  const d = JSON.parse(m.data);
  if (d.method !== "Fetch.requestPaused") return;
  const body = d.params.request.postData || "";
  const folder = field(body, "folder"), pid = field(body, "public_id");
  const cloud = d.params.request.url.split("/v1_1/")[1].split("/")[0];
  uploads.push({ folder, pid, bytes: body.length });
  const out = JSON.stringify({ secure_url: `https://res.cloudinary.com/${cloud}/video/upload/v1/${folder}/${pid}.webm` });
  await send("Fetch.fulfillRequest", { requestId: d.params.requestId, responseCode: 200, responseHeaders: [{ name: "Access-Control-Allow-Origin", value: "*" }, { name: "Content-Type", value: "application/json" }], body: Buffer.from(out).toString("base64") });
});

const token = mint(U, "e2e+b@example.test", "USER");
const CONSENT = process.env.E2E_CONSENT !== "no";
await go("/login", 1500); await setToken(token);
await go("/assessment/baseline", 3500);
log("start:", await clickText("Bắt đầu bài đo", "button")); await sleep(3500);
const started = await api("POST", "/assessments/baseline/start");
const sid = started.sessionId;
log("session:", sid, "bước đầu:", JSON.stringify(started.next));

const REPS_BY = { "push-up": 22, "bodyweight-squat": 32, "dips": 17, "pull-up": 13, "muscle-up": 4, "handstand-push-up": 6 };
const HOLD_BY = { "l-sit": 20, "plank": 33, "dead-hang": 33 };
const repsFor = (c) => REPS_BY[c] ?? 12, holdFor = (c) => HOLD_BY[c] ?? 33;

let finalProgress = null;
for (let i = 0; i < 40; i++) {
  const prog = await api("GET", `/assessments/baseline/${sid}/next`);
  if (prog.outcome !== "IN_PROGRESS" || !prog.next) { finalProgress = prog; break; }
  const st = prog.next;
  const t0 = await text();
  if (/Ghi hình bài test để Coach/.test(t0)) {
    log("   >> hộp thoại đồng ý hiện ở bậc", st.level, "|", CONSENT ? "đồng ý" : "từ chối");
    await shot(`base_consent_L${st.level}.png`);
    await clickText(CONSENT ? "Đồng ý ghi hình" : "Không đồng ý", "button"); await sleep(1200);
  }
  await setFake(st.exerciseCode, { repMs: 2300, rampMs: 2500, startDelayMs: 500 });
  for (let k = 0; k < 90; k++) { const t = await text(); if (/Bắt đầu đo/.test(t) && !/Nghỉ thêm/.test(t)) break; await sleep(1000); }
  await clickText("Bắt đầu đo", "button");
  const dur = st.metric === "ANGLE_DEG" ? 7000 : st.metric === "HOLD_SEC" ? holdFor(st.exerciseCode) * 1000 : (repsFor(st.exerciseCode) * 2300 + 1500);
  await sleep(dur);
  await clickText("Kết thúc bài", "button");
  await sleep(7000);
  const after = await api("GET", `/assessments/baseline/${sid}/next`);
  log(`#${i + 1} L${st.level} ${st.exerciseCode} (${st.metric}, lần ${st.attemptNo}) -> outcome ${after.outcome} ${after.finalLevel ?? ""} | tiếp: ${after.next ? `L${after.next.level} ${after.next.exerciseCode}` : "-"} | uploads=${uploads.length}`);
  if (after.outcome !== "IN_PROGRESS") { finalProgress = after; break; }
}
await shot("base_result.png");
await sleep(4000);
log("uploads Cloudinary (đã chặn):", JSON.stringify(uploads));
log("KẾT QUẢ:", JSON.stringify({ outcome: finalProgress?.outcome, finalLevel: finalProgress?.finalLevel, reason: finalProgress?.reasonCode, l4: finalProgress?.l4Review, overall: finalProgress?.overallScore, retestAfter: finalProgress?.retestAfter }));
log("trang:", await grep(/Level |Cần đo lại|Kết quả|Huấn luyện viên|video/));
log("== LỖI CONSOLE ==\n" + (consoleErrors.filter((e) => !/antd|Failed to load resource/.test(e)).join("\n") || "(không có)"));
ws.close(); edge.kill(); process.exit(0);
