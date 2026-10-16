import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Copy, Loader2, Sparkles, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/Button";
import { motionRulesApi, errorMessage, type GenerateRulesResponse, type GeneratedRuleOutcome } from "../api";

interface Props {
  profileId: number;
  exerciseName: string;
  /** Profile chưa cấu hình (camera, chỉ số đếm rep, ngưỡng) thì AI chưa soạn được. */
  blockedReason: string | null;
  onClose: () => void;
  /** Gọi sau khi có rule mới được lưu để danh sách rule tải lại. */
  onCreated: () => void;
}

const STYLE: Record<GeneratedRuleOutcome["status"], { box: string; icon: typeof CheckCircle2; label: string }> = {
  CREATED: { box: "border-emerald-500/30 bg-emerald-500/10", icon: CheckCircle2, label: "Đã lưu bản nháp" },
  DUPLICATE: { box: "border-amber-500/30 bg-amber-500/10", icon: AlertTriangle, label: "Trùng, đã bỏ qua" },
  INVALID: { box: "border-rose-500/30 bg-rose-500/10", icon: XCircle, label: "Không hợp lệ, đã bỏ qua" },
};

/**
 * AI (Gemini) đề xuất rule chấm form cho đúng bài đang mở. Mọi rule đi qua cùng bộ kiểm tra của engine và bị loại nếu trùng rule đã có của bài.
 * Rule hợp lệ được lưu thành bản NHÁP; Coach phải xem, chạy Rule Tester rồi tự gửi duyệt, Admin xuất bản.
 */
export function AiRuleGeneratorModal({ profileId, exerciseName, blockedReason, onClose, onCreated }: Props) {
  const [count, setCount] = useState(5);
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GenerateRulesResponse | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const r = await motionRulesApi.generateRules(profileId, { count, focus: focus.trim() || undefined });
      setResult(r);
      if (r.created > 0) onCreated();
    } catch (e) {
      toast.error(errorMessage(e, "Không gọi được AI. Bạn thử lại sau."));
    } finally {
      setBusy(false);
    }
  }

  async function showPrompt() {
    if (prompt !== null) { setPrompt(null); return; }
    setLoadingPrompt(true);
    try {
      setPrompt((await motionRulesApi.aiRulesPrompt(profileId, count, focus.trim() || undefined)).prompt);
    } catch (e) {
      toast.error(errorMessage(e, "Không tải được prompt."));
    } finally {
      setLoadingPrompt(false);
    }
  }

  const input = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none";
  const label = "mb-1 block text-[11px] font-bold uppercase tracking-wide text-text-secondary";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-label="AI tạo rule">
      <div className="flex max-h-[min(100%,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-text-primary"><Sparkles size={18} className="text-accent" aria-hidden />AI tạo rule chấm form</h2>
            <p className="mt-0.5 text-xs text-text-secondary">Bài: <b className="text-text-primary">{exerciseName}</b>. AI chỉ đề xuất; rule được lưu ở trạng thái <b>nháp</b>, không tự gửi duyệt hay xuất bản.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-text-secondary hover:bg-accent-soft hover:text-text-primary" aria-label="Đóng"><X size={18} /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
          {blockedReason && <p role="alert" className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />{blockedReason}</p>}

          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <div>
              <label className={label} htmlFor="ai-rule-count">Số rule tối đa</label>
              <select id="ai-rule-count" className={input} value={count} onChange={(e) => setCount(Number(e.target.value))} disabled={busy}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="ai-rule-focus">Trọng tâm (tùy chọn)</label>
              <input id="ai-rule-focus" className={input} value={focus} maxLength={300} onChange={(e) => setFocus(e.target.value)} disabled={busy}
                placeholder="Ví dụ: an toàn khớp vai, độ sâu khi hạ người, giữ thân thẳng" />
            </div>
          </div>

          <p className="rounded-xl border border-border bg-background p-3 text-xs text-text-secondary">
            Hệ thống tự loại rule <b>trùng</b> với rule đã có của bài này (cùng mã, cùng tên, hoặc đo cùng điểm khớp cùng pha với vùng chuẩn chồng nhau) và rule <b>không hợp lệ</b> theo bộ kiểm tra của engine.
            AI không được bật "dừng bài tập"; ngưỡng AI đưa ra chỉ là điểm khởi đầu, bạn phải chạy Rule Tester và thử với camera thật.
          </p>

          <div>
            <button type="button" onClick={showPrompt} disabled={loadingPrompt} className="text-xs font-bold text-accent underline disabled:opacity-60">
              {loadingPrompt ? "Đang tải prompt..." : prompt !== null ? "Ẩn prompt" : "Xem prompt gửi cho AI"}
            </button>
            {prompt !== null && (
              <div className="mt-2">
                <div className="mb-1 flex justify-end">
                  <button type="button" onClick={() => { void navigator.clipboard?.writeText(prompt); toast.success("Đã sao chép prompt"); }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-text-primary"><Copy size={12} aria-hidden />Sao chép</button>
                </div>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background p-3 text-[11px] leading-relaxed text-text-secondary">{prompt}</pre>
              </div>
            )}
          </div>

          {busy && <p role="status" className="flex items-center gap-2 text-sm text-text-secondary"><Loader2 size={16} className="animate-spin" aria-hidden />AI đang soạn và hệ thống đang kiểm tra từng rule. Việc này có thể mất tới 1 đến 2 phút...</p>}

          {result && (
            <section aria-label="Kết quả" className="space-y-3">
              <p className={`rounded-xl border p-3 text-sm font-semibold ${result.aiAvailable ? "border-border bg-background text-text-primary" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{result.message}</p>
              {result.outcomes.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-600">{result.created} đã lưu</span>
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-600">{result.duplicates} trùng</span>
                  <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-rose-600">{result.invalid} không hợp lệ</span>
                </div>
              )}
              <ul className="space-y-2">
                {result.outcomes.map((o, i) => {
                  const s = STYLE[o.status];
                  const Icon = s.icon;
                  return (
                    <li key={`${o.code}-${i}`} className={`rounded-xl border p-3 text-sm ${s.box}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Icon size={15} aria-hidden />
                        <b className="text-text-primary">{o.name ?? o.code}</b>
                        <span className="font-mono text-[11px] text-text-secondary">{o.code}</span>
                        <span className="ml-auto text-[11px] font-bold">{s.label}</span>
                      </div>
                      {o.reason && <p className="mt-1 text-xs text-text-secondary">{o.reason}</p>}
                      {o.errors.length > 0 && <ul className="mt-1 list-disc pl-5 text-xs text-text-secondary">{o.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
                      {o.rationale && o.status === "CREATED" && <p className="mt-1 text-xs text-text-secondary">Căn cứ AI nêu: {o.rationale}</p>}
                    </li>
                  );
                })}
              </ul>
              {result.created > 0 && <p className="text-xs text-text-secondary">Mở từng rule nháp trong danh sách để kiểm tra ngưỡng, chạy Rule Tester, rồi gửi duyệt.</p>}
            </section>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border px-6 py-3">
          <Button size="sm" variant="ghost" onClick={onClose}>Đóng</Button>
          <Button size="sm" variant="accent" onClick={run} disabled={busy || !!blockedReason}>
            {busy ? <><Loader2 size={13} className="animate-spin" /> Đang soạn...</> : <><Sparkles size={13} /> {result ? "Soạn thêm" : "Soạn rule bằng AI"}</>}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
