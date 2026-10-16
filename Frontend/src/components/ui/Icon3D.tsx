import { type FC } from "react";

export type Icon3DName =
  | "home"
  | "workout"
  | "dumbbell"
  | "chart"
  | "rocket"
  | "exercises"
  | "trophy"
  | "medal"
  | "crown"
  | "user"
  | "robot"
  | "sparkles"
  | "fire"
  | "shield"
  | "gear"
  | "target"
  | "battery"
  | "moon"
  | "clock"
  | "heart"
  | "card"
  | "calendar"
  | "stopwatch"
  | "running"
  | "lightning";

export type SquircleColor = "sky" | "amber" | "emerald" | "purple" | "rose" | "indigo" | "neutral";

interface Icon3DProps {
  name: Icon3DName;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  withSquircle?: boolean;
  squircleColor?: SquircleColor;
  color?: SquircleColor | string;
  animateHover?: boolean;
}

const SIZE_MAP = {
  xs: 16,
  sm: 20,
  md: 26,
  lg: 34,
  xl: 48,
};

const SQUIRCLE_BG_MAP: Record<string, string> = {
  sky: "bg-gradient-to-b from-[#e0f2fe] to-[#bae6fd] border-sky-200/90 shadow-[0_6px_14px_-2px_rgba(14,165,233,0.3),inset_0_2px_2px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(0,0,0,0.05)]",
  amber: "bg-gradient-to-b from-[#fef3c7] to-[#fde68a] border-amber-200/90 shadow-[0_6px_14px_-2px_rgba(245,158,11,0.3),inset_0_2px_2px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(0,0,0,0.05)]",
  emerald: "bg-gradient-to-b from-[#d1fae5] to-[#a7f3d0] border-emerald-200/90 shadow-[0_6px_14px_-2px_rgba(16,185,129,0.3),inset_0_2px_2px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(0,0,0,0.05)]",
  purple: "bg-gradient-to-b from-[#ede9fe] to-[#ddd6fe] border-purple-200/90 shadow-[0_6px_14px_-2px_rgba(139,92,246,0.3),inset_0_2px_2px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(0,0,0,0.05)]",
  rose: "bg-gradient-to-b from-[#ffe4e6] to-[#fecdd3] border-rose-200/90 shadow-[0_6px_14px_-2px_rgba(244,63,94,0.3),inset_0_2px_2px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(0,0,0,0.05)]",
  indigo: "bg-gradient-to-b from-[#e0e7ff] to-[#c7d2fe] border-indigo-200/90 shadow-[0_6px_14px_-2px_rgba(99,102,241,0.3),inset_0_2px_2px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(0,0,0,0.05)]",
  neutral: "bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] border-slate-200/90 shadow-[0_6px_14px_-2px_rgba(0,0,0,0.08),inset_0_2px_2px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(0,0,0,0.05)]",
};

export const Icon3D: FC<Icon3DProps> = ({
  name,
  size = "md",
  className = "",
  withSquircle,
  squircleColor,
  color,
  animateHover = false,
}) => {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size] || 26;
  const src = `/assets/3d/icons/${name}.png`;
  const resolvedColor = (color as SquircleColor) || squircleColor || "sky";
  const isSquircle = withSquircle !== undefined ? withSquircle : Boolean(color || squircleColor);

  const imageElement = (
    <img
      src={src}
      alt={`${name} icon 3D`}
      width={pixelSize}
      height={pixelSize}
      loading="lazy"
      className={`select-none object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.12)] transition-transform duration-200 ${
        animateHover ? "group-hover:scale-110 group-hover:-translate-y-0.5" : ""
      } ${className}`}
      style={{
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
      }}
    />
  );

  if (isSquircle) {
    const squircleSize = Math.round(pixelSize * 1.55);
    const bgClass = SQUIRCLE_BG_MAP[resolvedColor] || SQUIRCLE_BG_MAP.sky;

    return (
      <div
        className={`relative inline-flex shrink-0 items-center justify-center rounded-2xl border transition-all duration-200 ${bgClass}`}
        style={{
          width: `${squircleSize}px`,
          height: `${squircleSize}px`,
        }}
      >
        {imageElement}
      </div>
    );
  }

  return imageElement;
};
