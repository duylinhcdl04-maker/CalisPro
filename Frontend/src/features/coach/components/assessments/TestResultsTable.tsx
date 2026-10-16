import { FlaskConical } from "lucide-react";
import { FITNESS_METRIC_LABEL } from "../../constants/labels";
import type { AssessmentTestResult } from "../../types";
import { Delta, EmptyState, Panel } from "../ui";
import { formatTestValue, isTimeUnit } from "./assessmentUtils";

function Change({ t }: { t: AssessmentTestResult }) {
  if (t.previousValue === null) return <span className="text-xs text-text-secondary">-</span>;
  const diff = t.value - t.previousValue;
  return <Delta value={diff} suffix={isTimeUnit(t.unit) ? "s" : ""} />;
}

const unitLabel = (unit: string) => (isTimeUnit(unit) ? "mm:ss" : unit);

/** Raw test values behind the scores. Time based tests render as mm:ss. */
export function TestResultsTable({ tests }: { tests: AssessmentTestResult[] }) {
  return (
    <Panel title="Kết quả bài test" description="Giá trị đo thực tế của từng bài test" icon={FlaskConical} className="animate-rise" bodyClassName="p-0 sm:p-0 pt-2 sm:pt-2">
      {tests.length === 0 ? (
        <EmptyState title="Chưa có kết quả test" />
      ) : (
        <>
          <table className="hidden w-full text-left sm:table">
            <caption className="sr-only">Kết quả các bài test, so sánh với lần trước</caption>
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                <th scope="col" className="px-6 py-2.5">Bài test</th>
                <th scope="col" className="px-3 py-2.5 text-right">Trước</th>
                <th scope="col" className="px-3 py-2.5 text-right">Hiện tại</th>
                <th scope="col" className="px-3 py-2.5 text-right">Thay đổi</th>
                <th scope="col" className="px-6 py-2.5 text-right">Đơn vị</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="px-6 py-3 font-normal">
                    <div className="text-sm font-bold text-text-primary">{t.name}</div>
                    <div className="text-[11px] text-text-secondary">{FITNESS_METRIC_LABEL[t.metric]}</div>
                  </th>
                  <td className="px-3 py-3 text-right text-sm tabular-nums text-text-secondary">{formatTestValue(t.previousValue, t.unit)}</td>
                  <td className="px-3 py-3 text-right text-sm font-extrabold tabular-nums text-text-primary">{formatTestValue(t.value, t.unit)}</td>
                  <td className="px-3 py-3 text-right">
                    <Change t={t} />
                  </td>
                  <td className="px-6 py-3 text-right text-xs text-text-secondary">{unitLabel(t.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="divide-y divide-border/70 sm:hidden">
            {tests.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-text-primary">{t.name}</div>
                  <div className="text-[11px] tabular-nums text-text-secondary">
                    Trước: {formatTestValue(t.previousValue, t.unit)} · {unitLabel(t.unit)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black tabular-nums text-text-primary">{formatTestValue(t.value, t.unit)}</div>
                  <Change t={t} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}
