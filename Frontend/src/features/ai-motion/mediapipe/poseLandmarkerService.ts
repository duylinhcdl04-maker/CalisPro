import { FilesetResolver, PoseLandmarker, type PoseLandmarkerResult } from '@mediapipe/tasks-vision';

// WASM PHẢI cùng phiên bản với package @mediapipe/tasks-vision đã cài (khoá chính xác trong package.json).
// Dùng `@latest` làm lỗi "assignWasmExports ... reading 'value'" khi CDN phát hành bản mới (vd. 1.1.0) lệch với bundle JS 1.0.1.
const MEDIAPIPE_VERSION = '1.0.1';
const MEDIAPIPE_WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;

/**
 * Chỉ để kiểm thử tự động (Vite dev): trang thử gán window.__fakePose = (tMs) => 33 landmark | null để thay cho MediaPipe,
 * nhờ đó chạy được cả chuỗi đo mà không cần người thật. `import.meta.env.DEV` là false ở bản build nên nhánh này bị loại hoàn toàn.
 */
declare global {
  interface Window {
    __fakePose?: (tMs: number) => { x: number; y: number; z: number; visibility: number }[] | null;
  }
}
const fakePose = () => (import.meta.env.DEV && typeof window !== "undefined" ? window.__fakePose : undefined);

export class PoseLandmarkerService {
  private static instance: PoseLandmarkerService | null = null;
  private landmarker: PoseLandmarker | null = null;
  private isInitializing = false;
  private initPromise: Promise<PoseLandmarker | null> | null = null;

  public static getInstance(): PoseLandmarkerService {
    if (!PoseLandmarkerService.instance) {
      PoseLandmarkerService.instance = new PoseLandmarkerService();
    }
    return PoseLandmarkerService.instance;
  }

  public async initialize(options?: {
    modelAssetPath?: string;
    delegate?: 'GPU' | 'CPU';
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
    minPresenceConfidence?: number;
  }): Promise<PoseLandmarker | null> {
    if (fakePose()) return null;   // dev/test: không tải mô hình MediaPipe
    if (this.landmarker) return this.landmarker;
    if (this.isInitializing && this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        const visionWasm = await FilesetResolver.forVisionTasks(
          MEDIAPIPE_WASM_BASE
        );

        const modelUrl =
          options?.modelAssetPath ||
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';

        this.landmarker = await PoseLandmarker.createFromOptions(visionWasm, {
          baseOptions: {
            modelAssetPath: modelUrl,
            delegate: options?.delegate || 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: options?.minDetectionConfidence ?? 0.6,
          minTrackingConfidence: options?.minTrackingConfidence ?? 0.6,
          minPosePresenceConfidence: options?.minPresenceConfidence ?? 0.6,
        });

        console.log('[MediaPipe] PoseLandmarker initialized successfully with GPU delegate');
        return this.landmarker;
      } catch (err) {
        console.warn('[MediaPipe] GPU delegate failed, falling back to CPU:', err);
        try {
          const visionWasm = await FilesetResolver.forVisionTasks(
            MEDIAPIPE_WASM_BASE
          );
          this.landmarker = await PoseLandmarker.createFromOptions(visionWasm, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          return this.landmarker;
        } catch (cpuErr) {
          console.error('[MediaPipe] Failed to initialize PoseLandmarker:', cpuErr);
          return null;
        }
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initPromise;
  }

  public detectForVideo(videoElement: HTMLVideoElement, timestampMs: number): PoseLandmarkerResult | null {
    const fake = fakePose();
    if (fake) {
      const lm = fake(timestampMs);
      return { landmarks: lm ? [lm] : [], worldLandmarks: [], segmentationMasks: undefined, close() {} } as unknown as PoseLandmarkerResult;
    }
    if (!this.landmarker || !videoElement || videoElement.readyState < 2) {
      return null;
    }
    try {
      return this.landmarker.detectForVideo(videoElement, timestampMs);
    } catch (e) {
      console.error('[MediaPipe] detectForVideo frame error:', e);
      return null;
    }
  }

  public close(): void {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch (e) {
        console.warn('[MediaPipe] error closing landmarker:', e);
      }
      this.landmarker = null;
    }
    this.isInitializing = false;
    this.initPromise = null;
  }
}

export const poseLandmarkerService = PoseLandmarkerService.getInstance();
