import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  X, Info, Ruler, Target, BarChart3, Timer, MessageSquare, FlaskConical, GitBranch, Plus, Trash2, Play, Volume2,
  AlertTriangle, CheckCircle2, Wand2, Send, ShieldCheck, Archive, Undo2, Save, type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../../components/ui/Button";
import {
  motionRulesApi, errorMessage, normalFields, METRIC_LABEL, OPERATOR_LABEL, SEVERITY_STYLE, STATUS_LABEL, STATUS_STYLE,
  type AuditDto, type BandDto, type CatalogDto, type FeedbackTemplateDto, type MeasurementDto, type ProfileDto, type RuleDto,
  type RuleTestResponse, type RuleUpsertRequest, type RuleVersionDto, type Severity, type TestSample,
} from "../api";

interface Props {
  catalog: CatalogDto;
  profile: ProfileDto;
  templates: FeedbackTemplateDto[];
  rule: RuleDto | null;          // null = tạo mới
  onClose: () => void;
  onChanged: (rule: RuleDto | null) => void;   // sau khi lưu / đổi trạng thái (null = đã xoá)
  onTemplatesChanged: () => void;
}

const SEVERITIES: Severity[] = ["INFO", "WARNING", "ERROR", "CRITICAL"];
const SEVERITY_DOT: Record<string, string> = {
  NORMAL: "bg-emerald-500", INFO: "bg-sky-500", WARNING: "bg-amber-500", ERROR: "bg-orange-600", CRITICAL: "bg-rose-600",
};

const SECTIONS: { n: number; title: string; icon: LucideIcon; optional?: boolean }[] = [
  { n: 1, title: "Thông tin rule", icon: Info },
  { n: 2, title: "Phép đo (metric)", icon: Ruler },
  { n: 3, title: "Biên độ chuẩn (NORMAL)", icon: Target },
  { n: 4, title: "Thang mức độ (ngoài chuẩn)", icon: BarChart3, optional: true },
  { n: 5, title: "Thực thi", icon: Timer },
  { n: 6, title: "Phản hồi (feedback code)", icon: MessageSquare },
  { n: 7, title: "Rule Tester", icon: FlaskConical },
  { n: 8, title: "Phiên bản & xuất bản", icon: GitBranch },
];
const sectionId = (n: number) => `motion-rule-sec-${n}`;
const num = (v: string): number | null => (v.trim() === "" || isNaN(Number(v)) ? null : Number(v));
const show = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));

function emptyForm(profile: ProfileDto): RuleUpsertRequest {
  return {
    code: "", name: "", description: "", phase: "ALL", metricType: "ANGLE_3_POINT", measurement: { points: [] }, unit: "DEGREE",
    operator: "BETWEEN", target: null, normalMin: null, normalMax: null, normalMinInclusive: true, normalMaxInclusive: true,
    bands: [], severity: "WARNING", priority: 5, invalidRep: false, invalidRepMinSeverity: null, stopExercise: false,
    persistenceType: "FRAME", persistenceValue: 3, cooldownMs: 3000, evaluationIntervalMs: 0, feedbackCode: "",
    cameraView: profile.cameraView ?? "ANY", sourceType: "COACH_CONFIGURED", sourceReference: "", changeNote: "",
  };
}

function fromRule(r: RuleDto): RuleUpsertRequest {
  return {
    code: r.code, name: r.name, description: r.description ?? "", phase: r.phase, metricType: r.metricType,
    measurement: r.measurement ?? { points: [] }, unit: r.unit, operator: r.operator, target: r.target ?? null,
    normalMin: r.normalMin ?? null, normalMax: r.normalMax ?? null, normalMinInclusive: r.normalMinInclusive,
    normalMaxInclusive: r.normalMaxInclusive, bands: r.bands, severity: r.severity, priority: r.priority,
    invalidRep: r.invalidRep, invalidRepMinSeverity: r.invalidRepMinSeverity ?? null, stopExercise: r.stopExercise,
    persistenceType: r.persistenceType, persistenceValue: r.persistenceValue, cooldownMs: r.cooldownMs,
    evaluationIntervalMs: r.evaluationIntervalMs, feedbackCode: r.feedbackCode ?? "", cameraView: r.cameraView ?? "ANY",
    sourceType: r.sourceType ?? "", sourceReference: r.sourceReference ?? "", changeNote: "",
  };
}

/** Số landmark & cấu hình đo theo metric type (phải khớp MetricEvaluatorFactory ở backend). */
function measurementShape(type: string, m: MeasurementDto) {
  switch (type) {
    case "ANGLE_3_POINT":
    case "ROM":
      return { points: ["A", "B (đỉnh góc)", "C"] };
    case "DISTANCE":
      return { points: ["A", "B"] };
    case "ALIGNMENT":
      return m.method === "AXIS_DEVIATION"
        ? { points: ["Điểm đầu", "Điểm cuối"], method: true, axis: true }
        : { points: ["Điểm đầu", "Điểm giữa", "Điểm cuối"], method: true, extendable: true };
    case "SYMMETRY":
      return { points: ["Trái A", "Trái B", "Trái C"], right: ["Phải A", "Phải B", "Phải C"] };
    case "VELOCITY":
    case "ACCELERATION":
      return { points: ["Landmark"], axis: true };
    case "STABILITY":
      return { points: ["Landmark"], window: true };
    case "LANDMARK_VISIBILITY":
      return { multi: true };
    case "TEMPO":
    case "DURATION":
      return { phase: true };
    default:
      return {};
  }
}

/** Phép đo đã chọn đủ landmark / cấu hình chưa (chỉ để hiển thị tiến độ, backend vẫn validate). */
function measurementComplete(shape: ReturnType<typeof measurementShape>, m: MeasurementDto): boolean {
  const filled = (v: unknown) => v !== undefined && v !== null && !(typeof v === "number" && isNaN(v));
  const pts = m.points ?? [];
  if (shape.points && !shape.points.every((_, i) => filled(pts[i]))) return false;
  if (shape.right && !shape.right.every((_, i) => filled(m.pointsRight?.[i]))) return false;
  if (shape.multi && pts.length === 0) return false;
  if (shape.axis && !m.axis) return false;
  if (shape.phase && !m.phase) return false;
  if (shape.window && !m.windowFrames) return false;
  return true;
}

