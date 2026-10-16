/**
 * Ghi hình bài test L4 ngay trên trình duyệt (MediaRecorder). Không ghi âm, chỉ video track của luồng camera đang dùng cho MediaPipe.
 * Video không đi qua backend: tải thẳng lên Cloudinary (xem recordingApi.ts).
 */

/** Thứ tự ưu tiên: WebM (Chrome/Edge/Firefox) rồi MP4 (Safari/iOS không ghi được WebM). */
const MIME_CANDIDATES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4;codecs=avc1",
  "video/mp4",
] as const;

export function pickSupportedMime(isSupported: (mime: string) => boolean = (m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)): string | null {
  return MIME_CANDIDATES.find((m) => isSupported(m)) ?? null;
}

export function recordingSupported(): boolean {
  return typeof MediaRecorder !== "undefined" && pickSupportedMime() !== null;
}

/** Đuôi file theo mime thực tế của blob (Cloudinary đoán định dạng từ nội dung nhưng tên file đúng đuôi giúp Coach tải về mở được). */
export function extensionFor(mime: string): string {
  return mime.startsWith("video/mp4") ? "mp4" : "webm";
}

/** Mặc định đủ cho giữ tư thế mục tiêu 90 giây (plank) kèm thời gian chuẩn bị; bài cần lâu hơn truyền maxSeconds riêng. */
export const DEFAULT_MAX_SECONDS = 120;

/** Giới hạn ghi cho một bài: mục tiêu giữ (giây) cộng đệm chuẩn bị/kết thúc, không dưới mặc định. */
export function maxSecondsForHold(targetHoldSec: number | null | undefined, bufferSec = 30): number {
  return Math.max(DEFAULT_MAX_SECONDS, Math.ceil((targetHoldSec ?? 0) + bufferSec));
}
/** ~720p, đủ để Coach nhìn rõ form; một lần thử 60 giây chỉ vài MB. */
export const DEFAULT_VIDEO_BITS_PER_SECOND = 1_500_000;

export interface RecordedClip {
  blob: Blob;
  mime: string;
  durationMs: number;
  /** true nếu bị cắt do chạm giới hạn thời gian. */
  truncated: boolean;
}

export interface AttemptRecorderOptions {
  maxSeconds?: number;
  videoBitsPerSecond?: number;
}

/** Một lần ghi = một attempt. Dùng: start(stream) → ... → stop() trả về clip (hoặc null nếu không ghi được/không có dữ liệu). */
export class AttemptRecorder {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private truncated = false;
  private finished: Promise<RecordedClip | null> | null = null;

  constructor(private readonly options: AttemptRecorderOptions = {}) {}

  get active(): boolean {
    return this.recorder?.state === "recording";
  }

  /** Ném lỗi nếu trình duyệt không hỗ trợ; chỉ lấy video track nên không bao giờ ghi âm. */
  start(stream: MediaStream): void {
    if (this.recorder) throw new Error("Đang ghi hình");
    const mime = pickSupportedMime();
    if (!mime) throw new Error("Trình duyệt không hỗ trợ ghi hình");
    const videoOnly = new MediaStream(stream.getVideoTracks());
    this.chunks = [];
    this.truncated = false;
    const recorder = new MediaRecorder(videoOnly, {
      mimeType: mime,
      videoBitsPerSecond: this.options.videoBitsPerSecond ?? DEFAULT_VIDEO_BITS_PER_SECOND,
    });
    this.recorder = recorder;
    this.finished = new Promise<RecordedClip | null>((resolve) => {
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) this.chunks.push(e.data); };
      recorder.onerror = () => resolve(null);
      recorder.onstop = () => {
        const durationMs = Math.round(performance.now() - this.startedAt);
        const type = recorder.mimeType || mime;
        const blob = new Blob(this.chunks, { type });
        this.chunks = [];
        resolve(blob.size > 0 ? { blob, mime: type, durationMs, truncated: this.truncated } : null);
      };
    });
    this.startedAt = performance.now();
    recorder.start(1000); // cắt chunk mỗi giây để mất điện/đóng tab vẫn giữ phần đã ghi trong bộ nhớ
    this.timer = setTimeout(() => {
      this.truncated = true;
      this.stopInternal();
    }, (this.options.maxSeconds ?? DEFAULT_MAX_SECONDS) * 1000);
  }

  /** Dừng và lấy clip. Gọi nhiều lần an toàn (lần sau trả cùng kết quả). */
  stop(): Promise<RecordedClip | null> {
    this.stopInternal();
    return this.finished ?? Promise.resolve(null);
  }

  /** Bỏ clip (user huỷ lần thử / chuyển bài). */
  discard(): void {
    this.stopInternal();
    this.chunks = [];
    this.finished = null;
    this.recorder = null;
  }

  private stopInternal(): void {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
  }
}
