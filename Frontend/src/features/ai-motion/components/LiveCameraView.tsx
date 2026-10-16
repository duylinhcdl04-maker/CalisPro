import { useEffect, useState } from 'react';
import {
  Camera,
  VideoOff,
  RefreshCw,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useLivePoseTracking } from '../mediapipe/useLivePoseTracking';
import { FULL_33_LANDMARKS } from '../mediapipe/poseTypes';
import { Button } from '../../../components/ui/Button';
import type { ExerciseAiProfileDto } from '../types/aiMotion.types';
import { toast } from 'sonner';

interface Props {
  profile?: ExerciseAiProfileDto;
  onClose?: () => void;
}

type InspectorTab = 'ANGLES' | 'LANDMARKS' | 'VOICE_TEST';

export function LiveCameraView({ profile, onClose }: Props) {
  const [activeInspectorTab, setActiveInspectorTab] = useState<InspectorTab>('ANGLES');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<'ALL' | 'HEAD' | 'UPPER_BODY' | 'CORE' | 'LOWER_BODY'>('ALL');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeakingSummary, setIsSpeakingSummary] = useState(false);

  const {
    videoRef,
    canvasRef,
    isInitializing,
    isCameraRunning,
    error,
    fps,
    metrics,
    rawLandmarks,
    detectedLandmarksCount,
    poseConfidenceScore,
    voiceConfig,
    friendlyVoiceName,
    playVoiceWarning,
    startTracking,
    stopTracking,
  } = useLivePoseTracking({
    trackingMode: 'UNIVERSAL_POSE_TEST',
    autoVoiceWarning: false,
  });

  useEffect(() => {
    // Auto start camera tracking on mount
    startTracking();
    return () => {
      stopTracking();
    };
  }, [startTracking, stopTracking]);

  // Read live pose analysis using configured AI Voice
  async function handleSpeakLiveSummary() {
    if (detectedLandmarksCount === 0) {
      toast.warning('Chưa nhận diện được cơ thể trước camera');
      return;
    }
    setIsSpeakingSummary(true);
    const text = `Đã nhận diện ${detectedLandmarksCount} trên 33 điểm khớp MediaPipe. Độ tin cậy ${poseConfidenceScore} phần trăm. Cột sống thẳng ${Math.round(metrics?.spineAlignmentAngle ?? 180)} độ. Khớp tay và vai nhận diện tốt.`;
    try {
      await playVoiceWarning(text);
      toast.success('Đang phát giọng đọc HLV AI');
    } catch {
      toast.error('Lỗi khi phát giọng nói');
    } finally {
      setTimeout(() => setIsSpeakingSummary(false), 2000);
    }
  }

  const filteredLandmarks = FULL_33_LANDMARKS.filter((lm) => {
    if (selectedRegionFilter === 'ALL') return true;
    return lm.region === selectedRegionFilter;
  });

  return (
    <div className={`space-y-4 rounded-3xl border border-border/80 bg-surface p-5 shadow-elevated transition-all ${
      isFullscreen ? 'fixed inset-4 z-50 overflow-y-auto bg-background/95 backdrop-blur-md' : ''
    }`}>
      {/* HEADER CONTROL BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/20">
            <Camera size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display text-sm font-bold text-text-primary">
                MediaPipe Pose Realtime Vision Test (33 Điểm Khớp)
              </h4>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {fps > 0 ? `${fps} FPS Live` : 'Đang xử lý'}
              </span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Nhận diện và phân tích 33 tọa độ khung xương tự do & Giọng nói HLV: <strong className="text-accent">{friendlyVoiceName}</strong>.
            </p>
          </div>
        </div>

        {/* TOP CONTROLS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Audio toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className={`text-xs gap-1.5 h-8 px-2.5 ${isAudioMuted ? 'text-amber-500 border-amber-500/30' : 'text-emerald-500'}`}
            title={isAudioMuted ? `Bật giọng nói ${friendlyVoiceName}` : 'Tắt tiếng cảnh báo'}
          >
            {isAudioMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {isAudioMuted ? 'Đã tắt tiếng' : friendlyVoiceName}
          </Button>

          {/* Camera toggle */}
          {isCameraRunning ? (
            <Button
              size="sm"
              onClick={stopTracking}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1 h-8 px-3"
            >
              <VideoOff size={13} />
              Tắt Camera
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={startTracking}
              disabled={isInitializing}
              className="bg-accent hover:bg-accent-strong text-white text-xs font-bold gap-1 h-8 px-3"
            >
              <Camera size={13} />
              {isInitializing ? 'Đang bật...' : 'Bật Camera'}
            </Button>
          )}

          {/* Fullscreen */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8 p-0 text-text-secondary hover:text-text-primary"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </Button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-500 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={startTracking} className="h-7 text-xs">
            Thử lại
          </Button>
        </div>
      )}

      {/* MAIN TRACKING WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: LIVE WEBCAM & NEON SKELETON CANVAS */}
        <div className="lg:col-span-8 relative rounded-3xl bg-neutral-950 overflow-hidden border border-border/80 shadow-elevated aspect-[4/3] sm:aspect-video flex items-center justify-center">
          {/* Native HTML5 Video Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover -scale-x-100"
          />

          {/* Transparent Canvas for Skeleton Neon HUD Overlay */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover -scale-x-100 z-10 pointer-events-none"
          />

          {/* Loading Indicator */}
          {isInitializing && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm text-white gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-accent" />
              <div className="text-xs font-bold font-mono">Đang khởi tạo mô hình MediaPipe Pose Landmarker...</div>
            </div>
          )}

          {/* TOP LEFT HUD: LANDMARKS DETECTED COUNT & CONFIDENCE */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <div className="rounded-2xl bg-black/80 backdrop-blur-md px-3.5 py-2 border border-white/10 text-white shadow-lg flex items-center gap-3">
              <div>
                <div className="text-[9px] uppercase font-bold text-white/60">Điểm khớp nhận diện</div>
                <div className="text-xl font-black text-emerald-400 font-mono leading-none mt-1">
                  {detectedLandmarksCount} <span className="text-xs font-normal text-white/60">/ 33 Điểm</span>
                </div>
              </div>
              <div className="border-l border-white/10 pl-3">
                <div className="text-[9px] uppercase font-bold text-white/60">Độ tin cậy</div>
                <div className={`text-xl font-black font-mono leading-none mt-1 ${
                  poseConfidenceScore >= 80 ? 'text-emerald-400' : poseConfidenceScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {poseConfidenceScore}%
                </div>
              </div>
            </div>
          </div>

          {/* TOP RIGHT HUD: BODY DETECTION STATUS */}
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
            <div className="rounded-2xl bg-black/80 backdrop-blur-md px-3.5 py-2 border border-white/10 text-white shadow-lg text-right">
              <div className="text-[9px] uppercase font-bold text-white/60">Trạng thái cơ thể</div>
              <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                <ShieldCheck size={14} />
                {detectedLandmarksCount >= 18 ? 'Toàn thân rõ nét' : detectedLandmarksCount > 0 ? 'Phần trên cơ thể' : 'Chờ đứng trước camera'}
              </div>
            </div>
          </div>

          {/* BOTTOM HUD: STATUS BANNER & VOICE ACTION BUTTON */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-2 rounded-2xl bg-black/85 backdrop-blur-md px-4 py-2.5 text-xs text-white border border-white/10">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>
                {detectedLandmarksCount > 0
                  ? `Đang theo dõi 33 khớp xương thời gian thực (${fps} FPS)`
                  : 'Vui lòng đứng trong tầm nhìn camera để nhận diện khung xương'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSpeakLiveSummary}
                disabled={isSpeakingSummary || detectedLandmarksCount === 0}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-accent text-white font-bold text-[11px] hover:bg-accent-strong transition-all disabled:opacity-50"
              >
                <Volume2 size={13} className={isSpeakingSummary ? 'animate-bounce' : ''} />
                {isSpeakingSummary ? 'Đang đọc...' : 'Đọc phân tích AI Voice'}
              </button>

              <span className="text-[11px] text-white/60 font-mono hidden md:inline">
                Giọng: {friendlyVoiceName}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INSPECTOR & DIAGNOSTICS TABS */}
        <div className="lg:col-span-4 space-y-4">
          {/* Inspector Segmented Tabs */}
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-background p-1 border border-border/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveInspectorTab('ANGLES')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeInspectorTab === 'ANGLES'
                  ? 'bg-surface text-accent shadow-sm border border-border/60'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Activity size={14} />
              Góc Khớp
            </button>
            <button
              type="button"
              onClick={() => setActiveInspectorTab('LANDMARKS')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeInspectorTab === 'LANDMARKS'
                  ? 'bg-surface text-accent shadow-sm border border-border/60'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Layers size={14} />
              33 Điểm ({detectedLandmarksCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveInspectorTab('VOICE_TEST')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeInspectorTab === 'VOICE_TEST'
                  ? 'bg-surface text-accent shadow-sm border border-border/60'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Volume2 size={14} />
              AI Voice
            </button>
          </div>

          {/* TAB 1: REAL-TIME BIOMECHANICAL ANGLES */}
          {activeInspectorTab === 'ANGLES' && (
            <div className="rounded-3xl border border-border/80 bg-surface p-5 shadow-elevated space-y-4">
              <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
                <h5 className="font-display text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={14} className="text-accent" />
                  Góc Khớp Sinh học Tự do (Live)
                </h5>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  MediaPipe 33
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Elbow Left */}
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-text-secondary">Khuỷu tay trái:</span>
                    <span className="font-mono font-bold text-text-primary">
                      {Math.round(metrics?.elbowAngleLeft ?? 0)}°
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/60">
                    <div
                      className="h-full bg-accent transition-all duration-75"
                      style={{ width: `${Math.min(100, ((metrics?.elbowAngleLeft ?? 0) / 180) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Elbow Right */}
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-text-secondary">Khuỷu tay phải:</span>
                    <span className="font-mono font-bold text-text-primary">
                      {Math.round(metrics?.elbowAngleRight ?? 0)}°
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/60">
                    <div
                      className="h-full bg-accent transition-all duration-75"
                      style={{ width: `${Math.min(100, ((metrics?.elbowAngleRight ?? 0) / 180) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Elbow Flare */}
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-text-secondary">Góc mở cánh tay (Flare):</span>
                    <span className="font-mono font-bold text-text-primary">
                      {Math.round(metrics?.elbowFlareAngle ?? 0)}°
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/60">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-75"
                      style={{ width: `${Math.min(100, ((metrics?.elbowFlareAngle ?? 0) / 90) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Spine Alignment */}
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-text-secondary">Trục thẳng cột sống:</span>
                    <span className="font-mono font-bold text-text-primary">
                      {Math.round(metrics?.spineAlignmentAngle ?? 0)}°
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/60">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-75"
                      style={{ width: `${Math.min(100, ((metrics?.spineAlignmentAngle ?? 0) / 180) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Knee Angle Left */}
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-text-secondary">Góc khớp gối:</span>
                    <span className="font-mono font-bold text-text-primary">
                      {Math.round(metrics?.kneeAngleLeft ?? 0)}°
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/60">
                    <div
                      className="h-full bg-violet-500 transition-all duration-75"
                      style={{ width: `${Math.min(100, ((metrics?.kneeAngleLeft ?? 0) / 180) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FULL 33 LANDMARKS INSPECTOR */}
          {activeInspectorTab === 'LANDMARKS' && (
            <div className="rounded-3xl border border-border/80 bg-surface p-5 shadow-elevated space-y-3.5">
              <div className="flex items-center justify-between border-b border-border/70 pb-2">
                <h5 className="font-display text-xs font-bold text-text-primary uppercase tracking-wider">
                  Bảng 33 Tọa độ Khớp Xương
                </h5>
                <span className="text-[10px] font-mono text-accent">
                  {detectedLandmarksCount}/33 Visible
                </span>
              </div>

              {/* Region Filter Chips */}
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'ALL', label: 'Tất cả (33)' },
                  { id: 'HEAD', label: 'Đầu (11)' },
                  { id: 'UPPER_BODY', label: 'Tay (12)' },
                  { id: 'CORE', label: 'Hông (2)' },
                  { id: 'LOWER_BODY', label: 'Chân (8)' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setSelectedRegionFilter(chip.id as any)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      selectedRegionFilter === chip.id
                        ? 'bg-accent text-white'
                        : 'bg-background text-text-secondary hover:text-text-primary border border-border/60'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Landmarks List Scrollable */}
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {filteredLandmarks.map((lm) => {
                  const raw = rawLandmarks[lm.index];
                  const isVisible = raw && (raw.visibility ?? 0) >= 0.4;
                  const confidence = Math.round((raw?.visibility ?? 0) * 100);

                  return (
                    <div
                      key={lm.index}
                      className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                        isVisible
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-text-primary'
                          : 'border-border/40 bg-background/40 text-text-secondary opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold h-5 w-5 rounded bg-surface border border-border/60 flex items-center justify-center">
                          {lm.index}
                        </span>
                        <div>
                          <div className="font-bold text-[11px]">{lm.vi}</div>
                          <div className="text-[9px] text-text-secondary font-mono">{lm.en}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-mono text-[10px] font-bold ${
                          confidence >= 70 ? 'text-emerald-500' : confidence >= 40 ? 'text-amber-500' : 'text-text-secondary'
                        }`}>
                          {raw ? `${confidence}%` : '0%'}
                        </div>
                        {raw && (
                          <div className="text-[9px] text-text-secondary font-mono">
                            x:{raw.x.toFixed(2)} y:{raw.y.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: AI VOICE TEST & CONFIG REFERENCE */}
          {activeInspectorTab === 'VOICE_TEST' && (
            <div className="rounded-3xl border border-border/80 bg-surface p-5 shadow-elevated space-y-4">
              <div className="flex items-center justify-between border-b border-border/70 pb-2">
                <h5 className="font-display text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 size={14} className="text-accent" />
                  Kiểm tra Giọng nói HLV AI
                </h5>
                <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                  Đã cấu hình
                </span>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary font-semibold">Giọng đọc hiện tại:</span>
                  <strong className="text-accent font-mono">{friendlyVoiceName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary font-semibold">Nhà cung cấp:</span>
                  <span className="font-bold text-text-primary">{voiceConfig?.provider || 'VIETTEL_AI'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary font-semibold">Tốc độ đọc:</span>
                  <span className="font-mono text-text-primary">{voiceConfig?.speakingRate || 1.0}x</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-text-secondary uppercase">
                  Thử phát các khẩu lệnh mẫu:
                </label>
                {[
                  'Khép bớt khuỷu tay lại, giữ thẳng lưng!',
                  'Xuống sâu hơn nữa, ngực chạm sàn!',
                  'Tốt lắm, tiếp tục giữ vững nhịp thở!',
                  'Đã nhận diện chuẩn xác ba mươi ba khớp xương.',
                ].map((prompt, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant="outline"
                    onClick={() => playVoiceWarning(prompt)}
                    className="w-full justify-between text-xs h-9 bg-background/60 hover:bg-accent/10 hover:border-accent/40"
                  >
                    <span className="truncate max-w-[220px]">"{prompt}"</span>
                    <Volume2 size={12} className="text-accent shrink-0 ml-2" />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