export function MotionRuleEditor({ catalog, profile, templates, rule, onClose, onChanged, onTemplatesChanged }: Props) {
  const [current, setCurrent] = useState<RuleDto | null>(rule);
  const [form, setForm] = useState<RuleUpsertRequest>(rule ? fromRule(rule) : emptyForm(profile));
  const [saving, setSaving] = useState(false);
  const [tolerance, setTolerance] = useState({ target: "", tol: "" });
  const [ladderStep, setLadderStep] = useState("10");
  const [newTpl, setNewTpl] = useState<{ uiText: string; voiceText: string } | null>(null);
  const [testValue, setTestValue] = useState("");
  const [replay, setReplay] = useState("0:30\n100:30\n200:30\n300:30\n1000:5");
  const [testResult, setTestResult] = useState<RuleTestResponse | null>(null);
  const [versions, setVersions] = useState<RuleVersionDto[]>([]);
  const [audit, setAudit] = useState<AuditDto[]>([]);
  const [note, setNote] = useState("");

  const metric = catalog.metricTypes.find((t) => t.type === form.metricType);
  const shape = measurementShape(form.metricType ?? "", form.measurement ?? {});
  const fields = normalFields(form.operator ?? "");
  const isNew = !current;
  const locked = current?.status === "PUBLISHED" || current?.status === "ARCHIVED";
  const phaseOptions = ["ALL", ...profile.phases.map((p) => p.code)];
  const tpl = templates.find((t) => t.feedbackCode === form.feedbackCode);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(1);

  // Tiến độ từng mục cho thanh điều hướng (null = không đánh giá)
  const sectionDone: Record<number, boolean | null> = {
    1: !!form.code && !!form.name,
    2: measurementComplete(shape, form.measurement ?? {}),
    3: (!fields.target || form.target != null) && (!fields.min || form.normalMin != null) && (!fields.max || form.normalMax != null),
    4: null,
    5: true,
    6: !!tpl,
    7: !!current?.testedSinceLastChange,
    8: null,
  };

  function onBodyScroll() {
    const body = bodyRef.current;
    if (!body) return;
    const top = body.getBoundingClientRect().top;
    let cur = 1;
    for (const s of SECTIONS) {
      const el = document.getElementById(sectionId(s.n));
      if (el && el.getBoundingClientRect().top - top <= 96) cur = s.n;
    }
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - 4) cur = SECTIONS[SECTIONS.length - 1].n;
    setActiveSection(cur);
  }

  const jumpTo = (n: number) => document.getElementById(sectionId(n))?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    if (!current) return;
    motionRulesApi.versions(current.id).then(setVersions).catch(() => setVersions([]));
    motionRulesApi.audit(current.id).then(setAudit).catch(() => setAudit([]));
  }, [current]);

  const set = <K extends keyof RuleUpsertRequest>(k: K, v: RuleUpsertRequest[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setM = (patch: Partial<MeasurementDto>) => setForm((f) => ({ ...f, measurement: { ...(f.measurement ?? {}), ...patch } }));

  function changeMetric(type: string) {
    const mt = catalog.metricTypes.find((t) => t.type === type);
    setForm((f) => ({
      ...f,
      metricType: type,
      measurement: { points: [] },
      unit: mt?.units[0],
      operator: mt && !mt.operators.includes(f.operator ?? "") ? mt.operators[0] : f.operator,
      phase: mt?.timing === "REP" ? "ALL" : f.phase,
      target: type === "REP_SEQUENCE" || type === "REP_VALIDATION" ? 1 : f.target,
    }));
  }

  function setPoint(list: "points" | "pointsRight", i: number, v: string) {
    const arr = [...((form.measurement?.[list] as number[] | undefined) ?? [])];
    arr[i] = Number(v);
    setM({ [list]: arr });
  }

  // Dung sai chỉ là công cụ nhập liệu: Mục tiêu ± dung sai -> điền Normal Min/Max (không lưu dung sai, không dùng lúc chạy)
  function applyTolerance() {
    const t = num(tolerance.target), d = num(tolerance.tol);
    if (t === null || d === null || d < 0) return toast.error("Nhập mục tiêu và dung sai ≥ 0");
    setForm((f) => ({ ...f, operator: "BETWEEN", target: t, normalMin: t - d, normalMax: t + d }));
  }

  // Sinh thang mức độ mặc định quanh biên độ chuẩn: mỗi bậc rộng `step`
  function generateLadder() {
    const step = num(ladderStep);
    if (step === null || step <= 0) return toast.error("Bước thang phải > 0");
    const lo = form.normalMin ?? null, hi = form.normalMax ?? null;
    const bands: BandDto[] = [];
    const op = form.operator;
    const high = hi !== null && ["BETWEEN", "MAXIMUM_ALLOWED", "LESS_THAN", "LESS_THAN_OR_EQUAL", "DEVIATION_FROM_TARGET"].includes(op ?? "");
    const low = lo !== null && ["BETWEEN", "MINIMUM_REQUIRED", "GREATER_THAN", "GREATER_THAN_OR_EQUAL"].includes(op ?? "");
    if (!high && !low) return toast.error("Toán tử này cần nhập dải thủ công");
    if (high && hi !== null) {
      bands.push({ severity: "WARNING", min: hi, max: hi + step, minInclusive: false, maxInclusive: true });
      bands.push({ severity: "ERROR", min: hi + step, max: null, minInclusive: false, maxInclusive: true });
    }
    if (low && lo !== null) {
      bands.push({ severity: "WARNING", min: lo - step, max: lo, minInclusive: true, maxInclusive: false });
      bands.push({ severity: "ERROR", min: null, max: lo - step, minInclusive: true, maxInclusive: false });
    }
    set("bands", bands);
  }

  // Cảnh báo hiển thị cho từng dải (backend vẫn là nơi validate chính thức)
  function bandIssue(b: BandDto): string | null {
    if (b.min == null && b.max == null) return "Dải không có biên (−∞ … +∞) sẽ phủ toàn bộ trục, kể cả vùng chuẩn.";
    if (b.min != null && b.max != null && b.min > b.max) return "Biên “Từ” đang lớn hơn biên “Đến”.";
    if (form.operator === "BETWEEN" && form.normalMin != null && form.normalMax != null) {
      const lo = b.min ?? -Infinity, hi = b.max ?? Infinity;
      if (lo < form.normalMax && hi > form.normalMin) return "Dải chồng lên biên độ chuẩn.";
    }
    if (form.operator === "EQUAL" && form.target != null) {
      const lo = b.min ?? -Infinity, hi = b.max ?? Infinity;
      const inLo = (b.minInclusive ?? true) ? lo <= form.target : lo < form.target;
      const inHi = (b.maxInclusive ?? true) ? hi >= form.target : hi > form.target;
      if (inLo && inHi) return `Dải chứa giá trị chuẩn (${form.target}).`;
    }
    return null;
  }

  function updateBand(i: number, patch: Partial<BandDto>) {
    set("bands", (form.bands ?? []).map((b, j) => (j === i ? { ...b, ...patch } : b)));
  }

  async function save() {
    if (newTpl) return toast.error("Hãy lưu feedback template mới trước");
    setSaving(true);
    try {
      const saved = isNew ? await motionRulesApi.createRule(profile.id, form) : await motionRulesApi.updateRule(current!.id, form);
      if (current && saved.id !== current.id) toast.success(`Đã tạo phiên bản v${saved.version} (DRAFT) — bản đang chạy giữ nguyên`);
      else toast.success("Đã lưu rule");
      setCurrent(saved);
      setForm(fromRule(saved));
      setTestResult(null);
      onChanged(saved);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  // Coach soạn và gửi duyệt; chỉ Admin duyệt (xuất bản / trả lại / lưu trữ). Backend cũng chặn, đây chỉ để không hiện nút không dùng được.
  const isAdmin = useAuth().user?.role === "ADMIN";

  async function workflow(action: "submit-review" | "reject" | "publish" | "archive") {
    if (!current) return;
    try {
      const r = await motionRulesApi.workflow(current.id, action, note || undefined);
      setCurrent(r);
      setNote("");
      onChanged(r);
      toast.success({ "submit-review": "Đã gửi duyệt", reject: "Đã trả lại bản nháp", publish: "Đã xuất bản — rule bắt đầu chạy", archive: "Đã lưu trữ" }[action]);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function remove() {
    if (!current || !confirm(`Xoá bản nháp ${current.code} v${current.version}?`)) return;
    try {
      await motionRulesApi.deleteRule(current.id);
      toast.success("Đã xoá bản nháp");
      onChanged(null);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function runTest(mode: "value" | "replay") {
    if (!current) return;
    try {
      let body: { value?: number; samples?: TestSample[] };
      if (mode === "value") {
        const v = num(testValue);
        if (v === null) return toast.error("Nhập giá trị đo");
        body = { value: v };
      } else {
        const samples = replay.split(/\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
          const [t, v] = l.split(/[:,\s]+/);
          return { t: Number(t), value: v === undefined || v === "-" || v === "" ? null : Number(v) };
        });
        if (samples.some((s) => isNaN(s.t))) return toast.error("Mỗi dòng dạng thời_gian_ms:giá_trị (dùng - nếu không đo được)");
        body = { samples };
      }
      const res = await motionRulesApi.test(current.id, body);
      setTestResult(res);
      if (!locked) {
        const fresh = await motionRulesApi.rule(current.id);
        setCurrent(fresh);
        onChanged(fresh);
      }
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function createTemplate() {
    if (!newTpl || !form.feedbackCode) return;
    try {
      await motionRulesApi.saveTemplate(profile.id, { feedbackCode: form.feedbackCode, uiText: newTpl.uiText, voiceText: newTpl.voiceText });
      setNewTpl(null);
      onTemplatesChanged();
      toast.success("Đã tạo feedback template");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const ladder = useMemo(() => ladderSegments(form), [form]);

  const input = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none disabled:opacity-60";
  const label = "mb-1 block text-[11px] font-bold uppercase tracking-wide text-text-secondary";

  // Portal ra body: tránh bị layout cha (space-y-*, transform, overflow) đẩy lệch overlay
  return createPortal(
    <div className="fixed inset-0 z-50 m-0 flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex h-full max-h-[min(100%,960px)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
        {/* Header (cố định) */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-text-primary">{isNew ? "Rule chẩn đoán form mới" : `${current!.code}`}</h2>
              {current && (
                <>
                  <span className="rounded-lg border border-border px-2 py-0.5 font-mono text-xs font-bold text-text-secondary">v{current.version}</span>
                  <span className={`rounded-lg border px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[current.status]}`}>{STATUS_LABEL[current.status]}</span>
                </>
              )}
            </div>
            <p className="mt-0.5 text-xs text-text-secondary">{profile.exerciseName} · camera {profile.cameraView ?? "?"} · {profile.movementType}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-text-secondary hover:bg-accent-soft hover:text-text-primary" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
        {/* Điều hướng mục (desktop) */}
        <nav className="hidden w-56 shrink-0 overflow-y-auto border-r border-border p-3 lg:block" aria-label="Các mục của rule">
          <ol className="space-y-0.5">
            {SECTIONS.map((s) => {
              const done = sectionDone[s.n];
              const active = activeSection === s.n;
              return (
                <li key={s.n}>
                  <button type="button" onClick={() => jumpTo(s.n)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition-colors ${active ? "bg-accent/15 text-accent" : "text-text-secondary hover:bg-accent-soft hover:text-text-primary"}`}>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black ${done ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : active ? "bg-accent/20" : "bg-border/60"}`}>
                      {done ? <CheckCircle2 size={12} /> : s.n}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{s.title}</span>
                    {s.n === 4 && (form.bands?.length ?? 0) > 0 && <span className="font-mono text-[10px]">{form.bands!.length}</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div ref={bodyRef} onScroll={onBodyScroll} className="min-w-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth">
        {locked && (
          <div className="mx-6 mt-4 flex gap-2 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-700 dark:text-sky-300">
            <Info size={14} className="mt-0.5 shrink-0" />
            Bản này {current!.status === "PUBLISHED" ? "đang chạy" : "đã lưu trữ"} nên không sửa trực tiếp. Lưu thay đổi sẽ tạo phiên bản DRAFT mới; bản đang chạy giữ nguyên tới khi bản mới được duyệt.
          </div>
        )}
        {current?.status === "PENDING_REVIEW" && (
          <div className="mx-6 mt-4 flex gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Đang chờ duyệt. Sửa nội dung sẽ đưa rule về DRAFT và phải chạy Rule Tester, gửi duyệt lại.
          </div>
        )}
        {current?.legacy && (
          <div className="mx-6 mt-4 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-3 text-xs text-fuchsia-700 dark:text-fuchsia-300">
            <b>Rule chuyển từ cấu hình cũ</b> — cấu hình cũ không lưu landmark: {current.legacy.metricType} {current.legacy.operator}{" "}
            [{show(current.legacy.thresholdMin)} … {show(current.legacy.thresholdMax)}]. Hãy chọn phép đo và kiểm tra lại ngưỡng.
          </div>
        )}

        <div className="space-y-5 p-6">
          {/* 1. Thông tin */}
          <Section n={1}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Mã rule</label>
                <input className={`${input} font-mono uppercase`} value={form.code} disabled={!isNew}
                  onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))} placeholder="PUSHUP_ELBOW_FLARE" />
              </div>
              <div>
                <label className={label}>Tên hiển thị</label>
                <input className={input} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Khuỷu tay xòe quá rộng" />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Mô tả (lý do sinh cơ học)</label>
                <textarea className={input} rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>
              <div>
                <label className={label}>Pha áp dụng</label>
                <select className={input} value={form.phase} disabled={metric?.timing === "REP"} onChange={(e) => set("phase", e.target.value)}>
                  {phaseOptions.map((p) => <option key={p} value={p}>{p === "ALL" ? "ALL – mọi pha" : `${p} – ${profile.phases.find((x) => x.code === p)?.name}`}</option>)}
                </select>
                {metric?.timing === "REP" && <p className="mt-1 text-[11px] text-text-secondary">Chỉ số theo rep được xét khi kết thúc rep → pha ALL.</p>}
              </div>
              <div>
                <label className={label}>Góc camera hợp lệ</label>
                <select className={input} value={form.cameraView} onChange={(e) => set("cameraView", e.target.value)}>
                  {catalog.cameraViews.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="mt-1 text-[11px] text-text-secondary">Rule bị bỏ qua (không kết luận sai) khi phiên quay ở góc khác.</p>
              </div>
              <div>
                <label className={label}>Nguồn ngưỡng</label>
                <select className={input} value={form.sourceType} onChange={(e) => set("sourceType", e.target.value)}>
                  <option value="">— chọn —</option>
                  {catalog.sourceTypes.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Tham chiếu nguồn</label>
                <input className={input} value={form.sourceReference} onChange={(e) => set("sourceReference", e.target.value)} placeholder="Tài liệu / HLV / dữ liệu" />
              </div>
            </div>
          </Section>

          {/* 2. Phép đo */}
          <Section n={2}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className={label}>Loại chỉ số</label>
                <select className={input} value={form.metricType} onChange={(e) => changeMetric(e.target.value)}>
                  {catalog.metricTypes.map((t) => <option key={t.type} value={t.type}>{METRIC_LABEL[t.type] ?? t.type} ({t.type}{t.timing === "REP" ? " · theo rep" : ""})</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Đơn vị</label>
                <select className={input} value={form.unit} onChange={(e) => set("unit", e.target.value)}>
                  {(metric?.units ?? []).map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            {metric?.measurementHint && <p className="mt-2 text-xs text-text-secondary">{metric.measurementHint}</p>}

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {shape.method && (
                <div>
                  <label className={label}>Phương pháp</label>
                  <select className={input} value={form.measurement?.method ?? "COLLINEARITY"} onChange={(e) => setM({ method: e.target.value, points: [] })}>
                    <option value="COLLINEARITY">Thẳng hàng (≥3 điểm)</option>
                    <option value="AXIS_DEVIATION">Lệch trục (2 điểm)</option>
                  </select>
                </div>
              )}
              {(shape.points ?? []).map((name, i) => (
                <LandmarkSelect key={`p${i}`} label={name} catalog={catalog} value={form.measurement?.points?.[i]} onChange={(v) => setPoint("points", i, v)} />
              ))}
              {shape.extendable && (form.measurement?.points?.length ?? 0) >= 3 &&
                (form.measurement?.points ?? []).slice(3).map((_, j) => (
                  <LandmarkSelect key={`x${j}`} label={`Điểm thêm ${j + 1}`} catalog={catalog} value={form.measurement?.points?.[3 + j]} onChange={(v) => setPoint("points", 3 + j, v)} />
                ))}
              {(shape.right ?? []).map((name, i) => (
                <LandmarkSelect key={`r${i}`} label={name} catalog={catalog} value={form.measurement?.pointsRight?.[i]} onChange={(v) => setPoint("pointsRight", i, v)} />
              ))}
              {shape.axis && (
                <div>
                  <label className={label}>Trục</label>
                  <select className={input} value={form.measurement?.axis ?? ""} onChange={(e) => setM({ axis: e.target.value || null })}>
                    <option value="">— chọn —</option>
                    <option value="VERTICAL">VERTICAL</option>
                    <option value="HORIZONTAL">HORIZONTAL</option>
                    {form.metricType !== "ALIGNMENT" && <option value="ANY">ANY</option>}
                  </select>
                </div>
              )}
              {shape.window && (
                <div>
                  <label className={label}>Cửa sổ (khung, 3–120)</label>
                  <input className={input} type="number" value={show(form.measurement?.windowFrames)} onChange={(e) => setM({ windowFrames: num(e.target.value) })} />
                </div>
              )}
              {shape.phase && (
                <div>
                  <label className={label}>Pha được đo thời lượng</label>
                  <select className={input} value={form.measurement?.phase ?? ""} onChange={(e) => setM({ phase: e.target.value || null })}>
                    <option value="">— chọn —</option>
                    {profile.phases.map((p) => <option key={p.code} value={p.code}>{p.code} – {p.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            {shape.extendable && (
              <button className="mt-2 text-xs font-bold text-accent" onClick={() => setM({ points: [...(form.measurement?.points ?? []), 0] })}>+ thêm điểm</button>
            )}
            {shape.multi && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {catalog.landmarks.map((l) => {
                  const on = form.measurement?.points?.includes(l.index);
                  return (
                    <button key={l.index} type="button"
                      onClick={() => setM({ points: on ? form.measurement!.points!.filter((p) => p !== l.index) : [...(form.measurement?.points ?? []), l.index] })}
                      className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${on ? "border-accent bg-accent/15 text-accent" : "border-border text-text-secondary"}`}>
                      #{l.index} {l.name}
                    </button>
                  );
                })}
              </div>
            )}
          </Section>

          {/* 3. Chuẩn */}
          <Section n={3}>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className={label}>Toán tử</label>
                <select className={input} value={form.operator} onChange={(e) => set("operator", e.target.value)}>
                  {(metric?.operators ?? []).map((o) => <option key={o} value={o}>{OPERATOR_LABEL[o] ?? o} ({o})</option>)}
                </select>
              </div>
              {fields.target && (
                <div>
                  <label className={label}>Mục tiêu</label>
                  <input className={input} type="number" value={show(form.target)} onChange={(e) => set("target", num(e.target.value))} />
                </div>
              )}
              {fields.min && (
                <div>
                  <label className={label}>Normal Min</label>
                  <div className="flex gap-1">
                    <input className={input} type="number" value={show(form.normalMin)} onChange={(e) => set("normalMin", num(e.target.value))} />
                    <InclusiveToggle value={form.normalMinInclusive ?? true} onChange={(v) => set("normalMinInclusive", v)} side="min" />
                  </div>
                </div>
              )}
              {fields.max && (
                <div>
                  <label className={label}>{form.operator === "DEVIATION_FROM_TARGET" ? "Lệch tối đa" : "Normal Max"}</label>
                  <div className="flex gap-1">
                    <input className={input} type="number" value={show(form.normalMax)} onChange={(e) => set("normalMax", num(e.target.value))} />
                    <InclusiveToggle value={form.normalMaxInclusive ?? true} onChange={(v) => set("normalMaxInclusive", v)} side="max" />
                  </div>
                </div>
              )}
            </div>
            {(metric?.operators ?? []).includes("BETWEEN") && (
              <div className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-border p-3">
                <div className="w-28">
                  <label className={label}>Mục tiêu</label>
                  <input className={input} type="number" value={tolerance.target} onChange={(e) => setTolerance({ ...tolerance, target: e.target.value })} />
                </div>
                <div className="w-28">
                  <label className={label}>± Dung sai</label>
                  <input className={input} type="number" value={tolerance.tol} onChange={(e) => setTolerance({ ...tolerance, tol: e.target.value })} />
                </div>
                <Button size="sm" variant="outline" onClick={applyTolerance}><Wand2 size={13} /> Điền Min/Max</Button>
                <p className="w-full text-[11px] text-text-secondary">Dung sai chỉ hỗ trợ nhập liệu: hệ thống lưu biên độ chuẩn tường minh, không cộng dung sai khi chạy.</p>
              </div>
            )}
          </Section>

          {/* 4. Thang mức độ */}
          <Section n={4}>
            <LadderBar ladder={ladder} />

            {form.unit === "BOOLEAN" && (
              <div className="mt-3 flex gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-700 dark:text-sky-300">
                <Info size={13} className="mt-0.5 shrink-0" />
                Chỉ số dạng BOOLEAN (0/1) thường không cần chia dải — để trống và chọn "Mức khi không chia dải" ở mục 5.
              </div>
            )}

            <div className="mt-4 space-y-2">
              {(form.bands ?? []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-text-secondary">
                  Chưa có dải nào — mọi giá trị ngoài chuẩn nhận mức <b className="text-text-primary">{form.severity}</b> (mục 5).
                </div>
              ) : (
                <>
                  <div className="hidden grid-cols-[150px_1fr_36px] gap-3 px-1 text-[11px] font-bold uppercase tracking-wide text-text-secondary sm:grid">
                    <span>Mức</span>
                    <span>Khoảng giá trị <span className="normal-case font-medium tracking-normal">· bấm [ ] để đổi gồm / không gồm biên</span></span>
                    <span />
                  </div>
                  {(form.bands ?? []).map((b, i) => {
                    const issue = bandIssue(b);
                    return (
                      <div key={i} className="rounded-xl border border-border bg-background p-2">
                        <div className="grid grid-cols-[1fr_36px] items-center gap-2 sm:grid-cols-[150px_1fr_36px] sm:gap-3">
                          <div className="relative col-span-1">
                            <span className={`pointer-events-none absolute left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${SEVERITY_DOT[b.severity] ?? "bg-slate-400"}`} />
                            <select className={`${input} pl-8 font-semibold`} value={b.severity} aria-label="Mức độ"
                              onChange={(e) => updateBand(i, { severity: e.target.value as Severity })}>
                              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary hover:bg-rose-500/10 hover:text-rose-500 sm:order-last"
                            onClick={() => set("bands", (form.bands ?? []).filter((_, j) => j !== i))} aria-label="Xoá dải" title="Xoá dải">
                            <Trash2 size={15} />
                          </button>
                          <div className="col-span-2 flex items-center gap-1.5 sm:col-span-1">
                            <InclusiveToggle value={b.minInclusive ?? true} onChange={(v) => updateBand(i, { minInclusive: v })} side="min" />
                            <input className={`${input} min-w-0 text-center font-mono`} type="number" placeholder="−∞" aria-label="Từ"
                              value={show(b.min)} onChange={(e) => updateBand(i, { min: num(e.target.value) })} />
                            <span className="text-text-secondary">…</span>
                            <input className={`${input} min-w-0 text-center font-mono`} type="number" placeholder="+∞" aria-label="Đến"
                              value={show(b.max)} onChange={(e) => updateBand(i, { max: num(e.target.value) })} />
                            <InclusiveToggle value={b.maxInclusive ?? true} onChange={(v) => updateBand(i, { maxInclusive: v })} side="max" />
                            {form.unit && <span className="hidden w-16 shrink-0 truncate text-[11px] font-semibold text-text-secondary md:inline">{form.unit}</span>}
                          </div>
                        </div>
                        {issue && (
                          <p className="mt-1.5 flex items-center gap-1.5 px-1 text-[11px] text-amber-600 dark:text-amber-400">
                            <AlertTriangle size={12} className="shrink-0" /> {issue}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
              <Button size="sm" variant="outline" onClick={() => set("bands", [...(form.bands ?? []), { severity: "WARNING", min: null, max: null, minInclusive: true, maxInclusive: true }])}>
                <Plus size={13} /> Thêm dải
              </Button>
              <span className="text-xs text-text-secondary">hoặc tự sinh thang với mỗi bậc rộng</span>
              <div className="w-20"><input className={`${input} text-center`} type="number" value={ladderStep} onChange={(e) => setLadderStep(e.target.value)} aria-label="Bước thang" /></div>
              <Button size="sm" variant="outline" onClick={generateLadder}><Wand2 size={13} /> WARNING → ERROR</Button>
            </div>
            <p className="mt-2 text-[11px] text-text-secondary">
              Giá trị rơi vào khoảng trống giữa các dải là UNCLASSIFIED (vùng tím trên thang) và không cảnh báo.
            </p>
          </Section>

          {/* 5. Thực thi */}
          <Section n={5}>
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className={label}>Mức khi không chia dải</label>
                <select className={input} value={form.severity} onChange={(e) => set("severity", e.target.value as Severity)}>
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Ưu tiên (1–10)</label>
                <input className={input} type="number" min={1} max={10} value={show(form.priority)} onChange={(e) => set("priority", num(e.target.value) ?? 1)} />
              </div>
              <div>
                <label className={label}>Duy trì lỗi theo</label>
                <select className={input} value={form.persistenceType} onChange={(e) => set("persistenceType", e.target.value as "FRAME" | "TIME")}>
                  <option value="FRAME">Số khung liên tiếp</option>
                  <option value="TIME">Thời gian (ms)</option>
                </select>
              </div>
              <div>
                <label className={label}>{form.persistenceType === "TIME" ? "Thời gian (ms)" : "Số khung"}</label>
                <input className={input} type="number" value={show(form.persistenceValue)} onChange={(e) => set("persistenceValue", num(e.target.value) ?? 1)} />
              </div>
              <div>
                <label className={label}>Cooldown nhắc lại (ms)</label>
                <input className={input} type="number" value={show(form.cooldownMs)} onChange={(e) => set("cooldownMs", num(e.target.value) ?? 0)} />
              </div>
              <div>
                <label className={label}>Chu kỳ đánh giá (ms, 0 = mọi khung)</label>
                <input className={input} type="number" value={show(form.evaluationIntervalMs)} onChange={(e) => set("evaluationIntervalMs", num(e.target.value) ?? 0)} />
              </div>
              <div className="sm:col-span-2 flex flex-col justify-end gap-2">
                <label className="flex items-center gap-2 text-sm text-text-primary">
                  <input type="checkbox" checked={form.invalidRep ?? false} onChange={(e) => set("invalidRep", e.target.checked)} />
                  Đánh rep không hợp lệ khi vi phạm từ mức
                  <select className="rounded-lg border border-border bg-background px-2 py-1 text-xs" disabled={!form.invalidRep}
                    value={form.invalidRepMinSeverity ?? ""} onChange={(e) => set("invalidRepMinSeverity", (e.target.value || null) as Severity | null)}>
                    <option value="">mọi mức</option>
                    {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-text-primary">
                  <input type="checkbox" checked={form.stopExercise ?? false} onChange={(e) => set("stopExercise", e.target.checked)} />
                  Dừng bài tập khi đạt CRITICAL (an toàn)
                </label>
              </div>
            </div>
          </Section>

          {/* 6. Feedback */}
          <Section n={6}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Feedback code</label>
                <input className={`${input} font-mono uppercase`} list="motion-feedback-codes" value={form.feedbackCode}
                  onChange={(e) => { set("feedbackCode", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_")); setNewTpl(null); }} />
                <datalist id="motion-feedback-codes">
                  {templates.map((t) => <option key={t.id} value={t.feedbackCode}>{t.uiText}</option>)}
                </datalist>
                <p className="mt-1 text-[11px] text-text-secondary">Rule chỉ tham chiếu mã; câu chữ & audio nằm ở template (dùng chung được).</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-3 text-sm">
                {tpl ? (
                  <>
                    <div className="text-text-primary">{tpl.uiText}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                      <Volume2 size={12} /> {tpl.voiceText ?? "— không có câu đọc"}
                      <AudioBadge status={tpl.audioStatus} />
                      {tpl.audioUrl && <button className="text-accent" onClick={() => new Audio(tpl.audioUrl!).play()}><Play size={12} /></button>}
                    </div>
                  </>
                ) : form.feedbackCode ? (
                  newTpl ? (
                    <div className="space-y-2">
                      <input className={input} placeholder="Câu hiển thị" value={newTpl.uiText} onChange={(e) => setNewTpl({ ...newTpl, uiText: e.target.value })} />
                      <input className={input} placeholder="Câu đọc (ngắn, ≤ 200 ký tự)" maxLength={200} value={newTpl.voiceText} onChange={(e) => setNewTpl({ ...newTpl, voiceText: e.target.value })} />
                      <div className="flex gap-2">
                        <Button size="sm" variant="accent" onClick={createTemplate}>Lưu template</Button>
                        <Button size="sm" variant="ghost" onClick={() => setNewTpl(null)}>Huỷ</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 text-xs text-amber-600 dark:text-amber-400">
                      Mã chưa có template.
                      <Button size="sm" variant="outline" onClick={() => setNewTpl({ uiText: "", voiceText: "" })}><Plus size={13} /> Tạo</Button>
                    </div>
                  )
                ) : (
                  <span className="text-xs text-text-secondary">Chọn hoặc nhập feedback code.</span>
                )}
              </div>
            </div>
          </Section>

          {/* 7. Rule Tester */}
          <Section n={7}>
            {isNew ? (
              <p className="text-sm text-text-secondary">Lưu bản nháp trước để chạy thử.</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className={label}>Một giá trị đo ({form.unit})</label>
                  <div className="flex gap-2">
                    <input className={input} type="number" value={testValue} onChange={(e) => setTestValue(e.target.value)} />
                    <Button size="sm" variant="accent" onClick={() => runTest("value")}><Play size={13} /> Thử</Button>
                  </div>
                  <label className={`${label} pt-2`}>Phát lại chuỗi (ms:giá trị, "-" = không đo được)</label>
                  <textarea className={`${input} font-mono`} rows={5} value={replay} onChange={(e) => setReplay(e.target.value)} />
                  <Button size="sm" variant="outline" onClick={() => runTest("replay")}><Play size={13} /> Phát lại (persistence + cooldown)</Button>
                  <p className="text-[11px] text-text-secondary">Tester dùng đúng bộ phân loại, persistence và cooldown của runtime. Thử trên bản lưu gần nhất — hãy lưu trước khi thử.</p>
                </div>
                <div>
                  {testResult ? <TestResultView r={testResult} /> : <p className="text-sm text-text-secondary">Chưa chạy.</p>}
                </div>
              </div>
            )}
          </Section>

          {/* 8. Version & publishing */}
          <Section n={8}>
            {current && (
              <div className="mb-3 space-y-1 text-xs">
                {current.errors.map((e) => <div key={e} className="flex gap-1.5 text-rose-600 dark:text-rose-400"><AlertTriangle size={12} className="mt-0.5 shrink-0" />{e}</div>)}
                {current.warnings.map((w) => <div key={w} className="flex gap-1.5 text-amber-600 dark:text-amber-400"><AlertTriangle size={12} className="mt-0.5 shrink-0" />{w}</div>)}
                {current.errors.length === 0 && <div className="flex gap-1.5 text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={12} className="mt-0.5" />Cấu hình hợp lệ (theo bản đã lưu)</div>}
                <div className={current.testedSinceLastChange ? "text-emerald-600 dark:text-emerald-400" : "text-text-secondary"}>
                  {current.testedSinceLastChange ? `✓ Đã chạy Rule Tester ${fmt(current.lastTestedAt)}` : "Chưa chạy Rule Tester trên nội dung hiện tại (bắt buộc trước khi gửi duyệt)"}
                </div>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Ghi chú thay đổi (lưu)</label>
                <input className={input} value={form.changeNote} onChange={(e) => set("changeNote", e.target.value)} placeholder="Vì sao đổi ngưỡng…" />
              </div>
              <div>
                <label className={label}>Ghi chú duyệt / trả lại</label>
                <input className={input} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
            {current && (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <div className={label}>Các phiên bản</div>
                  <ul className="space-y-1 text-xs">
                    {versions.map((v) => (
                      <li key={v.id} className="flex items-center gap-2">
                        <span className="font-mono font-bold">v{v.version}</span>
                        <span className={`whitespace-nowrap rounded border px-1.5 ${STATUS_STYLE[v.status]}`}>{STATUS_LABEL[v.status]}</span>
                        <span className="truncate text-text-secondary">{v.changeNote ?? ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className={label}>Nhật ký</div>
                  <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
                    {audit.map((a) => (
                      <li key={a.id} className="text-text-secondary">
                        <span className="font-bold text-text-primary">{a.action}</span> · {a.userEmail ?? "?"} · {fmt(a.createdAt)}{a.reason ? ` — ${a.reason}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Section>
        </div>
        </div>
        </div>

        {/* Footer actions (cố định) */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-surface px-6 py-3">
          {isNew && <span className="mr-auto text-xs text-text-secondary">Lưu bản nháp để mở Rule Tester và gửi duyệt.</span>}
          {current && current.errors.length > 0 && (
            <span className="mr-auto flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <AlertTriangle size={13} /> {current.errors.length} lỗi cấu hình (bản đã lưu)
            </span>
          )}
          {current?.status === "DRAFT" && <Button size="sm" variant="ghost" onClick={remove}><Trash2 size={13} /> Xoá nháp</Button>}
          {isAdmin && current && current.status !== "ARCHIVED" && <Button size="sm" variant="ghost" onClick={() => workflow("archive")}><Archive size={13} /> Lưu trữ</Button>}
          {isAdmin && current?.status === "PENDING_REVIEW" && <Button size="sm" variant="outline" onClick={() => workflow("reject")}><Undo2 size={13} /> Trả lại</Button>}
          {isAdmin && current?.status === "PENDING_REVIEW" && <Button size="sm" variant="accent" onClick={() => workflow("publish")}><ShieldCheck size={13} /> Duyệt & xuất bản</Button>}
          {current?.status === "DRAFT" && <Button size="sm" variant="outline" onClick={() => workflow("submit-review")}><Send size={13} /> Gửi duyệt</Button>}
          <Button size="sm" variant="accent" onClick={save} disabled={saving}>
            <Save size={13} /> {isNew ? "Tạo bản nháp" : locked ? "Lưu thành phiên bản mới" : "Lưu"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ============================== Thành phần phụ ==============================

function Section({ n, children }: { n: number; children: ReactNode }) {
  const s = SECTIONS.find((x) => x.n === n)!;
  const Icon = s.icon;
  return (
    <section id={sectionId(n)} className="scroll-mt-4 rounded-2xl border border-border/80 bg-background/40 p-4 sm:p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-text-primary">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/15 text-accent"><Icon size={15} /></span>
        {n}. {s.title}
        {s.optional && <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">Tuỳ chọn</span>}
      </h3>
      {children}
    </section>
  );
}

function LandmarkSelect({ label, catalog, value, onChange }: { label: string; catalog: CatalogDto; value?: number; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-text-secondary">{label}</label>
      <select className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
        value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>— landmark —</option>
        {catalog.landmarks.map((l) => <option key={l.index} value={l.index}>#{l.index} {l.name}</option>)}
      </select>
    </div>
  );
}

function InclusiveToggle({ value, onChange, side }: { value: boolean; onChange: (v: boolean) => void; side: "min" | "max" }) {
  const text = side === "min" ? (value ? "[" : "(") : value ? "]" : ")";
  return (
    <button type="button" title={value ? "Gồm biên" : "Không gồm biên"} onClick={() => onChange(!value)}
      className="w-9 shrink-0 self-stretch rounded-xl border border-border font-mono text-sm font-black text-text-primary hover:border-accent">
      {text}
    </button>
  );
}

function AudioBadge({ status }: { status: string }) {
  const style: Record<string, string> = {
    GENERATED: "text-emerald-600 dark:text-emerald-400",
    NOT_GENERATED: "text-text-secondary",
    OUTDATED: "text-amber-600 dark:text-amber-400",
    NO_VOICE_TEXT: "text-text-secondary",
  };
  const text: Record<string, string> = { GENERATED: "audio sẵn sàng", NOT_GENERATED: "chưa tạo audio", OUTDATED: "audio cũ", NO_VOICE_TEXT: "" };
  return <span className={`font-semibold ${style[status] ?? ""}`}>{text[status] ?? status}</span>;
}

function TestResultView({ r }: { r: RuleTestResponse }) {
  return (
    <div className="space-y-2 text-sm">
      {r.status && (
        <div className="rounded-2xl border border-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-lg border px-2 py-0.5 text-xs font-black ${SEVERITY_STYLE[r.status] ?? ""}`}>{r.status}</span>
            <span className="text-text-secondary">đo {r.observed}{r.evaluated !== r.observed ? ` → xét ${r.evaluated}` : ""} · chuẩn {r.expected}</span>
          </div>
          {r.band && <div className="mt-1 text-xs text-text-secondary">Dải: {r.band}</div>}
          {r.status !== "NORMAL" && r.uiText && <div className="mt-1 text-xs text-text-primary">💬 {r.uiText}</div>}
          <div className="mt-1 text-xs text-text-secondary">
            {r.invalidRep ? "Rep sẽ bị đánh không hợp lệ" : "Không ảnh hưởng tính hợp lệ của rep"}{r.stopExercise ? " · DỪNG BÀI TẬP" : ""}
          </div>
        </div>
      )}
      {r.steps.length > 0 && (
        <div className="max-h-64 overflow-y-auto rounded-2xl border border-border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-surface text-left text-text-secondary">
              <tr><th className="px-2 py-1">t</th><th>Đo</th><th>Phân loại</th><th>Xác nhận</th><th /></tr>
            </thead>
            <tbody>
              {r.steps.map((s, i) => (
                <tr key={i} className="border-t border-border/60" title={s.note}>
                  <td className="px-2 py-1 font-mono">{s.t}</td>
                  <td>{s.observed ?? "–"}</td>
                  <td><span className={`rounded border px-1 ${SEVERITY_STYLE[s.status] ?? ""}`}>{s.status}</span></td>
                  <td>{s.confirmedSeverity ?? "–"}</td>
                  <td>{s.violationFired ? "⚡" : ""}{s.feedbackSpoken ? "🔊" : ""} <span className="text-text-secondary">{s.note ?? ""}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface Segment { from: number; to: number; kind: string }
interface Ladder { segments: Segment[]; ticks: { at: number; value: number }[]; min: number; max: number }

/** Thang trực quan: vùng chuẩn + các dải mức độ trên trục giá trị (toạ độ đã chuẩn hoá 0..1). */
function ladderSegments(f: RuleUpsertRequest): Ladder | null {
  const values: number[] = [];
  const push = (v?: number | null) => { if (v !== null && v !== undefined && isFinite(v)) values.push(v); };
  push(f.normalMin); push(f.normalMax); push(f.target);
  (f.bands ?? []).forEach((b) => { push(b.min); push(b.max); });
  if (values.length === 0) return null;
  const lo = Math.min(...values), hi = Math.max(...values);
  const pad = Math.max((hi - lo) * 0.25, 1);
  const min = lo - pad, max = hi + pad;
  const pos = (v: number) => (v - min) / (max - min);

  // Dải vẽ trước, vùng chuẩn vẽ sau cùng để luôn nhìn thấy kể cả khi bị dải chồng lên
  const segs: Segment[] = (f.bands ?? []).map((b) => ({ from: b.min ?? min, to: b.max ?? max, kind: b.severity }));
  const fl = normalFields(f.operator ?? "");
  const t = f.target;
  switch (f.operator) {
    case "BETWEEN":
      segs.push({ from: f.normalMin ?? min, to: f.normalMax ?? max, kind: "NORMAL" });
      break;
    case "OUTSIDE":
      if (f.normalMin != null) segs.push({ from: min, to: f.normalMin, kind: "NORMAL" });
      if (f.normalMax != null) segs.push({ from: f.normalMax, to: max, kind: "NORMAL" });
      break;
    case "EQUAL":
      if (t != null) segs.push({ from: t, to: t, kind: "NORMAL" });
      break;
    case "NOT_EQUAL":
      if (t != null) segs.push({ from: min, to: t, kind: "NORMAL" }, { from: t, to: max, kind: "NORMAL" });
      break;
    case "DEVIATION_FROM_TARGET":
      segs.push({ from: Math.max(min, 0), to: f.normalMax ?? max, kind: "NORMAL" });
      break;
    default:
      if (fl.min && !fl.max) segs.push({ from: f.normalMin ?? min, to: max, kind: "NORMAL" });
      else if (fl.max && !fl.min) segs.push({ from: min, to: f.normalMax ?? max, kind: "NORMAL" });
  }

  const ticks = [...new Set(values)].sort((a, b) => a - b).map((v) => ({ at: pos(v), value: v }));
  return { segments: segs.map((s) => ({ ...s, from: pos(s.from), to: pos(s.to) })), ticks, min, max };
}

function LadderBar({ ladder }: { ladder: Ladder | null }) {
  if (!ladder) return <p className="rounded-xl border border-dashed border-border p-3 text-xs text-text-secondary">Nhập biên độ chuẩn (mục 3) để xem thang.</p>;
  return (
    <div>
      <div className="relative h-4 overflow-hidden rounded-full bg-fuchsia-500/15" title="Vùng tím = UNCLASSIFIED (không thuộc chuẩn hay dải nào)">
        {ladder.segments.map((s, i) => {
          const from = Math.max(0, Math.min(s.from, s.to)), to = Math.min(1, Math.max(s.from, s.to));
          const point = to - from < 0.01; // vùng chuẩn dạng điểm (EQUAL) → vạch đánh dấu
          return (
            <div key={i} title={s.kind}
              className={`absolute top-0 h-full ${SEVERITY_DOT[s.kind] ?? "bg-slate-400"} ${s.kind === "NORMAL" ? "ring-1 ring-inset ring-white/40" : "opacity-80"}`}
              style={point ? { left: `calc(${from * 100}% - 3px)`, width: 6 } : { left: `${from * 100}%`, width: `${(to - from) * 100}%` }} />
          );
        })}
      </div>
      <div className="relative mt-1 h-4 font-mono text-[10px] text-text-secondary">
        {(ladder.ticks.length <= 8 ? ladder.ticks : [ladder.ticks[0], ladder.ticks[ladder.ticks.length - 1]]).map((tk) => (
          <span key={tk.value} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${tk.at * 100}%` }}>{round(tk.value)}</span>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-secondary">
        {Object.entries(SEVERITY_DOT).map(([k, c]) => <span key={k} className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${c}`} />{k}</span>)}
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-fuchsia-500/40" />UNCLASSIFIED</span>
      </div>
    </div>
  );
}

const round = (v: number) => Math.round(v * 100) / 100;
const fmt = (s?: string) => (s ? new Date(s).toLocaleString("vi-VN") : "");
