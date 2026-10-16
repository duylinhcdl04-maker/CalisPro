import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { initialApi, type AnswerValue, type InitialQuestion, type InitialResult } from "../../features/assessment-v2/initialApi";
import { parseApiError } from "../../features/safety-screening/api";

type Answers = Record<string, AnswerValue>;

const COMPETENCY_LABEL: Record<string, string> = {
  PUSH: "Sức mạnh đẩy", PULL: "Sức mạnh kéo", LEGS: "Chân", CORE: "Thân giữa", SKILL: "Kỹ năng", MOBILITY: "Linh hoạt",
};
const QUALITY_LABEL: Record<string, string> = {
  HIGH: "Dữ liệu đầy đủ", MEDIUM: "Dữ liệu khá đầy đủ", LOW: "Dữ liệu còn ít", CONFLICTED: "Một số câu trả lời mâu thuẫn nhau",
};

const isAnswered = (v: AnswerValue | undefined) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "" && !Number.isNaN(v));

export default function InitialAssessmentV2Page() {
  const qc = useQueryClient();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<InitialQuestion[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [sectionIdx, setSectionIdx] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);
  const [result, setResult] = useState<InitialResult | null>(null);

  // Bắt đầu hoặc tiếp tục phiên; trả về các câu đang hiển thị (câu có điều kiện phụ thuộc đáp án trước)
  const start = useQuery({
    queryKey: ["v2-initial-start"],
    queryFn: async () => {
      const s = await initialApi.start();
      const q = await initialApi.questions(s.sessionId);
      return { s, q };
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    gcTime: 0,
  });

  // đồng bộ state cục bộ một lần khi dữ liệu khởi tạo về
  useEffect(() => {
    if (!start.data) return;
    const { s, q } = start.data;
    setSessionId(s.sessionId);
    setQuestions(q.questions);
    setAnswers(q.answers ?? {});
    // tiếp tục từ phần đầu tiên còn thiếu câu bắt buộc
    const secs = groupSections(q.questions);
    const firstOpen = secs.findIndex((sec) => sec.questions.some((x) => x.required && !isAnswered(q.answers?.[x.code])));
    setSectionIdx(firstOpen < 0 ? Math.max(0, secs.length - 1) : firstOpen);
  }, [start.data]);

  const sections = useMemo(() => groupSections(questions), [questions]);
  const section = sections[Math.min(sectionIdx, Math.max(0, sections.length - 1))];

  const save = useMutation({
    mutationFn: async (finish: boolean) => {
      const list = Object.entries(answers).filter(([, v]) => isAnswered(v)).map(([questionCode, value]) => ({ questionCode, value }));
      const saved = await initialApi.saveAnswers(sessionId!, list);
      const fresh = await initialApi.questions(sessionId!);
      // Câu hỏi có điều kiện (vd: số lần của bài vừa chọn) chỉ xuất hiện SAU khi lưu đáp án trước: phải ở lại phần này để trả lời nốt
      const kept = Object.fromEntries(Object.entries(answers).filter(([k]) => !saved.removedQuestions.includes(k)));
      const secs = groupSections(fresh.questions);
      const lacking = (sec: { questions: InitialQuestion[] }) => sec.questions.filter((q) => q.required && !isAnswered(kept[q.code]));
      const current = secs.findIndex((s) => s.title === section?.title);
      const firstOpen = secs.findIndex((s) => lacking(s).length > 0);
      const stayAt = current >= 0 && lacking(secs[current]).length > 0 ? current : finish ? firstOpen : -1;
      if (stayAt >= 0) return { fresh, kept, stayAt, result: null as InitialResult | null };
      return { fresh, kept, stayAt: -1, result: finish ? await initialApi.complete(sessionId!) : null };
    },
    onSuccess: ({ fresh, kept, stayAt, result: res }, finish) => {
      setQuestions(fresh.questions);
      setAnswers(kept);
      if (stayAt >= 0) {
        setSectionIdx(stayAt);
        setMissing([]);
        toast.info("Có thêm câu hỏi tuỳ theo câu trả lời của bạn");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (finish && res) {
        setResult(res);
        void qc.invalidateQueries({ queryKey: ["v2-level"] });
      } else {
        setSectionIdx((i) => i + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    onError: (e) => toast.error(parseApiError(e, "Không lưu được câu trả lời").message),
  });

  function next() {
    const lacking = (section?.questions ?? []).filter((q) => q.required && !isAnswered(answers[q.code])).map((q) => q.code);
    setMissing(lacking);
    if (lacking.length > 0) { toast.warning("Còn câu bắt buộc chưa trả lời"); return; }
    save.mutate(sectionIdx >= sections.length - 1);
  }

  // Lỗi khi bắt đầu: dẫn sang sàng lọc an toàn nếu chưa làm
  const blocker = start.isError ? parseApiError(start.error, "Không bắt đầu được khảo sát") : null;

  if (start.isLoading) return <div className="grid place-items-center p-16"><Loader2 className="animate-spin text-text-secondary" /></div>;

  if (result) return <ResultView result={result} />;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 md:p-6">
      <header>
        <h1 className="font-display text-2xl font-black text-text-primary">Khảo sát năng lực ban đầu</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Dữ liệu <b>tự khai báo</b> dùng để xếp level <b>tạm thời</b>. Level chính thức sẽ được xác nhận bằng bài đo thực hành. Hãy trả lời trung thực để lộ trình phù hợp với bạn.
        </p>
      </header>

      {blocker && (
        <p className="flex flex-wrap items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            {blocker.message}.{" "}
            {blocker.code === "SAFETY_SCREENING_REQUIRED" && <Link to="/safety-screening" className="font-bold underline">Mở trang sàng lọc an toàn</Link>}
            {blocker.code === "INITIAL_ALREADY_DONE" && <Link to="/assessment/baseline" className="font-bold underline">Đo thực hành để xác nhận level</Link>}
            {blocker.code === "INITIAL_ALREADY_VERIFIED" && <Link to="/assessment/periodic" className="font-bold underline">Đến trang đo định kỳ</Link>}
          </span>
        </p>
      )}

      {section && (
        <>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-text-secondary">
              <span>Phần {Math.min(sectionIdx + 1, sections.length)} / {sections.length}</span>
              <span>{section.title}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${((Math.min(sectionIdx, sections.length - 1) + 1) / sections.length) * 100}%` }} />
            </div>
          </div>

          {section.questions.map((q) => (
            <QuestionBlock
              key={q.code}
              q={q}
              value={answers[q.code]}
              missing={missing.includes(q.code)}
              onChange={(v) => { setAnswers((a) => ({ ...a, [q.code]: v })); setMissing((m) => m.filter((c) => c !== q.code)); }}
            />
          ))}

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={() => { setSectionIdx((i) => Math.max(0, i - 1)); setMissing([]); }} disabled={sectionIdx === 0 || save.isPending}>
              <ArrowLeft size={15} aria-hidden />Quay lại
            </Button>
            <Button variant="accent" onClick={next} disabled={save.isPending}>
              {save.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : sectionIdx >= sections.length - 1 ? <CheckCircle2 size={15} aria-hidden /> : <ArrowRight size={15} aria-hidden />}
              {sectionIdx >= sections.length - 1 ? "Hoàn tất và xem kết quả" : "Tiếp tục"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function groupSections(questions: InitialQuestion[]): { title: string; questions: InitialQuestion[] }[] {
  const out: { title: string; questions: InitialQuestion[] }[] = [];
  for (const q of questions) {
    const title = q.section || "Câu hỏi";
    const last = out[out.length - 1];
    if (last && last.title === title) last.questions.push(q);
    else out.push({ title, questions: [q] });
  }
  return out;
}

function QuestionBlock({ q, value, missing, onChange }: { q: InitialQuestion; value: AnswerValue | undefined; missing: boolean; onChange: (v: AnswerValue) => void }) {
  const numeric = q.inputType === "NUMERIC_INPUT";
  const multi = q.inputType === "MULTIPLE_CHOICE";
  const selected = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];

  function toggle(code: string) {
    if (!multi) { onChange(code); return; }
    if (code === "NONE") { onChange(["NONE"]); return; }
    const rest = selected.filter((c) => c !== "NONE");
    onChange(rest.includes(code) ? rest.filter((c) => c !== code) : [...rest, code]);
  }

  return (
    <fieldset className={`space-y-2 rounded-2xl border bg-surface p-4 ${missing ? "border-rose-500/50" : "border-border"}`}>
      <legend className="px-1 text-sm font-bold text-text-primary">{q.text}{q.required && <span className="text-rose-500"> *</span>}</legend>
      {q.instruction && <p className="text-xs text-text-secondary">{q.instruction}</p>}
      {numeric ? (
        <input
          type="number"
          inputMode="decimal"
          min={q.minValue ?? 0}
          max={q.maxValue ?? undefined}
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          aria-label={q.text}
          className="w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary"
        />
      ) : (
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
      )}
      {missing && <p className="text-xs text-rose-500">Câu này bắt buộc.</p>}
    </fieldset>
  );
}

function ResultView({ result }: { result: InitialResult }) {
  const r = result;
  const capped = r.level.capApplied;
  const scored = r.competencies.some((c) => c.score != null);
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 md:p-6">
      <header>
        <h1 className="font-display text-2xl font-black text-text-primary">Kết quả khảo sát</h1>
      </header>

      <section className="space-y-2 rounded-2xl border border-accent/30 bg-accent/5 p-4">
        <div className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">Level tạm thời</div>
        <div className="font-display text-4xl font-black text-text-primary">{r.level.finalLevel}</div>
        <p className="flex items-start gap-2 text-sm text-text-secondary">
          <Info size={15} className="mt-0.5 shrink-0" />
          Đây là ước tính từ dữ liệu bạn tự khai, chưa phải level chính thức.
          {capped && r.level.levelCap ? ` Level tự khai báo chỉ được xếp tối đa ${r.level.levelCap}.` : ""} Bài đo thực hành bằng camera sẽ xác nhận level thật.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-text-secondary">Năng lực theo nhóm</div>
        <ul className="space-y-3">
          {r.competencies.map((c) => (
            <li key={c.code}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold text-text-primary">{COMPETENCY_LABEL[c.code] ?? c.code}</span>
                <span className="text-xs text-text-secondary">{c.score == null ? "Chưa đủ dữ liệu" : `${Math.round(c.score)}/100`}{c.needsVerification ? " · cần đo xác nhận" : ""}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-border">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-accent" style={{ width: `${Math.max(0, Math.min(100, c.score ?? 0))}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-text-secondary">
          {scored ? `${QUALITY_LABEL[r.dataQuality] ?? r.dataQuality}. ` : "Chưa có đủ thông tin về các bài bạn làm được để chấm điểm. "}Nhóm thiếu dữ liệu không bị tính là yếu; bài đo thực hành sẽ bổ sung.
        </p>
      </section>

      {r.consistencyFlags.length > 0 && (
        <section className="space-y-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2 font-bold"><AlertTriangle size={15} />Cần lưu ý</div>
          <ul className="list-disc pl-5">{r.consistencyFlags.map((f) => <li key={f.code}>{f.message}</li>)}</ul>
        </section>
      )}

      <section className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-text-primary">
        <ClipboardList size={18} className="mt-0.5 shrink-0" />
        <span>Bước tiếp theo: <Link to="/plan-choice" className="font-black text-accent underline">chọn tập theo giáo án của hệ thống hay tự tạo giáo án</Link>.</span>
      </section>

      <section className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-sm text-text-secondary">
        <ClipboardList size={18} className="mt-0.5 shrink-0" />
        <span>Bạn có thể làm <Link to="/assessment/baseline" className="font-bold text-accent underline">bài đo thực hành bằng camera</Link> để xác nhận level thật (tùy chọn). Nếu chưa có dụng cụ hoặc muốn tập ngay, bạn vẫn dùng được level tạm thời này; vì chưa đo thực tế nên level cao nhất của bạn hiện chỉ ở mức tối đa L2 và bạn có thể đo sau. Xem thêm <Link to="/roadmap" className="font-semibold underline">lộ trình của tôi</Link>.</span>
      </section>
    </div>
  );
}
