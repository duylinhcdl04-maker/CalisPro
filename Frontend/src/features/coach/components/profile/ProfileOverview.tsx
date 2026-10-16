import type { ReactNode } from "react";
import { Award, BadgeCheck, Briefcase, Languages, Mail, MapPin, Pencil, Phone, Star, Target, UserRound, Users } from "lucide-react";
import type { CoachProfile } from "../../types";
import { Button3D, Panel, StatusBadge, StudentAvatar } from "../ui";

function Stat({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) {
  return (
    <div className="well-3d flex items-center gap-3 rounded-[14px] px-3.5 py-3">
      <span className="icon-tile-3d h-9 w-9 shrink-0 bg-accent-soft text-accent-strong dark:text-accent" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-lg font-black leading-none tabular-nums text-text-primary">{value}</p>
        <p className="mt-1 truncate text-[11px] font-bold text-text-secondary">{label}</p>
      </div>
    </div>
  );
}

export function ProfileOverview({ profile, onEdit }: { profile: CoachProfile; onEdit: () => void }) {
  return (
    <div className="space-y-6">
      <Panel className="animate-rise">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <StudentAvatar name={profile.name} src={profile.avatarUrl} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-black tracking-tight text-text-primary sm:text-2xl">{profile.name}</h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StatusBadge tone="accent" icon={<BadgeCheck size={12} aria-hidden />}>
                    Head Coach
                  </StatusBadge>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Star size={13} className="fill-current" aria-hidden />
                    {profile.rating.toFixed(1)}
                    <span className="font-semibold text-text-secondary">/ 5 đánh giá</span>
                  </span>
                </div>
              </div>
              <Button3D onClick={onEdit} leftIcon={<Pencil size={15} />} className="self-start">
                Chỉnh sửa hồ sơ
              </Button3D>
            </div>
            <ul className="mt-4 grid gap-2 text-xs text-text-secondary sm:grid-cols-2">
              <li className="flex items-center gap-2"><MapPin size={14} aria-hidden />{profile.location || "Chưa cập nhật"}</li>
              <li className="flex items-center gap-2"><Languages size={14} aria-hidden />{profile.languages.join(", ")}</li>
              <li className="flex min-w-0 items-center gap-2"><Mail size={14} aria-hidden /><span className="truncate">{profile.email}</span></li>
              <li className="flex items-center gap-2"><Phone size={14} aria-hidden />{profile.phone || "Chưa cập nhật"}</li>
            </ul>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
          <Stat icon={<Users size={17} />} value={profile.assignedStudents} label="Học viên phụ trách" />
          <Stat icon={<Briefcase size={17} />} value={`${profile.experienceYears} năm`} label="Kinh nghiệm" />
          <Stat icon={<Award size={17} />} value={profile.certifications.length} label="Chứng chỉ" />
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Panel title="Giới thiệu" icon={UserRound} className="animate-rise [animation-delay:60ms]">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{profile.bio || "Chưa có phần giới thiệu."}</p>
          </Panel>
          <Panel title="Chuyên môn" icon={Target} className="animate-rise [animation-delay:120ms]">
            {profile.specializations.length ? (
              <ul className="flex flex-wrap gap-2">
                {profile.specializations.map((s) => (
                  <li key={s} className="rounded-full border border-accent/25 bg-accent-soft px-3 py-1 text-xs font-bold text-accent-strong dark:text-accent">
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-secondary">Chưa thêm chuyên môn.</p>
            )}
          </Panel>
        </div>
        <Panel title="Chứng chỉ" icon={Award} className="animate-rise [animation-delay:180ms] lg:col-span-2">
          <ul className="space-y-3">
            {profile.certifications.map((c) => (
              <li key={c.id} className="flex items-start gap-3 rounded-[14px] border border-border/70 bg-surface-elevated/50 p-3">
                <BadgeCheck size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary">{c.name}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {c.issuer}, {c.year}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
