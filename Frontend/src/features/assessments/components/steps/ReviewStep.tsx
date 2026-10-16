import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  TrendingUp,
  Clock,
  Eye,
  Send,
} from 'lucide-react';
import { AssessmentFormData } from '../../schemas/assessmentSchema';
import { useAssessmentValidation } from '../../hooks/useAssessmentValidation';
import { ASSESSMENT_TYPE_CONFIGS } from '../../constants/assessmentTypes';
import { AssessmentUserPreviewModal } from '../preview/AssessmentUserPreviewModal';

interface ReviewStepProps {
  onPublish: () => void;
  onSaveDraft: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ onPublish }) => {
  const { watch } = useFormContext<AssessmentFormData>();
  const formData = watch();

  const { stepValidations, isReadyToPublish, totalWeight } = useAssessmentValidation(formData);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const typeConfig = ASSESSMENT_TYPE_CONFIGS.find((t) => t.type === formData.type);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/20 text-accent flex items-center justify-center font-bold text-xs">
              06
            </span>
            <h2 className="text-lg font-bold text-text-primary">Kiểm tra Toàn diện & Phát hành (Review & Publish)</h2>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Rà soát toàn bộ các bước cấu hình trước khi đưa bài đánh giá vào hoạt động chính thức trên toàn hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4 text-accent" /> Xem trước giao diện học viên
          </button>

          <button
            type="button"
            onClick={onPublish}
            disabled={!isReadyToPublish}
            className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-strong text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" /> Phát hành bài đánh giá (Publish)
          </button>
        </div>
      </div>

      {/* Validation Checklist Banner */}
      <div
        className={`p-5 rounded-2xl border ${
          isReadyToPublish ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isReadyToPublish ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
            <h3
              className={`text-sm font-bold ${
                isReadyToPublish ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isReadyToPublish
                ? 'Đã sẵn sàng phát hành bài đánh giá (Ready to Publish)'
                : 'Cần hoàn thiện một số cấu hình trước khi phát hành'}
            </h3>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isReadyToPublish ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {stepValidations.filter((s) => s.isValid).length} / 5 bước hợp lệ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {stepValidations.map((v) => (
            <div
              key={v.step}
              className={`p-2.5 rounded-xl border flex items-center gap-2 bg-surface ${
                v.isValid ? 'border-emerald-500/30 text-emerald-400' : 'border-amber-500/30 text-amber-400'
              }`}
            >
              {v.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <span className="font-bold block truncate text-text-primary">{v.title}</span>
                <span className="text-[10px] text-text-secondary">
                  {v.isValid ? '✓ Hợp lệ' : `${v.errors.length} cảnh báo`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Information */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Info className="w-4 h-4 text-accent" />
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Thông tin cơ bản
            </h4>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-text-secondary block">Tên hiển thị học viên:</span>
              <strong className="text-text-primary text-sm">{formData.displayName}</strong>
            </div>
            <div>
              <span className="text-text-secondary block">Phân loại & Thời lượng:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-bold">
                  {typeConfig?.title || 'Đánh giá'}
                </span>
                <span className="text-text-secondary">~{formData.estimatedDuration} phút</span>
              </div>
            </div>
            <div>
              <span className="text-text-secondary block">Mô tả mục đích:</span>
              <p className="text-text-primary mt-0.5 line-clamp-2">{formData.description}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Questions & Scoring */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Layers className="w-4 h-4 text-accent" />
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Câu hỏi & Thang điểm
            </h4>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Tổng số câu hỏi:</span>
              <strong className="text-text-primary">{formData.questions?.length || 0} câu</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Tổng trọng số (Weight):</span>
              <strong className="text-emerald-400 font-bold">{Math.round(totalWeight)}%</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Thang điểm tối đa:</span>
              <strong className="text-text-primary">100 điểm</strong>
            </div>
          </div>
        </div>

        {/* Card 3: Fitness Levels */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <TrendingUp className="w-4 h-4 text-accent" />
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Phân loại Thể lực
            </h4>
          </div>
          <div className="space-y-1.5 text-xs">
            {(formData.fitnessLevels || []).map((lvl) => (
              <div key={lvl.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated/40 border border-border">
                <span className="font-bold text-text-primary">{lvl.name}</span>
                <span className="text-xs font-semibold text-accent">
                  {lvl.minScore} - {lvl.maxScore} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Schedule Automation */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Clock className="w-4 h-4 text-accent" />
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Chu kỳ & Tự động hóa
            </h4>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Chế độ tự động:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                {formData.schedule?.enabled ? 'Đang bật' : 'Tắt'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Thời gian gia hạn (Grace):</span>
              <strong className="text-text-primary">{formData.schedule?.gracePeriodDays || 7} ngày</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Số mốc nhắc hẹn:</span>
              <strong className="text-text-primary">
                {(formData.schedule?.reminders || []).filter((r) => r.enabled).length} mốc thông báo
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* User Simulation Modal */}
      <AssessmentUserPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        assessment={formData as any}
      />
    </div>
  );
};
