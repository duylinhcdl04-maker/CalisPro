import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, RefreshCw, Settings2, ListChecks, MessageSquare, AlertTriangle, Camera, ChevronDown, Volume2, Play, Wand2, Save,
  ShieldAlert, OctagonX, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/Button";
import {
  motionRulesApi, errorMessage, METRIC_LABEL, STATUS_LABEL, STATUS_STYLE, SEVERITY_STYLE,
  type CatalogDto, type FeedbackTemplateDto, type ProfileDto, type ProfileUpsertRequest, type RuleDto, type RuleStatus,
} from "../api";
import { MotionRuleEditor } from "./MotionRuleEditor";
import { AiRuleGeneratorModal } from "./AiRuleGeneratorModal";

interface Props {
  profileId: number;
  allProfiles?: Array<{ id: number; exerciseName: string; exerciseCode: string }>;
  onSelectProfileId?: (id: number) => void;
  /** Tab mở sẵn (vd. "PROFILE" khi đi tới từ cảnh báo thiếu cấu hình đo). */
  initialView?: "RULES" | "PROFILE" | "FEEDBACK";
}

type View = "RULES" | "PROFILE" | "FEEDBACK";
type Filter = "ALL" | RuleStatus | "LEGACY";

/** Motion Rule Engine: cấu hình profile, rule có version / duyệt, feedback template (MOTION_RULE_ENGINE_DESIGN.md). */
export function MotionRuleEnginePanel({ profileId, allProfiles = [], onSelectProfileId, initialView = "RULES" }: Props) {
  const [catalog, setCatalog] = useState<CatalogDto | null>(null);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [rules, setRules] = useState<RuleDto[]>([]);
  const [templates, setTemplates] = useState<FeedbackTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>(initialView);
  const [aiOpen, setAiOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [editing, setEditing] = useState<RuleDto | null | undefined>(undefined);   // undefined = đóng, null = tạo mới

  const loadTemplates = useCallback(() => motionRulesApi.templates(profileId).then(setTemplates).catch(() => setTemplates([])), [profileId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, p, r] = await Promise.all([motionRulesApi.catalog(), motionRulesApi.profile(profileId), motionRulesApi.rules(profileId)]);
      setCatalog(c);
      setProfile(p);
      setRules(r);
      await loadTemplates();
    } catch (e) {
      setError(errorMessage(e, "Không tải được Motion Rule Engine (backend đã khởi động lại bản mới chưa?)"));
    } finally {
      setLoading(false);
    }
  }, [profileId, loadTemplates]);

  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => rules.filter((r) =>
    filter === "ALL" ? true : filter === "LEGACY" ? !!r.legacy : r.status === filter), [rules, filter]);
  const count = (s: Filter) => rules.filter((r) => (s === "LEGACY" ? !!r.legacy : r.status === s)).length;

  function onRuleChanged() {
    motionRulesApi.rules(profileId).then(setRules).catch(() => undefined);
  }

  if (loading && !profile) {
    return <div className="flex h-60 items-center justify-center text-text-secondary"><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Đang tải Motion Rule Engine…</div>;
  }
  if (error || !profile || !catalog) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-700 dark:text-rose-300">
        <div className="flex items-center gap-2 font-bold"><AlertTriangle size={16} /> {error ?? "Không có dữ liệu"}</div>
        <Button size="sm" variant="outline" className="mt-3" onClick={load}><RefreshCw size={13} /> Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-3xl border border-border/80 bg-surface p-5 shadow-elevated">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-accent">Motion Rule Engine</div>
            <h2 className="text-xl font-black text-text-primary">{profile.exerciseName}</h2>
            <p className="text-xs text-text-secondary">
              {profile.profileName} · v{profile.version} · <Camera size={11} className="inline" /> {profile.cameraView ?? "chưa chọn"} · {profile.movementType}
              {" · "}chỉ rule <b>Đang chạy</b> mới được dùng khi tập / đánh giá
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {allProfiles.length > 0 && onSelectProfileId && (
              <div className="relative">
                <select value={profileId} onChange={(e) => onSelectProfileId(Number(e.target.value))}
                  className="appearance-none rounded-xl border border-border bg-background py-2 pl-3 pr-8 text-xs font-bold text-text-primary focus:border-accent focus:outline-none">
                  {allProfiles.map((p) => <option key={p.id} value={p.id}>{p.exerciseName}{p.exerciseCode ? ` (${p.exerciseCode})` : ""}</option>)}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
              </div>
            )}
            <Button size="sm" variant="ghost" onClick={load}><RefreshCw size={13} /></Button>
            <Button size="sm" variant="outline" onClick={() => setAiOpen(true)}><Sparkles size={14} /> AI tạo rule</Button>
            <Button size="sm" variant="accent" onClick={() => setEditing(null)}><Plus size={14} /> Rule mới</Button>
          </div>
        </div>
        {profile.issues.length > 0 && (
          <div className="mt-3 space-y-1 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            {profile.issues.map((i) => <div key={i} className="flex gap-1.5"><AlertTriangle size={12} className="mt-0.5 shrink-0" />{i}</div>)}
          </div>
        )}
        <div className="mt-4 flex gap-1.5 border-t border-border/60 pt-4">
          {([["RULES", "Rule", ListChecks], ["PROFILE", "Cấu hình profile", Settings2], ["FEEDBACK", "Feedback & audio", MessageSquare]] as const).map(([id, text, Icon]) => (
            <button key={id} onClick={() => setView(id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${view === id ? "bg-accent text-white" : "text-text-secondary hover:bg-accent-soft"}`}>
              <Icon size={13} /> {text}
            </button>
          ))}
        </div>
      </div>

      {view === "RULES" && (
        <div className="rounded-3xl border border-border/80 bg-surface p-4 shadow-elevated">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(["ALL", "PUBLISHED", "PENDING_REVIEW", "DRAFT", "ARCHIVED", "LEGACY"] as Filter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-xl border px-3 py-1 text-xs font-bold ${filter === f ? "border-accent bg-accent/10 text-accent" : "border-border text-text-secondary"}`}>
                {f === "ALL" ? `Tất cả (${rules.length})` : f === "LEGACY" ? `Chuyển từ bản cũ (${count(f)})` : `${STATUS_LABEL[f]} (${count(f)})`}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-text-secondary">
                  <th className="py-2">Rule</th><th>Chỉ số</th><th>Pha</th><th>Chuẩn</th><th>Thực thi</th><th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} onClick={() => setEditing(r)} className="cursor-pointer border-t border-border/60 hover:bg-accent-soft/40">
                    <td className="py-2.5 pr-3">
                      <div className="font-mono text-xs font-black text-text-primary">{r.code} <span className="text-text-secondary">v{r.version}</span></div>
                      <div className="text-xs text-text-secondary">{r.name}</div>
                    </td>
                    <td className="pr-3 text-xs">{METRIC_LABEL[r.metricType] ?? r.metricType}{r.cameraView && r.cameraView !== "ANY" ? <span className="ml-1 text-text-secondary">· {r.cameraView}</span> : null}</td>
                    <td className="pr-3 font-mono text-xs">{r.phase}</td>
                    <td className="pr-3 text-xs">
                      {r.expected ?? "—"}
                      {r.bands.length > 0 && (
                        <div className="mt-0.5 flex gap-1">
                          {r.bands.map((b, i) => <span key={i} className={`rounded border px-1 text-[10px] ${SEVERITY_STYLE[b.severity]}`}>{b.severity[0]}</span>)}
                        </div>
                      )}
                    </td>
                    <td className="pr-3 text-xs text-text-secondary">
                      P{r.priority} · {r.persistenceType === "TIME" ? `${r.persistenceValue}ms` : `${r.persistenceValue}f`}
                      {r.invalidRep && <ShieldAlert size={12} className="ml-1 inline text-rose-500" aria-label="Đánh rep không hợp lệ" />}
                      {r.stopExercise && <OctagonX size={12} className="ml-1 inline text-rose-600" aria-label="Dừng bài tập" />}
                    </td>
                    <td className="text-xs">
                      <span className={`rounded-lg border px-2 py-0.5 font-bold ${STATUS_STYLE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                      {r.errors.length > 0 && <div className="mt-0.5 text-[11px] text-rose-500">{r.errors.length} lỗi cấu hình</div>}
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-text-secondary">Không có rule.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "PROFILE" && <ProfileSettings catalog={catalog} profile={profile} onSaved={setProfile} />}
      {view === "FEEDBACK" && <FeedbackTemplates profileId={profileId} templates={templates} onChanged={loadTemplates} />}

      {aiOpen && (
        <AiRuleGeneratorModal profileId={profileId} exerciseName={profile.exerciseName}
          blockedReason={!profile.cameraView || !profile.repMetric || profile.repTopThreshold == null || profile.repBottomThreshold == null
            ? "Hãy cấu hình profile của bài (góc camera, chỉ số đếm rep, ngưỡng đỉnh/đáy) và bấm Lưu profile trước khi nhờ AI soạn rule." : null}
          onClose={() => setAiOpen(false)} onCreated={load} />
      )}

      {editing !== undefined && (
        <MotionRuleEditor catalog={catalog} profile={profile} templates={templates} rule={editing}
          onClose={() => setEditing(undefined)} onChanged={onRuleChanged} onTemplatesChanged={loadTemplates} />
      )}
    </div>
  );
}

// ============================== Profile ==============================

/** Giá trị khởi điểm theo kiểu bài để điền nhanh; chỉ là gợi ý, Coach thử với camera thật rồi chỉnh ngưỡng cho từng bài. */
const PROFILE_PRESETS: { label: string; hint: string; values: Partial<ProfileUpsertRequest> }[] = [
  { label: "Bài đẩy", hint: "push-up, dips, pike push-up", values: { cameraView: "SIDE", movementType: "REPS", repDirection: "DESCENDING_FIRST", repMetric: { points: [11, 13, 15] }, repTopThreshold: 160, repBottomThreshold: 90 } },
  { label: "Bài kéo", hint: "pull-up, chin-up, australian pull-up", values: { cameraView: "SIDE", movementType: "REPS", repDirection: "DESCENDING_FIRST", repMetric: { points: [11, 13, 15] }, repTopThreshold: 160, repBottomThreshold: 70 } },
  { label: "Squat / chân", hint: "squat, lunge", values: { cameraView: "SIDE", movementType: "REPS", repDirection: "DESCENDING_FIRST", repMetric: { points: [23, 25, 27] }, repTopThreshold: 165, repBottomThreshold: 90 } },
  { label: "Giữ tư thế", hint: "plank, hollow hold", values: { cameraView: "SIDE", movementType: "HOLD", repDirection: "DESCENDING_FIRST", repMetric: { points: [11, 23, 27] }, repTopThreshold: 180, repBottomThreshold: 160 } },
];

function ProfileSettings({ catalog, profile, onSaved }: { catalog: CatalogDto; profile: ProfileDto; onSaved: (p: ProfileDto) => void }) {
  const [f, setF] = useState<ProfileUpsertRequest>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setF({
      cameraView: profile.cameraView, movementType: profile.movementType, repMetric: profile.repMetric ?? { points: [11, 13, 15] },
      repTopThreshold: profile.repTopThreshold, repBottomThreshold: profile.repBottomThreshold, repDirection: profile.repDirection,
      debounceTimeMs: profile.debounceTimeMs, minRepDurationMs: profile.minRepDurationMs, maxRepDurationMs: profile.maxRepDurationMs,
      minPoseConfidence: profile.minPoseConfidence, minLandmarkVisibility: profile.minLandmarkVisibility,
      voiceWarningEnabled: profile.voiceWarningEnabled, textWarningEnabled: profile.textWarningEnabled,
    });
  }, [profile]);
  const n = (v: string) => (v === "" ? undefined : Number(v));
  const input = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none";
  const label = "mb-1 block text-[11px] font-bold uppercase tracking-wide text-text-secondary";

  async function save() {
    setSaving(true);
    try {
      onSaved(await motionRulesApi.updateProfile(profile.id, f));
      toast.success("Đã lưu cấu hình profile");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const pts = f.repMetric?.points ?? [];
  return (
    <div className="space-y-4 rounded-3xl border border-border/80 bg-surface p-5 shadow-elevated">
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className={label + " mb-0"}>Điền nhanh theo kiểu bài (giá trị khởi điểm)</div>
          <Button size="sm" variant="accent" onClick={save} disabled={saving}><Save size={13} /> Lưu profile</Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROFILE_PRESETS.map((p) => (
            <button key={p.label} type="button" title={p.hint} onClick={() => setF({ ...f, ...p.values })}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-text-primary hover:border-accent">
              {p.label} <span className="font-medium text-text-secondary">({p.hint})</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-text-secondary">Bấm một kiểu bài để điền các ô bên dưới, rồi kiểm tra và chỉnh theo bài. Các ô chỉ được áp dụng sau khi bấm <b>Lưu profile</b>. Hãy thử với camera thật rồi chỉnh ngưỡng đỉnh/đáy cho đúng biên độ của bài.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={label}>Góc camera chuẩn</label>
          <select className={input} value={f.cameraView ?? ""} onChange={(e) => setF({ ...f, cameraView: e.target.value })}>
            <option value="" disabled>— chọn —</option>
            {catalog.cameraViews.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Kiểu chuyển động</label>
          <select className={input} value={f.movementType} onChange={(e) => setF({ ...f, movementType: e.target.value as "REPS" | "HOLD" })}>
            <option value="REPS">REPS – đếm lần</option>
            <option value="HOLD">HOLD – giữ tĩnh</option>
          </select>
        </div>
        <div>
          <label className={label}>Hướng rep</label>
          <select className={input} value={f.repDirection} onChange={(e) => setF({ ...f, repDirection: e.target.value })}>
            <option value="DESCENDING_FIRST">Góc giảm trước (push-up, squat, dip)</option>
            <option value="ASCENDING_FIRST">Góc tăng trước</option>
          </select>
        </div>
      </div>
      <div>
        <div className={label}>Chỉ số đếm rep / xác định pha — góc 3 điểm</div>
        {!profile.repMetric && <p className="mb-1.5 text-[11px] font-semibold text-amber-600">Bài này chưa lưu chỉ số đếm rep. Ba ô dưới đang hiện gợi ý mặc định (#11, #13, #15), chỉ có hiệu lực sau khi bấm Lưu profile.</p>}
        <div className="grid gap-3 sm:grid-cols-3">
          {["A", "B (đỉnh góc)", "C"].map((name, i) => (
            <select key={i} className={input} value={pts[i] ?? ""} onChange={(e) => {
              const p = [...pts]; p[i] = Number(e.target.value); setF({ ...f, repMetric: { points: p } });
            }} aria-label={name}>
              <option value="" disabled>{name}</option>
              {catalog.landmarks.map((l) => <option key={l.index} value={l.index}>{name}: #{l.index} {l.name}</option>)}
            </select>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        <div><label className={label}>Ngưỡng đỉnh (°)</label><input className={input} type="number" value={f.repTopThreshold ?? ""} onChange={(e) => setF({ ...f, repTopThreshold: n(e.target.value) })} /></div>
        <div><label className={label}>Ngưỡng đáy (°)</label><input className={input} type="number" value={f.repBottomThreshold ?? ""} onChange={(e) => setF({ ...f, repBottomThreshold: n(e.target.value) })} /></div>
        <div><label className={label}>Debounce (ms)</label><input className={input} type="number" value={f.debounceTimeMs ?? ""} onChange={(e) => setF({ ...f, debounceTimeMs: n(e.target.value) })} /></div>
        <div><label className={label}>Rep tối thiểu (ms)</label><input className={input} type="number" value={f.minRepDurationMs ?? ""} onChange={(e) => setF({ ...f, minRepDurationMs: n(e.target.value) })} /></div>
        <div><label className={label}>Rep tối đa (ms)</label><input className={input} type="number" value={f.maxRepDurationMs ?? ""} onChange={(e) => setF({ ...f, maxRepDurationMs: n(e.target.value) })} /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div><label className={label}>Pose confidence tối thiểu</label><input className={input} type="number" step="0.05" min={0} max={1} value={f.minPoseConfidence ?? ""} onChange={(e) => setF({ ...f, minPoseConfidence: n(e.target.value) })} /></div>
        <div><label className={label}>Visibility landmark tối thiểu</label><input className={input} type="number" step="0.05" min={0} max={1} value={f.minLandmarkVisibility ?? ""} onChange={(e) => setF({ ...f, minLandmarkVisibility: n(e.target.value) })} /></div>
        <label className="flex items-end gap-2 pb-2 text-sm text-text-primary"><input type="checkbox" checked={f.voiceWarningEnabled ?? true} onChange={(e) => setF({ ...f, voiceWarningEnabled: e.target.checked })} /> Cảnh báo giọng nói</label>
        <label className="flex items-end gap-2 pb-2 text-sm text-text-primary"><input type="checkbox" checked={f.textWarningEnabled ?? true} onChange={(e) => setF({ ...f, textWarningEnabled: e.target.checked })} /> Cảnh báo chữ</label>
      </div>
      <p className="text-[11px] text-text-secondary">
        Máy trạng thái: SETUP → TOP (≥ đỉnh) → DESCENDING → BOTTOM (≤ đáy) → ASCENDING → TOP = 1 rep. Khung có độ tin cậy thấp không được dùng để kết luận sai form.
      </p>
      <div>
        <div className={label}>Các pha (mã do engine sinh ra)</div>
        <div className="flex flex-wrap gap-1.5">
          {profile.phases.map((p) => <span key={p.code} title={p.description} className="rounded-lg border border-border px-2 py-1 text-xs"><b className="font-mono">{p.code}</b> {p.name}</span>)}
        </div>
      </div>
      <div className="flex justify-end"><Button size="sm" variant="accent" onClick={save} disabled={saving}><Save size={13} /> Lưu profile</Button></div>
    </div>
  );
}

// ============================== Feedback ==============================

function FeedbackTemplates({ profileId, templates, onChanged }: { profileId: number; templates: FeedbackTemplateDto[]; onChanged: () => void }) {
  const [edit, setEdit] = useState<{ id?: number; feedbackCode: string; uiText: string; voiceText: string } | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const input = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none";

  async function save() {
    if (!edit) return;
    try {
      await motionRulesApi.saveTemplate(profileId, { feedbackCode: edit.feedbackCode, uiText: edit.uiText, voiceText: edit.voiceText }, edit.id);
      setEdit(null);
      onChanged();
      toast.success("Đã lưu template");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function generate(t: FeedbackTemplateDto) {
    setBusy(t.id);
    try {
      const r = await motionRulesApi.generateAudio(t.id);
      onChanged();
      toast.success("Đã tạo audio");
      if (r.audioUrl) new Audio(r.audioUrl).play().catch(() => undefined);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const badge: Record<string, string> = {
    GENERATED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    NOT_GENERATED: "border-border text-text-secondary",
    OUTDATED: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    NO_VOICE_TEXT: "border-border text-text-secondary",
  };
  const badgeText: Record<string, string> = { GENERATED: "Có audio", NOT_GENERATED: "Chưa tạo audio", OUTDATED: "Audio cũ – cần tạo lại", NO_VOICE_TEXT: "Không đọc" };

  return (
    <div className="rounded-3xl border border-border/80 bg-surface p-4 shadow-elevated">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-text-secondary">Audio chỉ được tạo tại đây (Viettel AI / cấu hình Voice) và lưu cache — runtime không gọi TTS, thiếu audio thì client tự đọc câu ngắn.</p>
        <Button size="sm" variant="accent" onClick={() => setEdit({ feedbackCode: "", uiText: "", voiceText: "" })}><Plus size={13} /> Template</Button>
      </div>
      {edit && (
        <div className="mb-4 grid gap-2 rounded-2xl border border-accent/40 p-3 sm:grid-cols-[1fr_2fr_2fr_auto]">
          <input className={`${input} font-mono uppercase`} placeholder="FEEDBACK_CODE" disabled={!!edit.id} value={edit.feedbackCode}
            onChange={(e) => setEdit({ ...edit, feedbackCode: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} />
          <input className={input} placeholder="Câu hiển thị" value={edit.uiText} onChange={(e) => setEdit({ ...edit, uiText: e.target.value })} />
          <input className={input} placeholder="Câu đọc (≤ 200 ký tự)" maxLength={200} value={edit.voiceText} onChange={(e) => setEdit({ ...edit, voiceText: e.target.value })} />
          <div className="flex gap-1"><Button size="sm" variant="accent" onClick={save}>Lưu</Button><Button size="sm" variant="ghost" onClick={() => setEdit(null)}>Huỷ</Button></div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-text-secondary"><th className="py-2">Mã</th><th>Câu hiển thị / câu đọc</th><th>Rule dùng</th><th>Audio</th><th /></tr></thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-t border-border/60">
                <td className="py-2 pr-3 font-mono text-xs font-bold">{t.feedbackCode}</td>
                <td className="pr-3 text-xs">
                  <div className="text-text-primary">{t.uiText}</div>
                  <div className="text-text-secondary"><Volume2 size={11} className="inline" /> {t.voiceText ?? "—"}</div>
                </td>
                <td className="pr-3 text-[11px] text-text-secondary">{t.usedByRules.join(", ") || "—"}</td>
                <td className="pr-3"><span className={`rounded-lg border px-2 py-0.5 text-[11px] font-bold ${badge[t.audioStatus]}`}>{badgeText[t.audioStatus]}</span></td>
                <td className="whitespace-nowrap text-right">
                  {t.audioUrl && <Button size="sm" variant="ghost" onClick={() => new Audio(t.audioUrl!).play()}><Play size={12} /></Button>}
                  {t.voiceText && t.audioStatus !== "GENERATED" && (
                    <Button size="sm" variant="outline" disabled={busy === t.id} onClick={() => generate(t)}><Wand2 size={12} /> Tạo audio</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setEdit({ id: t.id, feedbackCode: t.feedbackCode, uiText: t.uiText, voiceText: t.voiceText ?? "" })}>Sửa</Button>
                </td>
              </tr>
            ))}
            {templates.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-sm text-text-secondary">Chưa có template.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
