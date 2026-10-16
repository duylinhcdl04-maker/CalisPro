import { useState } from "react";
import { cn } from "../../../../lib/utils";
import { initials } from "../../lib/format";

const SIZES = { xs: "h-7 w-7 text-[10px]", sm: "h-9 w-9 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg", xl: "h-24 w-24 text-2xl" } as const;

interface StudentAvatarProps {
  name: string;
  src: string | null | undefined;
  size?: keyof typeof SIZES;
  online?: boolean;
  className?: string;
}

/** Photo avatar with a raised ring; falls back to initials when there is no photo or it fails to load. */
export function StudentAvatar({ name, src, size = "sm", online, className }: StudentAvatarProps) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "inline-grid place-items-center overflow-hidden rounded-full bg-accent-soft font-extrabold text-accent-strong ring-2 ring-surface shadow-[0_2px_0_0_hsl(var(--border-strong)),0_6px_12px_-6px_hsl(214_40%_30%/0.35)] dark:text-accent",
          SIZES[size]
        )}
      >
        {src && !failed ? <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" onError={() => setFailed(true)} /> : <span aria-hidden>{initials(name)}</span>}
      </span>
      {online !== undefined && (
        <span className={cn("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-surface", online ? "bg-emerald-500" : "bg-text-secondary/40")} aria-label={online ? "Đang online" : "Offline"} />
      )}
    </span>
  );
}
