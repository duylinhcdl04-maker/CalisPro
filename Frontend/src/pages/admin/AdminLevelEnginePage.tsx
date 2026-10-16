import { PARAM_GROUPS, competencyName, goalName, levelName, describeParam, describeRequirement, sourceLabel } from "../../features/level/levelLabels";
import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Copy,
  Play,
  ShieldCheck,
  Save,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Layers,
  SlidersHorizontal,
  Cpu,
  LayoutGrid,
  Sparkles,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Search,
  Plus,
  RefreshCw,
  Target,
  Shield,
  Zap,
  HelpCircle,
  Activity,
  Award,
  ChevronRight,
  FileCode,
  Gauge,
  Scale,
  Lock,
  Edit3,
} from "lucide-react";
import { AdminPageHeader } from "../../components/admin/layout/AdminPageHeader";
import { levelAdminApi, type RuleSetDetail, type SimulateResponse } from "../../features/level/adminApi";
import { apiErrorMessage } from "../../features/level/api";
import { programTemplatesApi } from "../../features/workout-plans/api/programTemplatesApi";

type Tab = "levels" | "params" | "simulate" | "coverage";

const GATE_LABELS: Record<string, { label: string; icon: any; desc: string; color: string }> = {
  COMPETENCY: {
    label: "Cổng Năng lực",
    icon: Target,
    desc: "Điểm năng lực 6 nhóm cơ (PUSH, PULL, CORE, LEGS, MOBILITY, SKILL)",
    color: "from-blue-500/10 to-indigo-500/10 text-blue-500 border-blue-500/30",
  },
  PERFORMANCE: {
    label: "Cổng Thành tích",
    icon: Zap,
    desc: "Số rep hợp lệ hoặc số giây giữ tối thiểu ở các bài kiểm tra chuẩn",
    color: "from-amber-500/10 to-orange-500/10 text-amber-500 border-amber-500/30",
  },
  QUALITY: {
    label: "Cổng Chất lượng",
    icon: Shield,
    desc: "Độ chuẩn form chuyển động (Form Score) và tỷ lệ rep hợp lệ (Valid Ratio)",
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-500 border-emerald-500/30",
  },
  SKILL: {
    label: "Cổng Kỹ năng",
    icon: Award,
    desc: "Kỹ năng tiên quyết bắt buộc đã được mở khóa hoặc xác nhận",
    color: "from-purple-500/10 to-pink-500/10 text-purple-500 border-purple-500/30",
  },
  RELIABILITY: {
    label: "Cổng Độ tin cậy",
    icon: Activity,
    desc: "Độ tin cậy của camera AI Vision và điều kiện ánh sáng lúc đo",
    color: "from-cyan-500/10 to-sky-500/10 text-cyan-500 border-cyan-500/30",
  },
  STABILITY: {
    label: "Cổng Ổn định",
    icon: Scale,
    desc: "Độ bền phong độ qua chuỗi bài tập và lịch sử EWMA",
    color: "from-slate-500/10 to-zinc-500/10 text-slate-500 border-slate-500/30",
  },
};

const LEVEL_THEMES: Record<string, { badgeBg: string; text: string; gradient: string; border: string; desc: string }> = {
  L0: {
    badgeBg: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20",
    text: "text-slate-600 dark:text-slate-300",
    gradient: "from-slate-500/5 via-transparent to-transparent",
    border: "border-slate-500/20 hover:border-slate-500/40",
    desc: "Giai đoạn khởi tạo, làm quen vận động cơ bản và chuẩn bị thể lực nền tảng.",
  },
  L1: {
    badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    text: "text-sky-600 dark:text-sky-400",
    gradient: "from-sky-500/5 via-transparent to-transparent",
    border: "border-sky-500/20 hover:border-sky-500/40",
    desc: "Xây dựng thể lực nền tảng qua chuỗi bài tập cơ bản (Push-up, Row, Squat, Plank).",
  },
  L2: {
    badgeBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    text: "text-indigo-600 dark:text-indigo-400",
    gradient: "from-indigo-500/5 via-transparent to-transparent",
    border: "border-indigo-500/20 hover:border-indigo-500/40",
    desc: "Làm chủ các biến thể chuẩn (Pull-up, Dip, Push-up chuẩn) với số rep chất lượng cao.",
  },
  L3: {
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    gradient: "from-amber-500/5 via-transparent to-transparent",
    border: "border-amber-500/20 hover:border-amber-500/40",
    desc: "Sức mạnh bùng nổ, kiểm soát cơ thể tối ưu và chinh phục các kỹ năng trung cấp.",
  },
  L4: {
    badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    text: "text-purple-600 dark:text-purple-400",
    gradient: "from-purple-500/5 via-transparent to-transparent",
    border: "border-purple-500/20 hover:border-purple-500/40",
    desc: "Cấp độ cao nhất: Chinh phục kỹ năng đỉnh cao (Muscle-up, Front Lever, Handstand).",
  },
};


