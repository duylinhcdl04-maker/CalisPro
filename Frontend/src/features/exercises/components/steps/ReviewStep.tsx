import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Send,
  Save,
} from "lucide-react";
import { ExerciseFormData } from "../../types/exercise";

interface ReviewStepProps {
  formData: ExerciseFormData;
  onChange: (updated: Partial<ExerciseFormData>) => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  isPublishing?: boolean;
}

export function ReviewStep({
  formData,
  onChange,
  onPublish,
  onSaveDraft,
  isPublishing = false,
}: ReviewStepProps) {
  const basic = formData.basicInformation;
  const media = formData.media;
  const muscles = formData.muscles;
  const tech = formData.technique;
  const ai = formData.aiAnalysis;

  const checks = [
    {
      title: "Thông tin định danh & Phân loại",
      passed: Boolean(basic.name.trim() && basic.category && basic.difficulty && basic.movementPattern),
      detail: `${basic.name || "Chưa có tên"} • ${basic.category} • ${basic.difficulty}`,
      required: true,
    },
    {
      title: "Media & Giai đoạn chuyển động",
      passed: Boolean(media.videoUrl.trim() && media.phases.length >= 2),
      detail: `${media.videoUrl ? "Đã có video HD" : "Thiếu URL video"} • ${media.phases.length} giai đoạn`,
      required: true,
    },
    {
      title: "Giải phẫu & Nhóm cơ (body-muscles)",
      passed: muscles.targets.some((m) => m.role === "PRIMARY"),
      detail: `${muscles.targets.length} nhóm cơ (${muscles.targets.filter((m) => m.role === "PRIMARY").length} cơ chính)`,
      required: true,
    },
    {
      title: "Kỹ thuật & Khẩu lệnh Huấn luyện",
      passed: Boolean(tech.setup.trim() && tech.execution.trim()),
      detail: `${tech.coachingCues.length} khẩu lệnh • ${tech.commonMistakes.length} lỗi sai`,
      required: true,
    },
    {
      title: "Cấu hình AI Motion Analysis",
      passed: !ai.enabled || (ai.jointRules.length > 0 && ai.landmarks.some((l) => l.enabled)),
      detail: ai.enabled
        ? `${ai.landmarks.filter((l) => l.enabled).length} điểm mốc • ${ai.jointRules.length} quy tắc góc`
        : "Đang tắt AI (Không bắt buộc)",
      required: false,
    },
  ];

  const totalRequired = checks.filter((c) => c.required).length;
  const passedRequired = checks.filter((c) => c.required && c.passed).length;
  const isReadyToPublish = passedRequired === totalRequired;

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 text-accent">
          <ShieldCheck size={18} />
          <span className="text-xs font-black uppercase tracking-wider">Bước 06 / 06</span>
        </div>
        <h2 className="text-xl font-black text-text-primary mt-1">Kiểm tra & Xuất bản Động tác</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Rà soát danh mục tiêu chuẩn CalisHealth trước khi phát hành động tác vào Thư viện và Giáo án học viên.
        </p>
      </div>

      {/* 1. READINESS AUDIT SUMMARY */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
              A
            </span>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
              1. Bảng kiểm định chất lượng (Pre-flight Quality Checklist)
            </h3>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-black flex items-center gap-1.5 ${
              isReadyToPublish
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30"
            }`}
          >
            {isReadyToPublish ? (
              <>
                <CheckCircle2 size={14} />
                <span>SẴN SÀNG XUẤT BẢN ({passedRequired}/{totalRequired})</span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} />
                <span>CHƯA ĐỦ ĐIỀU KIỆN ({passedRequired}/{totalRequired})</span>
              </>
            )}
          </span>
        </div>

        <div className="space-y-3">
          {checks.map((check, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between rounded-2xl border p-4 text-xs transition-all ${
                check.passed
                  ? "border-border bg-background hover:border-accent/40"
                  : check.required
                  ? "border-rose-500/30 bg-rose-500/5 text-rose-800 dark:text-rose-300"
                  : "border-border bg-background opacity-80"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black ${
                    check.passed
                      ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30"
                      : check.required
                      ? "bg-rose-500 text-white"
                      : "bg-surface-elevated text-text-secondary"
                  }`}
                >
                  {check.passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                </div>
                <div>
                  <h4 className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                    <span>{check.title}</span>
                    {check.required && <span className="text-rose-500 text-[10px]">*Bắt buộc</span>}
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">{check.detail}</p>
                </div>
              </div>

              <span className="font-bold text-[11px] text-text-secondary">
                {check.passed ? "Đạt chuẩn ✓" : "Cần bổ sung ⚠"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. VERSIONING & STATUS */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-border/70 pb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
            B
          </span>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
            2. Trạng thái & Phiên bản (Version Control)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary">Trạng thái phát hành</label>
            <select
              value={formData.status}
              onChange={(e) => onChange({ status: e.target.value as any })}
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="DRAFT">Bản nháp (DRAFT) - Chưa công khai</option>
              <option value="PUBLISHED">Đã xuất bản (PUBLISHED) - Sẵn sàng sử dụng</option>
              <option value="ARCHIVED">Lưu trữ (ARCHIVED) - Ngừng kích hoạt</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary">Phiên bản bài tập (Version)</label>
            <input
              type="text"
              value={formData.version || "1.0"}
              onChange={(e) => onChange({ version: e.target.value })}
              placeholder="e.g. 1.0, 1.1, 2.0"
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. ACTIONS PANEL */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-border bg-surface p-6 shadow-xs">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-bold text-xs text-text-primary">Xác nhận cập nhật dữ liệu</h4>
          <p className="text-[11px] text-text-secondary">
            Bản nháp được lưu tự động trên hệ thống. Khi xuất bản, động tác sẽ xuất hiện trên App Học viên.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onSaveDraft}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-5 py-3 text-xs font-bold text-text-primary hover:bg-surface-elevated cursor-pointer shadow-xs"
          >
            <Save size={14} />
            <span>Lưu bản nháp</span>
          </button>

          <button
            type="button"
            disabled={!isReadyToPublish || isPublishing}
            onClick={onPublish}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-xs font-black text-white transition-all shadow-md ${
              isReadyToPublish && !isPublishing
                ? "bg-accent hover:bg-accent-strong cursor-pointer scale-102"
                : "bg-accent/40 opacity-50 cursor-not-allowed"
            }`}
          >
            <Send size={14} />
            <span>{isPublishing ? "Đang xuất bản..." : "Xuất bản Động tác"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
