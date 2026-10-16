import React from 'react';
import type { VisualizationMode } from '../types';

interface BiomechanicsLegendProps {
  mode: VisualizationMode;
}

export const BiomechanicsLegend: React.FC<BiomechanicsLegendProps> = ({ mode }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-neutral-950/80 backdrop-blur-md px-4 py-2.5 text-[11px] text-white/90 border border-white/10 shadow-lg select-none">
      {/* Skeleton / Landmark status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="font-semibold text-emerald-300">Bắt buộc (Required)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
          <span className="font-semibold text-indigo-300">Tùy chọn (Optional)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
          <span className="text-slate-400">Vô hiệu</span>
        </div>
      </div>

      {/* Muscle engagement (for Heatmap or Combined) */}
      {(mode === 'HEATMAP' || mode === 'COMBINED') && (
        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-white/15 pt-2 sm:pt-0 sm:pl-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse" />
            <span className="font-semibold text-rose-300">Cơ chính (Primary)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <span className="font-semibold text-amber-300">Cơ phụ (Secondary)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="font-semibold text-cyan-300">Ổn định (Core/Stabilizer)</span>
          </div>
        </div>
      )}
    </div>
  );
};
