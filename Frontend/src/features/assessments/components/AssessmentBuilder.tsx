import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessmentScope } from '../useAssessmentScope';
import { FormProvider } from 'react-hook-form';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useAssessmentForm } from '../hooks/useAssessmentForm';
import { useAssessmentAutosave } from '../hooks/useAssessmentAutosave';
import { useAssessmentValidation } from '../hooks/useAssessmentValidation';
import { AssessmentStepper } from './AssessmentStepper';
import { AssessmentInformationStep } from './steps/AssessmentInformationStep';
import { QuestionBuilderStep } from './steps/QuestionBuilderStep';
import { ScoringStep } from './steps/ScoringStep';
import { FitnessLevelStep } from './steps/FitnessLevelStep';
import { ScheduleStep } from './steps/ScheduleStep';
import { OneTimePolicyStep } from './steps/OneTimePolicyStep';
import { LevelByEnginePanel } from './steps/LevelByEnginePanel';
import { ReviewStep } from './steps/ReviewStep';
import { AssessmentUserPreviewModal } from './preview/AssessmentUserPreviewModal';
import { Assessment } from '../types';
import { assessmentsApi, apiErrorMessage } from '../api/assessmentsApi';
import { toast } from 'sonner';

interface AssessmentBuilderProps {
  initialData?: Partial<Assessment>;
  assessmentId?: string;
  isEditMode?: boolean;
}

