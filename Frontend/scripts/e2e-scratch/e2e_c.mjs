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
const edge = spawn(EDGE, ["--headless=new", "--disable-gpu", "--remote-debugging-port=9333", `--user-data-dir=${join(OUT, "edge-profile")}`, "--no-first-run", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "about:blank"], { stdio: "ignore" });
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
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false });

const go = async (path, wait = 2500) => { await send("Page.navigate", { url: BASE + path }); await sleep(wait); };
const shot = async (name) => { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(join(OUT, name), Buffer.from(r.result.data, "base64")); };
const text = () => evalJs("document.body.innerText");
const path = () => evalJs("location.pathname");
const clickText = (label, scope = "button,a,label") => evalJs(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(scope)})].find(e => e.innerText && e.innerText.trim().startsWith(${JSON.stringify(label)})); if (!el) return false; el.click(); return true; })()`);
const setValue = (sel, v) => evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement; Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
const setToken = (t) => evalJs(t ? `localStorage.setItem('calis_token', ${JSON.stringify(t)})` : "localStorage.removeItem('calis_token')");
const log = (...a) => console.log(...a);
const STU = process.env.E2E_STU;
const stuToken = mint(STU, "e2e+student3@example.test", "USER");
const grep = async (re) => ((await text()).split("\n").filter((l) => re.test(l)).join(" | ")).slice(0, 300) || "(không thấy)";
// Chặn upload Cloudinary: KHÔNG gửi file thật ra ngoài, trả secure_url đúng thư mục để kiểm tra phần gắn video của backend
const intercepted = [];
await send("Fetch.enable", { patterns: [{ urlPattern: "https://api.cloudinary.com/*" }] });
ws.addEventListener("message", async (m) => {
  const d = JSON.parse(m.data);
  if (d.method !== "Fetch.requestPaused") return;
  const body = d.params.request.postData || "";
  const folder = /name="folder"\r\n\r\n([^\r]+)/.exec(body)?.[1], pid = /name="public_id"\r\n\r\n([^\r]+)/.exec(body)?.[1];
  const cloud = /v1_1\/([^/]+)\//.exec(d.params.request.url)?.[1];
  const fileLen = (/name="file"; filename="([^"]+)"/.exec(body) || [])[1];
  intercepted.push({ url: d.params.request.url, folder, pid, file: fileLen, bytes: body.length });
  const out = JSON.stringify({ secure_url: `https://res.cloudinary.com/${cloud}/video/upload/v1/${folder}/${pid}.webm` });
  await send("Fetch.fulfillRequest", { requestId: d.params.requestId, responseCode: 200, responseHeaders: [{ name: "Access-Control-Allow-Origin", value: "*" }, { name: "Content-Type", value: "application/json" }], body: Buffer.from(out).toString("base64") });
});
await go("/login", 1500); await setToken(stuToken);
await go("/assessment/periodic", 3500);
log("click start:", await clickText("Bắt đầu đo định kỳ")); await sleep(3500); await shot("c1_consent.png");
log("dialog:", await grep(/Ghi hình|không ghi âm|ngày|Đồng ý|Level 4/));
log("accept:", await clickText("Đồng ý ghi hình", "button")); await sleep(1500);
for (let i = 0; i < 70; i++) { const t = await text(); if (/Bắt đầu đo/.test(t) && !/Nghỉ thêm/.test(t)) break; await sleep(1000); }
log("begin:", await clickText("Bắt đầu đo", "button")); await sleep(9000); await shot("c2_recording.png");
log("recording:", await grep(/Đang ghi hình|Rep đúng/));
log("end:", await clickText("Kết thúc bài", "button")); await sleep(6000); await shot("c3_after.png");
log("after:", await grep(/video|Kết quả|Cần đo|đủ tin cậy|Level 4|Chưa tải/));
log("cloudinary requests:", JSON.stringify(intercepted));
log("== LỖI CONSOLE ==\n" + (consoleErrors.filter((e) => !/antd/.test(e)).join("\n") || "(không có)"));
ws.close(); edge.kill(); process.exit(0);
