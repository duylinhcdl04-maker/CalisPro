import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Camera, Sparkles, Upload, X, Trash2, Check, User as UserIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./Dialog";
import { Button } from "./Button";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

interface GlowingAvatarProps {
  src?: string | null;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  isEditable?: boolean;
  onAvatarChange?: (newAvatarUrl: string | null) => Promise<void> | void;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
];

const SIZE_CONFIGS = {
  sm: {
    container: "w-12 h-12",
    inner: "w-10 h-10",
    text: "text-sm",
    auraPadding: "p-[3px]",
    badgeSize: "w-4 h-4",
    iconSize: 12,
  },
  md: {
    container: "w-16 h-16",
    inner: "w-14 h-14",
    text: "text-lg font-bold",
    auraPadding: "p-[4px]",
    badgeSize: "w-5 h-5",
    iconSize: 14,
  },
  lg: {
    container: "w-24 h-24",
    inner: "w-[84px] h-[84px]",
    text: "text-2xl font-bold",
    auraPadding: "p-[5px]",
    badgeSize: "w-7 h-7",
    iconSize: 16,
  },
  xl: {
    container: "w-32 h-32 md:w-36 md:h-36",
    inner: "w-[116px] h-[116px] md:w-[130px] md:h-[130px]",
    text: "text-3xl md:text-4xl font-extrabold",
    auraPadding: "p-[6px]",
    badgeSize: "w-9 h-9",
    iconSize: 18,
  },
};