export const AssessmentBuilder: React.FC<AssessmentBuilderProps> = ({
  initialData,
  assessmentId,
  isEditMode = false,
}) => {
  const navigate = useNavigate();
  const { base, isCoach } = useAssessmentScope();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useAssessmentForm(initialData);
  const { watch, handleSubmit, getValues, setValue } = methods;
  const formData = watch();

  const { stepValidations, isReadyToPublish } = useAssessmentValidation(formData);

  /**
   * Áp dụng kết quả lưu từ backend:
   *  - Bài đang là bài test đầu vào -> backend tạo PHIÊN BẢN MỚI: chuyển sang sửa phiên bản đó.
   *  - Bài mới lưu lần đầu -> chuyển sang URL sửa (các lần lưu sau cập nhật đúng bài, không tạo trùng).
   *  - Câu hỏi mới tạo trong bài: đổi id tạm sang id thật trong form.
   */
  const applySaveResult = (saved: Assessment) => {
    if (saved.forkedFromId) {
      toast.info(`Bài đang là bài test đầu vào nên thay đổi được lưu thành phiên bản mới v${saved.version} (bản nháp).`, {
        description: 'Học viên vẫn làm phiên bản hiện tại cho tới khi bạn xuất bản phiên bản mới.',
        duration: 8000,
      });
      navigate(`${base}/${saved.id}/edit`, { replace: true });
      return;
    }
    if (!assessmentId && saved.id) {
      navigate(`${base}/${saved.id}/edit`, { replace: true });
      return;
    }
    const idMap = saved.idMap;
    if (idMap && Object.keys(idMap).length > 0) {
      const remap = (id: string) => idMap[id] ?? id;
      setValue(
        'questions',
        getValues('questions').map((r) =>
          idMap[r.questionId]
            ? { ...r, questionId: remap(r.questionId), question: r.question ? { ...r.question, id: remap(r.questionId) } : r.question }
            : r
        )
      );
      setValue(
        'scoringConfig.questionScoring',
        (getValues('scoringConfig.questionScoring') || []).map((x: any) =>
          idMap[x.questionId]
            ? { ...x, questionId: remap(x.questionId), rules: (x.rules || []).map((rr: any) => ({ ...rr, questionId: remap(x.questionId) })) }
            : x
        )
      );
    }
  };

  // Autosave
  const { status: autosaveStatus, lastSavedTime, forceSave } = useAssessmentAutosave({
    watch,
    assessmentId,
    enabled: true,
    debounceMs: 2500,
    onSaveSuccess: applySaveResult,
  });

  const getAutosaveBadge = () => {
    switch (autosaveStatus) {
      case 'SAVING':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#687068]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7C9B5B]" />
            Đang lưu nháp...
          </span>
        );
      case 'SAVED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#4F8A65] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã lưu nháp tự động
          </span>
        );
      case 'UNSAVED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium">
            <Clock className="w-3.5 h-3.5" />
            Có thay đổi chưa lưu
          </span>
        );
      default:
        return (
          <span className="text-xs text-[#969C95]">
            {lastSavedTime ? `Lưu lúc ${lastSavedTime.toLocaleTimeString('vi-VN')}` : 'Tự động lưu'}
          </span>
        );
    }
  };

  const handleSaveDraftManual = async () => {
    try {
      setIsSubmitting(true);
      const data = getValues();
      const saved = await assessmentsApi.saveDraft({ ...data, id: assessmentId || data.id } as any);
      toast.success('Đã lưu bản nháp bài đánh giá thành công!');
      applySaveResult(saved);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Không thể lưu bản nháp. Vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPublish = async () => {
    try {
      setIsSubmitting(true);
      const data = getValues();
      const saved = await assessmentsApi.saveDraft({ ...data, id: assessmentId || data.id, status: isCoach ? 'DRAFT' : 'PUBLISHED' } as any);
      if (isCoach) await assessmentsApi.submitReview(saved.id);   // báo Admin ngay (realtime)
      toast.success(isCoach ? 'Đã gửi Admin duyệt. Admin được báo ngay.' : '🎉 Phát hành bài đánh giá thành công trên toàn hệ thống!');
      setIsPublishModalOpen(false);
      navigate(base);
    } catch (err) {
      // Backend kiểm tra: đủ cách chấm điểm cho câu có trọng số, mức trình độ phủ kín thang điểm...
      toast.error(apiErrorMessage(err, 'Không thể phát hành bài đánh giá. Vui lòng thử lại.'), { duration: 10000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-12">
        {initialData?.locked && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-text-primary">
            <strong>🚩 Bài này đang là bài test đầu vào cho người dùng mới.</strong> Để không ảnh hưởng học viên đang làm bài,
            mọi thay đổi sẽ được lưu thành <strong>phiên bản mới (bản nháp)</strong>. Học viên vẫn làm phiên bản hiện tại cho tới
            khi bạn xuất bản phiên bản mới; khi đó bài test đầu vào tự chuyển sang phiên bản mới.
          </div>
        )}
        {/* Top Builder Header */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(base)}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
              title="Quay lại danh sách bài test"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-text-primary">
                  {isEditMode ? 'Chỉnh sửa bài đánh giá' : 'Tạo bài đánh giá thể lực mới'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 text-[11px] font-bold">
                  {formData.type || 'INITIAL'}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Thiết lập bộ câu hỏi, cách chấm điểm khoa học và chu kỳ tự động đánh giá thể lực.
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="hidden sm:block">{getAutosaveBadge()}</div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraftManual}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-text-primary bg-surface hover:bg-surface-elevated transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-text-secondary" /> Lưu nháp
              </button>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-text-primary bg-surface hover:bg-surface-elevated hover:text-accent transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-accent" /> Xem trước
              </button>

              <button
                type="button"
                onClick={() => setIsPublishModalOpen(true)}
                disabled={!isReadyToPublish || isSubmitting}
                className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-strong text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Phát hành
              </button>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <AssessmentStepper
          oneTime={formData.type === 'INITIAL'}
          currentStep={currentStep}
          onStepChange={(step) => setCurrentStep(step)}
          validations={stepValidations}
        />

        {/* Active Step Content */}
        <div>
          {currentStep === 1 && <AssessmentInformationStep />}
          {currentStep === 2 && <QuestionBuilderStep />}
          {currentStep === 3 && <ScoringStep />}
          {currentStep === 4 && (formData.type === 'INITIAL' ? <LevelByEnginePanel /> : <FitnessLevelStep />)}
          {currentStep === 5 && (formData.type === 'INITIAL' ? <OneTimePolicyStep /> : <ScheduleStep />)}
          {currentStep === 6 && (
            <ReviewStep
              onPublish={() => setIsPublishModalOpen(true)}
              onSaveDraft={handleSaveDraftManual}
            />
          )}
        </div>

        {/* Bottom Step Navigation Buttons */}
        <div className="bg-surface rounded-2xl p-4 border border-border shadow-xs flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => prev - 1)}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-text-secondary hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            ← Bước trước
          </button>

          <span className="text-xs font-semibold text-text-secondary">
            Bước {currentStep} / 6
          </span>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-strong text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              Tiếp tục bước tiếp theo →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              disabled={!isReadyToPublish || isSubmitting}
              className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-strong text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              Phát hành bài test ngay
            </button>
          )}
        </div>

        {/* User Simulation Modal */}
        <AssessmentUserPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          assessment={formData as any}
        />

        {/* Publish Confirmation Modal */}
        {isPublishModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-border animate-in fade-in zoom-in-95 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-text-primary">
                  Xác nhận Phát hành Bài đánh giá?
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Bài đánh giá sẽ lập tức có hiệu lực và được phân phối tự động cho học viên đủ điều kiện theo cấu hình chu kỳ.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated/50 border border-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Tên bài test:</span>
                  <strong className="text-text-primary">{formData.displayName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Số lượng câu hỏi:</span>
                  <strong className="text-text-primary">{formData.questions?.length} câu</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Thời lượng dự kiến:</span>
                  <strong className="text-text-primary">~{formData.estimatedDuration} phút</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Trạng thái:</span>
                  <span className="text-emerald-400 font-bold">Sẵn sàng (Ready)</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPublish}
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-strong rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Xác nhận & Phát hành
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
};
