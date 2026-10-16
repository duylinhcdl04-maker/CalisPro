import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSoundEnabled, playNotificationSound, setSoundEnabled } from "./sound";

/** Nút bật/tắt âm báo thông báo (nhớ lựa chọn trên trình duyệt này). Bật lại sẽ phát thử một tiếng. */
export function SoundToggle({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(isSoundEnabled);

  function toggle() {
    const next = !on;
    setSoundEnabled(next);
    setOn(next);
    if (next) playNotificationSound(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Tắt âm báo thông báo" : "Bật âm báo thông báo"}
      title={on ? "Âm báo: bật (bấm để tắt)" : "Âm báo: tắt (bấm để bật)"}
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors hover:bg-accent-soft ${on ? "text-accent-strong dark:text-accent" : "text-text-secondary"} ${className}`}
    >
      {on ? <Volume2 size={13} /> : <VolumeX size={13} />}
      {on ? "Có tiếng" : "Tắt tiếng"}
    </button>
  );
}
