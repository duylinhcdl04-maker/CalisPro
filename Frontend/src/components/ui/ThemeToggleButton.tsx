import { FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sun, Moon, Sparkles } from "lucide-react";
import { Tooltip } from "antd";
import { useTheme } from "../../features/theme/ThemeProvider";

export interface ThemeToggleButtonProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "clay" | "pill" | "subtle";
  showLabel?: boolean;
}

export const ThemeToggleButton: FC<ThemeToggleButtonProps> = ({
  className = "",
  size = "md",
  variant = "clay",
  showLabel = false,
}) => {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === "dark";

  const sizeClasses = {
    sm: "h-8 w-8 rounded-xl text-xs",
    md: "h-10 w-10 rounded-[14px] text-sm",
    lg: "h-12 w-12 rounded-2xl text-base",
  }[size];

  const iconSizes = {
    sm: 15,
    md: 18,
    lg: 22,
  }[size];

  const variantStyles = {
    clay: isDark
      ? "bg-gradient-to-b from-[#1c2c4c] to-[#101b30] border border-white/10 text-sky-300 shadow-[0_4px_14px_rgba(0,0,0,0.5),inset_0_1.5px_2px_rgba(255,255,255,0.12),inset_0_-2px_3px_rgba(0,0,0,0.4)]"
      : "bg-gradient-to-b from-[#FFF8DE] via-[#ffffff] to-[#e8efff] border border-white text-sky-800 shadow-[0_6px_16px_-2px_rgba(140,169,255,0.3),inset_0_2px_2px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(170,196,245,0.35)]",
    pill: isDark
      ? "bg-slate-900/80 border border-white/10 text-sky-300 backdrop-blur-md shadow-inner"
      : "bg-white/80 border border-sky-200/60 text-sky-700 backdrop-blur-md shadow-xs",
    subtle: isDark
      ? "bg-transparent text-slate-300 hover:bg-white/5"
      : "bg-transparent text-slate-600 hover:bg-sky-50",
  }[variant];

  const label = isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối";

  return (
    <Tooltip title={label} placement="bottom">
      <motion.button
        type="button"
        onClick={toggle}
        aria-label={label}
        whileHover={{ scale: 1.07, y: -1 }}
        whileTap={{ scale: 0.92, y: 1.5 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        className={`group relative inline-flex shrink-0 items-center justify-center cursor-pointer select-none overflow-hidden transition-colors ${
          showLabel ? "px-3.5 h-10 w-auto gap-2 rounded-2xl" : sizeClasses
        } ${variantStyles} ${className}`}
      >
        {/* Soft Ambient Glow Behind Icon */}
        <div
          className={`pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 ${
            isDark
              ? "bg-gradient-to-tr from-sky-500/20 via-indigo-500/10 to-transparent opacity-70 group-hover:opacity-100"
              : "bg-gradient-to-tr from-[#FFF2C6]/60 via-[#AAC4F5]/30 to-transparent opacity-80 group-hover:opacity-100"
          }`}
        />

        {/* Animated Icon Transitions */}
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="dark-moon"
              initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="relative z-10 flex items-center justify-center text-[#8CA9FF] drop-shadow-[0_0_8px_rgba(140,169,255,0.6)]"
            >
              <Moon size={iconSizes} className="fill-[#8CA9FF]/20" strokeWidth={2.4} />
              <motion.span
                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-1 -right-1 text-sky-200"
              >
                <Sparkles size={8} />
              </motion.span>
            </motion.div>
          ) : (
            <motion.div
              key="light-sun"
              initial={{ rotate: 90, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="relative z-10 flex items-center justify-center text-amber-500 drop-shadow-[0_0_8px_rgba(255,200,50,0.5)]"
            >
              <Sun size={iconSizes} strokeWidth={2.4} className="fill-amber-400/20" />
            </motion.div>
          )}
        </AnimatePresence>

        {showLabel && (
          <span className="relative z-10 text-xs font-extrabold text-text-primary">
            {isDark ? "Giao diện tối" : "Giao diện sáng"}
          </span>
        )}
      </motion.button>
    </Tooltip>
  );
};
