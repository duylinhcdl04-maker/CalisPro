/**
 * Âm báo khi có thông báo mới. Tự tạo bằng Web Audio (hai nốt ngắn), không cần file âm thanh.
 * Trình duyệt chỉ cho phát tiếng sau khi người dùng đã tương tác với trang ít nhất một lần, nên AudioContext được mở khóa ở lần bấm/phím đầu tiên;
 * nếu chưa mở khóa kịp thì tin vẫn hiện (toast, chuông), chỉ không có tiếng.
 */
const KEY = "calis_notification_sound";
const MIN_GAP_MS = 1200;

let ctx: AudioContext | null = null;
let lastPlayed = 0;
let unlockInstalled = false;

export function isSoundEnabled(): boolean {
  try { return localStorage.getItem(KEY) !== "off"; } catch { return true; }
}

export function setSoundEnabled(on: boolean): void {
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* không lưu được thì dùng mặc định */ }
}

function audio(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/** Gọi một lần khi ứng dụng khởi động: mở khóa âm thanh ở lần tương tác đầu tiên của người dùng. */
export function installAudioUnlock(): void {
  if (unlockInstalled) return;
  unlockInstalled = true;
  const unlock = () => {
    const c = audio();
    if (c && c.state === "suspended") void c.resume();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

function tone(c: AudioContext, freq: number, start: number, length: number): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

/** Phát âm báo (nếu người dùng chưa tắt). Trả về true nếu đã phát. */
export function playNotificationSound(force = false): boolean {
  if (!force && !isSoundEnabled()) return false;
  const now = Date.now();
  if (!force && now - lastPlayed < MIN_GAP_MS) return false;   // nhiều tin dồn dập chỉ kêu một lần
  const c = audio();
  if (!c || c.state !== "running") return false;
  lastPlayed = now;
  const t = c.currentTime;
  tone(c, 880, t, 0.16);          // A5
  tone(c, 1318.5, t + 0.14, 0.26); // E6
  return true;
}
