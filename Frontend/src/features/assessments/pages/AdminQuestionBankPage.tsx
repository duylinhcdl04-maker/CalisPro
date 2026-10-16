import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessmentScope } from '../useAssessmentScope';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  BookOpen,
  Sparkles,
  Layers,
  Edit3,
  Trash2,
  Copy,
  CheckCircle2,
  Clock,
  Zap,
  RotateCcw,
  Dumbbell,
  Sliders,
  Scale,
  ListChecks,
} from 'lucide-react';
import { Question, QuestionType, FitnessDimension } from '../types';
import { assessmentsApi } from '../api/assessmentsApi';
import { FITNESS_DIMENSION_CONFIGS } from '../constants/fitnessDimensions';
import { QUESTION_TYPE_CONFIGS } from '../constants/questionTypes';
import { QuestionBankFormModal } from '../components/questions/QuestionBankFormModal';
import { toast } from 'sonner';

export const AdminQuestionBankPage: React.FC = () => {
  const navigate = useNavigate();
  const { base, isCoach } = useAssessmentScope();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDimension, setFilterDimension] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  // Form Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await assessmentsApi.getQuestionsBank();
      setQuestions(list);
    } catch {
      toast.error('Không thể tải ngân hàng câu hỏi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedQuestion(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setSelectedQuestion(q);
    setIsFormModalOpen(true);
  };

  const handleSaveQuestion = async (payload: Partial<Question>) => {
    try {
      await assessmentsApi.saveQuestionToBank(payload);
      toast.success(
        payload.id ? 'Đã cập nhật câu hỏi thành công!' : 'Đã thêm câu hỏi mới vào ngân hàng!'
      );
      await loadData();
    } catch {
      toast.error('Không thể lưu câu hỏi.');
      throw new Error('Save question failed');
    }
  };

  const handleDuplicate = async (q: Question) => {
    try {
      const clonedPayload: Partial<Question> = {
        ...q,
        id: undefined,
        text: `${q.text} (Bản sao)`,
      };
      await assessmentsApi.saveQuestionToBank(clonedPayload);
      toast.success(`Đã nhân bản câu hỏi "${q.text}"!`);
      await loadData();
    } catch {
      toast.error('Không thể nhân bản câu hỏi.');
    }
  };

  const handleDelete = async (q: Question) => {
    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa câu hỏi "${q.text}" khỏi ngân hàng không?`
    );
    if (!isConfirmed) return;

    try {
      await assessmentsApi.deleteQuestionFromBank(q.id);
      toast.success('Đã xóa câu hỏi khỏi ngân hàng.');
      await loadData();
    } catch {
      toast.error('Không thể xóa câu hỏi.');
    }
  };

  const handleResetDefaults = async () => {
    const isConfirmed = window.confirm(
      'Khôi phục lại danh sách câu hỏi mẫu chuẩn Calisthenics ban đầu? Các tùy chỉnh hiện tại sẽ được làm mới.'
    );
    if (!isConfirmed) return;

    try {
      const resetList = await assessmentsApi.resetQuestionsBank();
      setQuestions(resetList);
      toast.success('Đã khôi phục ngân hàng câu hỏi chuẩn thành công!');
    } catch {
      toast.error('Không thể khôi phục dữ liệu mẫu.');
    }
  };

  const filtered = questions.filter((q) => {
    if (search) {
      const s = search.toLowerCase();
      const match =
        q.text.toLowerCase().includes(s) ||
        (q.description && q.description.toLowerCase().includes(s)) ||
        (q.performanceConfig?.exerciseName &&
          q.performanceConfig.exerciseName.toLowerCase().includes(s));
      if (!match) return false;
    }
    if (filterDimension !== 'ALL' && q.category !== filterDimension) return false;
    if (filterType !== 'ALL' && q.type !== filterType) return false;
    return true;
  });

  const totalUsedCount = questions.reduce(
    (sum, q) => sum + (q.usedInAssessmentsCount || 0),
    0
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(base)}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">
                Ngân hàng Câu hỏi Thể lực (Question Bank)
              </h1>
              <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold border border-accent/20">
                {questions.length} câu hỏi chuẩn
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Kho lưu trữ và phiên bản hóa các câu hỏi kiểm tra thể lực, bài test vận động phục vụ cho các bài đánh giá.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch md:self-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2.5 text-xs font-bold text-text-secondary hover:text-text-primary bg-surface-elevated hover:bg-surface-elevated/80 border border-border rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Khôi phục danh sách câu hỏi mẫu chuẩn Calisthenics"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Khôi phục mẫu
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 text-xs font-bold text-white bg-accent hover:bg-accent-strong rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Thêm câu hỏi vào kho
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl p-4 border border-border shadow-xs">
          <span className="text-xs font-bold text-text-secondary uppercase">Tổng số câu hỏi</span>
          <div className="text-2xl font-bold text-text-primary mt-1">{questions.length} câu</div>
          <span className="text-[11px] text-accent font-semibold mt-1 block">Tất cả các chiều đo</span>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-border shadow-xs">
          <span className="text-xs font-bold text-text-secondary uppercase">Đang áp dụng</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {questions.filter((q) => (q.usedInAssessmentsCount || 0) > 0).length} câu
          </div>
          <span className="text-[11px] text-text-secondary mt-1 block">Trong các bài test phát hành</span>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-border shadow-xs">
          <span className="text-xs font-bold text-text-secondary uppercase">Lượt nhúng bài test</span>
          <div className="text-2xl font-bold text-text-primary mt-1">{totalUsedCount} lượt</div>
          <span className="text-[11px] text-text-secondary mt-1 block">Tái sử dụng cao</span>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-border shadow-xs">
          <span className="text-xs font-bold text-text-secondary uppercase">Performance Tests</span>
          <div className="text-2xl font-bold text-cyan-400 mt-1">
            {questions.filter((q) => q.type === 'PERFORMANCE_TEST').length} bài
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">Bài tập thể lực thực tế</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface rounded-2xl p-4 border border-border shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm câu hỏi theo tên, nội dung, bài tập..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-accent text-text-primary placeholder:text-text-secondary"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterDimension}
            onChange={(e) => setFilterDimension(e.target.value)}
            className="px-3 py-2 text-xs bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent font-medium cursor-pointer"
          >
            <option value="ALL">Tất cả chiều đo thể chất</option>
            {Object.values(FITNESS_DIMENSION_CONFIGS).map((dim) => (
              <option key={dim.key} value={dim.key}>
                {dim.label}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent font-medium cursor-pointer"
          >
            <option value="ALL">Tất cả loại câu hỏi</option>
            {QUESTION_TYPE_CONFIGS.map((t) => (
              <option key={t.type} value={t.type}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-surface-elevated/50 border-b border-border text-xs font-bold text-text-secondary uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold">Nội dung câu hỏi</th>
              <th className="py-3.5 px-4 font-semibold">Loại câu hỏi</th>
              <th className="py-3.5 px-4 font-semibold">Chiều đo thể chất</th>
              <th className="py-3.5 px-4 font-semibold text-center">Đang dùng trong</th>
              <th className="py-3.5 px-4 font-semibold text-center">Trọng số</th>
              <th className="py-3.5 px-4 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-text-secondary">
                  Không tìm thấy câu hỏi nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filtered.map((q) => {
                const dimConfig =
                  FITNESS_DIMENSION_CONFIGS[q.category] ||
                  FITNESS_DIMENSION_CONFIGS.UPPER_BODY_STRENGTH;
                const typeConfig =
                  QUESTION_TYPE_CONFIGS.find((t) => t.type === q.type) ||
                  QUESTION_TYPE_CONFIGS[0];

                return (
                  <tr key={q.id} className="hover:bg-surface-elevated/40 transition-colors group">
                    <td className="py-4 px-4">
                      <div>
                        <h4 className="text-xs font-bold text-text-primary leading-tight flex items-center gap-1.5">
                          {q.text}
                          {q.unit && (
                            <span className="text-[10px] text-text-secondary font-normal px-1.5 py-0.5 rounded bg-surface-elevated border border-border">
                              {q.unit}
                            </span>
                          )}
                        </h4>
                        {q.description && (
                          <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-1">
                            {q.description}
                          </p>
                        )}
                        {q.performanceConfig?.exerciseName && (
                          <span className="text-[10px] text-accent/90 font-semibold mt-1 inline-flex items-center gap-1">
                            <Dumbbell className="w-3 h-3" /> Bài tập: {q.performanceConfig.exerciseName}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-elevated text-text-secondary border border-border text-xs font-medium">
                        {typeConfig.tag}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 text-xs font-bold">
                        {dimConfig.shortLabel}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {q.usedInAssessmentsCount && q.usedInAssessmentsCount > 0 ? (
                        <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                          {q.usedInAssessmentsCount} bài test
                        </span>
                      ) : (
                        <span className="text-xs text-text-secondary">Chưa dùng</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="text-xs font-bold text-text-primary">{q.weight || 10}%</span>
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(q)}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                          title="Chỉnh sửa chi tiết câu hỏi"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(q)}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                          title="Nhân bản câu hỏi này"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(q)}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Xóa câu hỏi khỏi kho"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Advanced Question Bank Form Modal */}
      <QuestionBankFormModal
        isOpen={isFormModalOpen}
        initialQuestion={selectedQuestion}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveQuestion}
      />
    </div>
  );
};

