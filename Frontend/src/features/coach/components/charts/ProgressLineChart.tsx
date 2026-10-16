import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { tooltipStyle, useChartTheme } from "./chartTheme";

export interface LineSeries<K extends string> {
  key: K;
  label: string;
}

interface ProgressLineChartProps<K extends string> {
  data: ({ label: string } & Partial<Record<K, number | null>>)[];
  series: LineSeries<K>[];
  height?: number;
  yDomain?: [number | "auto", number | "auto"];
  /** Single-series charts render as a soft area for a stronger read. */
  area?: boolean;
  valueSuffix?: string;
}

/**
 * Trend over time. One y-axis only; >=2 series always get a legend; colors follow
 * the series position in `series` (fixed order), never data rank.
 */
export function ProgressLineChart<K extends string>({ data, series, height = 240, yDomain = ["auto", "auto"], area, valueSuffix = "" }: ProgressLineChartProps<K>) {
  const t = useChartTheme();
  const tip = tooltipStyle(t);
  const common = {
    data,
    margin: { top: 8, right: 12, bottom: 0, left: -18 },
  };
  const axes = (
    <>
      <CartesianGrid stroke={t.grid} vertical={false} />
      <XAxis dataKey="label" tick={{ fill: t.text, fontSize: 11 }} axisLine={{ stroke: t.grid }} tickLine={false} minTickGap={16} />
      <YAxis domain={yDomain} tick={{ fill: t.text, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
      <Tooltip contentStyle={tip.contentStyle} labelStyle={tip.labelStyle} itemStyle={tip.itemStyle} cursor={tip.cursor} formatter={(v) => `${v}${valueSuffix}`} />
    </>
  );

  if (area && series.length === 1) {
    const s = series[0];
    const gid = `grad-${s.key}`;
    return (
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart {...common}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.series[0]} stopOpacity={0.28} />
                <stop offset="100%" stopColor={t.series[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            {axes}
            <Area type="monotone" dataKey={s.key} name={s.label} stroke={t.series[0]} strokeWidth={2} fill={`url(#${gid})`} activeDot={{ r: 5, strokeWidth: 2, stroke: t.surface }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...common}>
          {axes}
          {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: t.text, paddingTop: 6 }} />}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={t.series[i % t.series.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: t.surface }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
