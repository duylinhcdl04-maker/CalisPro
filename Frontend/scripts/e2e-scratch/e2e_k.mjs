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
const edge = spawn(EDGE, ["--headless=new", "--disable-gpu", "--remote-debugging-port=9333", `--user-data-dir=${join(OUT, "edge-profile")}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
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
const COACH = process.env.E2E_COACH;
const grep = async (re) => ((await text()).split("\n").filter((l) => re.test(l)).join(" | ")).slice(0, 420) || "(không thấy)";
await go("/login", 1500); await setToken(mint(COACH, "e2e+coach9@example.test", "COACH"));
await go("/coach/safety-clearances", 3500); await shot("k1_list.png");
log("list:", await grep(/Học viên #|Chờ xác minh|Xem xét/));
log("open:", await clickText("Xem xét", "a")); await sleep(3000); await shot("k2_detail.png");
log("detail:", await grep(/Học Viên|H\?c|Tình trạng|Cờ đang|Triệu chứng|Đau\/chấn|Giới hạn|Hạn chế bài tải|Chấp thuận|Trạng thái mới|Không có hạn chế/));
// Từ chối không có lý do => nút bị khoá
log("chọn từ chối:", await clickText("Từ chối", "label")); await sleep(400);
log("gửi khi thiếu lý do disabled:", await evalJs(`[...document.querySelectorAll('button')].find(b => b.innerText.trim().startsWith('Gửi quyết định'))?.disabled`));
log("chọn chấp thuận:", await clickText("Chấp thuận gỡ/giảm hạn chế", "label")); await sleep(400);
log("giữ lại giới hạn vai:", await evalJs(`(() => { const l=[...document.querySelectorAll('label')].find(e=>e.innerText.trim()==='Hạn chế bài tải vùng vai'); if(!l) return false; l.click(); return true; })()`)); await sleep(300);
await shot("k3_grant_form.png");
log("gửi:", await clickText("Gửi quyết định", "button")); await sleep(800);
log("xác nhận:", await clickText("Xác nhận", "[role=dialog] button")); await sleep(3000); await shot("k4_granted.png");
log("sau chấp thuận:", await grep(/Đã chấp thuận|Kết quả xét duyệt|Trạng thái mới:|quyết định lúc/));
// yêu cầu thứ hai: từ chối kèm lý do
await go("/coach/safety-clearances", 3000);
log("danh sách còn:", await grep(/Học viên #/));
log("open2:", await clickText("Xem xét", "a")); await sleep(3000);
log("từ chối:", await clickText("Từ chối", "label")); await sleep(300);
log("lý do:", await setValue("textarea", "Cần giấy xác nhận của bác sĩ trước khi gỡ hạn chế.")); await sleep(300);
log("gửi2:", await clickText("Gửi quyết định", "button")); await sleep(800);
log("xác nhận2:", await clickText("Xác nhận", "[role=dialog] button")); await sleep(3000); await shot("k5_rejected.png");
log("sau từ chối:", await grep(/Đã từ chối|Kết quả xét duyệt|quyết định lúc|bác sĩ/));
log("== LỖI CONSOLE ==\n" + (consoleErrors.filter((e) => !/antd|Failed to load resource/.test(e)).join("\n") || "(không có)"));
ws.close(); edge.kill(); process.exit(0);
