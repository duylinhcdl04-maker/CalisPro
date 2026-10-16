import React, { useState, useEffect } from 'react';
import { Search, Plus, Check, Sparkles, X, Filter } from 'lucide-react';
import { Question } from '../../types';
import { assessmentsApi } from '../../api/assessmentsApi';
import { FITNESS_DIMENSION_CONFIGS } from '../../constants/fitnessDimensions';
import { QUESTION_TYPE_CONFIGS } from '../../constants/questionTypes';

interface QuestionBankSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (questions: Question[]) => void;
  alreadyAddedQuestionIds: string[];
}

export const QuestionBankSelectorModal: React.FC<QuestionBankSelectorModalProps> = ({
  isOpen,
  onClose,
  onAddQuestions,
  alreadyAddedQuestionIds,
}) => {
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      assessmentsApi
        .getQuestionsBank()
        .then((data) => setBankQuestions(data))
        .finally(() => setLoading(false));
      setSelectedQuestionIds([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredQuestions = bankQuestions.filter((q) => {
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const matchText = q.text.toLowerCase().includes(query) || (q.description && q.description.toLowerCase().includes(query));
      if (!matchText) return false;
    }
    if (selectedCategory !== 'ALL' && q.category !== selectedCategory) return false;
    if (selectedType !== 'ALL' && q.type !== selectedType) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    if (alreadyAddedQuestionIds.includes(id)) return;
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const questionsToAdd = bankQuestions.filter((q) => selectedQuestionIds.includes(q.id));
    onAddQuestions(questionsToAdd);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-border animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-surface-elevated/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Ngân hàng Câu hỏi Thể lực</h3>
              <p className="text-xs text-text-secondary">
                Tái sử dụng các câu hỏi chuẩn hóa khoa học đã được thiết kế sẵn.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border bg-surface flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm câu hỏi theo tên, bài tập, hướng dẫn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-accent text-text-primary placeholder:text-text-secondary"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="ALL">Tất cả chiều đo thể chất</option>
              {Object.values(FITNESS_DIMENSION_CONFIGS).map((dim) => (
                <option key={dim.key} value={dim.key}>
                  {dim.label}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-xs bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
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

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="py-12 text-center text-xs text-text-secondary">Đang tải ngân hàng câu hỏi...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-secondary">Không tìm thấy câu hỏi phù hợp.</div>
          ) : (
            filteredQuestions.map((q) => {
              const isAlreadyAdded = alreadyAddedQuestionIds.includes(q.id);
              const isSelected = selectedQuestionIds.includes(q.id);
              const dimConfig = FITNESS_DIMENSION_CONFIGS[q.category] || FITNESS_DIMENSION_CONFIGS.UPPER_BODY_STRENGTH;
              const typeConfig = QUESTION_TYPE_CONFIGS.find((t) => t.type === q.type) || QUESTION_TYPE_CONFIGS[0];

              return (
                <div
                  key={q.id}
                  onClick={() => toggleSelect(q.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-4 ${
                    isAlreadyAdded
                      ? 'bg-surface-elevated/30 border-border opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'bg-accent/10 border-accent ring-1 ring-accent cursor-pointer'
                      : 'bg-surface border-border hover:bg-surface-elevated cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center shrink-0 ${
                        isAlreadyAdded
                          ? 'bg-surface-elevated border-border text-text-secondary'
                          : isSelected
                          ? 'bg-accent border-accent text-white'
                          : 'border-border bg-background'
                      }`}
                    >
                      {(isSelected || isAlreadyAdded) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 text-[10px] font-bold">
                          {dimConfig.shortLabel}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-elevated text-text-secondary border border-border text-[10px] font-medium">
                          {typeConfig.tag}
                        </span>
                        {q.usedInAssessmentsCount && q.usedInAssessmentsCount > 0 && (
                          <span className="text-[10px] text-text-secondary">
                            • Sử dụng trong {q.usedInAssessmentsCount} bài test
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-text-primary leading-snug">{q.text}</h4>
                      {q.description && (
                        <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2">{q.description}</p>
                      )}
                    </div>
                  </div>

                  {isAlreadyAdded && (
                    <span className="text-[10px] font-bold text-text-secondary bg-surface-elevated px-2 py-1 rounded border border-border shrink-0">
                      Đã có trong bài test
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-surface-elevated/60 flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            Đã chọn <strong className="text-text-primary">{selectedQuestionIds.length}</strong> câu hỏi mới
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              disabled={selectedQuestionIds.length === 0}
              onClick={handleConfirm}
              className="px-4 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent-strong disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm vào bài đánh giá ({selectedQuestionIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
