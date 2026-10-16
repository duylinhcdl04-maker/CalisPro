import { Progress } from "antd";
import type { FitnessProfile } from "../../types";

const METRICS: { key: keyof Omit<FitnessProfile, "overallScore">; label: string; strokeColor: Record<string, string> }[] = [
  { key: "strength", label: "Sức mạnh", strokeColor: { "0%": "#10b981", "100%": "#059669" } },
  { key: "endurance", label: "Sức bền", strokeColor: { "0%": "#3b82f6", "100%": "#2563eb" } },
  { key: "mobility", label: "Linh hoạt", strokeColor: { "0%": "#8b5cf6", "100%": "#7c3aed" } },
  { key: "core", label: "Core", strokeColor: { "0%": "#f59e0b", "100%": "#d97706" } },
  { key: "balance", label: "Thăng bằng", strokeColor: { "0%": "#ec4899", "100%": "#db2777" } },
];

export function FitnessStatusGrid({ fitness }: { fitness: FitnessProfile }) {
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-5">
      {METRICS.map((metric) => {
        const value = Math.max(0, Math.min(100, fitness[metric.key]));
        return (
          <div
            key={metric.key}
            className="rounded-2xl p-3 bg-surface border border-white/80 dark:border-white/5 shadow-[0_4px_12px_rgba(0,0,0,0.02),inset_0_1px_2px_rgba(255,255,255,0.9)]"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-text-secondary">{metric.label}</span>
              <span className="text-sm font-extrabold text-text-primary">{value}</span>
            </div>
            
            <div className="mt-2.5">
              <Progress
                percent={value}
                showInfo={false}
                strokeColor={metric.strokeColor}
                strokeWidth={7}
                trailColor="rgba(0,0,0,0.04)"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
