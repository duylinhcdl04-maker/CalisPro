import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { FitnessMetricKey } from "../../types";
import { FITNESS_METRIC_LABEL } from "../../constants/labels";
import { tooltipStyle, useChartTheme } from "./chartTheme";

type Scores = Record<FitnessMetricKey, number>;

interface FitnessRadarChartProps {
  current: Scores;
  /** Optional comparison layer (previous assessment / cohort average). */
  previous?: Scores | null;
  currentLabel?: string;
  previousLabel?: string;
  height?: number;
}

const KEYS: FitnessMetricKey[] = ["strength", "endurance", "mobility", "core", "balance"];

export function FitnessRadarChart({ current, previous, currentLabel = "Hiện tại", previousLabel = "Trước đó", height = 260 }: FitnessRadarChartProps) {
  const t = useChartTheme();
  const data = KEYS.map((k) => ({ metric: FITNESS_METRIC_LABEL[k], current: current[k], previous: previous?.[k] ?? null }));
  const tip = tooltipStyle(t);
  return (
    <div style={{ height }} role="img" aria-label={`Biểu đồ radar thể lực: ${KEYS.map((k) => `${FITNESS_METRIC_LABEL[k]} ${current[k]}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke={t.grid} />
          <PolarAngleAxis dataKey="metric" tick={{ fill: t.text, fontSize: 11, fontWeight: 600 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          {previous && <Radar name={previousLabel} dataKey="previous" stroke={t.axis} strokeDasharray="4 3" strokeWidth={1.5} fill="transparent" />}
          <Radar name={currentLabel} dataKey="current" stroke={t.series[0]} strokeWidth={2} fill={t.series[0]} fillOpacity={0.18} dot={{ r: 3, fill: t.series[0] }} />
          <Tooltip contentStyle={tip.contentStyle} labelStyle={tip.labelStyle} itemStyle={tip.itemStyle} />
          {previous && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: t.text }} />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
