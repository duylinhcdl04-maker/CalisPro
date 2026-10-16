import React, { useState } from "react";
import { Lock } from "lucide-react";
import { StreakBadgeItem } from "../../services/mock/streakBadgesData";

interface BadgeStickerProps {
  badge: StreakBadgeItem;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  useUltra?: boolean;
}

export const BadgeSticker: React.FC<BadgeStickerProps> = ({
  badge,
  size = "md",
  className = "",
  useUltra = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const isUnlocked = badge.isUnlocked;

  // Explicit, proportionate sticker sizing matching standard design
  const sizeStyles = {
    sm: "w-[68px] h-[80px] sm:w-[78px] sm:h-[92px]",
    md: "w-[88px] h-[102px] sm:w-[100px] sm:h-[116px]",
    lg: "w-[150px] h-[175px] sm:w-[180px] sm:h-[210px]",
    hero: "w-[170px] h-[200px] sm:w-[210px] sm:h-[245px]",
  }[size];

  // Tailored glow effects by color theme
  const glowFilters: Record<string, string> = {
    blue: "drop-shadow(0 6px 16px rgba(59, 130, 246, 0.55))",
    emerald: "drop-shadow(0 6px 16px rgba(16, 185, 129, 0.55))",
    purple: "drop-shadow(0 6px 16px rgba(168, 85, 247, 0.55))",
    gold: "drop-shadow(0 6px 16px rgba(245, 158, 11, 0.6))",
    ice: "drop-shadow(0 8px 18px rgba(56, 189, 248, 0.6))",
    royal: "drop-shadow(0 8px 18px rgba(217, 70, 239, 0.6))",
    crimson: "drop-shadow(0 8px 18px rgba(244, 63, 94, 0.6))",
  };

  const currentGlow = glowFilters[badge.theme] || glowFilters.blue;
  const imageSource = useUltra && badge.ultraImageSrc ? badge.ultraImageSrc : badge.imageSrc;

  return (
    <div
      className={`group relative flex flex-col items-center justify-center shrink-0 select-none cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-1.5 ${sizeStyles} ${className}`}
    >
      {/* 3D Badge Graphic */}
      {!imageError ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={imageSource}
            alt={badge.title}
            onError={() => setImageError(true)}
            className="w-full h-full max-w-full max-h-full object-contain pointer-events-none transition-all duration-300"
            style={{
              filter: isUnlocked
                ? `${currentGlow} contrast(1.08) brightness(1.03)`
                : "grayscale(0.7) brightness(0.55) contrast(0.9) drop-shadow(0 4px 10px rgba(0,0,0,0.5))",
              imageRendering: "-webkit-optimize-contrast",
            }}
          />

          {/* Discreet 3D Lock Indicator if not unlocked */}
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-slate-950/90 text-amber-400 border border-slate-700 shadow-md backdrop-blur-sm">
                <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-2xl bg-blue-950/80 p-2 text-xs font-bold text-sky-400 border border-blue-500/30">
          {badge.title}
        </div>
      )}
    </div>
  );
};
