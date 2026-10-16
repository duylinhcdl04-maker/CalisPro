import { useState } from "react";
import { Sparkles, Wand2, X, Loader2, Award, Target, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { aiGeneratorApi, GenerateAssessmentResult } from "../../ai-motion/api/aiGeneratorApi";

interface AIAssessmentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAssessment: (assessment: GenerateAssessmentResult) => void;
  existingProtocols?: string[];
}

export function AIAssessmentGeneratorModal({
  isOpen,
  onClose,
  onApplyAssessment,
  existingProtocols = [],
}: AIAssessmentGeneratorModalProps) {
  const [assessmentName, setAssessmentName] = useState("Kiểm Tra Năng Lực Thể Lực Đầu Vào Calisthenics");
  const [audience, setAudience] = useState("GENERAL");
  const [metric, setMetric] = useState("MAX_REPS");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  async function handleGenerate() {
    setIsLoading(true);
    const toastId = toast.loading("AI Gemini đang xây dựng tiêu chí đánh giá...");

    try {
      const res = await aiGeneratorApi.generateAssessment({
        assessmentName,
        targetAudience: audience,
        primaryMetric: metric,
        existingAssessmentProtocols: existingProtocols,
      });

      if (res.success) {
        onApplyAssessment(res);
        toast.success(`Đã tạo bộ tiêu chí đánh giá: ${res.assessmentTitle}`, {
          id: toastId,
          description: res.deduplicationNote,
        });
        onClose();
      } else {
        toast.error("Không thể tạo đánh giá từ AI", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi tạo đánh giá AI", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl border border-border bg-surface p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent text-white shadow-md shadow-accent/30">
              <Award size={18} />
            </span>
            <div>
              <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                <span>AI Thiết Lập Hệ Thống Đánh Giá</span>
                <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  Standardized Rubric
                </span>
              </h3>
              <p className="text-xs text-text-secondary">
                Tự động tạo các bài test thể lực, ngưỡng điểm phân tầng và tiêu chuẩn No-Rep.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-elevated cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-text-primary block mb-1">Tên bài kiểm tra / Bộ tiêu chí:</label>
            <input
              type="text"
              value={assessmentName}
              onChange={(e) => setAssessmentName(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-bold text-text-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-secondary block mb-1">Đối tượng đánh giá:</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs font-bold text-text-primary focus:outline-none"
              >
                <option value="GENERAL">Học viên phổ thông (Đầu vào)</option>
                <option value="COMPETITION">Thi đấu & Cấp chứng chỉ VĐV</option>
                <option value="SKILL_MASTERY">Kiểm tra chủ quyền Skill nâng cao</option>
                <option value="REHAB">Kiểm tra hồi phục sau chấn thương</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-text-secondary block mb-1">Chỉ số trọng tâm:</label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background p-2.5 text-xs font-bold text-text-primary focus:outline-none"
              >
                <option value="MAX_REPS">Số Rep tối đa chuẩn form (Max Reps)</option>
                <option value="HOLD_TIME">Thời gian giữ tĩnh (Isometric Time)</option>
                <option value="FORM_SCORE">Điểm số góc khớp AI Vision (AI Score)</option>
                <option value="ROM_FLEXIBILITY">Biên độ vận động khớp (ROM Flex)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl border border-border bg-background text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent text-xs font-black text-white hover:bg-accent-strong cursor-pointer shadow-lg shadow-accent/25 disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Đang tổng hợp tiêu chuẩn...</span>
              </>
            ) : (
              <>
                <Wand2 size={15} />
                <span>Tạo hệ thống đánh giá</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
