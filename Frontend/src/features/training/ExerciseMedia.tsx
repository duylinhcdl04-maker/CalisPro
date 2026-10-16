import { Dumbbell } from "lucide-react";

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Video hoặc ảnh mẫu của bài: YouTube nhúng, video tải lên (mp4/webm), không có thì ảnh đại diện. */
export function ExerciseMedia({ videoUrl, thumbnailUrl, name, className = "" }: { videoUrl: string | null; thumbnailUrl: string | null; name: string; className?: string }) {
  const yt = videoUrl ? youtubeId(videoUrl) : null;
  return (
    <div className={`relative aspect-video overflow-hidden rounded-2xl border border-border bg-neutral-950 ${className}`}>
      {yt ? (
        <iframe title={`Video mẫu ${name}`} src={`https://www.youtube.com/embed/${yt}?rel=0`} className="absolute inset-0 h-full w-full" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
      ) : videoUrl ? (
        <video src={videoUrl} poster={thumbnailUrl ?? undefined} controls loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />
      ) : thumbnailUrl ? (
        <img src={thumbnailUrl} alt={`Ảnh mẫu ${name}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-white/50"><Dumbbell size={32} aria-hidden /></div>
      )}
    </div>
  );
}
