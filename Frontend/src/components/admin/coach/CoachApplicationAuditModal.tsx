import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../../ui/Dialog";
import { Button } from "../../ui/Button";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Video,
  User,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  ZoomIn,
  Lock,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminReviewCoachApplication,
  type CoachApplicationResponse,
  type CoachApplicationStatus,
} from "../../../services/coachApplicationService";

interface CoachApplicationAuditModalProps {
  application: CoachApplicationResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewSuccess: (updated: CoachApplicationResponse) => void;
}

export function CoachApplicationAuditModal({
  application,
  open,
  onOpenChange,
  onReviewSuccess,
}: CoachApplicationAuditModalProps) {
  if (!application) return null;

  const [adminNotes, setAdminNotes] = useState(application.adminNotes || "");
  const [rejectionReason, setRejectionReason] = useState(application.rejectionReason || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleReview = async (status: CoachApplicationStatus) => {
    if (status === "REJECTED" && !rejectionReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối để thông báo cho ứng viên");
      return;
    }
    if (status === "CHANGES_REQUESTED" && !adminNotes.trim()) {
      toast.error("Vui lòng nhập nội dung yêu cầu bổ sung vào ô Ghi chú");
      return;
    }

    setIsProcessing(true);
    try {
      const updated = await adminReviewCoachApplication(application.id, {
        status,
        adminNotes,
        rejectionReason: status === "REJECTED" ? rejectionReason : undefined,
      });

      if (status === "APPROVED") {
        toast.success(`🎉 Đã duyệt hồ sơ của Coach ${application.fullName}!`, {
          description: "Tài khoản đã được nâng cấp lên ROLE_COACH và gửi email thông báo.",
        });
      } else if (status === "CHANGES_REQUESTED") {
        toast.info(`Đã gửi yêu cầu bổ sung hồ sơ tới ứng viên ${application.fullName}`);
      } else if (status === "REJECTED") {
        toast.error(`Đã từ chối hồ sơ của ứng viên ${application.fullName}`);
      }

      onReviewSuccess(updated);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Xử lý duyệt thất bại");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (st: CoachApplicationStatus) => {
    switch (st) {
      case "PENDING":
        return <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold text-[10px]">Chờ duyệt</span>;
      case "UNDER_REVIEW":
        return <span className="bg-sky-500/10 text-sky-600 border border-sky-500/20 px-2 py-0.5 rounded-full font-bold text-[10px]">Đang thẩm định</span>;
      case "APPROVED":
        return <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold text-[10px]">Đã duyệt (Official Coach)</span>;
      case "CHANGES_REQUESTED":
        return <span className="bg-orange-500/10 text-orange-600 border border-orange-500/20 px-2 py-0.5 rounded-full font-bold text-[10px]">Cần bổ sung</span>;
      case "REJECTED":
        return <span className="bg-red-500/10 text-red-600 border border-red-500/20 px-2 py-0.5 rounded-full font-bold text-[10px]">Đã từ chối</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-6 md:p-8">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-strong">
                <ShieldCheck size={18} />
                Thẩm Định Hồ Sơ Huấn Luyện Viên
              </div>
              <div>{getStatusBadge(application.status)}</div>
            </div>
            <DialogTitle className="text-xl md:text-2xl font-black text-text-primary mt-1">
              {application.fullName}
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Nộp lúc: {new Date(application.createdAt).toLocaleString("vi-VN")} • Email: {application.email} • SĐT: {application.phoneNumber}
            </DialogDescription>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            {/* LEFT 2 COLS: APPLICANT DETAILS & eKYC */}
            <div className="lg:col-span-2 space-y-6">
              {/* eKYC IDENTIFICATION CARD */}
              <div className="rounded-2xl border border-border/80 bg-surface-elevated/40 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h4 className="font-bold text-text-primary flex items-center gap-1.5">
                    <Lock size={15} className="text-accent" />
                    Định danh eKYC (Căn cước công dân)
                  </h4>
                  <span className="font-mono text-accent-strong font-bold bg-accent-soft/40 px-2 py-0.5 rounded-lg border border-accent/20">
                    CCCD: {application.idCardNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Front */}
                  <div className="space-y-1">
                    <div className="text-[11px] text-text-secondary font-medium">Mặt trước CCCD:</div>
                    <div
                      onClick={() => setZoomedImage(application.idCardFrontUrl)}
                      className="group relative cursor-pointer overflow-hidden rounded-xl border border-border aspect-[16/10] bg-black/5"
                    >
                      <img
                        src={application.idCardFrontUrl}
                        alt="Mặt trước CCCD"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-bold gap-1">
                        <ZoomIn size={14} /> Phóng to
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="space-y-1">
                    <div className="text-[11px] text-text-secondary font-medium">Mặt sau CCCD:</div>
                    <div
                      onClick={() => setZoomedImage(application.idCardBackUrl)}
                      className="group relative cursor-pointer overflow-hidden rounded-xl border border-border aspect-[16/10] bg-black/5"
                    >
                      <img
                        src={application.idCardBackUrl}
                        alt="Mặt sau CCCD"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-bold gap-1">
                        <ZoomIn size={14} /> Phóng to
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CALISTHENICS EXPERTISE & SKILLS */}
              <div className="rounded-2xl border border-border/80 bg-surface-elevated/40 p-4 space-y-3">
                <h4 className="font-bold text-text-primary flex items-center gap-1.5">
                  <Award size={15} className="text-amber-500" />
                  Năng Lực & Kỷ Lục Calisthenics
                </h4>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-text-secondary">Chuyên môn chính: </span>
                    <strong className="text-accent-strong">{application.primarySpecialty}</strong>
                  </div>
                  <div>
                    <span className="text-text-secondary">Kinh nghiệm: </span>
                    <strong className="text-text-primary">{application.experienceYears} năm</strong>
                  </div>
                  <div>
                    <span className="text-text-secondary">Khu vực: </span>
                    <strong className="text-text-primary">{application.location || "Chưa cập nhật"}</strong>
                  </div>
                  <div>
                    <span className="text-text-secondary">Mức giá đề xuất: </span>
                    <strong className="text-emerald-600 font-bold">{application.expectedRate || "Thỏa thuận"}</strong>
                  </div>
                </div>

                {application.skillsDescription && (
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-text-secondary font-medium">Kỹ năng đã mở khóa:</div>
                    <div className="p-2.5 rounded-xl bg-background border border-border/70 text-text-primary">
                      {application.skillsDescription}
                    </div>
                  </div>
                )}

                {application.personalRecords && (
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-text-secondary font-medium">Kỷ lục cá nhân (Personal Bests):</div>
                    <div className="p-2.5 rounded-xl bg-background border border-border/70 text-accent-strong font-semibold">
                      ⚡ {application.personalRecords}
                    </div>
                  </div>
                )}

                {/* DEMO VIDEO */}
                {application.skillDemoVideoUrl && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[11px] text-text-secondary font-medium flex items-center justify-between">
                      <span>Video thị phạm Strict Form:</span>
                      <a
                        href={application.skillDemoVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline flex items-center gap-1 font-bold"
                      >
                        Mở link gốc <ExternalLink size={12} />
                      </a>
                    </div>
                    <div className="p-3 rounded-xl bg-accent-soft/20 border border-accent/30 flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <Video size={16} className="text-accent shrink-0" />
                        <span className="truncate text-text-primary font-mono text-[11px]">
                          {application.skillDemoVideoUrl}
                        </span>
                      </div>
                      <a
                        href={application.skillDemoVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-accent text-white font-bold rounded-lg shrink-0 text-[11px] hover:bg-accent-strong"
                      >
                        Xem video
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* CERTIFICATES */}
              <div className="rounded-2xl border border-border/80 bg-surface-elevated/40 p-4 space-y-3">
                <h4 className="font-bold text-text-primary flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Award size={15} className="text-amber-500" />
                    Chứng chỉ & Bằng cấp thẩm định ({application.certificates?.length || 0})
                  </span>
                </h4>

                <div className="space-y-2">
                  {application.certificates?.map((cert, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={cert.certificateUrl}
                          alt={cert.certificateName}
                          onClick={() => setZoomedImage(cert.certificateUrl)}
                          className="h-12 w-16 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80"
                        />
                        <div>
                          <div className="font-bold text-text-primary">{cert.certificateName}</div>
                          <div className="text-[11px] text-text-secondary">
                            {cert.issuingOrganization} • Năm cấp: {cert.issueYear || "N/A"}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setZoomedImage(cert.certificateUrl)}
                        className="text-[11px] gap-1 text-accent font-bold"
                      >
                        <ZoomIn size={12} /> Xem bằng
                      </Button>
                    </div>
                  ))}
                  {(!application.certificates || application.certificates.length === 0) && (
                    <div className="text-xs text-text-secondary italic py-2">
                      Không có chứng chỉ kèm theo.
                    </div>
                  )}
                </div>
              </div>

              {/* COMPETITIONS & COMMUNITY ACTIVITIES WITH PROOFS */}
              <div className="rounded-2xl border border-border/80 bg-surface-elevated/40 p-4 space-y-3">
                <h4 className="font-bold text-text-primary flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Trophy size={15} className="text-amber-500" />
                    Giải đấu & Hoạt động Calisthenics ({application.activities?.length || 0})
                  </span>
                </h4>

                <div className="space-y-2.5">
                  {application.activities?.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-border bg-surface shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          {act.proofImageUrl ? (
                            <img
                              src={act.proofImageUrl}
                              alt={act.activityName}
                              onClick={() => setZoomedImage(act.proofImageUrl!)}
                              className="h-14 w-20 object-cover rounded-lg border border-border cursor-pointer hover:opacity-85 shrink-0 shadow-xs"
                              title="Bấm để phóng to ảnh minh chứng"
                            />
                          ) : (
                            <div className="h-14 w-20 rounded-lg border border-dashed border-border flex items-center justify-center bg-background/50 text-[10px] text-text-secondary text-center px-1 shrink-0">
                              Không ảnh
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-text-primary text-sm flex items-center gap-2 flex-wrap">
                              <span>{act.activityName}</span>
                              {act.roleOrAchievement && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                                  {act.roleOrAchievement}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-text-secondary mt-0.5">
                              {act.organizer ? `Ban tổ chức: ${act.organizer}` : "Cộng đồng Calisthenics"}
                              {act.eventYear ? ` • Năm: ${act.eventYear}` : ""}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {act.proofImageUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setZoomedImage(act.proofImageUrl!)}
                              className="text-[11px] gap-1 text-accent font-bold h-7 px-2"
                            >
                              <ZoomIn size={12} /> Minh chứng
                            </Button>
                          )}
                          {act.proofLinkUrl && (
                            <a
                              href={act.proofLinkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:underline font-medium px-2 py-0.5"
                            >
                              <ExternalLink size={11} /> Link bài viết/video
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!application.activities || application.activities.length === 0) && (
                    <div className="text-xs text-text-secondary italic py-2">
                      Ứng viên chưa bổ sung thông tin giải đấu hoặc hoạt động cộng đồng.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COL: ADMIN REVIEW DECISION PANEL */}
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-accent/40 bg-surface p-5 shadow-elevated space-y-4">
                <h4 className="font-bold text-text-primary text-sm uppercase tracking-wider border-b border-border/80 pb-2">
                  Bảng Quyết Định Thẩm Định
                </h4>

                {/* Admin Internal Notes */}
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block text-[11px]">
                    Ghi chú thẩm định nội bộ (Admin notes):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ghi chú về chất lượng form, độ rõ nét của CCCD..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Rejection / Correction reason */}
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary block text-[11px]">
                    Lý do từ chối (Gửi email giải trình cho ứng viên nếu Reject):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Vd: Video kỹ thuật chưa đạt độ khóa khớp vai, ảnh CCCD mặt sau bị mờ số..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-border/80">
                  <Button
                    onClick={() => handleReview("APPROVED")}
                    disabled={isProcessing}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 py-2.5 shadow-xs"
                  >
                    <CheckCircle2 size={16} /> Phê Duyệt & Thăng Cấp Coach
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleReview("CHANGES_REQUESTED")}
                    disabled={isProcessing}
                    className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-500/10 font-bold text-xs gap-1.5"
                  >
                    <AlertTriangle size={15} /> Yêu Cầu Bổ Sung Hồ Sơ
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => handleReview("REJECTED")}
                    disabled={isProcessing}
                    className="w-full text-red-500 hover:bg-red-500/10 font-bold text-xs gap-1.5"
                  >
                    <XCircle size={15} /> Từ Chối Hồ Sơ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FULLSIZE IMAGE PREVIEW MODAL */}
      {zoomedImage && (
        <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
          <DialogContent className="sm:max-w-3xl p-4 bg-black/95 border-none text-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Chi tiết ảnh chụp kiểm định
              </span>
              <button
                onClick={() => setZoomedImage(null)}
                className="text-white hover:text-red-400 font-bold text-xs"
              >
                Đóng [Esc]
              </button>
            </div>
            <div className="flex items-center justify-center max-h-[80vh] overflow-hidden rounded-xl">
              <img src={zoomedImage} alt="Zoom preview" className="max-h-[75vh] w-auto object-contain rounded-lg" />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
