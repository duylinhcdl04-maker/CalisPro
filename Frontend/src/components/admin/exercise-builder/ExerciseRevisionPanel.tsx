import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, GitPullRequestArrow, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useDecideRevision, usePendingRevisions, type ExerciseRevision } from "../../../features/exercises/revisionsApi";

const fmt = (iso: string) => new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

function errorText(e: unknown, fallback: string): string {
  const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return msg || fallback;
}

function RevisionCard({ r, admin, highlight }: { r: ExerciseRevision; admin: boolean; highlight: boolean }) {
  const { approve, reject } = useDecideRevision();
  const [rejecting, setRejecting] = useState(false);
  const [notes, setNotes] = useState("");
  const busy = approve.isPending || reject.isPending;

  return (
    <li id={`revision-${r.id}`} className={`rounded-2xl border bg-background p-4 ${highlight ? "border-accent ring-2 ring-accent/30" : "border-border"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-black text-text-primary">{r.exerciseName}</div>
          <div className="text-[11px] text-text-secondary">{admin ? `${r.authorName} · ` : ""}gửi lúc {fmt(r.createdAt)}</div>
        </div>
        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-black text-amber-600">Chờ Admin duyệt</span>
      </div>

      {r.changes.length === 0 ? (
        <p className="mt-2 text-xs text-text-secondary">Nội dung đã trùng với bản đang xuất bản.</p>
      ) : (
        <ul className="mt-3 space-y-1.5" aria-label="Các thay đổi">
          {r.changes.map((c) => (
            <li key={c.field} className="rounded-lg border border-border/70 bg-surface px-3 py-2 text-xs">
              <div className="font-bold text-text-primary">{c.label}</div>
              <div className="mt-0.5 grid gap-1 sm:grid-cols-2">
                <div className="text-text-secondary"><span className="font-bold">Hiện tại:</span> {c.before}</div>
                <div className="text-emerald-600 dark:text-emerald-400"><span className="font-bold">Đề xuất:</span> {c.after}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {admin && !rejecting && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => approve.mutate(r.id, { onSuccess: () => toast.success("Đã duyệt và áp dụng chỉnh sửa."), onError: (e) => toast.error(errorText(e, "Không duyệt được chỉnh sửa.")) })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-black text-white shadow-xs hover:opacity-90 disabled:opacity-60">
            {approve.isPending ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <CheckCircle2 size={13} aria-hidden />}Duyệt và áp dụng
          </button>
          <button type="button" disabled={busy} onClick={() => setRejecting(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-text-secondary hover:border-red-400 hover:text-red-500 disabled:opacity-60">
            <XCircle size={13} aria-hidden />Từ chối
          </button>
        </div>
      )}

      {admin && rejecting && (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-bold text-text-primary" htmlFor={`reject-${r.id}`}>Lý do từ chối (Coach sẽ nhận được nội dung này)</label>
          <textarea id={`reject-${r.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Ví dụ: Tên chưa đúng chuẩn đặt tên của thư viện."
            className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none" />
          <div className="flex gap-2">
            <button type="button" disabled={reject.isPending || !notes.trim()}
              onClick={() => reject.mutate({ id: r.id, notes: notes.trim() }, { onSuccess: () => toast.success("Đã từ chối chỉnh sửa và gửi lý do cho Coach."), onError: (e) => toast.error(errorText(e, "Không từ chối được chỉnh sửa.")) })}
              className="rounded-xl bg-red-500 px-3.5 py-2 text-xs font-black text-white hover:opacity-90 disabled:opacity-50">
              {reject.isPending ? "Đang gửi..." : "Xác nhận từ chối"}
            </button>
            <button type="button" onClick={() => { setRejecting(false); setNotes(""); }} className="rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-text-secondary">Hủy</button>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * Chỉnh sửa động tác đã xuất bản đang chờ duyệt. Admin xem phần thay đổi (hiện tại so với đề xuất) rồi duyệt hoặc từ chối kèm lý do;
 * Coach chỉ xem được bản của mình. Mở từ thông báo/hàng chờ qua ?revision=ID thì bản đó được làm nổi bật.
 */
export function ExerciseRevisionPanel({ admin }: { admin: boolean }) {
  const q = usePendingRevisions();
  const [params] = useSearchParams();
  const target = Number(params.get("revision")) || null;
  if (!q.isSuccess || q.data.length === 0) return null;

  return (
    <section aria-labelledby="revisions-title" className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-xs sm:p-5">
      <h2 id="revisions-title" className="flex items-center gap-2 text-sm font-black text-text-primary">
        <GitPullRequestArrow size={16} className="text-amber-600" aria-hidden />
        {admin ? `Chỉnh sửa động tác chờ duyệt (${q.data.length})` : `Chỉnh sửa của bạn đang chờ Admin duyệt (${q.data.length})`}
      </h2>
      <p className="mt-0.5 text-xs text-text-secondary">
        {admin ? "Học viên vẫn thấy nội dung cũ cho tới khi bạn duyệt." : "Học viên vẫn thấy nội dung cũ cho tới khi Admin duyệt. Bạn sẽ nhận thông báo khi có kết quả."}
      </p>
      <ul className="mt-3 space-y-3">
        {q.data.map((r) => <RevisionCard key={r.id} r={r} admin={admin} highlight={r.id === target} />)}
      </ul>
    </section>
  );
}
