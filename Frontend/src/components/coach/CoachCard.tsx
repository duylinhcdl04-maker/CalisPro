import { useState } from "react";
import {
  Trophy,
  Award,
  Medal,
  Star,
  ShieldCheck,
  Zap,
  MapPin,
  Flame,
  CheckCircle2,
  Users,
  ChevronRight,
  ExternalLink,
  Calendar,
  Sparkles,
  PhoneCall,
  MessageSquare,
} from "lucide-react";
import type { Coach } from "../../services/mock/coachData";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/Dialog";
import { toast } from "sonner";

export function CoachCard({ coach }: { coach: Coach }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<number>(0);
  const [isBooking, setIsBooking] = useState(false);

  function handleBookConsultation() {
    setIsBooking(true);
    setTimeout(() => {
      setIsBooking(false);
      setBookingOpen(false);
      toast.success(`Đã gửi yêu cầu tư vấn tới Coach ${coach.name}!`, {
        description: "Coach sẽ liên hệ với bạn qua email hoặc số điện thoại trong vòng 24h.",
      });
    }, 800);
  }

  return (
    <>
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-surface p-5 shadow-elevated transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-soft">
        {/* Top Header with Avatar & Status */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-accent/40 shadow-md">
                  <img src={coach.avatar} alt={coach.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-xs border-2 border-surface" title="Đã xác thực danh tính">
                  <ShieldCheck size={14} />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-text-primary group-hover:text-accent transition-colors">
                    {coach.name}
                  </h3>
                </div>
                <div className="text-xs font-semibold text-accent-strong">{coach.nickname} • {coach.role}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    <span>{coach.rating}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{coach.activeStudents} học viên</span>
                  </div>
                </div>
              </div>
            </div>

            <Badge variant="accent" className="text-[11px] font-bold px-2 py-0.5">
              {coach.experienceYears}+ năm KN
            </Badge>
          </div>

          <p className="mt-3 text-xs text-text-secondary line-clamp-2 leading-relaxed">
            {coach.shortBio}
          </p>

          {/* 🏆 TRANSPARENT ACHIEVEMENTS PREVIEW BOX */}
          <div className="mt-4 rounded-xl bg-gradient-to-br from-amber-500/5 via-surface-elevated to-accent-soft/20 p-3 border border-amber-500/20">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Trophy size={13} className="text-amber-500" />
                Thành tích & Bằng cấp minh bạch
              </span>
              <span className="text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded-full font-bold">
                {coach.achievements.length} chứng chỉ
              </span>
            </div>

            <div className="space-y-1.5">
              {coach.achievements.slice(0, 2).map((ach) => (
                <div key={ach.id} className="flex items-start gap-1.5 text-xs text-text-primary">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-1 font-medium">{ach.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Skills Tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {coach.skills.slice(0, 3).map((skill) => (
              <span key={skill} className="rounded-md bg-surface-elevated border border-border/60 px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                ⚡ {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-border/60 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDetailOpen(true)}
            className="flex-1 text-xs gap-1.5 border-border/80 hover:border-accent hover:bg-accent-soft/40"
          >
            Xem thành tích
            <ExternalLink size={13} />
          </Button>

          <Button
            size="sm"
            onClick={() => setBookingOpen(true)}
            className="flex-1 text-xs gap-1.5 bg-accent hover:bg-accent-strong text-white font-semibold shadow-xs"
          >
            Đặt lịch Coach
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>

      {/* 📄 FULL TRANSPARENT COACH PROFILE & ACHIEVEMENTS DIALOG */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="text-accent" size={20} />
            Hồ sơ & Thành tích minh bạch của Coach
          </DialogTitle>
          <DialogDescription>
            Tất cả danh hiệu, chứng chỉ và kỷ lục được thẩm định bởi Calis Platform.
          </DialogDescription>

          <div className="mt-4 space-y-6">
            {/* Coach Header Banner */}
            <div className="flex items-center gap-4 rounded-2xl bg-surface-elevated p-4 border border-border">
              <img src={coach.avatar} alt={coach.name} className="h-20 w-20 rounded-2xl object-cover border-2 border-accent" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-text-primary">{coach.name}</h3>
                  <Badge variant="accent">{coach.role}</Badge>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">{coach.location}</p>
                <div className="mt-2 flex items-center gap-3 text-xs font-semibold text-text-secondary">
                  <span className="text-amber-600 flex items-center gap-1 font-bold">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    {coach.rating} ({coach.reviewCount} đánh giá)
                  </span>
                  <span>•</span>
                  <span>{coach.activeStudents} học viên đang theo học</span>
                </div>
              </div>
            </div>

            {/* About Coach */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Giới thiệu</h4>
              <p className="text-sm text-text-primary leading-relaxed bg-background/50 p-3.5 rounded-xl border border-border/50">
                {coach.about}
              </p>
            </div>

            {/* 🏆 VERIFIED ACHIEVEMENTS LIST */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Trophy size={14} className="text-amber-500" />
                  Danh hiệu & Chứng chỉ đã xác thực ({coach.achievements.length})
                </h4>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck size={13} />
                  100% Đã xác minh
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {coach.achievements.map((ach) => (
                  <div key={ach.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-xs font-bold text-text-primary">{ach.title}</span>
                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 shrink-0 flex items-center gap-0.5">
                          <CheckCircle2 size={10} />
                          Verified
                        </span>
                      </div>
                      <div className="text-[11px] text-text-secondary mt-1">{ach.organization} • {ach.year}</div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-amber-500/10 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      🏅 {ach.proofBadge}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ⚡ PERSONAL RECORDS (PRs) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 mb-2">
                <Zap size={14} className="text-accent" />
                Thông số & Kỷ lục cá nhân (Personal Bests)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {coach.personalRecords.map((pr, idx) => (
                  <div key={idx} className="rounded-xl bg-background/60 p-3 border border-border/60">
                    <div className="text-[11px] text-text-secondary font-medium truncate">{pr.skill}</div>
                    <div className="text-sm font-extrabold text-accent-strong mt-0.5">{pr.record}</div>
                    <div className="text-[10px] text-text-secondary/80 mt-0.5">{pr.category}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 💬 STUDENT REVIEWS */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 mb-2">
                <MessageSquare size={14} className="text-sky-500" />
                Đánh giá từ học viên thực tế
              </h4>
              <div className="space-y-2">
                {coach.reviews.map((rev, idx) => (
                  <div key={idx} className="rounded-xl bg-surface-elevated p-3 border border-border text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary">{rev.studentName}</span>
                      <div className="flex text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={11} className="fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-text-secondary italic">"{rev.comment}"</p>
                    <div className="mt-1.5 font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                      🎯 Kết quả đạt được: {rev.achievedGoal}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="ghost" onClick={() => setDetailOpen(false)}>
                Đóng
              </Button>
              <Button
                onClick={() => {
                  setDetailOpen(false);
                  setBookingOpen(true);
                }}
                className="bg-accent hover:bg-accent-strong text-white gap-1.5"
              >
                Đăng ký tập với Coach
                <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 📅 BOOKING CONSULTATION DIALOG */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="sm:max-w-lg p-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Calendar className="text-accent" size={20} />
            Đăng ký tập cùng Coach {coach.name}
          </DialogTitle>
          <DialogDescription>
            Chọn gói tập phù hợp để bắt đầu lộ trình huấn luyện cá nhân hóa 1:1.
          </DialogDescription>

          <div className="mt-4 space-y-4">
            <div className="space-y-2.5">
              {coach.trainingOptions.map((opt, idx) => {
                const isSelected = selectedProgram === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedProgram(idx)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? "border-accent bg-accent-soft/30 ring-2 ring-accent/20"
                        : "border-border bg-surface hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-text-primary">{opt.title}</span>
                      <span className="font-extrabold text-sm text-accent-strong">{opt.price}</span>
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">{opt.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-text-secondary">
                      <span className="rounded-md bg-surface-elevated px-2 py-0.5 border border-border">
                        {opt.format}
                      </span>
                      <span>Thời lượng: {opt.duration}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl bg-background/70 p-3.5 border border-border text-xs text-text-secondary space-y-1">
              <div className="font-bold text-text-primary">✨ Quyền lợi khi tập cùng Coach:</div>
              <div>• Giáo án riêng biệt dựa trên kết quả bài kiểm tra thể lực của bạn.</div>
              <div>• Chỉnh sửa góc độ sinh cơ học, phòng tránh chấn thương khớp.</div>
              <div>• Cam kết hoàn tiền 100% nếu không tiến bộ sau 30 ngày.</div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border">
              <Button variant="ghost" onClick={() => setBookingOpen(false)} disabled={isBooking}>
                Hủy
              </Button>
              <Button
                onClick={handleBookConsultation}
                disabled={isBooking}
                className="bg-accent hover:bg-accent-strong text-white px-6 font-semibold"
              >
                {isBooking ? "Đang xử lý..." : "Xác nhận đăng ký tư vấn"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
