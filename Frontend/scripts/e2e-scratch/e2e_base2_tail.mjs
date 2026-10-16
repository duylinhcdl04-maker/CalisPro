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
