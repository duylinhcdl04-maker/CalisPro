import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Button } from "../ui/Button";

interface RestTimerProps {
  /** Total rest duration in seconds. Pass a new value (or remount via key) to reset the countdown. */
  seconds: number;
  paused?: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RestTimer({ seconds, paused = false, onComplete, onSkip }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const firedRef = useRef(false);

  useEffect(() => {
    setRemaining(seconds);
    firedRef.current = false;
  }, [seconds]);

  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        onComplete();
      }
      return;
    }
    const timeout = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timeout);
  }, [remaining, paused, onComplete]);

  const progress = seconds > 0 ? Math.max(0, remaining) / seconds : 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="text-xs font-semibold uppercase tracking-[.14em] text-text-secondary">Nghỉ giữa set</div>
      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
          <motion.circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={false}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </svg>
        <div className="absolute font-display text-3xl font-bold text-text-primary">{Math.max(0, remaining)}s</div>
      </div>
      <Button variant="ghost" size="sm" onClick={onSkip}>
        Bỏ qua nghỉ
      </Button>
    </div>
  );
}
