import { useTheme } from "../../../theme/ThemeProvider";

/**
 * Chart colors. Categorical order is the validated default palette from the dataviz
 * method (fixed order, never cycled; light and dark steps selected separately).
 * SVG presentation attributes cannot read CSS variables, so values are resolved here.
 */
const LIGHT = {
  series: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"],
  grid: "#e2e8f0",
  axis: "#94a3b8",
  text: "#64748b",
  surface: "#ffffff",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e2e8f0",
  good: "#0ca30c",
  warning: "#fab219",
  critical: "#d03b3b",
  muted: "#cbd5e1",
};

const DARK: typeof LIGHT = {
  series: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#0ca30c"],
  grid: "#1e293b",
  axis: "#475569",
  text: "#94a3b8",
  surface: "#0f172a",
  tooltipBg: "#111b2e",
  tooltipBorder: "#243049",
  good: "#0ca30c",
  warning: "#fab219",
  critical: "#e66767",
  muted: "#334155",
};

export type ChartTheme = typeof LIGHT;

export function useChartTheme(): ChartTheme {
  const { resolved } = useTheme();
  return resolved === "dark" ? DARK : LIGHT;
}

/** Shared Recharts tooltip styling. */
export function tooltipStyle(t: ChartTheme) {
  return {
    contentStyle: {
      background: t.tooltipBg,
      border: `1px solid ${t.tooltipBorder}`,
      borderRadius: 14,
      boxShadow: "0 12px 28px -12px rgba(15,23,42,0.35)",
      fontSize: 12,
      fontWeight: 600,
      padding: "8px 12px",
    },
    labelStyle: { color: t.text, fontWeight: 700, marginBottom: 4 },
    itemStyle: { padding: 0 },
    cursor: { stroke: t.axis, strokeDasharray: "3 3" },
  } as const;
}
