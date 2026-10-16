import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarCheck } from "lucide-react";
import type { AdherenceStats } from "../../types";
import { tooltipStyle, useChartTheme } from "../charts/chartTheme";
import { Panel, ScoreBar } from "../ui";
import { adherenceSeverity, weekLabel } from "./performanceUtils";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="well-3d rounded-[16px] px-4 py-3">
      <dt className="text-[11px] font-bold text-text-secondary">{label}</dt>
      <dd className="mt-1 text-2xl font-black tabular-nums leading-none tracking-tight text-text-primary">{value}</dd>
      {hint && <dd className="mt-1 text-[11px] text-text-secondary">{hint}</dd>}
    </div>
  );
}

/** Planned vs completed sessions, adherence meter, weekly bars and streaks. */
export function AdherencePanel({ adherence }: { adherence: AdherenceStats }) {
  const t = useChartTheme();
  const tip = tooltipStyle(t);
  const rows = useMemo(() => adherence.weekly.map((w) => ({ label: weekLabel(w.weekStart), planned: w.planned, completed: w.completed })), [adherence.weekly]);
  const severity = adherenceSeverity(adherence.adherencePercent);

  return (
    <Panel title="Tuân thủ tập luyện" description="Buổi dự kiến so với buổi đã hoàn thành" icon={CalendarCheck} className="animate-rise">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Buổi dự kiến" value={String(adherence.sessionsPlanned)} />
        <Stat label="Buổi hoàn thành" value={String(adherence.sessionsCompleted)} />
        <Stat label="Chuỗi hiện tại" value={`${adherence.currentStreak} ngày`} />
        <Stat label="Chuỗi dài nhất" value={`${adherence.longestStreak} ngày`} />
      </dl>

      <ScoreBar
        className="mt-5"
        label={`Tỷ lệ tuân thủ · ${adherence.trainingFrequency.toLocaleString("vi-VN")} buổi/tuần`}
        value={adherence.adherencePercent}
        tone={severity}
      />

      <h3 className="mt-6 text-xs font-bold uppercase tracking-wide text-text-secondary">Theo tuần</h3>
      <div
        className="mt-2 h-[220px]"
        role="img"
        aria-label={`Biểu đồ cột buổi dự kiến và hoàn thành theo tuần: ${rows.map((r) => `tuần ${r.label} ${r.completed}/${r.planned}`).join(", ")}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barGap={2} barCategoryGap="24%">
            <CartesianGrid stroke={t.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: t.text, fontSize: 11 }} axisLine={{ stroke: t.grid }} tickLine={false} minTickGap={8} />
            <YAxis allowDecimals={false} tick={{ fill: t.text, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              contentStyle={tip.contentStyle}
              labelStyle={tip.labelStyle}
              itemStyle={tip.itemStyle}
              cursor={{ fill: t.grid, opacity: 0.5 }}
              labelFormatter={(l) => `Tuần ${l}`}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: t.text, paddingTop: 6 }} />
            <Bar dataKey="planned" name="Dự kiến" fill={t.muted} radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="completed" name="Hoàn thành" fill={t.series[0]} radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
