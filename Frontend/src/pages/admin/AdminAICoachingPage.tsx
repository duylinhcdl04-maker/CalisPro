import { useState, useEffect } from 'react';
import { Bot, Sparkles, Activity, RefreshCw, Camera, Sliders, Key, History, Layers, ChevronDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from '../../components/admin/layout/AdminPageHeader';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../lib/api/client';
import type { ExerciseAiProfileDto } from '../../features/ai-motion/types/aiMotion.types';
import { motionRulesApi, errorMessage, type ProfileDto, type ProfileSummaryDto } from '../../features/motion-rules/api';
import { PoseLandmarkConfig } from '../../features/ai-motion/components/PoseLandmarkConfig';
import { MotionRuleEnginePanel } from '../../features/motion-rules/components/MotionRuleEnginePanel';
import { VoiceConfigPanel } from '../../features/ai-motion/components/VoiceConfigPanel';
import { AITestLabSimulator } from '../../features/ai-motion/components/AITestLabSimulator';
import { AuditVersionHistory } from '../../features/ai-motion/components/AuditVersionHistory';

type TabType = 'OVERVIEW' | 'LANDMARKS' | 'REP_COUNTING' | 'FORM_RULES' | 'VOICE_AGENT' | 'TEST_LAB' | 'VERSIONS';

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Đang dùng', DRAFT: 'Nháp', PUBLISHED: 'Đang dùng', ARCHIVED: 'Lưu trữ' };
const CAMERA_LABEL: Record<string, string> = { SIDE: 'Nhìn nghiêng', FRONT: 'Chính diện', BACK: 'Từ phía sau', ANY: 'Mọi góc' };
const MOVEMENT_LABEL: Record<string, string> = { REPS: 'Đếm rep', HOLD: 'Giữ tư thế' };
const EMPTY = 'Chưa cấu hình';

/** Các tab còn dùng kiểu hồ sơ cũ chỉ đọc id, phiên bản và trạng thái: dựng từ hồ sơ thật, không có số mẫu. */
function toLegacyProfile(p: ProfileSummaryDto): ExerciseAiProfileDto {
  return {
    id: p.id, exerciseId: p.exerciseId, exerciseCode: p.exerciseCode, exerciseName: p.exerciseName, category: '', status: p.status === 'ACTIVE' ? 'PUBLISHED' : 'DRAFT',
    version: Number.parseFloat(p.version) || 1, description: p.profileName, cameraAngleRequirement: p.cameraView ?? '', minBodyVisibilityPercent: 0, trackingFpsTarget: 0,
    smoothingAlpha: 0, repCountPrimaryMetric: '', repStartThreshold: 0, repPeakThreshold: 0, repEndThreshold: 0, minRomPercentage: 0, repDirection: 'DESCENDING_FIRST',
    repDebounceMs: 0, minRepDurationMs: 0, autoVoiceFeedbackEnabled: false, warningCooldownSeconds: 0, maxWarningsPerRep: 0,
  };
}

const pct = (v: number | undefined) => (v == null ? EMPTY : `${Math.round(v * 100)}%`);

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const missing = value === EMPTY;
  return (
    <div className="rounded-2xl border border-border/60 bg-background/50 p-4 space-y-1">
      <span className="font-bold text-text-secondary uppercase">{label}</span>
      <div className={`${mono ? 'font-mono' : ''} font-bold text-sm ${missing ? 'text-text-secondary italic' : 'text-text-primary'}`}>{value}</div>
    </div>
  );
}

/**
 * Trung tâm AI & Motion của Admin. Danh sách bài, đầu trang và tab Hồ sơ Động tác đều lấy từ hồ sơ thật của Motion Rule Engine
 * (cùng nguồn với trang Rule chấm form của Coach); ô nào chưa cấu hình thì ghi rõ "Chưa cấu hình", không để trống hay điền số mẫu.
 */
