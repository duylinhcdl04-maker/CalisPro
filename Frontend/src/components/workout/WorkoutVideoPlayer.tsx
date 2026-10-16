import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
} from "lucide-react";
import type { ExerciseGuideDetail } from "../../services/mock/workoutTrainingData";
import { Badge } from "../ui/Badge";

interface WorkoutVideoPlayerProps {
  exercise: ExerciseGuideDetail;
  exerciseIndex: number;
  totalExercises: number;
  isPaused: boolean;
  onTogglePause: () => void;
}

export function WorkoutVideoPlayer({
  exercise,
  exerciseIndex,
  totalExercises,
  isPaused,
  onTogglePause,
}: WorkoutVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(!isPaused);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [progressPercent, setProgressPercent] = useState<number>(35);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  function handlePlayToggle() {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (videoRef.current) {
      if (nextState) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
    onTogglePause();
  }

  function cycleSpeed() {
    const speeds = [1, 1.25, 0.75];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-black shadow-elevated group aspect-video md:aspect-[16/9.5]">
      {/* Exercise Image or Real HTML5 Video */}
      {exercise.videoUrl ? (
        <video
          ref={videoRef}
          src={exercise.videoUrl}
          poster={exercise.videoThumbnail}
          autoPlay={isPlaying}
          loop
          muted={isMuted}
          playsInline
          className={`h-full w-full object-cover transition-all duration-700 ${
            isPlaying ? "scale-100 brightness-[0.9]" : "scale-105 brightness-[0.7]"
          }`}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration) {
              setProgressPercent((v.currentTime / v.duration) * 100);
            }
          }}
        />
      ) : (
        <img
          src={exercise.videoThumbnail}
          alt={exercise.name}
          className={`h-full w-full object-cover transition-all duration-700 ${
            isPlaying ? "scale-100 brightness-[0.88]" : "scale-105 brightness-[0.7]"
          }`}
        />
      )}

      {/* Top Gradient Overlay */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />

      {/* Bottom Gradient Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

      {/* 🏷️ TOP LEFT: EXERCISE BADGES & TITLE */}
      <div className="absolute top-4 left-4 z-10 space-y-1.5">
        <div className="text-[11px] font-bold uppercase tracking-[.18em] text-white/80 flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime-400 animate-ping" />
          EXERCISE {exerciseIndex + 1} OF {totalExercises}
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
          {exercise.name}
        </h2>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold text-white/90 border border-white/20">
            {exercise.equipment}
          </span>
          <span className="rounded-full bg-accent/80 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-white border border-accent">
            {exercise.category}
          </span>
          <span className="rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold text-white">
            {exercise.difficulty}
          </span>
        </div>
      </div>

      {/* 🧬 TOP RIGHT: TARGET MUSCLE ANATOMY OVERLAY */}
      <div className="absolute top-4 right-4 z-10 hidden sm:flex flex-col items-end">
        <div className="rounded-2xl bg-black/65 backdrop-blur-md border border-white/15 p-3 text-right max-w-[200px] shadow-lg">
          <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold uppercase tracking-wider text-lime-400 mb-1">
            <Activity size={12} />
            Nhóm cơ kích hoạt
          </div>
          <div className="text-[11px] font-bold text-white leading-tight">
            {exercise.primaryMuscles[0]}
          </div>
          <div className="text-[10px] text-white/70 mt-0.5 line-clamp-1">
            {exercise.primaryMuscles.slice(1).join(", ")}
          </div>
        </div>
      </div>

      {/* ⏯️ CENTER PLAY/PAUSE BIG OVERLAY BUTTON (When paused) */}
      {!isPlaying && (
        <button
          type="button"
          onClick={handlePlayToggle}
          className="absolute inset-0 m-auto h-16 w-16 rounded-full bg-accent/90 hover:bg-accent text-white flex items-center justify-center shadow-2xl backdrop-blur-sm border-2 border-white/30 transition-transform hover:scale-110 active:scale-95 z-20 cursor-pointer"
          aria-label="Phát video"
        >
          <Play size={28} className="translate-x-0.5 fill-white" />
        </button>
      )}

      {/* 🎛️ BOTTOM VIDEO CONTROLS BAR */}
      <div className="absolute bottom-3 inset-x-4 z-10 space-y-2">
        {/* Scrub progress bar */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = ((e.clientX - rect.left) / rect.width) * 100;
            setProgressPercent(percent);
          }}
          className="relative h-1.5 w-full rounded-full bg-white/25 hover:h-2.5 transition-all cursor-pointer overflow-hidden group/bar"
        >
          <div
            className="h-full bg-gradient-to-r from-accent to-lime-400 rounded-full relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Action icons row */}
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePlayToggle}
              className="p-1 hover:text-lime-400 transition-colors cursor-pointer"
              title={isPlaying ? "Tạm dừng" : "Phát"}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-current" />}
            </button>

            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 hover:text-lime-400 transition-colors cursor-pointer"
              title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <span className="font-mono text-[11px] text-white/90">
              0:15 / 1:20
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cycleSpeed}
              className="rounded-md bg-white/20 hover:bg-white/30 px-2 py-0.5 text-[10px] font-bold text-white transition-colors cursor-pointer"
            >
              {playbackSpeed}x
            </button>

            <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
              HD
            </span>

            <button
              type="button"
              onClick={() => toast.info("Chế độ xem toàn màn hình")}
              className="p-1 hover:text-lime-400 transition-colors cursor-pointer"
              title="Toàn màn hình"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
