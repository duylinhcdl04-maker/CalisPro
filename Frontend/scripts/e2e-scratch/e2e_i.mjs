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
const A = process.env.E2E_A, B = process.env.E2E_B;
const grep = async (re) => ((await text()).split("\n").filter((l) => re.test(l)).join(" | ")).slice(0, 420) || "(không thấy)";
// điền trang hiện tại: số theo nhãn, lựa chọn đơn/đa -> phương án đầu tiên nếu chưa chọn
const fillPage = () => evalJs(`(() => {
  const setNum = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true })); };
  let filled = 0;
  for (const fs of document.querySelectorAll('fieldset')) {
    const num = fs.querySelector('input[type=number]');
    if (num) { if (num.value === '') { const t = fs.innerText; setNum(num, /Tuổi/.test(t) ? 30 : /Chiều cao/.test(t) ? 175 : /Cân nặng/.test(t) ? 70 : 8); filled++; } continue; }
    const opts = [...fs.querySelectorAll('[role=radio],[role=checkbox]')];
    if (opts.length && !opts.some(o => o.getAttribute('aria-checked') === 'true')) { (/khó nhất bạn/.test(fs.innerText) ? opts[Math.min(2, opts.length - 1)] : opts[0]).click(); filled++; }
  }
  return filled; })()`);
const sections = () => evalJs(`(document.body.innerText.match(/PH[^ ]*N [0-9]+ . [0-9]+/i)||[''])[0]`);

// ---- B: chưa sàng lọc -> bị chặn kèm liên kết
await go("/login", 1500); await setToken(mint(B, "e2e+s11@example.test", "USER"));
await go("/assessment/initial", 3500);
log("B chặn:", await grep(/sàng lọc|Mở trang/));

// ---- A: đã sàng lọc -> làm khảo sát
await setToken(mint(A, "e2e+s10@example.test", "USER")); await go("/assessment/initial", 3500); await shot("i1_first.png");
log("A phần đầu:", await sections(), "|", await grep(/Hồ sơ cơ bản|Tuổi|Giới tính/));
log("A tiếp khi trống:", await clickText("Tiếp tục", "button")); await sleep(1500);
log("A bắt buộc:", await grep(/Câu này bắt buộc|chưa trả lời/));
let i = 0;
for (; i < 30; i++) {
  const sec = await sections();
  await fillPage(); await sleep(300);
  if (i === 99) {   // kiểm tra tiếp tục phiên: tải lại giữa chừng
    await clickText("Tiếp tục", "button"); await sleep(2500);
    log("trước khi tải lại:", await sections());
    await go("/assessment/initial", 3500);
    log("sau khi tải lại (tiếp tục đúng phần):", await sections());
    continue;
  }
  const done = await clickText("Hoàn tất và xem kết quả", "button");
  if (!done) await clickText("Tiếp tục", "button");
  await sleep(2500);
  const t = await text();
  if (/Level tạm thời/.test(t)) break;
  const err = await grep(/Không lưu|INVALID|bắt buộc|tối đa/);
  if (!/không thấy/.test(err)) log("trang", i + 1, sec, "lỗi?:", err);
}
await shot("i2_result.png");
log("kết quả:", await grep(/Level tạm thời|Năng lực theo nhóm|Đẩy|Kéo|Chân|Thân giữa|Kỹ năng|Linh hoạt|dữ liệu|Cần lưu ý|chưa phải level/));
log("== LỖI CONSOLE ==\n" + (consoleErrors.filter((e) => !/antd|Failed to load resource/.test(e)).join("\n") || "(không có)"));
ws.close(); edge.kill(); process.exit(0);
