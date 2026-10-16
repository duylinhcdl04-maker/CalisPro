import { useState, useRef, ChangeEvent } from "react";
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Check,
  Eye,
  Sparkles,
  Info,
  Maximize2,
  Trash2,
  RefreshCw,
  Layers,
  FileText,
  Plus,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { MuscleImpactImage } from "../../types/exercise";
import { aiGeneratorApi } from "../../../ai-motion/api/aiGeneratorApi";

interface MuscleImpactImageUploaderProps {
  images?: MuscleImpactImage[];
  // Backwards compatibility props
  imageUrl?: string;
  caption?: string;
  onChange: (data: {
    anatomyImages: MuscleImpactImage[];
    anatomyImageUrl: string;
    anatomyImageCaption: string;
  }) => void;
  readOnly?: boolean;
}

const MAX_IMAGES = 5;

const ANATOMY_PRESETS = [
  {
    id: "preset-chest-push",
    title: "Ngực & Tay sau (Push)",
    url: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1000&q=80",
    caption: "Minh họa cơ Ngực lớn (Pectoralis Major) và Cơ tam đầu (Triceps) chịu tải chính khi ép đẩy.",
  },
  {
    id: "preset-back-pull",
    title: "Xô lưng & Tay trước (Pull)",
    url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80",
    caption: "Minh họa cơ Xô (Lats) kéo căng và Cơ nhị đầu (Biceps) co rút trong chuyển động kéo xà.",
  },
  {
    id: "preset-core-abs",
    title: "Cơ lõi & Bụng (Core / Abs)",
    url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80",
    caption: "Minh họa cơ Bụng thẳng (Rectus Abdominis) và Cơ liên sườn (Obliques) gồng ổn định cột sống.",
  },
  {
    id: "preset-legs-quads",
    title: "Đùi & Mông (Legs / Quads)",
    url: "https://images.unsplash.com/photo-1434596922112-19c563067271?auto=format&fit=crop&w=1000&q=80",
    caption: "Minh họa cơ Đùi trước (Quadriceps) và Cơ mông lớn (Gluteus Maximus) phát lực bật duỗi gối.",
  },
  {
    id: "preset-shoulders-overhead",
    title: "Vai & Thân trên (Shoulders)",
    url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1000&q=80",
    caption: "Minh họa cơ Vai trước & giữa (Deltoids) cùng Cơ cầu vai (Traps) giữ vững khớp bả vai.",
  },
];

