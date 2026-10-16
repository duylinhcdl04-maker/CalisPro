import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../ui/Dialog";
import { Button } from "../ui/Button";
import {
  ShieldCheck,
  Award,
  Upload,
  User,
  Phone,
  Mail,
  Video,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Plus,
  ArrowRight,
  ArrowLeft,
  Lock,
  Trophy,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  submitCoachApplication,
  type CoachApplicationRequest,
  type CertificateItem,
  type ActivityItem,
} from "../../services/coachApplicationService";

interface CoachApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CoachApplicationModal({
  open,
  onOpenChange,
}: CoachApplicationModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CoachApplicationRequest>({
    fullName: "",
    dateOfBirth: "1998-01-01",
    gender: "Nam",
    phoneNumber: "",
    email: "",
    location: "Hà Nội",
    idCardNumber: "",
    idCardFrontUrl: "",
    idCardBackUrl: "",
    experienceYears: 3,
    primarySpecialty: "Static Strength (Planche, Front Lever)",
    skillsDescription: "",
    personalRecords: "",
    skillDemoVideoUrl: "",
    bio: "",
    expectedRate: "1.500.000 đ / tháng",
    certificates: [],
    activities: [],
  });

  // Certificate input draft
  const [certDraft, setCertDraft] = useState<CertificateItem>({
    certificateName: "",
    issuingOrganization: "",
    issueYear: new Date().getFullYear(),
    certificateUrl: "",
  });

  // Activity / Competition input draft
  const [activityDraft, setActivityDraft] = useState<ActivityItem>({
    activityName: "",
    roleOrAchievement: "",
    organizer: "",
    eventYear: new Date().getFullYear(),
    proofImageUrl: "",
    proofLinkUrl: "",
  });

  const [step3Tab, setStep3Tab] = useState<"certs" | "activities">("certs");
  const [agreementChecked, setAgreementChecked] = useState(false);

  // Handle local image upload as data URL
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "idCardFrontUrl" | "idCardBackUrl" | "cert" | "activity"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (field === "cert") {
        setCertDraft((prev) => ({ ...prev, certificateUrl: result }));
      } else if (field === "activity") {
        setActivityDraft((prev) => ({ ...prev, proofImageUrl: result }));
      } else {
        setFormData((prev) => ({ ...prev, [field]: result }));
      }
      toast.success("Đã tải ảnh lên thành công");
    };
    reader.readAsDataURL(file);
  };

  const addCertificate = () => {
    if (!certDraft.certificateName.trim() || !certDraft.issuingOrganization.trim()) {
      toast.error("Vui lòng nhập tên chứng chỉ và đơn vị cấp");
      return;
    }
    if (!certDraft.certificateUrl) {
      toast.error("Vui lòng tải ảnh scan/chứng nhận bằng cấp");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      certificates: [...prev.certificates, { ...certDraft, id: Date.now() }],
    }));
    setCertDraft({
      certificateName: "",
      issuingOrganization: "",
      issueYear: new Date().getFullYear(),
      certificateUrl: "",
    });
    toast.success("Đã thêm chứng chỉ vào hồ sơ");
  };

  const removeCertificate = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index),
    }));
  };

  const addActivity = () => {
    if (!activityDraft.activityName.trim() || !activityDraft.roleOrAchievement.trim()) {
      toast.error("Vui lòng nhập tên cuộc thi/hoạt động và vai trò/thành tích");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      activities: [...prev.activities, { ...activityDraft, id: Date.now() }],
    }));
    setActivityDraft({
      activityName: "",
      roleOrAchievement: "",
      organizer: "",
      eventYear: new Date().getFullYear(),
      proofImageUrl: "",
      proofLinkUrl: "",
    });
    toast.success("Đã thêm cuộc thi/hoạt động vào hồ sơ");
  };

  const removeActivity = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        toast.error("Vui lòng nhập họ và tên thật");
        return false;
      }
      if (!formData.phoneNumber.trim()) {
        toast.error("Vui lòng nhập số điện thoại");
        return false;
      }
      if (!formData.email.trim()) {
        toast.error("Vui lòng nhập email liên hệ");
        return false;
      }
      if (!formData.idCardNumber.trim() || formData.idCardNumber.length < 9) {
        toast.error("Vui lòng nhập đúng số CCCD (tối thiểu 9 số)");
        return false;
      }
      if (!formData.idCardFrontUrl || !formData.idCardBackUrl) {
        toast.error("Vui lòng tải lên cả mặt trước và mặt sau CCCD để eKYC định danh");
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.primarySpecialty) {
        toast.error("Vui lòng chọn trường phái thế mạnh chính");
        return false;
      }
      if (!formData.skillDemoVideoUrl?.trim()) {
        toast.error("Vui lòng cung cấp link video thị phạm kỹ năng để thẩm định form");
        return false;
      }
    } else if (currentStep === 3) {
      if (formData.certificates.length === 0) {
        toast.error("Vui lòng thêm ít nhất 1 chứng chỉ hoặc bằng cấp minh chứng");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4) as any);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;
    if (!agreementChecked) {
      toast.error("Vui lòng đọc và tích cam kết tính trung thực của hồ sơ");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCoachApplication(formData);
      toast.success("🎉 Gửi hồ sơ đăng ký Coach thành công!", {
        description:
          "Ban Quản Trị & Hội Đồng Chuyên Môn sẽ thẩm định eKYC, bằng cấp và video của bạn trong vòng 24 - 48h.",
      });
      onOpenChange(false);
      setStep(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Gửi hồ sơ thất bại, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-strong">
            <ShieldCheck size={18} />
            Hệ Thống Kiểm Định Huấn Luyện Viên Calisthenics
          </div>
          <DialogTitle className="text-xl md:text-2xl font-extrabold text-text-primary mt-1">
            Đăng Ký Hồ Sơ Huấn Luyện Viên (Calis Coach)
          </DialogTitle>
          <DialogDescription className="text-xs text-text-secondary leading-relaxed">
            Hồ sơ của bạn sẽ được Hội đồng Chuyên môn đối chiếu eKYC, kiểm định chứng chỉ và thẩm định Strict Form kỹ thuật trước khi phê duyệt cấp phép.
          </DialogDescription>
        </div>

        {/* STEPPER PROGRESS BAR */}
        <div className="my-5 grid grid-cols-4 gap-2 border-b border-border/80 pb-4">
          {[
            { s: 1, label: "1. eKYC & Cá nhân" },
            { s: 2, label: "2. Năng lực & Video" },
            { s: 3, label: "3. Bằng cấp & Chứng chỉ" },
            { s: 4, label: "4. Cam kết & Nộp" },
          ].map((item) => (
            <div
              key={item.s}
              className={`flex flex-col gap-1 border-b-2 pb-1.5 transition-all ${
                step >= item.s
                  ? "border-accent text-accent-strong font-bold"
                  : "border-border/60 text-text-secondary/60 font-medium"
              }`}
            >
              <span className="text-[11px] truncate">{item.label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: eKYC & PERSONAL INFORMATION */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl bg-accent-soft/30 p-3 border border-accent/20 flex items-start gap-2.5 text-accent-strong">
              <Lock size={16} className="shrink-0 mt-0.5" />
              <span>
                <strong>Bảo mật danh tính eKYC:</strong> Ảnh CCCD chỉ phục vụ mục đích kiểm định danh tính người huấn luyện và bảo vệ học viên. CalisHealth cam kết bảo mật theo tiêu chuẩn pháp luật.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-text-primary block mb-1">
                  Họ và tên thật (như trên CCCD) *
                </label>
                <input
                  type="text"
                  placeholder="Vd: Nguyễn Hoàng Long"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-text-primary block mb-1">Số CCCD / Hộ chiếu (12 số) *</label>
                <input
                  type="text"
                  placeholder="001098012345"
                  value={formData.idCardNumber}
                  onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-text-primary block mb-1">Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  placeholder="0987654321"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-text-primary block mb-1">Email chính chủ *</label>
                <input
                  type="email"
                  placeholder="coach@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-text-primary block mb-1">Ngày sinh</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-text-primary block mb-1">Khu vực / Tỉnh thành</label>
                <input
                  type="text"
                  placeholder="Hà Nội / TP.HCM / Online"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* CCCD PHOTO UPLOAD DROPZONES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Mặt trước */}
              <div className="rounded-2xl border-2 border-dashed border-border/80 bg-surface-elevated/40 p-4 text-center">
                <div className="font-bold text-text-primary mb-1">Mặt trước CCCD *</div>
                <p className="text-[11px] text-text-secondary mb-3">Chụp rõ nét họ tên, số CCCD và chân dung</p>
                {formData.idCardFrontUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-border aspect-[16/10]">
                    <img src={formData.idCardFrontUrl} alt="Mặt trước" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, idCardFrontUrl: "" })}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-lg opacity-80 hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border border-border/60 rounded-xl cursor-pointer hover:bg-accent-soft/30 hover:border-accent transition-colors">
                    <Upload size={22} className="text-text-secondary mb-1" />
                    <span className="font-bold text-accent-strong">Chọn ảnh mặt trước</span>
                    <span className="text-[10px] text-text-secondary mt-0.5">JPG, PNG (Tối đa 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "idCardFrontUrl")}
                    />
                  </label>
                )}
              </div>

              {/* Mặt sau */}
              <div className="rounded-2xl border-2 border-dashed border-border/80 bg-surface-elevated/40 p-4 text-center">
                <div className="font-bold text-text-primary mb-1">Mặt sau CCCD *</div>
                <p className="text-[11px] text-text-secondary mb-3">Chụp rõ nét đặc điểm nhận dạng và ngày cấp</p>
                {formData.idCardBackUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-border aspect-[16/10]">
                    <img src={formData.idCardBackUrl} alt="Mặt sau" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, idCardBackUrl: "" })}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-lg opacity-80 hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border border-border/60 rounded-xl cursor-pointer hover:bg-accent-soft/30 hover:border-accent transition-colors">
                    <Upload size={22} className="text-text-secondary mb-1" />
                    <span className="font-bold text-accent-strong">Chọn ảnh mặt sau</span>
                    <span className="text-[10px] text-text-secondary mt-0.5">JPG, PNG (Tối đa 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "idCardBackUrl")}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CALISTHENICS EXPERTISE & DEMO VIDEO */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-text-primary block mb-1">Số năm kinh nghiệm tập luyện & huấn luyện</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-text-primary block mb-1">Trường phái thế mạnh chính *</label>
                <select
                  value={formData.primarySpecialty}
                  onChange={(e) => setFormData({ ...formData, primarySpecialty: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="Static Strength (Planche, Front Lever)">Static Strength (Planche, Front Lever, Maltese)</option>
                  <option value="Weighted Calisthenics (Sức mạnh tải trọng)">Weighted Calisthenics (Pull-up, Dip mang thêm tạ)</option>
                  <option value="Handstand & Balance (Thăng bằng tay)">Handstand & Balance (Handstand Push-up, Press)</option>
                  <option value="Mobility & Phục hồi chức năng khớp">Mobility & Phục hồi chức năng vận động khớp</option>
                  <option value="Foundation cho người mới bắt đầu">Calisthenics Nền tảng & Tăng cơ giảm mỡ cho người mới</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-text-primary block mb-1">
                Kỹ năng chuyên sâu đã mở khóa (Skills mastered)
              </label>
              <input
                type="text"
                placeholder="Vd: Full Planche (10s), Front Lever (15s), One Arm Pull-up, Ring Muscle Up"
                value={formData.skillsDescription}
                onChange={(e) => setFormData({ ...formData, skillsDescription: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-text-primary block mb-1">
                Thông số / Kỷ lục cá nhân (Personal Bests)
              </label>
              <input
                type="text"
                placeholder="Vd: Weighted Dip +80kg, Weighted Pull-up +60kg, 35 Strict Pull-ups"
                value={formData.personalRecords}
                onChange={(e) => setFormData({ ...formData, personalRecords: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            {/* VIDEO URL INPUT */}
            <div className="rounded-2xl border border-accent/30 bg-accent-soft/20 p-4 space-y-2">
              <div className="flex items-center gap-2 font-bold text-accent-strong">
                <Video size={16} />
                Link Video thị phạm kỹ năng (Strict Form Demo) *
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Cung cấp link video YouTube, Google Drive công khai hoặc TikTok quay bạn thực hiện các kỹ năng thế mạnh với <strong>form chuẩn mực (khóa khuỷu tay, không đung đưa, hạ cằm qua xà)</strong> để Ban Giám Khảo đánh giá kỹ thuật.
              </p>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.skillDemoVideoUrl}
                onChange={(e) => setFormData({ ...formData, skillDemoVideoUrl: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 3: CERTIFICATES & COMPETITIONS/ACTIVITIES */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            {/* SUBTABS */}
            <div className="flex items-center gap-2 border-b border-border/80 pb-2">
              <button
                type="button"
                onClick={() => setStep3Tab("certs")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  step3Tab === "certs"
                    ? "bg-accent text-white shadow-xs"
                    : "bg-surface text-text-secondary border border-border hover:text-text-primary"
                }`}
              >
                <Award size={14} />
                Bằng cấp & Chứng chỉ ({formData.certificates.length})
              </button>

              <button
                type="button"
                onClick={() => setStep3Tab("activities")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  step3Tab === "activities"
                    ? "bg-accent text-white shadow-xs"
                    : "bg-surface text-text-secondary border border-border hover:text-text-primary"
                }`}
              >
                <Trophy size={14} />
                Cuộc thi & Hoạt động đã tham gia ({formData.activities.length})
              </button>
            </div>

            {/* TAB 1: CERTIFICATES */}
            {step3Tab === "certs" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/80 bg-surface-elevated/40 p-4 space-y-3">
                  <h4 className="font-bold text-text-primary flex items-center gap-2">
                    <Award size={16} className="text-amber-500" />
                    Thêm chứng chỉ huấn luyện chuyên môn (WSWCF, NASM, ACE, FRC...)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="font-medium text-text-secondary block mb-1">Tên chứng chỉ / Bằng cấp *</label>
                      <input
                        type="text"
                        placeholder="Vd: WSWCF Level 2 Trainer, NASM-CPT, Cử nhân ĐH TDTT..."
                        value={certDraft.certificateName}
                        onChange={(e) => setCertDraft({ ...certDraft, certificateName: e.target.value })}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-text-secondary block mb-1">Năm cấp</label>
                      <input
                        type="number"
                        value={certDraft.issueYear}
                        onChange={(e) => setCertDraft({ ...certDraft, issueYear: Number(e.target.value) })}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-medium text-text-secondary block mb-1">Đơn vị cấp bằng / Tổ chức</label>
                    <input
                      type="text"
                      placeholder="Vd: World Street Workout Federation, ACE, ĐH Sư Phạm TDTT..."
                      value={certDraft.issuingOrganization}
                      onChange={(e) => setCertDraft({ ...certDraft, issuingOrganization: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-surface cursor-pointer hover:border-accent">
                      <Upload size={14} className="text-text-secondary" />
                      <span className="font-semibold text-text-primary">
                        {certDraft.certificateUrl ? "✓ Đã tải ảnh chứng chỉ" : "Tải ảnh scan bằng chứng nhận"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "cert")}
                      />
                    </label>
                    <Button size="sm" onClick={addCertificate} className="bg-accent text-white font-bold gap-1 text-xs">
                      <Plus size={14} /> Thêm chứng chỉ
                    </Button>
                  </div>
                </div>

                {/* LIST OF ADDED CERTS */}
                <div className="space-y-2">
                  <div className="font-bold text-text-primary">Danh sách chứng chỉ đã thêm ({formData.certificates.length}):</div>
                  {formData.certificates.length === 0 ? (
                    <div className="text-center py-5 border border-dashed border-border rounded-xl text-text-secondary">
                      Chưa có chứng chỉ nào. Thêm chứng chỉ đào tạo để tăng độ uy tín cho hồ sơ.
                    </div>
                  ) : (
                    formData.certificates.map((cert, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={cert.certificateUrl}
                            alt="cert"
                            className="h-10 w-14 object-cover rounded-lg border border-border"
                          />
                          <div>
                            <div className="font-bold text-text-primary">{cert.certificateName}</div>
                            <div className="text-[11px] text-text-secondary">
                              {cert.issuingOrganization} • Năm {cert.issueYear}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCertificate(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: COMPETITIONS & COMMUNITY ACTIVITIES */}
            {step3Tab === "activities" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/80 bg-surface-elevated/40 p-4 space-y-3">
                  <h4 className="font-bold text-text-primary flex items-center gap-2">
                    <Trophy size={16} className="text-amber-500" />
                    Thêm Cuộc thi / Giải đấu / Hoạt động cộng đồng đã tham gia
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="font-medium text-text-secondary block mb-1">
                        Tên cuộc thi / Giải đấu / Sự kiện *
                      </label>
                      <input
                        type="text"
                        placeholder="Vd: Vietnam Calisthenics Championship, King of the Bar, Workshop Planche..."
                        value={activityDraft.activityName}
                        onChange={(e) => setActivityDraft({ ...activityDraft, activityName: e.target.value })}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-text-secondary block mb-1">Năm diễn ra</label>
                      <input
                        type="number"
                        value={activityDraft.eventYear}
                        onChange={(e) => setActivityDraft({ ...activityDraft, eventYear: Number(e.target.value) })}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-medium text-text-secondary block mb-1">
                        Thành tích / Vai trò đạt được *
                      </label>
                      <input
                        type="text"
                        placeholder="Vd: Huy chương Vàng, Huy chương Bạc, Top 3, Thí sinh Pro, HLV Diễn giả..."
                        value={activityDraft.roleOrAchievement}
                        onChange={(e) => setActivityDraft({ ...activityDraft, roleOrAchievement: e.target.value })}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-text-secondary block mb-1">Đơn vị tổ chức / Giải đấu</label>
                      <input
                        type="text"
                        placeholder="Vd: Liên đoàn Street Workout VN, CLB Cali Sài Gòn..."
                        value={activityDraft.organizer}
                        onChange={(e) => setActivityDraft({ ...activityDraft, organizer: e.target.value })}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* PROOFS: IMAGE & LINK */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="font-medium text-text-secondary block mb-1">
                        Minh chứng bằng hình ảnh (Huy chương, Cúp, Bục trao giải):
                      </label>
                      <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-surface cursor-pointer hover:border-accent">
                        <Upload size={14} className="text-text-secondary" />
                        <span className="font-semibold text-text-primary truncate">
                          {activityDraft.proofImageUrl ? "✓ Đã tải ảnh minh chứng" : "Tải ảnh huy chương/cúp"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "activity")}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="font-medium text-text-secondary block mb-1">
                        Link bài báo / Video thi đấu chứng thực (YouTube/FB):
                      </label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/watch?v=... hoặc link bài báo"
                        value={activityDraft.proofLinkUrl}
                        onChange={(e) => setActivityDraft({ ...activityDraft, proofLinkUrl: e.target.value })}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button size="sm" onClick={addActivity} className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1 text-xs">
                      <Plus size={14} /> Thêm hoạt động / cuộc thi
                    </Button>
                  </div>
                </div>

                {/* LIST OF ADDED ACTIVITIES */}
                <div className="space-y-2">
                  <div className="font-bold text-text-primary">
                    Danh sách cuộc thi & hoạt động đã tham gia ({formData.activities.length}):
                  </div>
                  {formData.activities.length === 0 ? (
                    <div className="text-center py-5 border border-dashed border-border rounded-xl text-text-secondary">
                      Chưa có hoạt động nào. Hãy thêm các giải đấu hoặc workshop bạn từng tham gia để minh chứng năng lực thực tế.
                    </div>
                  ) : (
                    formData.activities.map((act, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          {act.proofImageUrl ? (
                            <img
                              src={act.proofImageUrl}
                              alt="proof"
                              className="h-10 w-14 object-cover rounded-lg border border-amber-500/30"
                            />
                          ) : (
                            <div className="h-10 w-14 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600">
                              <Trophy size={18} />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-text-primary flex items-center gap-2">
                              <span>{act.activityName}</span>
                              <span className="bg-amber-400/20 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] px-2 py-0.2 rounded-full border border-amber-500/30">
                                🏅 {act.roleOrAchievement}
                              </span>
                            </div>
                            <div className="text-[11px] text-text-secondary mt-0.5 flex items-center gap-2">
                              <span>{act.organizer} • Năm {act.eventYear}</span>
                              {act.proofLinkUrl && (
                                <a
                                  href={act.proofLinkUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-accent hover:underline flex items-center gap-0.5 font-bold"
                                >
                                  Video/Link <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeActivity(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: BIO, RATE & COMMITMENT */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-text-primary block mb-1">
                Giới thiệu bản thân & Triết lý huấn luyện (Bio)
              </label>
              <textarea
                rows={3}
                placeholder="Chia sẻ về hành trình Calisthenics của bạn, phong cách giảng dạy và cách bạn đồng hành cùng học viên..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-text-primary block mb-1">Mức giá huấn luyện 1:1 dự kiến</label>
              <input
                type="text"
                placeholder="Vd: 1.500.000 đ / tháng hoặc 2.000.000 đ / khóa 8 tuần"
                value={formData.expectedRate}
                onChange={(e) => setFormData({ ...formData, expectedRate: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            {/* SUMMARY REVIEW */}
            <div className="rounded-2xl border border-border bg-background/50 p-4 space-y-2">
              <div className="font-bold text-text-primary">Tóm tắt hồ sơ đăng ký:</div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary">
                <div>HLV: <strong className="text-text-primary">{formData.fullName}</strong></div>
                <div>CCCD: <strong className="text-text-primary">{formData.idCardNumber}</strong></div>
                <div>Chuyên môn: <strong className="text-text-primary">{formData.primarySpecialty}</strong></div>
                <div>Chứng chỉ đính kèm: <strong className="text-text-primary">{formData.certificates.length} bằng cấp</strong></div>
                <div className="col-span-2">Giải đấu / Hoạt động: <strong className="text-amber-600 font-bold">{formData.activities.length} sự kiện đã tham gia</strong></div>
              </div>
            </div>

            {/* ETHICAL COMMITMENT */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="mt-0.5 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-emerald-950 dark:text-emerald-200 leading-relaxed font-medium">
                  Tôi cam kết toàn bộ thông tin cá nhân, giấy tờ CCCD, bằng cấp và video gửi lên là chính chủ và trung thực 100%. Tôi cam kết tuân thủ đạo đức nghề huấn luyện, bảo vệ an toàn khớp xương của học viên và chấp hành nội quy nền tảng CalisHealth.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* MODAL FOOTER BUTTONS */}
        <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-4">
          {step > 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="text-xs gap-1.5"
            >
              <ArrowLeft size={14} /> Quay lại
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
              Hủy bỏ
            </Button>
          )}

          {step < 4 ? (
            <Button size="sm" onClick={handleNext} className="bg-accent text-white font-bold text-xs gap-1.5">
              Tiếp tục <ArrowRight size={14} />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 px-5 shadow-xs"
            >
              {isSubmitting ? "Đang gửi hồ sơ..." : "Xác nhận nộp hồ sơ"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
