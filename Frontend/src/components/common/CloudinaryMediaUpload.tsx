import { useState, useRef, useEffect } from "react";
import { UploadCloud, CheckCircle2, Film, Image as ImageIcon, Loader2, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { aiGeneratorApi } from "../../features/ai-motion/api/aiGeneratorApi";

interface CloudinaryMediaUploadProps {
  label: string;
  accept: "image" | "video" | "both";
  currentUrl?: string;
  onUploadSuccess: (url: string) => void;
  folder?: string;
  helperText?: string;
}

export function CloudinaryMediaUpload({
  label,
  accept,
  currentUrl,
  onUploadSuccess,
  folder = "calishealth_exercises",
  helperText,
}: CloudinaryMediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentUrl);
  const [progress, setProgress] = useState(0);

  // Đồng bộ khi dữ liệu form được nạp sau (vd. mở trang Edit) để hiển thị media đã lưu
  useEffect(() => {
    setPreviewUrl(currentUrl || undefined);
  }, [currentUrl]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptMime =
    accept === "image"
      ? "image/jpeg,image/png,image/webp,image/svg+xml"
      : accept === "video"
      ? "video/mp4,video/quicktime,video/webm"
      : "image/*,video/*";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (images <= 10MB, videos <= 100MB)
    const maxMb = file.type.startsWith("video/") ? 100 : 10;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`Dung lượng file vượt quá giới hạn (${maxMb}MB).`);
      return;
    }

    setIsUploading(true);
    setProgress(0);
    const toastId = toast.loading(`Đang tải ${file.type.startsWith("video/") ? "video" : "ảnh"} lên Cloudinary CDN...`);

    try {
      const res = await aiGeneratorApi.uploadMedia(file, folder, setProgress);
      if (res.success && res.secureUrl) {
        setPreviewUrl(res.secureUrl);
        onUploadSuccess(res.secureUrl);
        toast.success("Tải lên Cloudinary thành công!", { id: toastId });
      } else {
        toast.error(res.message || "Tải lên thất bại", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Không thể kết nối máy chủ tải lên", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleClear() {
    setPreviewUrl("");
    onUploadSuccess("");
  }

  const isVideo = previewUrl && (previewUrl.includes("/video/") || previewUrl.endsWith(".mp4") || previewUrl.endsWith(".mov") || previewUrl.endsWith(".webm"));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
          {accept === "video" ? <Film size={14} className="text-accent" /> : <ImageIcon size={14} className="text-accent" />}
          <span>{label}</span>
        </label>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.2 rounded-full">
          Cloudinary CDN
        </span>
      </div>

      {previewUrl ? (
        <div className="relative rounded-2xl border border-border bg-surface overflow-hidden group">
          {isVideo ? (
            <video
              src={previewUrl}
              controls
              className="w-full max-h-56 object-cover bg-black rounded-2xl"
            />
          ) : (
            <div className="relative h-44 w-full bg-black/40 flex items-center justify-center overflow-hidden">
              <img
                src={previewUrl}
                alt="Uploaded media"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Action Overlay */}
          <div className="p-2.5 bg-surface/90 border-t border-border flex items-center justify-between gap-2">
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-mono text-accent truncate hover:underline flex items-center gap-1"
            >
              <span className="truncate max-w-[200px]">{previewUrl}</span>
              <ExternalLink size={11} />
            </a>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-xl border border-border bg-background text-[11px] font-bold text-text-primary hover:bg-surface-elevated cursor-pointer"
              >
                Đổi file
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-lg text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                title="Xóa media"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed border-border rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer hover:border-accent/60 hover:bg-accent/5 ${
            isUploading ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptMime}
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="space-y-2">
            {isUploading ? (
              <div className="flex flex-col items-center justify-center space-y-2">
                <Loader2 size={24} className="text-accent animate-spin" />
                <span className="text-xs font-bold text-text-primary">
                  {progress < 100 ? `Đang tải lên... ${progress}%` : "Cloudinary đang xử lý..."}
                </span>
                <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-elevated">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent mx-auto">
                  <UploadCloud size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-text-primary block">
                    Bấm để tải lên {accept === "video" ? "Video bài tập" : "Ảnh giải phẫu"}
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    {helperText || `Hỗ trợ ${accept === "video" ? "MP4, MOV, WEBM (Tối đa 100MB)" : "PNG, JPG, WEBM (Tối đa 10MB)"}`}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
