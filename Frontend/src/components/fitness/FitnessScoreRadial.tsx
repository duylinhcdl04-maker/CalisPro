const SIZE = 160;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function FitnessScoreRadial({ score, label = "Điểm thể lực" }: { score: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center">
      {/* 3D Tactile Outer Well Frame */}
      <div
        className="relative flex items-center justify-center rounded-full p-2.5 clay-well"
        style={{ width: SIZE + 20, height: SIZE + 20 }}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90 drop-shadow-sm">
          <defs>
            <linearGradient id="fitnessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            stroke="currentColor"
            className="text-black/5 dark:text-white/10"
          />

          {/* Active Gradient Arc with Cap */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            stroke="url(#fitnessGrad)"
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>

        {/* Center 3D Floating Pill for Score */}
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-surface shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06),inset_0_2px_2px_rgba(255,255,255,0.9),inset_0_-2px_3px_rgba(0,0,0,0.04)] border border-white/80 dark:border-white/10">
          <span className="font-display text-3xl font-black tracking-tight text-text-primary">
            {Math.round(clamped)}
          </span>
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">/ 100</span>
        </div>
      </div>

      <span className="mt-3 text-xs font-bold uppercase tracking-wider text-text-secondary">{label}</span>
    </div>
  );
}
