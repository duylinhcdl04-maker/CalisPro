import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessmentScope } from '../useAssessmentScope';
import { Plus, BookOpen, Sparkles, RefreshCw } from 'lucide-react';
import { AssessmentStats } from './AssessmentStats';
import { AssessmentTable } from './AssessmentTable';
import { AssessmentUserPreviewModal } from './preview/AssessmentUserPreviewModal';
import { Assessment } from '../types';
import { assessmentsApi, apiErrorMessage, type OnboardingSettings } from '../api/assessmentsApi';
import { OnboardingAssessmentCard } from './OnboardingAssessmentCard';
import { toast } from 'sonner';

export const AssessmentLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { base, isCoach } = useAssessmentScope();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [onboarding, setOnboarding] = useState<OnboardingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewAssessment, setPreviewAssessment] = useState<Assessment | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [list, statsSummary, onboardingSettings] = await Promise.all([
        assessmentsApi.getAssessments(),
        assessmentsApi.getStatsSummary(),
        assessmentsApi.getOnboardingSettings(),
      ]);
      setAssessments(list);
      setStats(statsSummary);
      setOnboarding(onboardingSettings);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách bài đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await assessmentsApi.duplicateAssessment(id);
      toast.success(`Đã tạo bản sao "${duplicated.displayName}"`);
      await loadData();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Không thể tạo bản sao bài test.'));
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await assessmentsApi.updateStatus(id, 'ARCHIVED');
      toast.success('Đã chuyển bài đánh giá sang trạng thái Lưu trữ (Archived)');
      await loadData();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Không thể lưu trữ bài test.'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await assessmentsApi.deleteAssessment(id);
      toast.success('Đã xóa bài đánh giá (bài đã có người làm sẽ được lưu trữ để giữ kết quả)');
      await loadData();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Không thể xóa bài test.'));
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await assessmentsApi.publishAssessment(id);
      toast.success('Phát hành bài đánh giá thành công!');
      await loadData();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Không thể phát hành bài test.'), { duration: 10000 });
    }
  };

  const handleSetOnboarding = async (id: string) => {
    try {
      await assessmentsApi.updateOnboardingSettings({ activeTemplateId: id });
      toast.success('Đã đặt làm bài test đầu vào cho người dùng mới.');
      await loadData();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Không thể đặt làm bài test đầu vào.'), { duration: 10000 });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">
              Quản trị Bài test Đánh giá Thể lực (Assessments)
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold border border-accent/20">
              Dynamic Questionnaire
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
            Cấu hình ngân hàng câu hỏi, thang đo điểm số thể lực và thuật toán phân loại Beginner / Intermediate / Advanced / Elite.
          </p>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={() => navigate(`${base}/questions`)}
            className="px-4 py-2.5 text-xs font-bold text-text-primary bg-surface hover:bg-surface-elevated border border-border rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-accent" />
            Ngân hàng Câu hỏi
          </button>

          {isCoach && <button
            onClick={() => navigate(`${base}/new`)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-accent hover:bg-accent-strong rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Tạo bài đánh giá
          </button>}
        </div>
      </div>

      {/* Bài test đầu vào cho người dùng mới */}
      {!isCoach && <OnboardingAssessmentCard
        settings={onboarding}
        assessments={assessments}
        onChanged={loadData}
        onPreview={setPreviewAssessment}
      />}

      {/* 4 KPI Statistics Cards */}
      {stats && <AssessmentStats stats={stats} />}

      {/* Main Assessment List & Filters */}
      <AssessmentTable
        assessments={assessments}
        onDuplicate={handleDuplicate}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onPublish={handlePublish}
        onSetOnboarding={isCoach ? undefined : handleSetOnboarding}
        onOpenPreview={(item) => setPreviewAssessment(item)}
      />

      {/* User Simulation Modal */}
      {previewAssessment && (
        <AssessmentUserPreviewModal
          isOpen={!!previewAssessment}
          onClose={() => setPreviewAssessment(null)}
          assessment={previewAssessment}
        />
      )}
    </div>
  );
};