export function MuscleImpactImageUploader({
  images = [],
  imageUrl = "",
  caption = "",
  onChange,
  readOnly = false,
}: MuscleImpactImageUploaderProps) {
  // Normalize initial images list
  const initialList: MuscleImpactImage[] =
    images.length > 0
      ? images
      : imageUrl
      ? [
          {
            id: "initial-1",
            url: imageUrl,
            caption: caption || "Ảnh minh họa nhóm cơ chịu tác động chính của động tác.",
            isPrimary: true,
          },
        ]
      : [];

  const [imageList, setImageList] = useState<MuscleImpactImage[]>(initialList);
  const [selectedImageId, setSelectedImageId] = useState<string>(
    initialList[0]?.id || ""
  );
  const [urlInput, setUrlInput] = useState<string>("");
  const [isUrlMode, setIsUrlMode] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeImage =
    imageList.find((img) => img.id === selectedImageId) || imageList[0] || null;

  // Notify parent component
  const syncWithParent = (updatedList: MuscleImpactImage[]) => {
    setImageList(updatedList);
    const primary = updatedList.find((img) => img.isPrimary) || updatedList[0];
    onChange({
      anatomyImages: updatedList,
      anatomyImageUrl: primary ? primary.url : "",
      anatomyImageCaption: primary?.caption || "",
    });
  };

  // Handle Cloudinary file upload (single or multiple)
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = MAX_IMAGES - imageList.length;
    if (availableSlots <= 0) {
      toast.error(`Đã đạt giới hạn tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    const toastId = toast.loading(`Đang tải ${filesToUpload.length} ảnh lên Cloudinary CDN...`);
    const newItems: MuscleImpactImage[] = [];

    try {
      for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) {
          toast.error(`Tệp ${file.name} không phải là hình ảnh hợp lệ.`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Ảnh ${file.name} vượt quá dung lượng 10MB.`);
          continue;
        }

        const res = await aiGeneratorApi.uploadMedia(file, "calishealth_anatomy");
        if (res.success && res.secureUrl) {
          const newItem: MuscleImpactImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            url: res.secureUrl,
            caption: `Ảnh minh họa cơ tác động ${imageList.length + newItems.length + 1}`,
            isPrimary: imageList.length === 0 && newItems.length === 0,
          };
          newItems.push(newItem);
        } else {
          toast.error(`Không thể tải ${file.name}: ${res.message || "Lỗi Cloudinary"}`);
        }
      }

      if (newItems.length > 0) {
        const combined = [...imageList, ...newItems];
        syncWithParent(combined);
        setSelectedImageId(newItems[newItems.length - 1].id);
        toast.success(`Đã tải lên Cloudinary ${newItems.length} ảnh (${combined.length}/${MAX_IMAGES})!`, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi kết nối tải ảnh lên máy chủ", { id: toastId });
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      toast.error("Vui lòng nhập đường dẫn URL hình ảnh.");
      return;
    }
    if (imageList.length >= MAX_IMAGES) {
      toast.error(`Đã đạt giới hạn tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }

    const newItem: MuscleImpactImage = {
      id: `img-url-${Date.now()}`,
      url: urlInput.trim(),
      caption: `Ảnh minh họa cơ tác động ${imageList.length + 1}`,
      isPrimary: imageList.length === 0,
    };

    const updated = [...imageList, newItem];
    syncWithParent(updated);
    setSelectedImageId(newItem.id);
    setUrlInput("");
    setIsUrlMode(false);
    toast.success(`Đã thêm ảnh từ URL (${updated.length}/${MAX_IMAGES})!`);
  };

  const handleApplyPreset = (preset: (typeof ANATOMY_PRESETS)[0]) => {
    if (imageList.length >= MAX_IMAGES) {
      toast.error(`Đã đạt giới hạn tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }

    const newItem: MuscleImpactImage = {
      id: `preset-${Date.now()}`,
      url: preset.url,
      caption: preset.caption,
      isPrimary: imageList.length === 0,
    };

    const updated = [...imageList, newItem];
    syncWithParent(updated);
    setSelectedImageId(newItem.id);
    toast.success(`Đã thêm ảnh mẫu: ${preset.title} (${updated.length}/${MAX_IMAGES})`);
  };

  const handleSetPrimary = (id: string) => {
    const updated = imageList.map((img) => ({
      ...img,
      isPrimary: img.id === id,
    }));
    syncWithParent(updated);
    toast.success("Đã đặt làm ảnh minh họa chính!");
  };

  const handleUpdateCaption = (id: string, newCaption: string) => {
    const updated = imageList.map((img) =>
      img.id === id ? { ...img, caption: newCaption } : img
    );
    syncWithParent(updated);
  };

  const handleRemoveImage = (id: string) => {
    const updated = imageList.filter((img) => img.id !== id);
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    syncWithParent(updated);
    if (selectedImageId === id) {
      setSelectedImageId(updated[0]?.id || "");
    }
    toast.info("Đã gỡ ảnh khỏi danh sách.");
  };

  return (
    <div className="flex flex-col rounded-3xl border border-border bg-background/50 p-4 sm:p-5 space-y-4 shadow-xs w-full">
      {/* 1. Header Toolbar with Image Counter */}
      <div className="flex flex-wrap items-center justify-between border-b border-border/60 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <ImageIcon size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">
                Ảnh Minh Họa Cơ Tác Động (Muscle Visuals)
              </h4>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold font-mono ${
                  imageList.length >= MAX_IMAGES
                    ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                    : "bg-accent/10 text-accent"
                }`}
              >
                {imageList.length} / {MAX_IMAGES} ảnh
              </span>
            </div>
            <span className="text-[10px] text-text-secondary font-medium">
              Tải tối đa {MAX_IMAGES} góc ảnh minh họa cơ co thắt & chịu lực thực tế
            </span>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={imageList.length >= MAX_IMAGES}
              onClick={() => setIsUrlMode(!isUrlMode)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isUrlMode
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              <LinkIcon size={12} />
              <span>{isUrlMode ? "Đóng URL" : "Thêm URL"}</span>
            </button>
            <button
              type="button"
              disabled={imageList.length >= MAX_IMAGES}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-accent text-white hover:bg-accent-strong transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={13} strokeWidth={3} />
              <span>Thêm ảnh ({imageList.length}/{MAX_IMAGES})</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>

      {/* 2. URL Input Bar (Collapsible) */}
      {isUrlMode && !readOnly && imageList.length < MAX_IMAGES && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-surface border border-border/70 animate-in fade-in">
          <LinkIcon size={14} className="text-text-secondary flex-shrink-0" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Dán đường dẫn ảnh minh họa (https://...)"
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-secondary focus:outline-none"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-strong cursor-pointer"
          >
            Thêm
          </button>
        </div>
      )}

      {/* 3. Main Active Image Preview & Gallery List */}
      {imageList.length > 0 && activeImage ? (
        <div className="space-y-4">
          {/* Main Large Viewer */}
          <div className="relative aspect-video sm:aspect-[16/10] w-full rounded-2xl overflow-hidden border border-border/70 bg-black/40 group shadow-inner">
            <img
              src={activeImage.url}
              alt="Ảnh minh họa cơ tác động"
              className="h-full w-full object-cover sm:object-contain bg-zinc-950 transition-transform duration-300 group-hover:scale-[1.01]"
            />

            {/* Hover Action Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const idx = imageList.findIndex((img) => img.id === activeImage.id);
                  setLightboxIndex(idx >= 0 ? idx : 0);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 text-white backdrop-blur-md hover:bg-white/30 text-xs font-bold cursor-pointer transition-colors"
              >
                <Maximize2 size={13} />
                <span>Xem lớn</span>
              </button>

              {!readOnly && (
                <>
                  {!activeImage.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(activeImage.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/80 text-white backdrop-blur-md hover:bg-amber-500 text-xs font-bold cursor-pointer transition-colors"
                    >
                      <Star size={13} />
                      <span>Đặt làm ảnh chính</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(activeImage.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/80 text-white backdrop-blur-md hover:bg-rose-600 text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>Gỡ ảnh</span>
                  </button>
                </>
              )}
            </div>

            {/* Badge Indicator */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              {activeImage.isPrimary ? (
                <div className="flex items-center gap-1 rounded-xl bg-amber-500/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-black text-white shadow-xs">
                  <Star size={11} className="fill-white" />
                  <span>Ảnh chính</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 rounded-xl bg-black/70 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-slate-300 border border-white/20">
                  <span>Ảnh góc phụ</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. Multi-Image Thumbnail Strip (Up to 5 thumbnails) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary">
              <span>Danh sách ảnh đã tải ({imageList.length}/{MAX_IMAGES}):</span>
              {!readOnly && imageList.length < MAX_IMAGES && (
                <span className="text-[10px] text-accent">Có thể tải thêm {MAX_IMAGES - imageList.length} ảnh nữa</span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {imageList.map((img, idx) => {
                const isSelected = img.id === activeImage.id;
                return (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImageId(img.id)}
                    className={`group relative aspect-video rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-accent ring-2 ring-accent/30 shadow-md scale-[1.02]"
                        : "border-border hover:border-border-hover opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {img.isPrimary && (
                      <div className="absolute top-1 left-1 rounded-md bg-amber-500 p-0.5 text-white">
                        <Star size={9} className="fill-white" />
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 rounded-md bg-black/70 px-1 text-[9px] font-mono font-bold text-white">
                      #{idx + 1}
                    </div>
                  </div>
                );
              })}

              {/* Add slot placeholder if less than 5 */}
              {!readOnly && imageList.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video rounded-xl border-2 border-dashed border-border/80 bg-surface/40 hover:bg-surface hover:border-accent flex flex-col items-center justify-center text-text-secondary hover:text-accent transition-all cursor-pointer"
                >
                  <Plus size={16} />
                  <span className="text-[9px] font-bold mt-0.5">Thêm ảnh</span>
                </button>
              )}
            </div>
          </div>

          {/* 5. Caption Editor for Active Image */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-bold text-text-primary flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileText size={12} className="text-accent" />
                <span>Chú thích ảnh đang chọn (#{imageList.findIndex((img) => img.id === activeImage.id) + 1})</span>
              </span>
              {activeImage.isPrimary && (
                <span className="text-[10px] text-amber-500 font-bold">⭐ Hiển thị ưu tiên</span>
              )}
            </label>
            {readOnly ? (
              <p className="text-xs text-text-secondary bg-surface p-2.5 rounded-xl border border-border/70">
                {activeImage.caption || "Chưa có chú thích giải phẫu."}
              </p>
            ) : (
              <input
                type="text"
                value={activeImage.caption || ""}
                onChange={(e) => handleUpdateCaption(activeImage.id, e.target.value)}
                placeholder="VD: Nhóm cơ ngực căng cực đại tại điểm đáy và cơ tay sau khóa lực ở đỉnh..."
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
              />
            )}
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onClick={() => !readOnly && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-border/80 bg-surface/40 hover:bg-surface hover:border-accent/60 transition-all cursor-pointer text-center space-y-3 ${
            readOnly ? "pointer-events-none" : ""
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Upload size={22} />
          </div>
          <div className="space-y-1 max-w-sm">
            <div className="text-xs font-bold text-text-primary">
              Kéo thả hoặc nhấp để tải lên ảnh minh họa cơ bắp (Tối đa {MAX_IMAGES} ảnh)
            </div>
            <p className="text-[11px] text-text-secondary">
              Hỗ trợ PNG, JPG, WEBP (Tối đa 5MB/ảnh). Cho phép tải nhiều góc ảnh để người tập hình dung trọn vẹn nhóm cơ tác động.
            </p>
          </div>
        </div>
      )}

      {/* 6. Quick Presets (Gợi ý ảnh mẫu nhanh theo bài tập) */}
      {!readOnly && imageList.length < MAX_IMAGES && (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary">
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-accent" />
              <span>Gợi ý ảnh mẫu giải phẫu theo nhóm chuyển động:</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {ANATOMY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="group relative flex flex-col items-center rounded-xl border border-border bg-surface p-1.5 text-center hover:border-accent hover:shadow-xs transition-all cursor-pointer overflow-hidden"
              >
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/20 mb-1.5">
                  <img
                    src={preset.url}
                    alt={preset.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <span className="text-[10px] font-bold text-text-primary line-clamp-1">
                  {preset.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 7. Lightbox Modal */}
      {lightboxIndex !== null && imageList[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white cursor-pointer"
            >
              <X size={24} />
            </button>

            <img
              src={imageList[lightboxIndex].url}
              alt="Ảnh giải phẫu cơ bắp chi tiết"
              className="max-h-[75vh] w-auto rounded-2xl border border-white/20 shadow-2xl object-contain"
            />

            {/* Lightbox Navigation */}
            {imageList.length > 1 && (
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((i) =>
                      i !== null ? (i > 0 ? i - 1 : imageList.length - 1) : 0
                    )
                  }
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs font-mono font-bold text-white">
                  {lightboxIndex + 1} / {imageList.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((i) =>
                      i !== null ? (i < imageList.length - 1 ? i + 1 : 0) : 0
                    )
                  }
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {imageList[lightboxIndex].caption && (
              <p className="mt-2 text-center text-xs text-white/90 bg-black/60 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 max-w-xl">
                {imageList[lightboxIndex].caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
