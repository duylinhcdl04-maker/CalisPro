import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import type { ProgressPoint } from "../../types";

const ACCENT = "#78945b";

interface ProgressChartProps {
  data: ProgressPoint[];
  unit?: string;
}

function ChartTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: ProgressPoint }>;
  unit?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const dateLabel = (() => {
    try {
      return format(parseISO(point.date), "dd/MM/yyyy");
    } catch {
      return point.date;
    }
  })();

  return (
    <div className="rounded-sm border border-border bg-surface px-3 py-2 text-xs shadow-elevated">
      <div className="text-text-secondary">{dateLabel}</div>
      <div className="mt-0.5 font-semibold text-text-primary">
        {point.value}
        {unit ? ` ${unit}` : ""}
      </div>
    </div>
  );
}

export function ProgressChart({ data, unit }: ProgressChartProps) {
  return (
    <div className="h-64 w-full md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => {
              try {
                return format(parseISO(value), "dd/MM");
              } catch {
                return value;
              }
            }}
            tick={{ fill: "hsl(var(--text-secondary))", fontSize: 11 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
            minTickGap={16}
          />
          <YAxis
            tick={{ fill: "hsl(var(--text-secondary))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: "hsl(var(--border))" }} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={ACCENT}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: ACCENT, stroke: "white", strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
