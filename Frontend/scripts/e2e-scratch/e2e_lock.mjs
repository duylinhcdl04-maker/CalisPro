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
const NEW_EMAIL = "e2e+newcoach@example.test";
const NEW_PASSWORD = "MatKhauMoi2026";

const getToken = () => evalJs("localStorage.getItem('calis_token')");
const grep = async (re) => ((await text()).split("\n").filter((l) => re.test(l)).join(" | ")).slice(0, 170) || "(không thấy)";

// 1) Admin tạo Coach
await go("/login", 1500); await setToken(adminToken); await go("/admin/coaches", 3000);
await clickText("Tạo tài khoản Coach"); await sleep(500);
await setValue("#coach-name", "Trần Khóa Thử"); await setValue("#coach-email", NEW_EMAIL); await sleep(300);
await clickText("Tạo và gửi email", "[role=dialog] button"); await sleep(3500);
const m = [...readFileSync(LOG, "utf8").matchAll(/\[MAIL log-only\] Coach account -> (\S+) \| mật khẩu tạm: (\S+) \|/g)].pop();
const TEMP = m[2];
log("tạo tài khoản:", m[1]);

// 2) Nhập sai 5 lần trên form đăng nhập
await setToken(null); await go("/login", 2000);
for (let i = 1; i <= 5; i++) {
  await setValue("#email", NEW_EMAIL); await setValue("#password", "sai-mat-khau-" + i);
  await clickText("Đăng nhập ngay"); await sleep(1500);
  log("lần sai", i, "->", await grep(/khóa|không chính xác/));
}
await shot("l1_login_locked.png");
await setValue("#email", NEW_EMAIL); await setValue("#password", TEMP); await clickText("Đăng nhập ngay"); await sleep(1800);
log("mật khẩu ĐÚNG khi đang khóa ->", await path(), "|", await grep(/khóa/));

// 3) Admin thấy bị khóa và mở khóa
await setToken(adminToken); await go("/admin/coaches", 3000); await shot("l2_admin_locked.png");
log("Admin thấy:", await grep(/khóa|Mở khóa/));
await clickText("Mở khóa"); await sleep(2500); await shot("l3_admin_unlocked.png");
log("sau Mở khóa:", await grep(/Chờ đăng nhập|đang bị khóa/i));

// 4) Coach đăng nhập được rồi bị Admin vô hiệu hóa
await setToken(null); await go("/login", 2000);
await setValue("#email", NEW_EMAIL); await setValue("#password", TEMP); await clickText("Đăng nhập ngay"); await sleep(3000);
log("Coach đăng nhập sau khi mở khóa ->", await path());
const coachToken = await getToken();
await setToken(adminToken); await go("/admin/coaches", 3000);
await clickText("Vô hiệu hóa"); await sleep(600); await shot("l4_admin_suspend_confirm.png");
await clickText("Xác nhận", "[role=dialog] button"); await sleep(2500); await shot("l5_admin_suspended.png");
log("sau Vô hiệu hóa:", await grep(/vô hiệu|Kích hoạt lại/i));
await setToken(coachToken); await go("/change-password", 3500);
log("Coach đang có token, sau khi bị vô hiệu hóa ->", await path(), "| token còn:", !!(await getToken()));
await setToken(null); await go("/login", 1500);
await setValue("#email", NEW_EMAIL); await setValue("#password", TEMP); await clickText("Đăng nhập ngay"); await sleep(1800);
log("đăng nhập lại khi bị vô hiệu hóa ->", await path(), "|", await grep(/vô hiệu/));
log("== LỖI CONSOLE (bỏ qua các phản hồi 4xx dự kiến) ==\n" + (consoleErrors.filter((e) => !/40[01]|Failed to load resource/.test(e)).join("\n") || "(không có)"));
ws.close(); edge.kill(); process.exit(0);
