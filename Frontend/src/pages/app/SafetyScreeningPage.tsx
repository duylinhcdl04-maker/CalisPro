import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Info, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { CONSTRAINT_LABEL, FLAG_LABEL } from "../../features/safety-screening/labels";
import { parseApiError, safetyApi, type Clearance, type SafetyStatus, type ScreeningQuestion } from "../../features/safety-screening/api";

const STATUS_VIEW: Record<string, { title: string; text: string; cls: string }> = {
  CLEARED: {
    title: "Không có hạn chế riêng",
    text: "Dựa trên câu trả lời của bạn, hệ thống không đặt thêm hạn chế nào cho việc tập luyện.",
    cls: "border-emerald-500/30 bg-emerald-500/10",
  },
  REVIEW_REQUIRED: {
    title: "Nên tham khảo ý kiến chuyên gia",
    text: "Một số bài và mức cường độ sẽ được giới hạn để an toàn cho bạn. Bạn vẫn tập được trong các giới hạn này.",
    cls: "border-amber-500/30 bg-amber-500/10",
  },
  RESTRICTED: {
    title: "Chỉ tập nội dung nền tảng, cường độ thấp",
    text: "Câu trả lời của bạn cho thấy cần thận trọng hơn. Muốn nới hạn chế, hãy nhờ Huấn luyện viên xác minh.",
    cls: "border-rose-500/30 bg-rose-500/10",
  },
};

const CLEARANCE_LABEL: Record<string, string> = {
  REQUESTED: "Đang chờ Huấn luyện viên", UNDER_REVIEW: "Đang được xem xét", GRANTED: "Đã được chấp thuận", REJECTED: "Không được chấp thuận",
};

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "–");
type Answers = Record<string, string | string[]>;

export default function SafetyScreeningPage() {
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ["safety-status"], queryFn: safetyApi.status, retry: false });
  const clearances = useQuery({
    queryKey: ["safety-clearances"], queryFn: safetyApi.clearances, retry: false,
    enabled: status.isSuccess && status.data !== null && status.data.status !== "CLEARED",
  });
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [missing, setMissing] = useState<string[]>([]);

  const start = useMutation({
    mutationFn: async () => {
      const s = await safetyApi.start();
      const q = await safetyApi.questions(s.sessionId);
      return { s, q };
    },
    onSuccess: ({ s, q }) => {
      setSessionId(s.sessionId);
      setQuestions(q.questions);
      setAnswers(Object.fromEntries(Object.entries(q.answers ?? {}).map(([k, v]) => [k, v as string | string[]])));
      setMissing([]);
    },
    onError: (e) => toast.error(parseApiError(e, "Không bắt đầu được sàng lọc").message),
  });

  const submit = useMutation({
    mutationFn: async () => {
      const list = Object.entries(answers).map(([questionCode, value]) => ({ questionCode, value }));
      const saved = await safetyApi.saveAnswers(sessionId!, list);
      if (saved.requiredRemaining.length > 0) return { remaining: saved.requiredRemaining, result: null };
      return { remaining: [] as string[], result: await safetyApi.complete(sessionId!) };
    },
    onSuccess: ({ remaining, result }) => {
      if (!result) { setMissing(remaining); toast.warning("Còn câu bắt buộc chưa trả lời"); return; }
      setSessionId(null);
      void qc.invalidateQueries({ queryKey: ["safety-status"] });
      void qc.invalidateQueries({ queryKey: ["safety-clearances"] });
    },
    onError: (e) => toast.error(parseApiError(e, "Không lưu được câu trả lời").message),
  });

  const acknowledge = useMutation({
    mutationFn: safetyApi.acknowledge,
    onSuccess: () => { toast.success("Đã ghi nhận bạn đã đọc khuyến nghị"); void qc.invalidateQueries({ queryKey: ["safety-status"] }); },
    onError: (e) => toast.error(parseApiError(e, "Không ghi nhận được").message),
  });

  const requestClearance = useMutation({
    mutationFn: safetyApi.requestClearance,
    onSuccess: () => { toast.success("Đã gửi yêu cầu cho Huấn luyện viên"); void qc.invalidateQueries({ queryKey: ["safety-clearances"] }); },
    onError: (e) => toast.error(parseApiError(e, "Không gửi được yêu cầu").message),
  });

  // Chưa có màn hình nào khác dẫn vào đây: tự mở bảng câu hỏi khi người dùng chưa từng sàng lọc
  const neverScreened = status.isSuccess && status.data === null;
  useEffect(() => {
    if (neverScreened && sessionId === null && !start.isPending && !start.isSuccess && !start.isError) start.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [neverScreened]);

  if (status.isLoading) return <div className="grid place-items-center p-16"><Loader2 className="animate-spin text-text-secondary" /></div>;

  const answering = sessionId !== null;
  const featureOff = status.isError;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 md:p-6">
      <header>
        <h1 className="font-display text-2xl font-black text-text-primary">Sàng lọc an toàn</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Vài câu hỏi để biết bạn nên tập thế nào cho an toàn. <b>Đây không phải chẩn đoán y tế</b> và không ảnh hưởng điểm thể lực hay level của bạn.
        </p>
      </header>

      {featureOff && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />Tính năng sàng lọc an toàn chưa được bật.
        </p>
      )}

      {answering && (
        <form
          className="space-y-5"
          onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}
        >
          {questions.map((q) => (
            <QuestionBlock
              key={q.code}
              q={q}
              value={answers[q.code]}
              missing={missing.includes(q.code)}
              onChange={(v) => { setAnswers((a) => ({ ...a, [q.code]: v })); setMissing((m) => m.filter((c) => c !== q.code)); }}
            />
          ))}
          <Button type="submit" variant="accent" disabled={submit.isPending}>
            {submit.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <ShieldCheck size={15} aria-hidden />}Xem kết quả
          </Button>
        </form>
      )}

      {!answering && status.data && (
        <ResultView
          status={status.data}
          clearances={clearances.data ?? []}
          busy={acknowledge.isPending || requestClearance.isPending}
          onAcknowledge={() => acknowledge.mutate()}
          onRequestClearance={() => requestClearance.mutate()}
          onRescreen={() => start.mutate()}
          rescreening={start.isPending}
        />
      )}

      {neverScreened && !answering && start.isError && (
        <Button variant="accent" onClick={() => start.mutate()}>Thử lại</Button>
      )}
    </div>
  );
}

