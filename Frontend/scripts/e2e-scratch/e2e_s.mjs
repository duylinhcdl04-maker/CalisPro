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
const grep = async (re) => ((await text()).split("\n").filter((l) => re.test(l)).join(" | ")).slice(0, 380) || "(không thấy)";
const clickOpt = (label) => evalJs(`(() => { const el = [...document.querySelectorAll('[role=radio],[role=checkbox]')].find(e => e.innerText.trim() === ${JSON.stringify(label)} && !e.dataset.done); if (!el) return false; el.click(); return true; })()`);
// radio theo câu: bấm nút "Không" của câu thứ i (mỗi câu YES/NO có 2 nút)
const clickNth = (label, n) => evalJs(`(() => { const els = [...document.querySelectorAll('[role=radio]')].filter(e => e.innerText.trim() === ${JSON.stringify(label)}); if (!els[${n}]) return false; els[${n}].click(); return true; })()`);

// ---- A: chưa sàng lọc -> tự mở bảng câu hỏi; thử gửi thiếu câu trả lời
await go("/login", 1500); await setToken(mint(A, "e2e+s5@example.test", "USER"));
await go("/safety-screening", 3500); await shot("s1_form.png");
log("A form:", await grep(/Sàng lọc an toàn|Bác sĩ|Xem kết quả|bắt buộc/));
log("A submit thiếu:", await clickText("Xem kết quả", "button")); await sleep(1800); await shot("s2_missing.png");
log("A missing:", await grep(/Câu này bắt buộc|chưa trả lời/));
for (let i = 0; i < 7; i++) await clickNth("Không", i);
log("A không có:", await clickOpt("Không có")); await sleep(300);
log("A submit:", await clickText("Xem kết quả", "button")); await sleep(2500); await shot("s3_cleared.png");
log("A result:", await grep(/Không có hạn chế|Có hiệu lực|Sàng lọc lại|đọc khuyến nghị/));

// ---- B: có triệu chứng + đau vai -> REVIEW_REQUIRED
await setToken(mint(B, "e2e+s6@example.test", "USER")); await go("/safety-screening", 3500);
for (let i = 0; i < 7; i++) await clickNth(i === 1 ? "Có" : "Không", i);   // Q2: đau ngực khi vận động = Có
log("B vai:", await clickOpt("Vai")); await sleep(300);
log("B submit:", await clickText("Xem kết quả", "button")); await sleep(2500); await shot("s4_review.png");
log("B result:", await grep(/Nên tham khảo|Điểm cần lưu ý|Triệu chứng|đau\/chấn thương|Giới hạn|Không có bài|Giới hạn cường độ|Hạn chế bài tải|không phải chẩn đoán/i));
log("B ack:", await clickText("Tôi đã đọc khuyến nghị", "button")); await sleep(2000);
log("B sau ack:", await grep(/Bạn đã xác nhận|đọc khuyến nghị/));
log("B nhờ Coach:", await clickText("Nhờ Huấn luyện viên xác minh", "button")); await sleep(2500); await shot("s5_clearance.png");
log("B clearance:", await grep(/Yêu cầu xác minh|Đang chờ|Nhờ Huấn/));

// ---- C: trang đo định kỳ khi chưa sàng lọc / chưa xác nhận -> dẫn sang sàng lọc
const C = process.env.E2E_C;
await setToken(mint(C, "e2e+s7@example.test", "USER")); await go("/assessment/periodic", 3500);
log("C start:", await clickText("Bắt đầu đo định kỳ", "button")); await sleep(2500); await shot("s6_block.png");
log("C block:", await grep(/sàng lọc|Mở trang/));
log("== LỖI CONSOLE ==\n" + (consoleErrors.filter((e) => !/antd|40[0-9]|Failed to load resource/.test(e)).join("\n") || "(không có)"));
ws.close(); edge.kill(); process.exit(0);
