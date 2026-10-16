import React, { useState } from "react";
import {
  Video,
  Image as ImageIcon,
  Play,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  Wind,
  Target,
  CheckCircle2,
  UploadCloud,
  Link2,
  Film,
  X,
  RefreshCw,
} from "lucide-react";
import { ExerciseFormData, MovementPhase } from "../../types/exercise";
import { CloudinaryMediaUpload } from "../../../../components/common/CloudinaryMediaUpload";

interface MediaStepProps {
  formData: ExerciseFormData;
  onChange: (updated: Partial<ExerciseFormData>) => void;
}

export function MediaStep({ formData, onChange }: MediaStepProps) {
  const media = formData.media;

  // Chỉ gửi phần thay đổi; trang cha merge vào state MỚI NHẤT. Nếu spread `media` ở đây, callback
  // upload chạy xong (vài chục giây sau) sẽ ghi đè các field vừa nhập bằng giá trị cũ (vd. xóa thumbnail).
  function updateMedia(updated: Partial<typeof media>) {
    onChange({ media: updated as typeof media });
  }

  // Media Input Modes (URL vs Upload)
  const [videoMode, setVideoMode] = useState<"url" | "upload">("url");
  const [thumbMode, setThumbMode] = useState<"url" | "upload">("url");
  const [animMode, setAnimMode] = useState<"url" | "upload">("url");

  // Local File States
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [animFile, setAnimFile] = useState<File | null>(null);

  // Quick sample presets
  const SAMPLE_VIDEOS = [
    { label: "Push Up HD", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    { label: "Pull Up HD", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
    { label: "Dip HD", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
  ];

  const SAMPLE_THUMBS = [
    { label: "Calisthenics Bar", url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80" },
    { label: "Push Up Studio", url: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=1200&q=80" },
    { label: "Gym Rings", url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80" },
  ];

  // Video File Handler
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const objectUrl = URL.createObjectURL(file);
      updateMedia({ videoUrl: objectUrl });
    }
  };

  // Thumbnail File Handler
  const handleThumbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          updateMedia({ thumbnailUrl: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Animation File Handler
  const handleAnimFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnimFile(file);
      const objectUrl = URL.createObjectURL(file);
      updateMedia({ animationUrl: objectUrl });
    }
  };

  const handleClearVideo = () => {
    setVideoFile(null);
    updateMedia({ videoUrl: "" });
  };

  const handleClearThumb = () => {
    setThumbFile(null);
    updateMedia({ thumbnailUrl: "" });
  };

  const handleClearAnim = () => {
    setAnimFile(null);
    updateMedia({ animationUrl: "" });
  };

  // Movement Phases Handlers
  function handleAddPhase() {
    const newOrder = media.phases.length + 1;
    const newPhase: MovementPhase = {
      id: `phase-${Date.now()}`,
      order: newOrder,
      name: `0${newOrder} New Phase`,
      vietnameseName: `Giai đoạn 0${newOrder}`,
      description: "Mô tả chi tiết kỹ thuật của giai đoạn này...",
      coachingCue: "Khẩu lệnh hướng dẫn chính...",
      breathing: "Natural",
      muscleFocus: "Nhóm cơ cảm nhận",
    };
    updateMedia({ phases: [...media.phases, newPhase] });
  }

  function handleUpdatePhase(id: string, updated: Partial<MovementPhase>) {
    updateMedia({
      phases: media.phases.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    });
  }

  function handleDeletePhase(id: string) {
    const filtered = media.phases.filter((p) => p.id !== id);
    const reordered = filtered.map((p, idx) => ({ ...p, order: idx + 1 }));
    updateMedia({ phases: reordered });
  }

  function handleMovePhase(index: number, direction: "up" | "down") {
    const newPhases = [...media.phases];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newPhases.length) return;

    const temp = newPhases[index];
    newPhases[index] = newPhases[targetIdx];
    newPhases[targetIdx] = temp;

    const reordered = newPhases.map((p, idx) => ({ ...p, order: idx + 1 }));
    updateMedia({ phases: reordered });
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Step Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 text-accent">
          <Video size={18} />
          <span className="text-xs font-black uppercase tracking-wider">Bước 02 / 06</span>
        </div>
        <h2 className="text-xl font-black text-text-primary mt-1">Media & Hướng dẫn Chuyển động</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Tải lên video mẫu tiêu chuẩn CalisHealth (kết hợp tải tệp trực tiếp và đường dẫn URL) và phân rã các pha chuyển động kỹ thuật.
        </p>
      </div>

      {/* 1. MEDIA ASSETS */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
              A
            </span>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
              1. Video mẫu & Hình ảnh minh họa (Media Assets)
            </h3>
          </div>
          <span className="text-[11px] text-text-secondary">Hỗ trợ Tải tệp từ máy & Nhập URL trực tiếp</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Video Column */}
          <div className="space-y-4 p-5 rounded-2xl bg-surface-elevated/30 border border-border flex flex-col justify-between">
            <div>
              {/* Header & Mode Switcher */}
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-accent" />
                  <span>Video mẫu HD (MP4 / WebM / MOV)</span>
                  <span className="text-rose-500">*</span>
                </label>

                <div className="flex items-center bg-background border border-border rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setVideoMode("url")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                      videoMode === "url"
                        ? "bg-accent text-white shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Link2 className="w-3 h-3" />
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMode("upload")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                      videoMode === "upload"
                        ? "bg-accent text-white shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <UploadCloud className="w-3 h-3" />
                    Tải tệp lên
                  </button>
                </div>
              </div>

              {/* URL Mode */}
              {videoMode === "url" ? (
                <div className="space-y-2.5">
                  <input
                    type="url"
                    value={media.videoUrl}
                    onChange={(e) => updateMedia({ videoUrl: e.target.value })}
                    placeholder="https://... (Nhập link MP4, WebM hoặc URL trực tiếp)"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-text-secondary/50 font-medium"
                  />

                  {/* Sample Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-text-secondary font-semibold">Mẫu nhanh:</span>
                    {SAMPLE_VIDEOS.map((sample, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => updateMedia({ videoUrl: sample.url })}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface border border-border text-accent hover:bg-accent hover:text-white transition-colors cursor-pointer"
                      >
                        + {sample.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Cloudinary Upload Mode */
                <div className="space-y-2.5">
                  <CloudinaryMediaUpload
                    label="Tải video bài tập lên Cloudinary CDN"
                    accept="video"
                    currentUrl={media.videoUrl}
                    onUploadSuccess={(url) => updateMedia({ videoUrl: url })}
                    folder="calishealth_exercises"
                    helperText="Video được lưu trữ đám mây Cloudinary, tối ưu CDN cho AI MediaPipe phân tích chuyển động."
                  />
                </div>
              )}
            </div>

            {/* Video preview container */}
            <div className="mt-3">
              {media.videoUrl ? (
                <div className="space-y-2">
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border bg-black shadow-inner group">
                    <video
                      key={media.videoUrl}
                      src={media.videoUrl}
                      controls
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleClearVideo}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer backdrop-blur-xs"
                      title="Xóa video"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-secondary px-1">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Video đã nạp • Sẵn sàng trích xuất MediaPipe
                    </span>
                    <button
                      type="button"
                      onClick={handleClearVideo}
                      className="text-rose-400 hover:underline cursor-pointer font-medium"
                    >
                      Xóa video
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center aspect-video rounded-2xl border border-border/80 bg-background/40 p-4 text-center">
                  <Video size={32} className="text-text-secondary/40 mb-1.5" />
                  <p className="text-xs font-bold text-text-primary">Chưa có video bài tập</p>
                  <p className="text-[11px] text-text-secondary mt-0.5 max-w-xs">
                    Tải lên file video từ máy hoặc dán link URL trực tiếp để AI MediaPipe phân tích chuyển động.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail & Animation Column */}
          <div className="space-y-4">
            {/* 1. Thumbnail Image Box */}
            <div className="p-5 rounded-2xl bg-surface-elevated/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-accent" />
                  <span>Ảnh bìa Thumbnail (16:9)</span>
                  <span className="text-rose-500">*</span>
                </label>

                <div className="flex items-center bg-background border border-border rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setThumbMode("url")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                      thumbMode === "url"
                        ? "bg-accent text-white shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Link2 className="w-3 h-3" />
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbMode("upload")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                      thumbMode === "upload"
                        ? "bg-accent text-white shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <UploadCloud className="w-3 h-3" />
                    Tải ảnh lên
                  </button>
                </div>
              </div>

              {thumbMode === "url" ? (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={media.thumbnailUrl}
                    onChange={(e) => updateMedia({ thumbnailUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none font-medium"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-text-secondary font-semibold">Ảnh mẫu:</span>
                    {SAMPLE_THUMBS.map((sample, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => updateMedia({ thumbnailUrl: sample.url })}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface border border-border text-accent hover:bg-accent hover:text-white transition-colors cursor-pointer"
                      >
                        + {sample.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <CloudinaryMediaUpload
                    label="Tải ảnh bìa lên Cloudinary CDN"
                    accept="image"
                    currentUrl={media.thumbnailUrl}
                    onUploadSuccess={(url) => updateMedia({ thumbnailUrl: url })}
                    folder="calishealth_thumbnails"
                    helperText="Khuyên dùng ảnh chụp chuẩn tỉ lệ 16:9, PNG hoặc JPG chất lượng cao."
                  />
                </div>
              )}

              {/* Thumbnail preview */}
              {media.thumbnailUrl && (
                <div className="relative h-28 w-full rounded-xl overflow-hidden border border-border bg-surface-elevated group">
                  <img
                    src={media.thumbnailUrl}
                    alt="Thumbnail preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleClearThumb}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer backdrop-blur-xs"
                    title="Xóa ảnh bìa"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* 2. Animation Loop Box */}
            <div className="p-5 rounded-2xl bg-surface-elevated/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>Animation lặp vô tận (GIF / Lottie / MP4)</span>
                </label>

                <div className="flex items-center bg-background border border-border rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setAnimMode("url")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                      animMode === "url"
                        ? "bg-accent text-white shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Link2 className="w-3 h-3" />
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnimMode("upload")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                      animMode === "upload"
                        ? "bg-accent text-white shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <UploadCloud className="w-3 h-3" />
                    Tải tệp
                  </button>
                </div>
              </div>

              {animMode === "url" ? (
                <input
                  type="url"
                  value={media.animationUrl || ""}
                  onChange={(e) => updateMedia({ animationUrl: e.target.value })}
                  placeholder="https://... (URL file GIF hoặc video lặp vô tận)"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none font-medium"
                />
              ) : (
                <div className="space-y-2">
                  <CloudinaryMediaUpload
                    label="Tải animation lặp lên Cloudinary CDN"
                    accept="both"
                    currentUrl={media.animationUrl}
                    onUploadSuccess={(url) => updateMedia({ animationUrl: url })}
                    folder="calishealth_animations"
                    helperText="Hỗ trợ ảnh GIF động hoặc video MP4/WebM lặp vô tận (Loop)."
                  />
                </div>
              )}

              {media.animationUrl && (
                <div className="relative h-24 w-full rounded-xl overflow-hidden border border-border bg-black group">
                  {media.animationUrl.endsWith(".mp4") || media.animationUrl.startsWith("blob:") ? (
                    <video
                      src={media.animationUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={media.animationUrl}
                      alt="Animation preview"
                      className="h-full w-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleClearAnim}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer backdrop-blur-xs"
                    title="Xóa animation"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MOVEMENT PHASES BUILDER */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
              B
            </span>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
              2. Phân rã Giai đoạn chuyển động (Movement Phases)
            </h3>
          </div>
          <button
            type="button"
            onClick={handleAddPhase}
            className="flex items-center gap-1.5 rounded-2xl bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-strong cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>Thêm giai đoạn</span>
          </button>
        </div>

        <p className="text-xs text-text-secondary">
          Chia nhỏ 1 rep hoàn chỉnh thành các pha kỹ thuật (Setup, Eccentric, Bottom, Concentric, Finish) để AI kiểm tra từng khung hình và hướng dẫn học viên hít thở chuẩn xác.
        </p>

        <div className="space-y-4">
          {media.phases.map((phase, idx) => (
            <div
              key={phase.id}
              className="rounded-2xl border border-border bg-background p-4 space-y-4 hover:border-accent/40 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-white text-xs font-black">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={phase.name}
                    onChange={(e) => handleUpdatePhase(phase.id, { name: e.target.value })}
                    className="font-bold text-xs text-text-primary bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none"
                    placeholder="Tên giai đoạn (e.g. 01 Setup)"
                  />
                  <span className="text-text-secondary text-xs">•</span>
                  <input
                    type="text"
                    value={phase.vietnameseName}
                    onChange={(e) => handleUpdatePhase(phase.id, { vietnameseName: e.target.value })}
                    className="text-xs text-text-secondary bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none"
                    placeholder="Tên tiếng Việt"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMovePhase(idx, "up")}
                    className="rounded-lg p-1 text-text-secondary hover:bg-surface-elevated disabled:opacity-30 cursor-pointer"
                    title="Di chuyển lên"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === media.phases.length - 1}
                    onClick={() => handleMovePhase(idx, "down")}
                    className="rounded-lg p-1 text-text-secondary hover:bg-surface-elevated disabled:opacity-30 cursor-pointer"
                    title="Di chuyển xuống"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePhase(phase.id)}
                    className="rounded-lg p-1 text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                    title="Xóa giai đoạn"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Phase Form details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-text-primary">Mô tả hành động & kỹ thuật</label>
                  <textarea
                    rows={2}
                    value={phase.description}
                    onChange={(e) => handleUpdatePhase(phase.id, { description: e.target.value })}
                    placeholder="Mô tả chuyển động cơ thể trong pha này..."
                    className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-text-primary">Khẩu lệnh then chốt (Coaching Cue)</label>
                  <input
                    type="text"
                    value={phase.coachingCue}
                    onChange={(e) => handleUpdatePhase(phase.id, { coachingCue: e.target.value })}
                    placeholder="e.g. Khuỷu tay khép 45 độ, siết chặt cơ bụng..."
                    className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="flex items-center gap-2">
                  <Wind size={14} className="text-sky-500" />
                  <span className="font-bold text-text-primary">Nhịp thở:</span>
                  <select
                    value={phase.breathing}
                    onChange={(e) => handleUpdatePhase(phase.id, { breathing: e.target.value as any })}
                    className="rounded-xl border border-border bg-surface p-2 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="Inhale">Hít vào (Inhale)</option>
                    <option value="Exhale">Thở ra (Exhale)</option>
                    <option value="Hold / Braced">Nín thở nén hơi (Hold/Braced)</option>
                    <option value="Natural">Thở tự nhiên (Natural)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Target size={14} className="text-emerald-500" />
                  <span className="font-bold text-text-primary">Tâm điểm cơ:</span>
                  <input
                    type="text"
                    value={phase.muscleFocus}
                    onChange={(e) => handleUpdatePhase(phase.id, { muscleFocus: e.target.value })}
                    placeholder="e.g. Cơ ngực lớn & Vai trước"
                    className="flex-1 rounded-xl border border-border bg-surface p-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