export default function AdminAICoachingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [profiles, setProfiles] = useState<ProfileSummaryDto[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ProfileDto | null>(null);
  const [aiReady, setAiReady] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const list = await motionRulesApi.profiles();
      setProfiles(list);
      // ?exercise=ID (từ cảnh báo thiếu cấu hình đo trong form động tác): chọn đúng bài và mở tab cấu hình đếm rep
      const target = Number(new URLSearchParams(window.location.search).get('exercise')) || null;
      const match = target ? list.find((p) => p.exerciseId === target) : undefined;
      setSelectedProfileId((cur) => cur ?? match?.id ?? list[0]?.id ?? null);
      if (match) setActiveTab('REP_COUNTING');
    } catch (e) {
      setLoadError(errorMessage(e, 'Không tải được danh sách hồ sơ AI.'));
    } finally {
      setIsLoading(false);
    }
    try {
      const readiness = (await apiClient.get<Record<string, { ready: boolean }>>('/exercises/ai-readiness')).data;
      setAiReady(Object.values(readiness).filter((r) => r.ready).length);
    } catch {
      setAiReady(null);
    }
  }

  useEffect(() => { void loadData(); }, []);

  useEffect(() => {
    if (selectedProfileId == null) return;
    let alive = true;
    setDetail(null);
    motionRulesApi.profile(selectedProfileId).then((d) => { if (alive) setDetail(d); }).catch(() => { if (alive) setDetail(null); });
    return () => { alive = false; };
  }, [selectedProfileId]);

  const current = profiles.find((p) => p.id === selectedProfileId) ?? profiles[0];
  const totalPublished = profiles.reduce((n, p) => n + p.publishedRules, 0);
  const totalPending = profiles.reduce((n, p) => n + p.draftRules, 0);
  const withPublished = profiles.filter((p) => p.publishedRules > 0).length;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-text-secondary">
        <RefreshCw className="h-8 w-8 animate-spin text-accent" />
        <span className="ml-3 font-display font-bold">Đang tải Trung tâm Điều khiển AI & Motion Tracking...</span>
      </div>
    );
  }

  if (loadError || !current) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center space-y-4">
        <p className="text-sm text-text-secondary">{loadError ?? 'Chưa có hồ sơ AI nào. Hồ sơ được tạo khi bài tập có cấu hình AI.'}</p>
        <Button variant="outline" size="sm" onClick={() => void loadData()}><RefreshCw size={14} /> Thử lại</Button>
      </div>
    );
  }

  const legacy = toLegacyProfile(current);
  const allProfiles = profiles.map((p) => ({ id: p.id, exerciseName: p.exerciseName, exerciseCode: p.exerciseCode }));
  const active = current.status === 'ACTIVE' || current.status === 'PUBLISHED';

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Quản trị Động cơ AI & Motion Tracking"
        description="Cấu hình cách camera nhận diện 33 điểm khớp xương MediaPipe, đếm rep và chấm form cho từng bài tập; cấu hình giọng nhắc của AI Coach."
        badge={`${profiles.length} hồ sơ bài tập`}
        actions={
          <Button size="sm" variant="outline" onClick={() => setActiveTab('VOICE_AGENT')} className="border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 font-bold text-xs gap-1.5">
            <Key size={14} />
            Cấu hình giọng đọc và khóa AI
          </Button>
        }
      />

      {/* Chọn bài và trạng thái hồ sơ */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-3xl border border-border/80 bg-surface p-5 shadow-elevated">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="ai-profile-select" className="text-xs font-bold text-text-secondary uppercase tracking-wider">Động tác đang cấu hình:</label>
          <div className="relative">
            <select
              id="ai-profile-select"
              value={current.id}
              onChange={(e) => setSelectedProfileId(parseInt(e.target.value))}
              className="appearance-none rounded-2xl border border-accent/40 bg-background pl-4 pr-10 py-2 text-sm font-bold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.exerciseName}{p.profileName ? ` · ${p.profileName}` : ''} · v{p.version} · {STATUS_LABEL[p.status] ?? p.status}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
          <span className={`rounded-full px-3 py-0.5 text-xs font-black uppercase ${active ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
            {STATUS_LABEL[current.status] ?? current.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
          <span>Camera: <strong className="text-text-primary">{current.cameraView ? CAMERA_LABEL[current.cameraView] ?? current.cameraView : EMPTY}</strong></span>
          <span>Kiểu đo: <strong className="text-text-primary">{current.movementType ? MOVEMENT_LABEL[current.movementType] ?? current.movementType : EMPTY}</strong></span>
          <span>Rule: <strong className="text-text-primary">{current.publishedRules} đang chạy</strong>, {current.draftRules} nháp/chờ duyệt</span>
        </div>
      </div>

      {/* Số liệu thật của toàn hệ thống */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-border/80 bg-surface p-5 shadow-elevated space-y-1.5">
          <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">Hồ sơ AI</div>
          <div className="text-3xl font-black text-text-primary">{profiles.length}</div>
          <div className="text-[11px] text-text-secondary">Bài tập có hồ sơ chuyển động</div>
        </div>
        <div className="rounded-3xl border border-border/80 bg-surface p-5 shadow-elevated space-y-1.5">
          <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">Bài dùng được AI</div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{aiReady ?? '--'}</div>
          <div className="text-[11px] text-text-secondary">Đã bật tích hợp AI và đủ cấu hình đo</div>
        </div>
        <div className="rounded-3xl border border-border/80 bg-surface p-5 shadow-elevated space-y-1.5">
          <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">Rule chấm form đang chạy</div>
          <div className="text-3xl font-black text-accent">{totalPublished}</div>
          <div className="text-[11px] text-text-secondary">Ở {withPublished} bài tập</div>
        </div>
        <div className="rounded-3xl border border-border/80 bg-surface p-5 shadow-elevated space-y-1.5">
          <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">Rule nháp hoặc chờ duyệt</div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{totalPending}</div>
          <div className="text-[11px] text-text-secondary">Chưa có hiệu lực với học viên</div>
        </div>
      </div>

      {/* Tab */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 border-b border-border/70 pb-2">
        {([
          { id: 'OVERVIEW', label: 'Hồ sơ Động tác', icon: Sparkles },
          { id: 'REP_COUNTING', label: 'Thuật toán Đếm Reps', icon: Layers },
          { id: 'FORM_RULES', label: 'Bộ Quy tắc Form (Rules)', icon: Sliders },
          { id: 'LANDMARKS', label: '33 Khớp MediaPipe', icon: Activity },
          { id: 'TEST_LAB', label: 'Camera AI Live Test Lab', icon: Camera },
          { id: 'VOICE_AGENT', label: 'AI Voice & Gemini Agent API Key', icon: Bot, highlight: true },
          { id: 'VERSIONS', label: 'Lịch sử Phiên bản & Audit', icon: History },
        ] as { id: TabType; label: string; icon: typeof Bot; highlight?: boolean }[]).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-accent text-white shadow-md shadow-accent/20'
                  : tab.highlight
                  ? 'bg-accent/10 border border-accent/40 text-accent hover:bg-accent/20'
                  : 'bg-surface border border-border/80 text-text-secondary hover:text-text-primary hover:bg-background'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-white' : tab.highlight ? 'text-accent' : 'text-text-secondary'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="pt-2">
        {activeTab === 'VOICE_AGENT' && <VoiceConfigPanel />}
        {activeTab === 'TEST_LAB' && <AITestLabSimulator profile={legacy} />}
        {activeTab === 'FORM_RULES' && <MotionRuleEnginePanel key={`rules-${current.id}`} profileId={current.id} allProfiles={allProfiles} onSelectProfileId={setSelectedProfileId} />}
        {activeTab === 'REP_COUNTING' && (
          <MotionRuleEnginePanel key={`profile-${current.id}`} profileId={current.id} allProfiles={allProfiles} onSelectProfileId={setSelectedProfileId} initialView="PROFILE" />
        )}
        {activeTab === 'LANDMARKS' && <PoseLandmarkConfig profileId={current.id} exerciseCode={current.exerciseCode} />}
        {activeTab === 'VERSIONS' && <AuditVersionHistory profile={legacy} onProfileUpdated={() => void loadData().then(() => toast.info('Đã tải lại danh sách hồ sơ'))} />}

        {activeTab === 'OVERVIEW' && (
          <div className="rounded-3xl border border-border/80 bg-surface p-6 shadow-elevated space-y-5">
            <div className="border-b border-border/70 pb-3">
              <h3 className="font-display text-base font-bold text-text-primary">Chi tiết Hồ sơ AI: {current.exerciseName}</h3>
              <p className="text-xs text-text-secondary mt-0.5">{current.profileName} · phiên bản {current.version}</p>
            </div>

            {detail && detail.issues.length > 0 && (
              <ul className="space-y-1 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300" aria-label="Việc cần hoàn thiện">
                {detail.issues.map((i) => <li key={i} className="flex gap-1.5"><AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden />{i}</li>)}
              </ul>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <Field label="Mã động tác" value={current.exerciseCode || EMPTY} mono />
              <Field label="Danh mục" value={detail?.categoryName || (detail ? EMPTY : '...')} />
              <Field label="Góc camera chuẩn" value={current.cameraView ? CAMERA_LABEL[current.cameraView] ?? current.cameraView : EMPTY} />
              <Field label="Kiểu chuyển động" value={detail ? MOVEMENT_LABEL[detail.movementType] ?? detail.movementType : '...'} />
              <Field label="Góc đo chính (3 điểm khớp)" value={detail?.repMetric?.points?.length ? detail.repMetric.points.map((i) => `#${i}`).join(' - ') : detail ? EMPTY : '...'} mono />
              <Field label="Ngưỡng đỉnh / đáy" value={detail?.repTopThreshold != null && detail.repBottomThreshold != null ? `${detail.repTopThreshold}° / ${detail.repBottomThreshold}°` : detail ? EMPTY : '...'} />
              <Field label="Hướng rep" value={detail ? (detail.repDirection === 'ASCENDING_FIRST' ? 'Góc tăng trước' : 'Góc giảm trước') : '...'} />
              <Field label="Thời lượng một rep" value={detail?.minRepDurationMs != null && detail.maxRepDurationMs != null ? `${(detail.minRepDurationMs / 1000).toFixed(1)}s đến ${(detail.maxRepDurationMs / 1000).toFixed(1)}s` : detail ? EMPTY : '...'} />
              <Field label="Độ tin cậy tư thế tối thiểu" value={detail ? pct(detail.minPoseConfidence) : '...'} />
              <Field label="Độ rõ khớp tối thiểu" value={detail ? pct(detail.minLandmarkVisibility) : '...'} />
              <Field label="Nhắc bằng giọng nói" value={detail ? (detail.voiceWarningEnabled ? 'Bật' : 'Tắt') : '...'} />
              <Field label="Nhắc bằng chữ" value={detail ? (detail.textWarningEnabled ? 'Bật' : 'Tắt') : '...'} />
            </div>
            <p className="text-[11px] text-text-secondary">Chỉnh các giá trị này ở tab "Thuật toán Đếm Reps". Thời gian chờ giữa hai lần nhắc được đặt riêng cho từng rule ở tab "Bộ Quy tắc Form".</p>
          </div>
        )}
      </div>
    </div>
  );
}
