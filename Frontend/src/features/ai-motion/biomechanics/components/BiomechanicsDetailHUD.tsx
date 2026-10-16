import React from 'react';
import { Activity, Gauge, Flame, ShieldAlert, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import type { Landmark3DPosition, VisualizationMode } from '../types';
import { JOINT_DEFINITIONS, getExerciseMuscles, MUSCLE_GROUPS } from '../constants';
import { calculate3DAngle } from '../utils';

interface BiomechanicsDetailHUDProps {
  selectedLandmark: Landmark3DPosition | null;
  allLandmarks: Landmark3DPosition[];
  exerciseCode?: string;
  mode: VisualizationMode;
}

export const BiomechanicsDetailHUD: React.FC<BiomechanicsDetailHUDProps> = ({
  selectedLandmark,
  allLandmarks,
  exerciseCode,
  mode,
}) => {
  if (!selectedLandmark) {
    return (
      <div className="rounded-2xl border border-white/10 bg-neutral-950/75 p-3 backdrop-blur-md text-white/70 text-xs">
        <p className="flex items-center gap-1.5 text-cyan-400 font-semibold">
          <Activity size={14} />
          Nhấp vào bất kỳ điểm khớp xương hoặc cơ bắp trên mô hình 3D để xem phân tích cơ sinh học.
        </p>
      </div>
    );
  }

  // Find if this landmark is associated with any defined biomechanical joint
  const associatedJoint = JOINT_DEFINITIONS.find(
    (j) => j.landmarkVertex === selectedLandmark.index || j.landmarkA === selectedLandmark.index || j.landmarkC === selectedLandmark.index
  );

  let currentAngle: number | null = null;
  let isAngleInRange = true;
  let targetMin = 0;
  let targetMax = 180;

  if (associatedJoint) {
    const lmA = allLandmarks.find((l) => l.index === associatedJoint.landmarkA);
    const lmV = allLandmarks.find((l) => l.index === associatedJoint.landmarkVertex);
    const lmC = allLandmarks.find((l) => l.index === associatedJoint.landmarkC);
    if (lmA && lmV && lmC) {
      currentAngle = calculate3DAngle([lmA.x, lmA.y, lmA.z], [lmV.x, lmV.y, lmV.z], [lmC.x, lmC.y, lmC.z]);
      targetMin = associatedJoint.targetRangeDefault[0];
      targetMax = associatedJoint.targetRangeDefault[1];
      isAngleInRange = currentAngle >= targetMin && currentAngle <= targetMax;
    }
  }

  const exerciseMuscles = getExerciseMuscles(exerciseCode);

  return (
    <div className="space-y-2.5 rounded-2xl border border-cyan-500/30 bg-neutral-950/85 p-3.5 backdrop-blur-xl shadow-2xl text-white select-none">
      {/* Top Title: Landmark Name & Index */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-mono font-bold text-xs">
            #{selectedLandmark.index.toString().padStart(2, '0')}
          </div>
          <div>
            <h4 className="font-display text-xs font-bold text-cyan-300">
              {selectedLandmark.nameVi}
            </h4>
            <span className="text-[10px] text-white/50 font-mono">
              {selectedLandmark.name}
            </span>
          </div>
        </div>

        <span
          className={`rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wider ${
            selectedLandmark.visibilityRequirement === 'REQUIRED'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : selectedLandmark.visibilityRequirement === 'OPTIONAL'
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
              : 'bg-slate-700/50 text-slate-400 border border-slate-600'
          }`}
        >
          {selectedLandmark.visibilityRequirement}
        </span>
      </div>

      {/* Biomechanical Joint Telemetry (Level 2) */}
      {associatedJoint && currentAngle !== null ? (
        <div className="rounded-xl bg-white/[0.04] p-2.5 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/80 flex items-center gap-1.5">
              <Gauge size={13} className="text-amber-400" />
              {associatedJoint.nameVi}
            </span>
            <div className="flex items-center gap-1 font-mono text-xs font-black">
              <span className={isAngleInRange ? 'text-emerald-400' : 'text-amber-400'}>
                {currentAngle}°
              </span>
              <span className="text-[10px] text-white/40">
                [Chuẩn: {targetMin}° - {targetMax}°]
              </span>
            </div>
          </div>

          {/* Range Progress Bar */}
          <div className="relative h-2 w-full rounded-full bg-neutral-800 overflow-hidden border border-white/10">
            <div
              className={`absolute top-0 bottom-0 transition-all ${
                isAngleInRange ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500'
              }`}
              style={{
                left: `${(targetMin / 180) * 100}%`,
                width: `${((targetMax - targetMin) / 180) * 100}%`,
              }}
            />
            {/* Current Angle Needle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_6px_#fff]"
              style={{ left: `${Math.min(100, Math.max(0, (currentAngle / 180) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-white/40 font-mono">
            <span>0°</span>
            <span className="text-emerald-400/80">Vùng kích hoạt tối ưu</span>
            <span>180°</span>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-white/60 bg-white/[0.02] p-2 rounded-xl border border-white/5 flex items-center justify-between">
          <span>Vị trí không gian 3D:</span>
          <span className="font-mono text-cyan-300 text-[10px]">
            X: {selectedLandmark.x.toFixed(2)} | Y: {selectedLandmark.y.toFixed(2)} | Z: {selectedLandmark.z.toFixed(2)}
          </span>
        </div>
      )}

      {/* Muscle Engagement Context (Level 3) */}
      {(mode === 'HEATMAP' || mode === 'COMBINED') && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-white/80">
            <span className="flex items-center gap-1.5 text-rose-400">
              <Flame size={13} />
              Cơ liên đới phát lực ({exerciseCode || 'Tập luyện'})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {exerciseMuscles.slice(0, 4).map((m) => {
              const def = MUSCLE_GROUPS.find((g) => g.id === m.muscleId);
              return (
                <div
                  key={m.muscleId}
                  className={`rounded-lg px-2 py-1 text-[10px] flex items-center justify-between border ${
                    m.role === 'PRIMARY'
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                      : m.role === 'SECONDARY'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  }`}
                >
                  <span className="font-medium truncate mr-1">{def?.nameVi.split(' ')[0] || m.muscleId}</span>
                  <span className="font-mono font-bold text-[9px] uppercase">{m.role}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