function QuestionBlock({ q, value, missing, onChange }: { q: ScreeningQuestion; value: string | string[] | undefined; missing: boolean; onChange: (v: string | string[]) => void }) {
  const multi = q.inputType === "MULTIPLE_CHOICE";
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  function toggle(code: string) {
    if (!multi) { onChange(code); return; }
    // "Không có" loại trừ các lựa chọn còn lại và ngược lại
    if (code === "NONE") { onChange(["NONE"]); return; }
    const next = selected.filter((c) => c !== "NONE");
    onChange(next.includes(code) ? next.filter((c) => c !== code) : [...next, code]);
  }

  return (
    <fieldset className={`space-y-2 rounded-2xl border p-4 ${missing ? "border-rose-500/50" : "border-border"} bg-surface`}>
      <legend className="px-1 text-sm font-bold text-text-primary">{q.text}{q.required && <span className="text-rose-500"> *</span>}</legend>
      {q.instruction && <p className="text-xs text-text-secondary">{q.instruction}</p>}
      <div className="flex flex-wrap gap-2">
        {q.options.map((o) => {
          const on = selected.includes(o.code);
          return (
            <button
              key={o.code}
              type="button"
              role={multi ? "checkbox" : "radio"}
              aria-checked={on}
              onClick={() => toggle(o.code)}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition ${on ? "border-accent bg-accent text-white" : "border-border bg-background text-text-primary hover:border-accent"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {missing && <p className="text-xs text-rose-500">Câu này bắt buộc.</p>}
    </fieldset>
  );
}

function ResultView(props: {
  status: SafetyStatus; clearances: Clearance[]; busy: boolean; rescreening: boolean;
  onAcknowledge: () => void; onRequestClearance: () => void; onRescreen: () => void;
}) {
  const { status: s } = props;
  const view = STATUS_VIEW[s.status] ?? { title: s.status, text: "", cls: "border-border bg-surface" };
  const open = props.clearances.some((c) => c.status === "REQUESTED" || c.status === "UNDER_REVIEW");
  return (
    <section className="space-y-4">
      <div className={`rounded-2xl border p-4 ${view.cls}`}>
        <div className="flex items-center gap-2 font-display text-lg font-black text-text-primary">
          {s.status === "CLEARED" ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Info size={18} />}{view.title}
        </div>
        <p className="mt-1 text-sm text-text-secondary">{view.text}</p>
        <p className="mt-2 text-xs text-text-secondary">
          Có hiệu lực đến {fmtDate(s.validUntil)}{s.expired ? " (đã hết hạn, hãy sàng lọc lại)" : ""}.
          {s.clearanceMethod === "COACH_VERIFIED" && " Đã được Huấn luyện viên xác minh."}
        </p>
      </div>

      {s.activeFlags.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text-secondary">Điểm cần lưu ý</div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-text-primary">
            {s.activeFlags.map((f) => <li key={f.code}>{FLAG_LABEL[f.code] ?? f.code}</li>)}
          </ul>
        </div>
      )}

      {s.constraints.filter((c) => CONSTRAINT_LABEL[c]).length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text-secondary">Giới hạn đang áp dụng khi tập</div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-text-primary">
            {s.constraints.filter((c) => CONSTRAINT_LABEL[c]).map((c) => <li key={c}>{CONSTRAINT_LABEL[c]}</li>)}
          </ul>
        </div>
      )}

      {s.constraints.includes("ADVISORY_PROFESSIONAL_CONSULT") && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          Câu trả lời của bạn cho thấy nên tham khảo ý kiến chuyên gia y tế hoặc vận động trước khi tập cường độ cao. Đây không phải chẩn đoán.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {s.status !== "CLEARED" && !s.acknowledged && (
          <Button variant="accent" onClick={props.onAcknowledge} disabled={props.busy}>
            <CheckCircle2 size={15} aria-hidden />Tôi đã đọc khuyến nghị
          </Button>
        )}
        {s.status !== "CLEARED" && s.acknowledged && <span className="text-xs font-semibold text-emerald-600">✓ Bạn đã xác nhận đã đọc. Việc này không gỡ các giới hạn ở trên.</span>}
        {s.status !== "CLEARED" && !open && (
          <Button variant="outline" onClick={props.onRequestClearance} disabled={props.busy}>
            <UserCheck size={15} aria-hidden />Nhờ Huấn luyện viên xác minh
          </Button>
        )}
        <Button variant="ghost" onClick={props.onRescreen} disabled={props.rescreening}>Sàng lọc lại</Button>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-secondary">
        Bước tiếp theo: <Link to="/assessment/initial" className="font-bold text-accent underline">khảo sát năng lực ban đầu</Link>. Kết quả sàng lọc không chặn bước này.
      </div>

      {props.clearances.length > 0 && (
        <ul className="space-y-1 text-xs text-text-secondary">
          {props.clearances.map((c) => (
            <li key={c.id}>Yêu cầu xác minh {fmtDate(c.requestedAt)}: <b className="text-text-primary">{CLEARANCE_LABEL[c.status] ?? c.status}</b>{c.note ? ` · ${c.note}` : ""}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
