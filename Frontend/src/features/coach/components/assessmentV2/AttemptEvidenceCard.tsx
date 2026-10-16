import { VideoOff } from "lucide-react";
import { MEASUREMENT_STATUS, METRIC_LABEL } from "../../constants/assessmentV2Labels";
import { formatDate } from "../../lib/format";
import type { AttemptEvidence } from "../../types";
import { StatusBadge } from "../ui";
import { METRIC_ORDER, exerciseLabel, formatMetric } from "./v2Utils";

/** Bằng chứng của một attempt: chỉ số đo, video (nếu còn hạn lưu) và từng rep với mã lỗi vi phạm. */
export function AttemptEvidenceCard({ attempt }: { attempt: AttemptEvidence }) {
  const status = MEASUREMENT_STATUS[attempt.measurementStatus] ?? { label: attempt.measurementStatus, tone: "neutral" as const };
  const metrics = METRIC_ORDER.filter((k) => attempt.metrics[k] != null);
  const invalidReps = attempt.reps.filter((r) => !r.valid).length;

  return (
    <article className="well-3d rounded-2xl p-4 sm:p-5" aria-label={`Bằng chứng ${exerciseLabel(attempt.exerciseCode)}`}>
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-extrabold text-text-primary">{exerciseLabel(attempt.exerciseCode)}</h3>
        <span className="text-[11px] font-semibold text-text-secondary">Lần {attempt.attemptNo}</span>
        <StatusBadge status={status} />
        <span className="ml-auto text-[11px] font-bold tabular-nums text-text-secondary">Độ tin cậy {Math.round(attempt.reliability * 100)}%</span>
      </header>

      {metrics.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {metrics.map((k) => (
            <div key={k} className="rounded-xl bg-surface-sunken/70 px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">{METRIC_LABEL[k] ?? k}</dt>
              <dd className="text-sm font-extrabold tabular-nums text-text-primary">{formatMetric(k, attempt.metrics[k])}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-4">
        {attempt.videoUrl ? (
          <div>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video controls preload="metadata" className="aspect-video w-full rounded-xl bg-black" src={attempt.videoUrl} aria-label={`Video ${exerciseLabel(attempt.exerciseCode)}`} />
            {attempt.videoExpiresAt && <p className="mt-1.5 text-[11px] text-text-secondary">Video được lưu đến {formatDate(attempt.videoExpiresAt)}.</p>}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-xs text-text-secondary">
            <VideoOff size={18} aria-hidden />
            <span>Chưa có video cho attempt này, hoặc video đã hết hạn lưu.</span>
          </div>
        )}
      </div>

      {attempt.reps.length > 0 && (
        <details className="mt-4 group">
          <summary className="cursor-pointer text-xs font-bold text-accent-strong hover:underline dark:text-accent">
            Chi tiết {attempt.reps.length} rep{invalidReps > 0 ? ` (${invalidReps} rep không hợp lệ)` : ""}
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">Chi tiết từng rep</caption>
              <thead>
                <tr className="border-b border-border text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                  <th scope="col" className="py-2 pr-3">Rep</th>
                  <th scope="col" className="py-2 pr-3">Hợp lệ</th>
                  <th scope="col" className="py-2 pr-3">Điểm form</th>
                  <th scope="col" className="py-2">Lỗi vi phạm</th>
                </tr>
              </thead>
              <tbody>
                {attempt.reps.map((r) => (
                  <tr key={r.repNumber} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 font-bold tabular-nums">{r.repNumber}</td>
                    <td className="py-2 pr-3">{r.valid ? <StatusBadge tone="success">Hợp lệ</StatusBadge> : <StatusBadge tone="critical">Không hợp lệ</StatusBadge>}</td>
                    <td className="py-2 pr-3 tabular-nums">{r.qualityScore ?? "-"}</td>
                    <td className="py-2 text-text-secondary">{r.violationCodes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </article>
  );
}