export function GlowingAvatar({
  src,
  fallback,
  size = "xl",
  className,
  isEditable = false,
  onAvatarChange,
}: GlowingAvatarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(src ?? null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = SIZE_CONFIGS[size];

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  }

  function processFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh tối đa là 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      if (onAvatarChange) {
        await onAvatarChange(previewUrl);
      }
      toast.success("Đã cập nhật ảnh đại diện thành công!");
      setModalOpen(false);
    } catch (err) {
      toast.error("Có lỗi xảy ra khi lưu ảnh đại diện.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveAvatar() {
    setPreviewUrl(null);
    setIsSaving(true);
    try {
      if (onAvatarChange) {
        await onAvatarChange(null);
      }
      toast.success("Đã gỡ ảnh đại diện.");
      setModalOpen(false);
    } catch (err) {
      toast.error("Không thể gỡ ảnh.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div
        className={cn("relative inline-flex items-center justify-center select-none group", config.container, className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Layer 1: Ambient Pulsing Energy Background */}
        <div
          className="absolute inset-[-8px] rounded-full animate-pulse-energy pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(14, 165, 233, 0.45) 0%, rgba(56, 189, 248, 0.35) 45%, rgba(2, 132, 199, 0.15) 75%, transparent 100%)",
          }}
        />

        {/* Layer 2: Undulating Dynamic Wave Ring 1 (Clockwise Wave) */}
        <div
          className="absolute inset-[-4px] rounded-[50%] animate-wave-morph pointer-events-none opacity-85"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(56, 189, 248, 0.5), transparent 70%), linear-gradient(135deg, rgba(14, 165, 233, 0.6) 0%, rgba(56, 189, 248, 0.6) 50%, rgba(2, 132, 199, 0.6) 100%)",
            filter: "blur(4px)",
          }}
        />

        {/* Layer 3: Undulating Dynamic Wave Ring 2 (Counter-Clockwise Wave) */}
        <div
          className="absolute inset-[-6px] rounded-[50%] animate-wave-morph-reverse pointer-events-none opacity-60"
          style={{
            background:
              "linear-gradient(225deg, rgba(56, 189, 248, 0.5) 0%, rgba(6, 182, 212, 0.5) 50%, rgba(14, 165, 233, 0.5) 100%)",
            filter: "blur(6px)",
          }}
        />

        {/* Layer 4: Intersecting Spinning Light Beam Ring 1 (Clockwise) */}
        <div
          className="absolute inset-[-3px] rounded-full animate-spin-slow pointer-events-none animate-laser-glow"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(14, 165, 233, 0.95) 25deg, transparent 50deg, transparent 180deg, rgba(56, 189, 248, 0.95) 205deg, transparent 230deg, transparent 360deg)",
            mask: "radial-gradient(circle, transparent 58%, black 62%)",
            WebkitMask: "radial-gradient(circle, transparent 58%, black 62%)",
          }}
        />

        {/* Layer 5: Intersecting Spinning Light Beam Ring 2 (Counter-Clockwise - Criss-Cross Light effect) */}
        <div
          className="absolute inset-[-3px] rounded-full animate-spin-reverse-slow pointer-events-none"
          style={{
            background:
              "conic-gradient(from 90deg, transparent 0deg, rgba(6, 182, 212, 0.95) 30deg, transparent 60deg, transparent 180deg, rgba(14, 165, 233, 0.9) 210deg, transparent 240deg, transparent 360deg)",
            mixBlendMode: "screen",
            mask: "radial-gradient(circle, transparent 58%, black 62%)",
            WebkitMask: "radial-gradient(circle, transparent 58%, black 62%)",
          }}
        />

        {/* Layer 6: High Precision Circular Glass Ring Frame */}
        <div className="absolute inset-0 rounded-full border border-white/40 dark:border-white/20 shadow-[inset_0_0_12px_rgba(255,255,255,0.4)] pointer-events-none" />

        {/* Layer 7: Inner Avatar Body */}
        <div
          className={cn(
            "relative rounded-full overflow-hidden bg-surface flex items-center justify-center shadow-elevated border-2 border-surface transition-transform duration-300",
            config.inner,
            isHovered && isEditable ? "scale-[0.98]" : ""
          )}
        >
          {src ? (
            <img src={src} alt="Avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-soft via-surface to-accent/20 text-accent-strong">
              <span className={cn("tracking-tight font-display select-none", config.text)}>{fallback}</span>
            </div>
          )}

          {/* Interactive Hover Overlay for Edit Mode */}
          {isEditable && (
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(src ?? null);
                setModalOpen(true);
              }}
              className={cn(
                "absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white transition-opacity duration-200 cursor-pointer",
                isHovered ? "opacity-100" : "opacity-0"
              )}
              title="Đổi ảnh đại diện"
              aria-label="Đổi ảnh đại diện"
            >
              <Camera size={config.iconSize * 1.4} className="text-white drop-shadow mb-0.5" />
              {size === "xl" && <span className="text-[11px] font-semibold tracking-wide text-white/90">Đổi ảnh</span>}
            </button>
          )}
        </div>

        {/* Edit floating badge indicator */}
        {isEditable && size !== "sm" && (
          <button
            type="button"
            onClick={() => {
              setPreviewUrl(src ?? null);
              setModalOpen(true);
            }}
            className={cn(
              "absolute bottom-0 right-0 rounded-full bg-accent text-white flex items-center justify-center shadow-lg border-2 border-surface hover:bg-accent-strong transition-transform hover:scale-110 active:scale-95 cursor-pointer z-10",
              config.badgeSize
            )}
            title="Tải ảnh mới"
            aria-label="Tải ảnh mới"
          >
            <Camera size={config.iconSize} />
          </button>
        )}
      </div>

      {/* Upload & Customize Avatar Modal */}
      {isEditable && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-lg p-6 bg-surface">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="text-accent" size={20} />
              Cập nhật ảnh đại diện
            </DialogTitle>
            <DialogDescription>
              Tải lên hình ảnh cá nhân hoặc chọn một ảnh avatar có sẵn để đại diện cho bạn.
            </DialogDescription>

            <div className="mt-6 space-y-6">
              {/* Central Preview with Glowing Ring */}
              <div className="flex flex-col items-center justify-center py-4 bg-background/50 rounded-xl border border-border">
                <GlowingAvatar
                  src={previewUrl}
                  fallback={fallback}
                  size="lg"
                  isEditable={false}
                  className="my-2"
                />
                <span className="mt-3 text-xs text-text-secondary font-medium">
                  {previewUrl ? "Xem trước ảnh của bạn" : "Chưa chọn ảnh (dùng ký tự mặc định)"}
                </span>
              </div>

              {/* Drag & Drop Upload Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2",
                  isDragging
                    ? "border-accent bg-accent-soft/30 scale-[0.99]"
                    : "border-border hover:border-accent hover:bg-surface-elevated"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center text-accent-strong">
                  <Upload size={22} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-text-primary block">
                    Kéo thả ảnh vào đây hoặc <span className="text-accent underline">duyệt tệp</span>
                  </span>
                  <span className="text-xs text-text-secondary mt-1 block">
                    Hỗ trợ PNG, JPG, WEBP (tối đa 5MB)
                  </span>
                </div>
              </div>

              {/* Preset Avatars Selection */}
              <div>
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Hoặc chọn avatar mẫu
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((presetUrl, idx) => {
                    const isSelected = previewUrl === presetUrl;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewUrl(presetUrl)}
                        className={cn(
                          "relative rounded-full aspect-square overflow-hidden border-2 transition-transform hover:scale-105",
                          isSelected
                            ? "border-accent ring-2 ring-accent/30 scale-105"
                            : "border-transparent opacity-80 hover:opacity-100"
                        )}
                      >
                        <img src={presetUrl} alt={`Mẫu ${idx + 1}`} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-accent/30 flex items-center justify-center text-white">
                            <Check size={14} className="stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                {previewUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={isSaving}
                    className="text-danger hover:bg-danger/10 hover:text-danger border-danger/30"
                  >
                    <Trash2 size={15} className="mr-1.5" />
                    Gỡ ảnh
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setModalOpen(false)}
                    disabled={isSaving}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-accent hover:bg-accent-strong text-white px-5"
                  >
                    {isSaving ? "Đang lưu..." : "Lưu ảnh"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
