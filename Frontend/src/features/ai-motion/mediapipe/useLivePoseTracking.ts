import { useState, useRef, useEffect, useCallback } from 'react';
import { poseLandmarkerService } from './poseLandmarkerService';
import { cameraService } from './cameraService';
import { AngleCalculator } from '../analysis/angleCalculator';
import { RepCounter } from '../analysis/repCounter';
import { SkeletonDrawer } from './skeletonDrawer';
import { aiMotionApi } from '../api/aiMotionApi';
import type { CalculatedMotionMetrics, RepCounterState, NormalizedLandmark } from './poseTypes';
import type { AiVoiceConfigurationDto } from '../types/aiMotion.types';
import { motionRuntimeApi, speakFeedback, type FinishMotionSessionResponse, type MotionFrame, type FrameBatchResponse } from '../../motion-rules/runtimeApi';

/** Lấy mẫu ~15 khung/giây, gửi lô mỗi ~400 ms tới Motion Rule Engine (không gửi video). */
const SAMPLE_MS = 66;
const BATCH_MS = 400;

type LiveViolation = { code: string; title: string; message: string; voicePrompt: string; severity: 'WARNING' | 'ERROR' };

function mapPhase(p: string): RepCounterState['currentPhase'] {
  if (p === 'DESCENDING' || p === 'ASCENDING') return p;
  if (p === 'BOTTOM' || p === 'HOLD') return 'INFLECTION';
  return 'START';
}

export interface LivePoseTrackingOptions {
  exerciseCode?: string;
  /** EXERCISE_RULES: bài tập được chấm bởi rule PUBLISHED của Motion Rule Engine (backend) */
  exerciseId?: number;
  context?: 'TRAINING' | 'ASSESSMENT';
  assessmentSessionId?: number;
  testItemId?: number;
  workoutSessionId?: number;
  onSessionFinished?: (summary: FinishMotionSessionResponse) => void;
  trackingMode?: 'UNIVERSAL_POSE_TEST' | 'EXERCISE_RULES';
  autoVoiceWarning?: boolean;
  voiceCooldownSeconds?: number;
  onRepCompleted?: (repCount: number, score: number) => void;
  onViolationDetected?: (violation: string) => void;
}

export function getFriendlyVoiceName(cfg?: AiVoiceConfigurationDto | null): string {
  if (!cfg) return 'Quỳnh Anh (Bắc - Viettel AI)';
  const voice = cfg.voiceName || '';
  const provider = cfg.provider || 'VIETTEL_AI';

  const viettelMap: Record<string, string> = {
    'hn-quynhanh': 'Quỳnh Anh (Nữ Bắc)',
    'hn-thaochi': 'Thảo Chi (Nữ Bắc)',
    'hn-phuongtrang': 'Phương Trang (Nữ Bắc)',
    'hn-thanhha': 'Thanh Hà (Nữ Bắc)',
    'hn-thanhtung': 'Thanh Tùng (Nam Bắc)',
    'hn-namkhanh': 'Nam Khánh (Nam Bắc)',
    'hn-tienquan': 'Tiến Quân (Nam Bắc)',
    'hue-maingoc': 'Mai Ngọc (Nữ Huế)',
    'hue-baoquoc': 'Bảo Quốc (Nam Huế)',
    'hcm-diemmy': 'Diễm My (Nữ Nam)',
    'hcm-minhquan': 'Minh Quân (Nam)',
    'hcm-thuytien': 'Thủy Tiên (Nữ Nam)',
    'hcm-leminh': 'Lê Minh (Nam)',
  };

  if (provider === 'VIETTEL_AI') {
    return viettelMap[voice] || `${voice} (Viettel AI)`;
  }
  if (provider === 'GEMINI') {
    return `${voice || 'Aoede'} (Google Gemini)`;
  }
  if (provider === 'GOOGLE_CLOUD_TTS') {
    return `${voice || 'Neural2'} (Google Cloud)`;
  }
  return 'Web Speech API (Trình duyệt)';
}

