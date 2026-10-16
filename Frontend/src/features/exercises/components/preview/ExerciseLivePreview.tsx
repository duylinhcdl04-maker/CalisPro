import { useState } from "react";
import {
  Sparkles,
  Play,
  Layers,
  Activity,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Smartphone,
  Monitor,
  Eye,
} from "lucide-react";
import { ExerciseFormData } from "../../types/exercise";
import { AnatomySelector } from "../anatomy/AnatomySelector";
import { findCatalogMuscle } from "../anatomy/bodyMusclesAdapter";

interface ExerciseLivePreviewProps {
  formData: ExerciseFormData;
}

export function ExerciseLivePreview({ formData }: ExerciseLivePreviewProps) {
  const [deviceMode, setDeviceMode] = useState<"mobile" | "card">("mobile");
  const [showAnatomyTab, setShowAnatomyTab] = useState<boolean>(true);

  const basic = formData.basicInformation;
  const media = formData.media;
  const muscles = formData.muscles;
  const tech = formData.technique;
  const ai = formData.aiAnalysis;

  function getMuscleMeta(id: string) {
    return findCatalogMuscle(id);
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-xs space-y-4 sticky top-20">
      {/* Preview Header */}
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-accent" />
          <span className="text-xs font-black text-text-primary uppercase tracking-wider">
            Xem trước Học viên (Live User Preview)
          </span>
        </div>

        <div className="flex rounded-xl border border-border bg-surface-elevated p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setDeviceMode("mobile")}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              deviceMode === "mobile" ? "bg-surface text-accent shadow-xs" : "text-text-secondary"
            }`}
            title="Khung giao diện App Mobile"
          >
            <Smartphone size={13} />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode("card")}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              deviceMode === "card" ? "bg-surface text-accent shadow-xs" : "text-text-secondary"
            }`}
            title="Thẻ thư viện (Card View)"
          >
            <Monitor size={13} />
          </button>
        </div>
      </div>

      {/* Preview Container Frame */}
      <div className="rounded-2xl border border-border bg-background/60 p-3 space-y-4 max-h-[calc(100vh-210px)] overflow-y-auto no-scrollbar">
        {/* Media Preview Box */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border bg-black shadow-inner">
          {media.videoUrl ? (
            <video
              src={media.videoUrl}
              poster={media.thumbnailUrl}
              controls
              className="h-full w-full object-cover"
            />
          ) : media.thumbnailUrl ? (
            <img
              src={media.thumbnailUrl}
              alt={basic.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary">
              <Play size={24} className="opacity-40" />
              <span className="text-[10px] mt-1">Chưa có video mẫu</span>
            </div>
          )}

          {/* AI Badge Overlay */}
          {ai.enabled && (
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[9px] font-black text-emerald-400 border border-emerald-500/30">
              <Sparkles size={10} />
              <span>AI Engine: Active</span>
            </div>
          )}

          <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white">
            {basic.difficulty}
          </div>
        </div>

        {/* Title & Category info */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[9px] font-black uppercase text-accent-strong">
              {basic.category}
            </span>
            <span className="rounded-md bg-surface-elevated px-2 py-0.5 text-[9px] font-bold text-text-secondary border border-border">
              {basic.movementPattern}
            </span>
          </div>

          <h3 className="text-sm font-black text-text-primary mt-1">
            {basic.name || "Tên Động tác (English)"}
          </h3>
          <p className="text-xs text-text-secondary">
            {basic.displayName || "Tên hiển thị tiếng Việt"}
          </p>
        </div>

        {/* Short description */}
        {basic.description && (
          <p className="text-[11px] text-text-secondary leading-relaxed bg-surface p-2.5 rounded-xl border border-border/70">
            {basic.description}
          </p>
        )}

        {/* Anatomy Visualization Preview Switcher */}
        <div className="rounded-2xl bg-surface p-3 border border-border/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-text-primary uppercase flex items-center gap-1">
              <Activity size={12} className="text-accent" />
              <span>Sơ đồ cơ bắp ({muscles.targets.length})</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAnatomyTab(!showAnatomyTab)}
              className="text-[10px] text-accent font-bold hover:underline cursor-pointer"
            >
              {showAnatomyTab ? "Thu gọn" : "Mở rộng"}
            </button>
          </div>

          {showAnatomyTab && (
            <div className="space-y-3">
              {/* Uploaded Anatomy Impact Photo Gallery if present */}
              {((muscles.anatomyImages && muscles.anatomyImages.length > 0) || muscles.anatomyImageUrl) && (
                <div className="rounded-xl overflow-hidden border border-border/80 bg-black/40 shadow-inner space-y-1.5 p-2 bg-surface-elevated/40">
                  {(() => {
                    const imgList =
                      muscles.anatomyImages && muscles.anatomyImages.length > 0
                        ? muscles.anatomyImages
                        : [
                            {
                              id: "prev-1",
                              url: muscles.anatomyImageUrl || "",
                              caption: muscles.anatomyImageCaption,
                              isPrimary: true,
                            },
                          ];
                    const activeImg = imgList.find((i) => i.isPrimary) || imgList[0];

                    return (
                      <div className="space-y-2">
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
                          <img
                            src={activeImg.url}
                            alt="Ảnh minh họa cơ tác động"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                            Ảnh tác động ({imgList.length} ảnh)
                          </div>
                        </div>

                        {activeImg.caption && (
                          <p className="text-[10px] text-text-secondary bg-surface p-2 rounded-lg border border-border/50 leading-relaxed">
                            {activeImg.caption}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="scale-90 -my-3">
                <AnatomySelector
                  targets={muscles.targets}
                  onSelectMuscle={() => {}}
                  readOnly
                />
              </div>
            </div>
          )}

          {/* Muscle List Chips */}
          <div className="space-y-1.5 pt-1">
            {muscles.targets.map((target) => {
              const meta = getMuscleMeta(target.muscleId);
              if (!meta) return null;

              return (
                <div key={target.muscleId} className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold text-text-primary">{meta.nameVi}</span>
                    <span className="text-accent font-bold">
                      {target.role} • {target.activationLevel}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-elevated overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        target.role === "PRIMARY" ? "bg-rose-500" : target.role === "SECONDARY" ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{
                        width:
                          target.activationLevel === "VERY_HIGH"
                            ? "100%"
                            : target.activationLevel === "HIGH"
                            ? "80%"
                            : target.activationLevel === "MODERATE"
                            ? "50%"
                            : "25%",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* What You Should Feel (Sensations) */}
        {muscles.targets.some((t) => t.expectedSensations.length > 0 || t.userGuidance) && (
          <div className="space-y-2 rounded-2xl bg-surface p-3 border border-border/70 text-xs">
            <div className="text-[11px] font-bold text-text-primary flex items-center gap-1">
              <Flame size={12} className="text-amber-500" />
              <span>Cảm giác chuẩn khi tập (What You Feel)</span>
            </div>
            {muscles.targets.map((t) => {
              const meta = getMuscleMeta(t.muscleId);
              if (!meta || !t.userGuidance) return null;
              return (
                <div key={t.muscleId} className="text-[11px] space-y-1 border-b border-border/40 pb-2 last:border-none last:pb-0">
                  <span className="font-bold text-text-primary">{meta.nameVi}:</span>
                  <p className="text-text-secondary text-[10px]">{t.userGuidance}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Movement Phases */}
        {media.phases.length > 0 && (
          <div className="space-y-2 rounded-2xl bg-surface p-3 border border-border/70 text-xs">
            <div className="text-[11px] font-bold text-text-primary flex items-center gap-1">
              <Layers size={12} className="text-sky-500" />
              <span>Các pha kỹ thuật ({media.phases.length} Phases)</span>
            </div>
            <div className="space-y-1.5">
              {media.phases.map((phase) => (
                <div key={phase.id} className="rounded-xl bg-background p-2 text-[10px] space-y-0.5 border border-border/50">
                  <div className="flex justify-between font-bold text-text-primary">
                    <span>{phase.name}</span>
                    <span className="text-accent">{phase.breathing}</span>
                  </div>
                  <p className="text-text-secondary line-clamp-1">{phase.coachingCue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coaching Cues Quick Preview */}
        {tech.coachingCues.length > 0 && (
          <div className="space-y-1.5 rounded-2xl bg-accent/5 p-3 border border-accent/20 text-xs">
            <span className="text-[10px] font-bold text-accent-strong uppercase">Khẩu lệnh then chốt</span>
            <div className="space-y-1">
              {tech.coachingCues.slice(0, 3).map((cue) => (
                <div key={cue.id} className="flex items-center gap-1.5 text-[10px] text-text-primary">
                  <CheckCircle2 size={11} className="text-accent flex-shrink-0" />
                  <span>{cue.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
