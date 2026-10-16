import { type FC, type ComponentType } from "react";
import type { LucideProps } from "lucide-react";

export type ClayColor = "sky" | "amber" | "emerald" | "purple" | "rose" | "indigo" | "cyan" | "neutral";

export interface ClayTileIconProps {
  icon: ComponentType<LucideProps>;
  color?: ClayColor;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  animateHover?: boolean;
}

const TILE_SIZE_MAP = {
  xs: { box: "w-7 h-7 rounded-xl", icon: 13 },
  sm: { box: "w-9 h-9 rounded-xl", icon: 16 },
  md: { box: "w-11 h-11 rounded-2xl", icon: 20 },
  lg: { box: "w-14 h-14 rounded-2xl", icon: 26 },
  xl: { box: "w-16 h-16 rounded-[22px]", icon: 30 },
};

const COLOR_STYLES: Record<ClayColor, { box: string; icon: string }> = {
  sky: {
    box: "bg-gradient-to-b from-[#FFF8DE] via-[#AAC4F5] to-[#8CA9FF] border-white/90 dark:border-white/20 text-[#29487d] shadow-[0_6px_16px_-2px_rgba(140,169,255,0.45),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(100,130,240,0.25)]",
    icon: "text-[#1d3557] dark:text-[#1d3557] drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]",
  },
  amber: {
    box: "bg-gradient-to-b from-[#FFF8DE] via-[#FFF2C6] to-[#fed7aa] border-white/90 dark:border-white/20 text-amber-700 shadow-[0_6px_16px_-2px_rgba(245,158,11,0.25),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(217,119,6,0.2)]",
    icon: "text-amber-900 dark:text-amber-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]",
  },
  emerald: {
    box: "bg-gradient-to-b from-[#FFF8DE] via-[#c7eedb] to-[#86e0b4] border-white/90 dark:border-white/20 text-emerald-700 shadow-[0_6px_16px_-2px_rgba(16,185,129,0.3),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(5,150,105,0.2)]",
    icon: "text-emerald-850 dark:text-emerald-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]",
  },
  purple: {
    box: "bg-gradient-to-b from-[#FFF8DE] via-[#dcd2fd] to-[#bca6fe] border-white/90 dark:border-white/20 text-purple-700 shadow-[0_6px_16px_-2px_rgba(139,92,246,0.3),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(124,58,237,0.2)]",
    icon: "text-purple-900 dark:text-purple-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]",
  },
  rose: {
    box: "bg-gradient-to-b from-[#FFF8DE] via-[#fecdd3] to-[#fda4af] border-white/90 dark:border-white/20 text-rose-600 shadow-[0_6px_16px_-2px_rgba(244,63,94,0.3),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(225,29,72,0.2)]",
    icon: "text-rose-800 dark:text-rose-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]",
  },
  indigo: {
    box: "bg-gradient-to-b from-[#AAC4F5] via-[#8CA9FF] to-[#6384ff] border-white/90 dark:border-white/20 text-blue-950 shadow-[0_6px_16px_-2px_rgba(100,130,240,0.45),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(60,90,200,0.3)]",
    icon: "text-[#0e1d44] dark:text-[#0e1d44] drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]",
  },
  cyan: {
    box: "bg-gradient-to-b from-[#FFF8DE] via-[#bae6fd] to-[#7dd3fc] border-white/90 dark:border-white/20 text-cyan-700 shadow-[0_6px_16px_-2px_rgba(6,182,212,0.3),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(8,145,178,0.2)]",
    icon: "text-cyan-900 dark:text-cyan-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]",
  },
  neutral: {
    box: "bg-gradient-to-b from-[#FFF8DE] via-[#f1f5f9] to-[#e2e8f0] border-white/90 dark:border-white/20 text-slate-700 shadow-[0_6px_16px_-2px_rgba(0,0,0,0.06),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(0,0,0,0.05)]",
    icon: "text-slate-800 dark:text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]",
  },
};

export const ClayTileIcon: FC<ClayTileIconProps> = ({
  icon: Icon,
  color = "sky",
  size = "md",
  className = "",
  animateHover = false,
}) => {
  const sizeConfig = typeof size === "number" ? { box: "", icon: size } : TILE_SIZE_MAP[size] || TILE_SIZE_MAP.md;
  const styleConfig = COLOR_STYLES[color] || COLOR_STYLES.sky;

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center border transition-all duration-200 ${styleConfig.box} ${
        typeof size === "string" ? sizeConfig.box : ""
      } ${animateHover ? "group-hover:scale-105 group-hover:-translate-y-0.5 group-hover:shadow-lg active:translate-y-0" : ""} ${className}`}
      style={typeof size === "number" ? { width: `${size * 1.8}px`, height: `${size * 1.8}px`, borderRadius: "14px" } : undefined}
    >
      {/* Light Reflection Highlight Bevel */}
      <div className="pointer-events-none absolute inset-x-1.5 top-0.5 h-[35%] rounded-t-xl bg-gradient-to-b from-white/70 to-transparent opacity-80" />

      <Icon
        size={sizeConfig.icon}
        strokeWidth={2.4}
        className={`relative z-10 transition-transform duration-200 ${styleConfig.icon} ${
          animateHover ? "group-hover:scale-110" : ""
        }`}
      />
    </div>
  );
};