/** mode="coach": soạn (clone, sửa bản nháp). mode="admin": xem, duyệt và kích hoạt bản nháp (không sửa nội dung). */
export default function AdminLevelEnginePage({ mode = "admin" }: { mode?: "admin" | "coach" }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("levels");
  const list = useQuery({ queryKey: ["rule-sets"], queryFn: levelAdminApi.list });
  const [selected, setSelected] = useState<string | null>(null);
  const currentId = selected ?? list.data?.find((r) => r.status === "ACTIVE")?.id ?? list.data?.[0]?.id ?? null;
  const detail = useQuery({
    queryKey: ["rule-set", currentId],
    queryFn: () => levelAdminApi.detail(currentId!),
    enabled: Boolean(currentId),
  });
  const [draft, setDraft] = useState<RuleSetDetail | null>(null);
  const editing = draft && draft.ruleSet.id === currentId ? draft : null;
  const view = editing ?? detail.data ?? null;
  const exerciseNames = useMemo(() => Object.fromEntries((view?.ladders ?? []).map((n) => [n.exerciseCode, n.exerciseName])), [view]);
  const isDraftStatus = view?.ruleSet.status === "DRAFT";
  const isDraft = isDraftStatus && mode === "coach";   // chỉ Coach được sửa nội dung bản nháp

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["rule-sets"] });
    qc.invalidateQueries({ queryKey: ["rule-set"] });
  };

  const clone = useMutation({
    mutationFn: () => levelAdminApi.clone(currentId!),
    onSuccess: (d) => {
      toast.success(`Đã tạo bản nháp mới v${d.ruleSet.version}`);
      setSelected(d.ruleSet.id);
      setDraft(null);
      refresh();
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Không thể nhân bản rule set")),
  });

  const save = useMutation({
    mutationFn: () =>
      levelAdminApi.update(currentId!, {
        notes: view!.ruleSet.notes,
        params: view!.params,
        ladders: view!.ladders,
        levels: view!.levels,
        consistencyRules: view!.consistencyRules,
      }),
    onSuccess: () => {
      toast.success("Đã lưu thành công các thay đổi bản nháp");
      setDraft(null);
      refresh();
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Không thể lưu bản nháp")),
  });

  const activate = useMutation({
    mutationFn: () => levelAdminApi.activate(currentId!),
    onSuccess: () => {
      toast.success("Đã kích hoạt rule set - Áp dụng ngay cho toàn bộ lượt đánh giá từ bây giờ");
      refresh();
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Không thể kích hoạt rule set")),
  });

  const submit = useMutation({
    mutationFn: () => levelAdminApi.submit(currentId!),
    onSuccess: () => {
      toast.success("Đã gửi Admin duyệt. Admin sẽ được báo ngay.");
      setDraft(null);
      refresh();
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Không thể gửi duyệt")),
  });

  const withdraw = useMutation({
    mutationFn: () => levelAdminApi.withdraw(currentId!),
    onSuccess: () => {
      toast.success("Đã rút lại yêu cầu duyệt. Bạn có thể sửa tiếp bản nháp.");
      refresh();
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Không thể rút lại yêu cầu duyệt")),
  });

  const decide = useMutation({
    mutationFn: (v: { decision: "APPROVED" | "CHANGES_REQUESTED"; notes?: string }) => levelAdminApi.decide(currentId!, v.decision, v.notes),
    onSuccess: (_d, v) => {
      toast.success(v.decision === "APPROVED" ? "Đã duyệt và kích hoạt làm bản chính. Coach đã được báo." : "Đã trả về Coach kèm yêu cầu chỉnh sửa.");
      refresh();
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Không thể xử lý yêu cầu duyệt")),
  });

  const pending = (list.data ?? []).filter((r) => r.status === "PENDING_REVIEW");
  const isPending = view?.ruleSet.status === "PENDING_REVIEW";

  function requestChanges() {
    const notes = window.prompt("Coach cần chỉnh sửa gì? (bắt buộc)");
    if (notes && notes.trim()) decide.mutate({ decision: "CHANGES_REQUESTED", notes: notes.trim() });
  }

  const edit = (fn: (d: RuleSetDetail) => void) => {
    if (!view || !isDraft) return;
    const copy: RuleSetDetail = JSON.parse(JSON.stringify(view));
    fn(copy);
    setDraft(copy);
  };

  const weightSum = useMemo(
    () =>
      (view?.params ?? [])
        .filter((p) => p.key.startsWith("overall.weight."))
        .reduce((a, p) => a + p.value, 0),
    [view]
  );

  const paramRows = useMemo(() => {
    const rows = (view?.params ?? []).map((p, i) => ({ p, i, info: describeParam(p.key) }));
    const order = (g: string) => { const k = (PARAM_GROUPS as readonly string[]).indexOf(g); return k < 0 ? 99 : k; };
    rows.sort((a, b) => order(a.info.group) - order(b.info.group) || a.p.key.localeCompare(b.p.key));
    return rows.map((r, idx) => ({ ...r, showGroup: idx === 0 || rows[idx - 1].info.group !== r.info.group }));
  }, [view]);
  const weightParams = useMemo(
    () => (view?.params ?? []).filter((p) => p.key.startsWith("overall.weight.")),
    [view]
  );

  const activeRuleSet = list.data?.find((r) => r.status === "ACTIVE");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <AdminPageHeader
        title="Quy tắc Level & Lộ trình – 6 cổng thể lực"
        description="Động cơ đánh giá phân bậc thể lực (L0–L4), cơ chế chống tụt hạng đột ngột (Hysteresis & EWMA), điều kiện 6 cổng năng lực và trọng số tính điểm toàn diện."
        badge="AI & Rule Engine"
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Version Switcher */}
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-1.5 shadow-sm">
              <span className="text-xs font-semibold text-text-secondary whitespace-nowrap">Phiên bản:</span>
              <select
                value={currentId ?? ""}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setDraft(null);
                }}
                className="bg-transparent text-xs font-black text-text-primary focus:outline-none cursor-pointer pr-2"
              >
                {(list.data ?? []).map((r) => (
                  <option key={r.id} value={r.id} className="bg-surface text-text-primary">
                    {r.code} v{r.version} · {r.status === "ACTIVE" ? "🟢 ACTIVE" : r.status === "DRAFT" ? "🟡 DRAFT" : r.status === "PENDING_REVIEW" ? "🟠 CHỜ DUYỆT" : "⚪ ARCHIVED"}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            {mode === "coach" && <button
              type="button"
              onClick={() => clone.mutate()}
              disabled={!currentId || clone.isPending}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface hover:bg-surface-elevated px-3.5 py-2 text-xs font-bold text-text-primary shadow-sm hover:border-accent/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <Copy size={14} className="text-text-secondary" />
              <span>Clone thành bản nháp</span>
            </button>}

            {isDraft && (
              <>
                <button
                  type="button"
                  onClick={() => save.mutate()}
                  disabled={!editing || save.isPending}
                  className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>Lưu thay đổi nháp</span>
                </button>

                <button
                  type="button"
                  onClick={() => submit.mutate()}
                  disabled={Boolean(editing) || submit.isPending}
                  title={editing ? "Hãy lưu thay đổi nháp trước khi gửi duyệt" : "Gửi cho Admin duyệt và kích hoạt"}
                  className="inline-flex items-center gap-2 rounded-2xl bg-accent hover:bg-accent-strong px-4 py-2 text-xs font-black text-white shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  <ShieldCheck size={14} />
                  <span>Gửi Admin duyệt</span>
                </button>


              </>
            )}
            {isPending && mode === "coach" && (
              <button
                type="button"
                onClick={() => withdraw.mutate()}
                disabled={withdraw.isPending}
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 transition-all cursor-pointer"
              >
                <span>Rút lại yêu cầu duyệt</span>
              </button>
            )}
            {isPending && mode === "admin" && (
              <>
                <button
                  type="button"
                  onClick={() => decide.mutate({ decision: "APPROVED" })}
                  disabled={decide.isPending}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-black text-white shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  <ShieldCheck size={14} />
                  <span>Duyệt & kích hoạt</span>
                </button>
                <button
                  type="button"
                  onClick={requestChanges}
                  disabled={decide.isPending}
                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                >
                  <span>Yêu cầu chỉnh sửa</span>
                </button>
              </>
            )}
            {isDraftStatus && mode === "admin" && (
              <button
                type="button"
                onClick={() => activate.mutate()}
                disabled={Boolean(editing) || activate.isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-accent hover:bg-accent-strong px-4 py-2 text-xs font-black text-white shadow-md shadow-accent/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck size={14} />
                <span>Kích hoạt phiên bản này</span>
              </button>
            )}
          </div>
        }
      />

      {mode === "admin" && pending.length > 0 && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3.5 text-xs text-orange-700 dark:text-orange-300">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="font-bold">{pending.length} bản Level Engine đang chờ bạn duyệt:</span>
          {pending.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => { setSelected(r.id); setDraft(null); }}
              className="rounded-lg border border-orange-500/40 bg-surface px-2.5 py-1 font-black hover:bg-orange-500/10 cursor-pointer"
            >
              v{r.version}{r.submittedAt ? ` · gửi ${new Date(r.submittedAt).toLocaleString("vi-VN")}` : ""}
            </button>
          ))}
        </div>
      )}

      {/* Alert Notices */}
      {list.isError && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-500">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Không thể tải danh sách rule set</div>
            <div>{apiErrorMessage(list.error, (list.error as Error)?.message ?? "Lỗi không xác định")}</div>
            {(list.error as { response?: { status?: number } })?.response?.status === 404 && (
              <div className="mt-1 font-semibold text-rose-400">
                Backend đang chạy chưa có API Level Engine. Hãy kiểm tra kết nối máy chủ.
              </div>
            )}
          </div>
        </div>
      )}

      {list.isSuccess && list.data.length === 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-600 dark:text-amber-300">
          <Info size={18} className="shrink-0" />
          <span>Chưa có rule set nào. Rule set mặc định LEVEL_ENGINE v1 sẽ được tự động khởi tạo khi backend hoạt động.</span>
        </div>
      )}

      {/* Key Metric Ribbon / Rule Set Status Summary */}
      {view && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Version & Status */}
          <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col justify-between space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
              <span>Trạng thái phiên bản</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${view.ruleSet.status === "ACTIVE"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : view.ruleSet.status === "DRAFT"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : "bg-slate-500/15 text-slate-500 border border-slate-500/30"
                  }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${view.ruleSet.status === "ACTIVE"
                    ? "bg-emerald-500 animate-pulse"
                    : view.ruleSet.status === "DRAFT"
                      ? "bg-amber-500"
                      : "bg-slate-400"
                    }`}
                />
                {view.ruleSet.status}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-text-primary tracking-tight">
                {view.ruleSet.code} v{view.ruleSet.version}
              </span>
              {view.ruleSet.status === "ACTIVE" ? (
                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                  <Lock size={12} /> Bất biến
                </span>
              ) : view.ruleSet.status === "ARCHIVED" ? (
                <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                  <Lock size={12} /> Đã lưu trữ
                </span>
              ) : isDraft ? (
                <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                  <Edit3 size={12} /> Cho phép sửa
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                  <Edit3 size={12} /> Chờ Admin duyệt
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-secondary line-clamp-1">
              {view.ruleSet.notes || "Quy tắc phân bậc tiêu chuẩn cho Calisthenics."}
            </p>
          </div>

          {/* Card 2: 6 Gates Engine */}
          <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col justify-between space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
              <span>Kiến trúc đánh giá</span>
              <ShieldCheck size={16} className="text-accent" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-text-primary">6 Cổng Độc Lập</span>
              <span className="text-xs font-bold text-accent">L0 ➔ L4</span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Năng lực · Thành tích · Chất lượng · Kỹ năng · Tin cậy · Ổn định
            </p>
          </div>

          {/* Card 3: Weight Balance */}
          <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col justify-between space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
              <span>Tổng trọng số Overall</span>
              <Scale
                size={16}
                className={Math.abs(weightSum - 1) < 0.001 ? "text-emerald-500" : "text-rose-500"}
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-text-primary">{(weightSum * 100).toFixed(1)}%</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${Math.abs(weightSum - 1) < 0.001
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-500"
                  }`}
              >
                {Math.abs(weightSum - 1) < 0.001 ? "Chuẩn 100%" : "Chưa cân bằng"}
              </span>
            </div>
            <p className="text-[11px] text-text-secondary">
              {weightParams.length} nhóm năng lực cấu thành điểm tổng thể
            </p>
          </div>

          {/* Card 4: Stability Mechanism */}
          <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col justify-between space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
              <span>Cơ chế bảo vệ Level</span>
              <Gauge size={16} className="text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-text-primary">Hysteresis & EWMA</span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Ngăn ngừa rớt hạng do phong độ thất thường hoặc biến động ngắn hạn.
            </p>
          </div>
        </div>
      )}

      {/* Status Mode Banner */}
      {view && (
        <div
          className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${isDraft
            ? "bg-amber-500/5 border-amber-500/30 text-amber-900 dark:text-amber-200"
            : "bg-accent/5 border-accent/25 text-text-primary"
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 ${isDraft ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-accent/20 text-accent"
                }`}
            >
              {isDraft ? <Edit3 size={18} /> : <Lock size={18} />}
            </div>
            <div>
              <div className="font-black text-sm">
                {isDraft
                  ? "Bạn đang ở chế độ chỉnh sửa Bản nháp (DRAFT)"
                  : isPending
                    ? `Bản ${view.ruleSet.code} v${view.ruleSet.version} đang chờ Admin duyệt`
                    : isDraftStatus
                    ? `Bản nháp ${view.ruleSet.code} v${view.ruleSet.version} do Coach soạn, chưa gửi duyệt`
                    : view.ruleSet.status === "ARCHIVED"
                      ? `Phiên bản cũ ${view.ruleSet.code} v${view.ruleSet.version} (đã lưu trữ, chỉ xem)`
                      : `Đang xem phiên bản chuẩn ${view.ruleSet.code} v${view.ruleSet.version} (ACTIVE - Bất biến)`}
              </div>
              <p className="text-text-secondary mt-0.5">
                {isDraft
                  ? "Các thông số và ngưỡng bên dưới có thể chỉnh sửa trực tiếp. Hãy kiểm tra mô phỏng trước khi Kích hoạt."
                  : isPending
                    ? (mode === "admin"
                      ? "Xem xét các thông số, chạy mô phỏng rồi bấm 'Duyệt & kích hoạt' để áp dụng làm bản chính, hoặc 'Yêu cầu chỉnh sửa' để trả về Coach kèm lý do."
                      : "Bạn không sửa được trong lúc chờ duyệt. Cần chỉnh thêm thì bấm 'Rút lại yêu cầu duyệt'.")
                    : isDraftStatus
                    ? "Bản nháp này chưa được Coach gửi duyệt nên Admin chưa kích hoạt được."
                    : view.ruleSet.status === "ARCHIVED"
                      ? "Phiên bản này đã được thay thế và chỉ giữ lại để truy vết. Muốn dùng lại, hãy clone thành bản nháp mới."
                      : "Bản ACTIVE được bảo vệ tính toàn vẹn dữ liệu học viên. Để tùy chỉnh thông số, Coach bấm 'Clone thành bản nháp', sửa rồi chờ Admin kích hoạt."}
              </p>
            </div>
          </div>
          {isDraft && (
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => save.mutate()}
                disabled={!editing || save.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition cursor-pointer disabled:opacity-50"
              >
                <Save size={13} /> Lưu nháp
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modern Underline Tab Navigation */}
      <div className="border-b border-border/80 mt-6 mb-8">
        <div className="flex items-center gap-2 sm:gap-6 no-scrollbar">
          {[
            {
              key: "levels",
              label: "Level & Điều kiện 6 Cổng",
              icon: Target,
              badge: `${view?.levels.length ?? 5} Levels`,
            },
            {
              key: "params",
              label: "Tham số & Trọng số",
              icon: SlidersHorizontal,
              badge: `${view?.params.length ?? 0} Params`,
            },
            {
              key: "simulate",
              label: "Mô phỏng Sandbox",
              icon: Cpu,
              badge: "AI Tester",
            },
            {
              key: "coverage",
              label: "Ma trận Độ phủ Giáo án",
              icon: LayoutGrid,
              badge: "Curriculum",
            },
          ].map(({ key, label, icon: Icon, badge }) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key as Tab)}
                className={`group relative flex items-center gap-2.5 px-4 py-3.5 text-xs font-black transition-all cursor-pointer whitespace-nowrap border-b-2 -mb-[2px] ${isActive
                  ? "border-accent text-accent font-black"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border font-bold"
                  }`}
              >
                <Icon size={16} className={isActive ? "text-accent" : "text-text-secondary group-hover:text-text-primary"} />
                <span>{label}</span>
                {badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive
                      ? "bg-accent/15 text-accent border border-accent/20"
                      : "bg-surface-elevated text-text-secondary border border-border"
                      }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: LEVELS & GATES */}
      {view && tab === "levels" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-base font-black text-text-primary tracking-tight">
                Danh sách 5 Cấp độ Thể lực (L0 – L4)
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Mỗi cấp độ yêu cầu vượt qua đồng thời ngưỡng điểm tổng thể và các cổng kiểm duyệt thành phần.
              </p>
            </div>
            <span className="rounded-full bg-accent/10 border border-accent/20 px-3 py-1 text-xs font-bold text-accent">
              Chuẩn 5 Level (L0 – L4)
            </span>
          </div>

          <div className="space-y-4">
            {view.levels.map((l, li) => {
              const theme = LEVEL_THEMES[l.code] || LEVEL_THEMES.L0;
              const nextLevel = view.levels[li + 1];

              return (
                <div
                  key={l.code}
                  className={`rounded-3xl border ${theme.border} bg-surface overflow-hidden shadow-sm transition-all`}
                >
                  {/* Card Header with Level Identity */}
                  <div className={`p-5 bg-gradient-to-r ${theme.gradient} border-b border-border/60`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black ${theme.badgeBg} border shadow-inner`}
                        >
                          <span className="text-base leading-none">{l.code}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 mt-0.5">
                            Rank {l.rank}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-lg font-black text-text-primary tracking-tight">{l.name}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${theme.badgeBg} border`}>
                              {l.code}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-1">
                            {l.description || theme.desc}
                          </p>
                        </div>
                      </div>

                      {/* Thresholds / Hysteresis Controls */}
                      {l.rank > 0 && (
                        <div className="flex flex-wrap items-center gap-2.5 bg-background/80 backdrop-blur-sm p-2 rounded-2xl border border-border text-xs">
                          {/* Promote threshold */}
                          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <TrendingUp size={14} className="shrink-0" />
                            <span className="font-semibold text-[11px]">Lên khi Overall ≥</span>
                            {isDraft ? (
                              <input
                                type="number"
                                value={l.promoteMin}
                                onChange={(e) =>
                                  edit((d) => {
                                    d.levels[li].promoteMin = Number(e.target.value);
                                  })
                                }
                                className="w-14 rounded-lg border border-emerald-500/40 bg-surface px-1.5 py-0.5 text-xs font-black text-emerald-600 dark:text-emerald-400 focus:outline-none"
                              />
                            ) : (
                              <span className="font-black text-xs">{l.promoteMin}</span>
                            )}
                          </div>

                          {/* Regress threshold */}
                          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                            <TrendingDown size={14} className="shrink-0" />
                            <span className="font-semibold text-[11px]">Tụt khi EWMA &lt;</span>
                            {isDraft ? (
                              <input
                                type="number"
                                value={l.regressBelow}
                                onChange={(e) =>
                                  edit((d) => {
                                    d.levels[li].regressBelow = Number(e.target.value);
                                  })
                                }
                                className="w-14 rounded-lg border border-rose-500/40 bg-surface px-1.5 py-0.5 text-xs font-black text-rose-600 dark:text-rose-400 focus:outline-none"
                              />
                            ) : (
                              <span className="font-black text-xs">{l.regressBelow}</span>
                            )}
                          </div>

                          {/* Buffer Zone */}
                          <div className="px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
                            Vùng đệm ổn định:{" "}
                            <span className="font-bold text-text-primary">
                              {l.regressBelow} – {nextLevel?.promoteMin ?? 100}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gates Requirements Grid */}
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {["COMPETENCY", "PERFORMANCE", "QUALITY", "SKILL"].map((g) => {
                        const reqs = l.requirements.map((r, ri) => ({ r, ri })).filter(({ r }) => r.gate === g);
                        if (reqs.length === 0) return null;
                        const gateMeta = GATE_LABELS[g] || { label: g, icon: Target, desc: "", color: "text-accent" };
                        const GateIcon = gateMeta.icon;

                        return (
                          <div
                            key={g}
                            className="rounded-2xl border border-border bg-background/50 hover:bg-background p-3.5 transition flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg bg-surface border border-border ${gateMeta.color}`}>
                                  <GateIcon size={14} />
                                </div>
                                <div>
                                  <span className="font-black text-xs text-text-primary">{gateMeta.label}</span>
                                  <span className="ml-2 text-[10px] font-semibold text-text-secondary">
                                    ({reqs.length} điều kiện)
                                  </span>
                                </div>
                              </div>
                            </div>

                            <ul className="space-y-2 text-xs">
                              {reqs.map(({ r, ri }) => (
                                <li
                                  key={ri}
                                  className="flex items-center justify-between gap-3 p-2 rounded-xl bg-surface border border-border/70 hover:border-accent/30 transition"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                    <span className="font-semibold text-text-primary">{describeRequirement(r, exerciseNames)}</span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="rounded-md bg-background px-1.5 py-0.5 text-[9px] font-bold text-text-secondary border border-border">
                                      <span title={sourceLabel(r.sourceType).hint}>{sourceLabel(r.sourceType).label}</span>
                                    </span>

                                    {isDraft && r.gate !== "SKILL" && (
                                      <input
                                        type="number"
                                        step="0.05"
                                        value={r.value}
                                        onChange={(e) =>
                                          edit((d) => {
                                            d.levels[li].requirements[ri].value = Number(e.target.value);
                                          })
                                        }
                                        className="w-16 rounded-lg border border-accent/40 bg-background px-2 py-0.5 text-xs font-bold text-accent text-right focus:outline-none"
                                      />
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PARAMS & WEIGHTS */}
      {view && tab === "params" && (
        <div className="space-y-6">
          {/* Weight Gauge Summary Card */}
          <div className="rounded-3xl border border-border bg-surface p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-text-primary">Phân bổ Trọng số Điểm Tổng Thể (Overall)</h3>
                <p className="text-xs text-text-secondary">
                  Tổng trọng số các nhóm năng lực phải bằng chính xác 1.0 (100%) để điểm tính đúng theo phân phối chuẩn.
                </p>
              </div>
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-black self-start sm:self-auto ${Math.abs(weightSum - 1) < 0.001
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-500"
                  }`}
              >
                {Math.abs(weightSum - 1) < 0.001 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>Tổng = {weightSum.toFixed(3)} / 1.000</span>
              </div>
            </div>

            {/* Visual Bar Breakdown */}
            <div className="space-y-2">
              <div className="h-3 w-full rounded-full bg-background overflow-hidden flex border border-border">
                {weightParams.map((p, idx) => {
                  const colors = [
                    "bg-blue-500",
                    "bg-sky-500",
                    "bg-indigo-500",
                    "bg-purple-500",
                    "bg-amber-500",
                    "bg-emerald-500",
                    "bg-rose-500",
                  ];
                  const color = colors[idx % colors.length];
                  const pct = Math.max(0, p.value * 100);
                  return (
                    <div
                      key={p.key}
                      style={{ width: `${pct}%` }}
                      className={`${color} transition-all duration-300 relative group`}
                      title={`${p.key}: ${(p.value * 100).toFixed(1)}%`}
                    />
                  );
                })}
              </div>

              {/* Weight Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {weightParams.map((p, idx) => {
                  const colors = [
                    "text-blue-500 border-blue-500/30 bg-blue-500/5",
                    "text-sky-500 border-sky-500/30 bg-sky-500/5",
                    "text-indigo-500 border-indigo-500/30 bg-indigo-500/5",
                    "text-purple-500 border-purple-500/30 bg-purple-500/5",
                    "text-amber-500 border-amber-500/30 bg-amber-500/5",
                    "text-emerald-500 border-emerald-500/30 bg-emerald-500/5",
                    "text-rose-500 border-rose-500/30 bg-rose-500/5",
                  ];
                  const theme = colors[idx % colors.length];
                  const cleanKey = competencyName(p.key.replace("overall.weight.", "").toUpperCase());
                  return (
                    <div
                      key={p.key}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold ${theme}`}
                    >
                      <span>{cleanKey}:</span>
                      <span className="font-black font-mono">{(p.value * 100).toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Parameters Data Table */}
          <div className="rounded-3xl border border-border bg-surface overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-surface-elevated/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-text-primary">Tham số tính toán</h3>
                <p className="text-[11px] text-text-secondary">Các con số điều khiển cách chấm điểm, lên/xuống level và chọn giáo án, xếp theo nhóm. Mã kỹ thuật hiện nhỏ bên dưới tên gọi.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-background/60 border-b border-border text-text-secondary font-bold">
                    <th className="p-3 pl-4">Tham số</th>
                    <th className="p-3 w-48">Giá trị</th>
                    <th className="p-3 w-40">Nguồn</th>
                    <th className="p-3 pr-4">Giải thích & tài liệu tham chiếu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paramRows.map(({ p, i, info, showGroup }) => (
                    <Fragment key={p.key}>
                    {showGroup && (
                      <tr className="bg-background/70">
                        <td colSpan={4} className="px-4 py-2 text-[11px] font-black uppercase tracking-wide text-accent-strong">{info.group}</td>
                      </tr>
                    )}
                    <tr className="hover:bg-surface-elevated/50 transition">
                      <td className="p-3 pl-4">
                        <div className="font-bold text-text-primary text-[13px]">{info.title}</div>
                        <div className="mt-0.5 font-mono text-[10px] text-text-secondary/80">{p.key}</div>
                      </td>
                      <td className="p-3">
                        {isDraft ? (
                          <input
                            type="number"
                            step="0.01"
                            value={p.value}
                            onChange={(e) =>
                              edit((d) => {
                                d.params[i].value = Number(e.target.value);
                              })
                            }
                            className="w-28 rounded-xl border border-accent/40 bg-background px-2.5 py-1 text-xs font-black text-accent focus:outline-none"
                          />
                        ) : (
                          <span className="font-black font-mono text-text-primary text-sm">{p.value}</span>
                        )}
                        {info.unit && <span className="ml-1.5 text-[11px] font-semibold text-text-secondary">{info.unit}</span>}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-background text-text-secondary border border-border">
                          {sourceLabel(p.sourceType).label}
                        </span>
                      </td>
                      <td className="p-3 pr-4 text-[11px] text-text-secondary">
                        {info.help && <div className="text-text-primary/80">{info.help}</div>}
                        {p.sourceReference ? <div className={info.help ? "mt-0.5" : ""}>{p.sourceReference}</div> : !info.help ? "—" : null}
                      </td>
                    </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SIMULATOR */}
      {tab === "simulate" && <Simulator ruleSetId={currentId} />}

      {/* TAB 4: COVERAGE MATRIX */}
      {tab === "coverage" && <Coverage mode={mode} />}
    </div>
  );
}

/* =========================================================================
   COMPONENTS: SIMULATOR (Sandbox chẩn đoán & kiểm thử)
   ========================================================================= */

function Simulator({ ruleSetId }: { ruleSetId: string | null }) {
  const [level, setLevel] = useState("L1");
  const [status, setStatus] = useState("VERIFIED");
  const [comps, setComps] = useState<Record<string, number>>({
    PUSH: 62,
    PULL: 38,
    LEGS: 60,
    CORE: 55,
    MOBILITY: 55,
    SKILL: 30,
  });

  const [tests, setTests] = useState(
    JSON.stringify(
      [
        { exerciseCode: "push-up", totalReps: 28, validReps: 25, formScore: 81 },
        { exerciseCode: "pull-up", totalReps: 4, validReps: 3, formScore: 81 },
      ],
      null,
      2
    )
  );

  const [res, setRes] = useState<SimulateResponse | null>(null);

  const run = useMutation({
    mutationFn: () =>
      levelAdminApi.simulate({
        ruleSetId: ruleSetId ?? undefined,
        currentLevel: level,
        status,
        competencies: comps,
        tests: JSON.parse(tests),
      }),
    onSuccess: (data) => {
      setRes(data);
      toast.success("Mô phỏng thành công!");
    },
    onError: (e) =>
      toast.error(
        e instanceof SyntaxError
          ? "Dữ liệu bài test không đúng định dạng JSON hợp lệ"
          : apiErrorMessage(e, "Không thể chạy mô phỏng")
      ),
  });

  return (
    <div className="space-y-6">
      {/* Sandbox Control Deck */}
      <div className="rounded-3xl border border-border bg-surface p-5 space-y-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Cpu size={18} className="text-accent" />
              <h3 className="text-base font-black text-text-primary">Mô Phỏng Chẩn Đoán Đánh Giá Thể Lực (Sandbox)</h3>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Chạy giả lập Level Engine trên rule set đang chọn (bao gồm bản DRAFT). Không ghi vào cơ sở dữ liệu thật.
            </p>
          </div>

          <button
            type="button"
            onClick={() => run.mutate()}
            disabled={run.isPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent hover:bg-accent-strong px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-accent/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play size={14} className={run.isPending ? "animate-spin" : "fill-current"} />
            <span>{run.isPending ? "Đang đánh giá..." : "Chạy Mô Phỏng Ngay"}</span>
          </button>
        </div>

        {/* Level & Status Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-text-primary">Level Hiện Tại</label>
            <div className="flex gap-1.5">
              {["L0", "L1", "L2", "L3", "L4"].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer ${level === l
                    ? "bg-accent text-white shadow-sm"
                    : "bg-background hover:bg-surface-elevated text-text-secondary border border-border"
                    }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-text-primary">Trạng Thái Hồ Sơ</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-2.5 font-semibold text-text-primary focus:outline-none"
            >
              <option value="VERIFIED">VERIFIED (Đã xác thực)</option>
              <option value="PROVISIONAL">PROVISIONAL (Tạm thời)</option>
              <option value="RETURNING">RETURNING (Quay trở lại)</option>
            </select>
          </div>
        </div>

        {/* Competencies Sliders & Inputs */}
        <div className="space-y-2">
          <label className="font-bold text-xs text-text-primary">Điểm Năng Lực 6 Nhóm Cơ (0 – 100)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.keys(comps).map((c) => (
              <div
                key={c}
                className="rounded-2xl border border-border bg-background p-3 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
                  <span>{c}</span>
                  <span className="font-mono text-accent font-black">{comps[c]}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={comps[c]}
                  onChange={(e) => setComps({ ...comps, [c]: Number(e.target.value) })}
                  className="w-full accent-accent cursor-pointer h-1.5 bg-surface rounded-lg"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={comps[c]}
                  onChange={(e) => setComps({ ...comps, [c]: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs font-black text-text-primary text-center"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Test Results Payload */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-bold text-text-primary flex items-center gap-1.5">
              <FileCode size={14} className="text-text-secondary" />
              <span>Kết quả bài test thực hiện (JSON)</span>
            </label>
            <span className="text-[11px] text-text-secondary">exerciseCode, totalReps, validReps, formScore</span>
          </div>
          <textarea
            rows={4}
            value={tests}
            onChange={(e) => setTests(e.target.value)}
            className="w-full rounded-2xl border border-border bg-background p-3 font-mono text-xs text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Simulation Result HUD */}
      {res && (
        <div className="rounded-3xl border border-border bg-surface p-5 space-y-5 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary">
                Kết Quả Đánh Giá Mô Phỏng
              </span>
              <div className="flex items-center gap-3 mt-1">
                <div className="text-2xl font-black text-text-primary">
                  Overall: <span className="text-accent">{res.overallScore ?? "–"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-black bg-background px-3 py-1 rounded-xl border border-border">
                  <span className="text-text-secondary">{res.evaluation.previousLevel ?? level}</span>
                  <ArrowRight size={14} className="text-accent" />
                  <span className="text-accent">{res.evaluation.finalLevel}</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${res.evaluation.decision === "PROMOTE"
                    ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                    : res.evaluation.decision === "REGRESS"
                      ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                      : "bg-blue-500/15 text-blue-500 border border-blue-500/30"
                    }`}
                >
                  {res.evaluation.decision}
                </span>
              </div>
            </div>

            {res.evaluation.candidateLevel && (
              <div className="text-xs text-text-secondary bg-background px-3 py-2 rounded-xl border border-border">
                Ứng viên đề xuất: <span className="font-black text-text-primary">{res.evaluation.candidateLevel}</span>
              </div>
            )}
          </div>

          {/* 6 Gates Status Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-text-primary">Trạng Thái 6 Cổng Đánh Giá (Gates):</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {Object.entries(res.evaluation.gates).map(([g, s]) => {
                const isPass = s === "PASS";
                const isFail = s === "FAIL";
                const Icon = isPass ? CheckCircle2 : isFail ? XCircle : MinusCircle;
                const gateMeta = GATE_LABELS[g] || { label: g };

                return (
                  <div
                    key={g}
                    className={`rounded-2xl border p-3 flex flex-col items-center justify-center text-center space-y-1 ${isPass
                      ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : isFail
                        ? "bg-rose-500/5 border-rose-500/30 text-rose-500"
                        : "bg-background border-border text-text-secondary"
                      }`}
                  >
                    <Icon size={18} />
                    <span className="text-xs font-black">{gateMeta.label}</span>
                    <span className="text-[10px] font-bold uppercase">{s}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Decision Reasons */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-text-primary">Chi Tiết Lý Do & Bằng Chứng:</h4>
            <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
              {res.evaluation.reasons.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2.5 text-xs p-2 rounded-xl ${r.passed ? "bg-surface text-text-primary" : "bg-rose-500/10 text-rose-500 font-semibold"
                    }`}
                >
                  {r.passed ? (
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <span>{r.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   COMPONENTS: COVERAGE MATRIX (Độ phủ giáo án)
   ========================================================================= */

function Coverage({ mode }: { mode: "admin" | "coach" }) {
  const q = useQuery({ queryKey: ["template-coverage"], queryFn: programTemplatesApi.coverage });

  if (q.isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-12 text-center text-xs text-text-secondary flex flex-col items-center gap-3">
        <RefreshCw size={24} className="animate-spin text-accent" />
        <span>Đang tính toán ma trận độ phủ giáo án...</span>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-xs text-rose-500 flex items-center gap-3">
        <AlertTriangle size={18} className="shrink-0" />
        <span>{apiErrorMessage(q.error, "Không thể tải ma trận độ phủ giáo án")}</span>
      </div>
    );
  }

  const { levels, goals, days, cells } = q.data;
  const cell = (l: string, g: string, d: number) =>
    cells.find((c) => c.level === l && c.goal === g && c.daysPerWeek === d);

  const totalCells = levels.length * goals.length * days.length;
  const coveredCells = cells.filter((c) => c.templateCount > 0).length;
  const missingCells = totalCells - coveredCells;
  const coverageRate = Math.round((coveredCells / Math.max(1, totalCells)) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-xs text-text-secondary">
        <Info size={16} className="mt-0.5 shrink-0 text-accent" />
        <div className="space-y-1">
          <p className="font-bold text-text-primary">Cách đọc ma trận</p>
          <p>
            Mỗi ô là <b>số giáo án mẫu đã xuất bản</b> có thể dùng cho một học viên ở <b>level</b> đó, theo <b>mục tiêu</b> đó và <b>số buổi tập mỗi tuần</b> đó.
            Ô <b className="text-emerald-600 dark:text-emerald-400">xanh</b> là đã có giáo án; ô <b className="text-rose-500">đỏ (0)</b> là còn thiếu, khi đó hệ thống dùng
            khung giáo án dự phòng theo level. Đưa chuột vào ô để xem tên các giáo án.
          </p>
          <p>Chỉ giáo án ở trạng thái <b>đã xuất bản</b> mới được tính; bản nháp và bản chờ duyệt chưa tính.</p>
        </div>
      </div>

      {/* Executive Coverage Overview Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-border bg-surface p-5 space-y-1 shadow-sm">
          <span className="text-xs text-text-secondary font-medium">Độ phủ giáo án toàn hệ thống</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">{coverageRate}%</span>
            <span className="text-xs font-bold text-emerald-500">
              {coveredCells}/{totalCells} ô có giáo án
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-background overflow-hidden mt-2">
            <div
              style={{ width: `${coverageRate}%` }}
              className="h-full bg-accent rounded-full transition-all duration-500"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-5 space-y-1 shadow-sm">
          <span className="text-xs text-text-secondary font-medium">Ô đã có giáo án</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {coveredCells} <span className="text-xs text-text-secondary font-normal">tổ hợp level · mục tiêu · số buổi</span>
          </div>
          <p className="text-[11px] text-text-secondary">Học viên ở các tổ hợp này được gán giáo án mẫu phù hợp.</p>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-5 space-y-1 shadow-sm">
          <span className="text-xs text-text-secondary font-medium">Ô còn thiếu giáo án</span>
          <div className="text-2xl font-black text-rose-500">
            {missingCells} <span className="text-xs text-text-secondary font-normal">tổ hợp</span>
          </div>
          <p className="text-[11px] text-text-secondary">Các tổ hợp này đang dùng khung giáo án dự phòng theo level.</p>
        </div>
      </div>

      {/* Heatmap Grid per Level */}
      <div className="space-y-6">
        {levels.map((l) => (
          <div key={l} className="rounded-3xl border border-border bg-surface overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-surface-elevated/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center font-black text-xs">
                  {l}
                </div>
                <h3 className="text-sm font-black text-text-primary">
                  Level {l}{levelName(l) ? ` · ${levelName(l)}` : ""} – giáo án theo mục tiêu và số buổi/tuần
                </h3>
              </div>

              {mode === "coach" && <Link
                to="/coach/plans/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-surface-elevated text-[11px] font-bold text-text-primary transition"
              >
                <Plus size={12} />
                <span>Soạn giáo án cho {l}</span>
              </Link>}
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border text-text-secondary font-bold">
                    <th className="p-2.5 pl-3">Mục tiêu tập luyện</th>
                    {days.map((d) => (
                      <th key={d} className="p-2.5 text-center w-24">
                        {d} buổi/tuần
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {goals.map((g) => (
                    <tr key={g} className="hover:bg-surface-elevated/30 transition">
                      <td className="p-2.5 pl-3"><div className="font-semibold text-text-primary">{goalName(g)}</div><div className="font-mono text-[10px] text-text-secondary/80">{g}</div></td>
                      {days.map((d) => {
                        const c = cell(l, g, d);
                        const count = c?.templateCount ?? 0;
                        const isCovered = count > 0;

                        return (
                          <td key={d} className="p-2 text-center">
                            <div
                              title={c?.templates.length ? `${count} giáo án: ${c.templates.join(", ")}` : "Chưa có giáo án đã xuất bản cho tổ hợp này"}
                              className={`mx-auto w-16 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${isCovered
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                }`}
                            >
                              {isCovered ? (
                                <>
                                  <CheckCircle2 size={12} />
                                  <span>{count}</span>
                                </>
                              ) : (
                                <span>0</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