export function useLivePoseTracking(options: LivePoseTrackingOptions = {}) {
  const {
    exerciseCode = 'PUSH_UP',
    trackingMode = 'UNIVERSAL_POSE_TEST',
    autoVoiceWarning = true,
    voiceCooldownSeconds = 2.5,
    onRepCompleted,
    onViolationDetected,
    exerciseId,
    context = 'TRAINING',
    assessmentSessionId,
    testItemId,
    workoutSessionId,
    onSessionFinished,
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const repCounterRef = useRef<RepCounter>(new RepCounter());

  // Phiên Motion Rule Engine (EXERCISE_RULES)
  const motionSessionRef = useRef<string | null>(null);
  const frameBufferRef = useRef<MotionFrame[]>([]);
  const lastSampleRef = useRef(0);
  const lastFlushRef = useRef(0);
  const inFlightRef = useRef(false);
  const [sessionWarnings, setSessionWarnings] = useState<string[]>([]);

  const [isInitializing, setIsInitializing] = useState(false);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);

  // Active Voice Configuration loaded from Step 4 (Cấu hình AI Voice)
  const [voiceConfig, setVoiceConfig] = useState<AiVoiceConfigurationDto | null>(null);
  const voiceConfigRef = useRef<AiVoiceConfigurationDto | null>(null);

  // Raw landmarks & detected counts
  const [rawLandmarks, setRawLandmarks] = useState<NormalizedLandmark[]>([]);
  const [detectedLandmarksCount, setDetectedLandmarksCount] = useState(0);
  const [poseConfidenceScore, setPoseConfidenceScore] = useState(0);

  // Load configured voice on mount
  useEffect(() => {
    aiMotionApi.getVoiceConfig().then((cfg) => {
      setVoiceConfig(cfg);
      voiceConfigRef.current = cfg;
    }).catch(() => {});
  }, []);

  const [metrics, setMetrics] = useState<CalculatedMotionMetrics | null>(null);
  const [repState, setRepState] = useState<RepCounterState>({
    repCount: 0,
    currentPhase: 'START',
    currentRom: 0,
    peakRom: 0,
    invalidRepCount: 0,
    lastRepDurationMs: 0,
    lastRepScore: 100,
    repStartTime: null,
  });

  const [activeViolations, setActiveViolations] = useState<LiveViolation[]>([]);

  const [formScore, setFormScore] = useState(100);

  // Voice warning debouncer & cooldown tracker
  const lastVoicePlayedTimeRef = useRef(0);
  const lastVoicePromptRef = useRef<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const playVoiceWarning = useCallback(async (promptText: string) => {
    const now = Date.now();
    if (now - lastVoicePlayedTimeRef.current < voiceCooldownSeconds * 1000) {
      return;
    }
    lastVoicePlayedTimeRef.current = now;
    lastVoicePromptRef.current = promptText;

    try {
      await aiMotionApi.speakVoicePrompt(promptText);
    } catch {
      // Audio playback failsafe
    }
  }, [voiceCooldownSeconds]);

  const applyBatch = useCallback((res: FrameBatchResponse) => {
    const last = res.completedReps[res.completedReps.length - 1];
    setRepState((prev) => ({
      ...prev,
      repCount: res.repCount,
      currentPhase: mapPhase(res.phase),
      invalidRepCount: res.repCount - res.validReps,
      lastRepScore: last ? last.qualityScore : prev.lastRepScore,
    }));
    if (last) setFormScore(last.qualityScore);
    res.completedReps.forEach((r) => onRepCompleted?.(r.repNumber, r.qualityScore));
    if (res.feedback.length > 0) {
      setActiveViolations(res.feedback.map((f) => ({
        code: f.feedbackCode ?? f.ruleCode,
        title: f.uiText ?? f.ruleCode,
        message: f.observed !== undefined ? `Đo được ${Math.round(f.observed * 10) / 10} · chuẩn ${f.expected ?? ''}` : f.expected ?? '',
        voicePrompt: f.voiceText ?? '',
        severity: f.severity === 'ERROR' || f.severity === 'CRITICAL' ? 'ERROR' : 'WARNING',
      })));
      const top = res.feedback[res.feedback.length - 1];
      if (autoVoiceWarning) speakFeedback(top);
      onViolationDetected?.(top.uiText ?? top.ruleCode);
    } else if (last) {
      setActiveViolations([]);
    }
    if (res.stopRequested) onViolationDetected?.(res.stopReason ?? 'Dừng bài tập để đảm bảo an toàn');
  }, [autoVoiceWarning, onRepCompleted, onViolationDetected]);

  const flushFrames = useCallback(async (aspectRatio: number) => {
    const sid = motionSessionRef.current;
    if (!sid || inFlightRef.current || frameBufferRef.current.length === 0) return;
    const batch = frameBufferRef.current;
    frameBufferRef.current = [];
    inFlightRef.current = true;
    try {
      applyBatch(await motionRuntimeApi.frames(sid, batch, aspectRatio));
    } catch {
      // Mất kết nối tạm thời: bỏ lô này, không kết luận sai form
    } finally {
      inFlightRef.current = false;
    }
  }, [applyBatch]);

  const bufferFrame = useCallback((now: number, landmarks: NormalizedLandmark[], video: HTMLVideoElement) => {
    if (!motionSessionRef.current || now - lastSampleRef.current < SAMPLE_MS) return;
    lastSampleRef.current = now;
    frameBufferRef.current.push({ t: Math.round(now), l: landmarks.map((l) => [l.x, l.y, l.z ?? 0, l.visibility ?? 0]) });
    if (now - lastFlushRef.current >= BATCH_MS) {
      lastFlushRef.current = now;
      void flushFrames((video.videoWidth || 640) / (video.videoHeight || 480));
    }
  }, [flushFrames]);

  // Main Detection Loop
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      animFrameIdRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const now = performance.now();
    const result = poseLandmarkerService.detectForVideo(video, now);

    if (result && result.landmarks && result.landmarks.length > 0) {
      const landmarks = result.landmarks[0] as NormalizedLandmark[];
      setRawLandmarks(landmarks);

      // Count visible landmarks (> 0.4 visibility)
      const visiblePts = landmarks.filter((l) => (l.visibility ?? 1) >= 0.4);
      setDetectedLandmarksCount(visiblePts.length);
      const avgConfidence = Math.round(
        (visiblePts.reduce((acc, l) => acc + (l.visibility ?? 1), 0) / Math.max(1, visiblePts.length)) * 100
      );
      setPoseConfidenceScore(avgConfidence);

      // 1. Calculate Biomechanical metrics
      const calculated = AngleCalculator.extractMetrics(landmarks, exerciseCode);
      setMetrics(calculated);

      const highlightJoints: { [index: number]: 'GOOD' | 'WARNING' | 'ERROR' } = {};
      const activeAngles: { index: number; label: string; angle: number; status: 'GOOD' | 'WARNING' | 'ERROR' }[] = [];

      // Always show dynamic angle indicators in Universal Inspector mode
      activeAngles.push({ index: 13, label: 'Khuỷu T', angle: Math.round(calculated.elbowAngleLeft), status: 'GOOD' });
      activeAngles.push({ index: 14, label: 'Khuỷu P', angle: Math.round(calculated.elbowAngleRight), status: 'GOOD' });
      activeAngles.push({ index: 23, label: 'Cột sống', angle: Math.round(calculated.spineAlignmentAngle), status: calculated.spineAlignmentAngle >= 165 ? 'GOOD' : 'WARNING' });
      activeAngles.push({ index: 25, label: 'Gối T', angle: Math.round(calculated.kneeAngleLeft), status: 'GOOD' });

      // Highlight key joints as detected
      [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach((idx) => {
        highlightJoints[idx] = 'GOOD';
      });

      if (trackingMode === 'EXERCISE_RULES') {
        // Chấm form hoàn toàn ở Motion Rule Engine: chỉ gom khung landmark và gửi theo lô
        bufferFrame(now, landmarks, video);
      } else {
        // In Universal Inspector Mode, no false-positive violations are raised!
        setActiveViolations([]);
        setFormScore(avgConfidence);
      }

      // Draw HUD Skeleton on Canvas
      SkeletonDrawer.draw({
        canvas,
        landmarks,
        videoWidth: video.videoWidth || 640,
        videoHeight: video.videoHeight || 480,
        highlightJoints,
        activeAngles,
      });
    } else {
      if (trackingMode === 'EXERCISE_RULES') bufferFrame(now, [], video);
      setRawLandmarks([]);
      setDetectedLandmarksCount(0);
      setPoseConfidenceScore(0);
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    animFrameIdRef.current = requestAnimationFrame(processFrame);
  }, [exerciseCode, trackingMode, bufferFrame]);

  // FPS calculation timer
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      setFps(Math.round(frameCount / delta));
      frameCount = 0;
      lastTime = now;
    }, 1000);

    const onFrame = () => {
      frameCount++;
    };

    const loop = () => {
      onFrame();
      if (isCameraRunning) requestAnimationFrame(loop);
    };

    if (isCameraRunning) requestAnimationFrame(loop);

    return () => clearInterval(interval);
  }, [isCameraRunning]);

  const startTracking = useCallback(async (): Promise<boolean> => {
    setError(null);
    setIsInitializing(true);

    try {
      // 1. Initialize MediaPipe PoseLandmarker
      await poseLandmarkerService.initialize();

      if (trackingMode === 'EXERCISE_RULES' && exerciseId) {
        const s = await motionRuntimeApi.start({ exerciseId, context, assessmentSessionId, testItemId, workoutSessionId });
        motionSessionRef.current = s.sessionId;
        frameBufferRef.current = [];
        setSessionWarnings(s.warnings);
      }

      // 2. Start Camera Stream
      if (videoRef.current) {
        await cameraService.startCamera(videoRef.current, {
          facingMode: 'user',
          idealWidth: 1280,
          idealHeight: 720,
        });
        setIsCameraRunning(true);
        repCounterRef.current.reset();
        animFrameIdRef.current = requestAnimationFrame(processFrame);
      }
      return true;
    } catch (err: any) {
      // Ưu tiên thông điệp tiếng Việt từ backend (ApiError.message) thay cho "Request failed with status code 400"
      setError(err?.response?.data?.message || err.message || 'Lỗi khi khởi động MediaPipe Camera');
      setIsCameraRunning(false);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [processFrame, trackingMode, exerciseId, context, assessmentSessionId, testItemId, workoutSessionId]);

  const stopTracking = useCallback(() => {
    const sid = motionSessionRef.current;
    if (sid) {
      motionSessionRef.current = null;
      frameBufferRef.current = [];
      motionRuntimeApi.finish(sid).then((summary) => onSessionFinished?.(summary)).catch(() => undefined);
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    cameraService.stopCamera();
    setIsCameraRunning(false);

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [onSessionFinished]);

  const resetReps = useCallback(() => {
    repCounterRef.current.reset();
    setRepState(repCounterRef.current.getState());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    videoRef,
    canvasRef,
    isInitializing,
    isCameraRunning,
    error,
    fps,
    metrics,
    repState,
    activeViolations,
    formScore,
    rawLandmarks,
    detectedLandmarksCount,
    poseConfidenceScore,
    sessionWarnings,
    voiceConfig,
    friendlyVoiceName: getFriendlyVoiceName(voiceConfig),
    playVoiceWarning,
    startTracking,
    stopTracking,
    resetReps,
  };
}

