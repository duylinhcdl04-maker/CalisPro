import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Plus,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { AssessmentFormData } from '../../schemas/assessmentSchema';
import { Question, AssessmentQuestionRef } from '../../types';
import { QuestionEditor } from '../questions/QuestionEditor';
import { QuestionBankSelectorModal } from '../questions/QuestionBankSelectorModal';
import { FITNESS_DIMENSION_CONFIGS, isV2Category, v2RoleLabel } from '../../constants/fitnessDimensions';
import { QUESTION_TYPE_CONFIGS } from '../../constants/questionTypes';
import { assessmentsApi } from '../../api/assessmentsApi';

export const QuestionBuilderStep: React.FC = () => {
  const { watch, setValue } = useFormContext<AssessmentFormData>();
  const questionRefs = watch('questions') || [];

  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  // Câu hỏi trong ngân hàng (để tra cứu); định nghĩa câu hỏi của bài nằm ngay trong từng ref (ref.question)
  // -> được gửi kèm khi lưu để backend tạo / cập nhật câu hỏi riêng của bài.
  const [bankMap, setBankMap] = useState<Record<string, Question>>({});
  const questionsMap = useMemo(() => {
    const map: Record<string, Question> = { ...bankMap };
    questionRefs.forEach((r) => {
      if (r.question) map[r.questionId] = r.question as Question;
    });
    return map;
  }, [bankMap, questionRefs]);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [, setLoading] = useState(true);

  // Load question objects from mock API / bank
  useEffect(() => {
    setLoading(true);
    assessmentsApi
      .getQuestionsBank()
      .then((bankList) => {
        const map: Record<string, Question> = {};
        bankList.forEach((q) => {
          map[q.id] = q;
        });
        setBankMap(map);
        if (questionRefs.length > 0 && !activeQuestionId) {
          setActiveQuestionId(questionRefs[0].questionId);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const lastActiveIndex = useRef(0);
  useEffect(() => {
    const idx = questionRefs.findIndex((q) => q.questionId === activeQuestionId);
    if (idx >= 0) {
      lastActiveIndex.current = idx;
    } else if (activeQuestionId && questionRefs.length > 0) {
      setActiveQuestionId(questionRefs[Math.min(lastActiveIndex.current, questionRefs.length - 1)].questionId);
    }
  }, [questionRefs, activeQuestionId]);

  const scoredRefs = questionRefs.filter((r) => !isV2Category(questionsMap[r.questionId]?.category));
  const totalWeight = scoredRefs.reduce((sum, q) => sum + (Number(q.weight) || 0), 0);
  // Bài toàn câu V2 (hồ sơ/bối cảnh/thang tiến triển) không dùng trọng số %: điểm do bộ quy tắc V2 quyết định
  const isWeightValid = scoredRefs.length === 0 || Math.round(totalWeight) === 100;

  const activeQuestionIndex = questionRefs.findIndex((q) => q.questionId === activeQuestionId);
  const activeRef = activeQuestionIndex >= 0 ? questionRefs[activeQuestionIndex] : null;
  const activeQuestion = activeQuestionId ? questionsMap[activeQuestionId] : null;

  // Add new blank question
  const handleAddNewQuestion = (type: any = 'PERFORMANCE_TEST') => {
    const newId = `q-custom-${Date.now()}`;
    const newQuestion: Question = {
      id: newId,
      text: 'Câu hỏi kiểm tra thể lực mới',
      type: type,
      category: 'UPPER_BODY_STRENGTH',
      required: true,
      weight: 10,
      options: [
        { id: 'opt-1', label: 'Mức 1', value: '1', score: 25 },
        { id: 'opt-2', label: 'Mức 2', value: '2', score: 50 },
        { id: 'opt-3', label: 'Mức 3', value: '3', score: 75 },
        { id: 'opt-4', label: 'Mức 4', value: '4', score: 100 },
      ],
      performanceConfig: {
        exerciseName: 'Tên bài tập',
        measurementType: 'REPETITIONS',
        unit: 'reps',
        minValue: 0,
        maxValue: 100,
        instructionText: 'Mô tả hướng dẫn bài tập...',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newRef: AssessmentQuestionRef = {
      questionId: newId,
      order: questionRefs.length + 1,
      weight: 10,
      required: true,
      section: questionRefs[questionRefs.length - 1]?.section,
      question: newQuestion,
    };

    setValue('questions', [...questionRefs, newRef], { shouldValidate: true });
    setActiveQuestionId(newId);
  };

  // Add questions from bank
  const handleAddFromBank = (selectedQuestions: Question[]) => {
    const newRefs: AssessmentQuestionRef[] = [...questionRefs];

    selectedQuestions.forEach((q) => {
      newRefs.push({
        questionId: q.id,
        order: newRefs.length + 1,
        weight: q.weight || 10,
        required: true,
        section: questionRefs[questionRefs.length - 1]?.section,
        question: q,
      });
    });

    setValue('questions', newRefs, { shouldValidate: true });
    if (selectedQuestions.length > 0) {
      setActiveQuestionId(selectedQuestions[0].id);
    }
  };

  // Move up / down
  const handleMoveQuestion = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === questionRefs.length - 1) return;

    const newRefs = [...questionRefs];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    const temp = newRefs[index];
    newRefs[index] = newRefs[targetIdx];
    newRefs[targetIdx] = temp;

    // reorder index
    newRefs.forEach((r, i) => (r.order = i + 1));
    setValue('questions', newRefs, { shouldValidate: true });
  };

  // Duplicate question
  const handleDuplicateQuestion = (ref: AssessmentQuestionRef) => {
    const originalQ = questionsMap[ref.questionId];
    if (!originalQ) return;

    const newId = `q-copy-${Date.now()}`;
    const duplicatedQ: Question = {
      ...originalQ,
      id: newId,
      text: `${originalQ.text} (Bản sao)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newRef: AssessmentQuestionRef = {
      questionId: newId,
      order: questionRefs.length + 1,
      weight: ref.weight,
      required: ref.required,
      section: ref.section,
      question: duplicatedQ,
    };

    setValue('questions', [...questionRefs, newRef], { shouldValidate: true });
    setActiveQuestionId(newId);
  };

  // Delete question
  const handleDeleteQuestion = (questionId: string) => {
    const filtered = questionRefs.filter((q) => q.questionId !== questionId);
    filtered.forEach((r, i) => (r.order = i + 1));
    setValue('questions', filtered, { shouldValidate: true });

    if (activeQuestionId === questionId) {
      setActiveQuestionId(filtered.length > 0 ? filtered[0].questionId : null);
    }
  };

  // Auto distribute weights equally
  const handleAutoBalanceWeights = () => {
    if (questionRefs.length === 0) return;
    const scored = questionRefs.filter((r) => !isV2Category(questionsMap[r.questionId]?.category));
    if (scored.length === 0) {
      // Toàn câu V2: không có gì để chia, đưa mọi trọng số về 0 (xóa số cũ do lần cân bằng trước)
      setValue('questions', questionRefs.map((q) => ({ ...q, weight: 0 })), { shouldValidate: true });
      return;
    }
    const count = scored.length;
    const equalWeight = Math.floor(100 / count);
    const remainder = 100 - equalWeight * count;
    const firstScored = scored[0].questionId;

    // Câu V2 giữ trọng số 0: chỉ chia đều cho các câu chấm điểm kiểu v1
    const balanced = questionRefs.map((q) => ({
      ...q,
      weight: isV2Category(questionsMap[q.questionId]?.category) ? 0 : q.questionId === firstScored ? equalWeight + remainder : equalWeight,
    }));

    setValue('questions', balanced, { shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Weight Summary & Bank Action */}
      <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Weight indicator */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
              isWeightValid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {Math.round(totalWeight)}%
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-primary">
                Tổng trọng số ({questionRefs.length} câu hỏi)
              </span>
              {isWeightValid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn 100%
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                  <AlertTriangle className="w-3.5 h-3.5" /> Cần đạt đúng 100%
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5">
              {scoredRefs.length === 0
                ? 'Bài V2: các câu không dùng trọng số %, điểm do bộ quy tắc V2 quyết định. Nút cân bằng chỉ đưa trọng số cũ về 0.'
                : 'Mỗi câu hỏi đóng góp một tỷ trọng nhất định vào thang điểm 100 tổng quan.'}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoBalanceWeights}
            className="px-3 py-2 text-xs font-semibold text-accent bg-accent/10 border border-accent/20 hover:bg-accent hover:text-white rounded-xl transition-colors"
          >
            Cân bằng đều trọng số
          </button>

          <button
            type="button"
            onClick={() => setIsBankModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-accent-strong hover:bg-accent rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" />
            Chọn từ Ngân hàng ({Object.keys(questionsMap).length})
          </button>

          <button
            type="button"
            onClick={() => handleAddNewQuestion('PERFORMANCE_TEST')}
            className="px-3.5 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-strong rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Tạo câu hỏi mới
          </button>
        </div>
      </div>

      {/* Main Layout: Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Questions List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Danh sách câu hỏi ({questionRefs.length})
            </span>
            <span className="text-[11px] text-text-secondary/70">Kéo thả hoặc bấm để sửa</span>
          </div>

          {questionRefs.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-dashed border-border p-8 text-center">
              <Layers className="w-8 h-8 text-text-secondary mx-auto mb-2" />
              <h4 className="text-xs font-bold text-text-primary">Chưa có câu hỏi nào trong bài test</h4>
              <p className="text-[11px] text-text-secondary mt-1">
                Hãy chọn các câu hỏi chuẩn hóa từ Ngân hàng câu hỏi hoặc tạo mới câu hỏi kiểm tra.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent-strong"
                >
                  Mở Ngân hàng
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {questionRefs.map((ref, idx) => {
                const q = questionsMap[ref.questionId];
                const isActive = activeQuestionId === ref.questionId;
                const isV2 = !!q && isV2Category(q.category);
                const dimConfig = q && !isV2 ? FITNESS_DIMENSION_CONFIGS[q.category] : null;
                const typeConfig = q ? QUESTION_TYPE_CONFIGS.find((t) => t.type === q.type) : null;

                return (
                  <div
                    key={ref.questionId}
                    onClick={() => setActiveQuestionId(ref.questionId)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isActive
                        ? 'bg-accent/15 border-accent shadow-sm ring-1 ring-accent'
                        : 'bg-surface border-border hover:bg-surface-elevated'
                    }`}
                  >
                    {/* Order & Reorder Controls */}
                    <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveQuestion(idx, 'UP');
                        }}
                        className="p-0.5 text-text-secondary hover:text-text-primary disabled:opacity-20"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 h-5 rounded-md bg-surface-elevated border border-border text-[10px] font-bold text-text-primary flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        disabled={idx === questionRefs.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveQuestion(idx, 'DOWN');
                        }}
                        className="p-0.5 text-text-secondary hover:text-text-primary disabled:opacity-20"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {isV2 && q && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-elevated text-accent text-[10px] font-bold border border-border">
                            {v2RoleLabel(q.category)}
                          </span>
                        )}
                        {dimConfig && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-elevated text-accent text-[10px] font-bold border border-border">
                            {dimConfig.shortLabel}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-surface-elevated/80 text-text-secondary text-[10px] font-medium border border-border/50">
                          {typeConfig?.tag || 'Test'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 ml-auto bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                          {isV2 ? 'Không tính điểm' : `${ref.weight}%`}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-text-primary leading-tight line-clamp-2">
                        {q?.text || 'Đang tải câu hỏi...'}
                      </h4>
                    </div>

                    {/* Duplicate / Delete */}
                    <div className="flex items-center gap-1 shrink-0 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateQuestion(ref);
                        }}
                        className="p-1 text-text-secondary hover:text-text-primary rounded hover:bg-surface-elevated"
                        title="Nhân bản câu hỏi"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuestion(ref.questionId);
                        }}
                        className="p-1 text-text-secondary hover:text-rose-400 rounded hover:bg-rose-500/10"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Question Editor (7 cols) */}
        <div className="lg:col-span-7">
          {activeQuestion && activeRef && (
            <div className="mb-3 bg-surface rounded-2xl border border-border p-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs font-bold text-text-primary shrink-0" htmlFor="question-section">
                Phần / bước hiển thị cho học viên:
              </label>
              <input
                id="question-section"
                list="assessment-sections"
                value={activeRef.section ?? ''}
                onChange={(e) => {
                  const refs = [...questionRefs];
                  refs[activeQuestionIndex] = { ...refs[activeQuestionIndex], section: e.target.value };
                  setValue('questions', refs, { shouldValidate: true });
                }}
                placeholder="vd. Thông tin cơ bản, Khả năng thể chất... (để trống = nhóm theo nhóm năng lực)"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
              <datalist id="assessment-sections">
                {[...new Set(questionRefs.map((r) => r.section).filter(Boolean))].map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          )}
          {activeQuestion && activeRef ? (
            <QuestionEditor
              question={activeQuestion}
              questionIndex={activeQuestionIndex}
              weight={activeRef.weight}
              required={activeRef.required}
              onUpdateQuestion={(updated) => {
                const refs = [...questionRefs];
                refs[activeQuestionIndex] = { ...refs[activeQuestionIndex], question: updated };
                setValue('questions', refs, { shouldValidate: true });
              }}
              onUpdateWeight={(newWeight) => {
                const updated = [...questionRefs];
                updated[activeQuestionIndex].weight = newWeight;
                setValue('questions', updated, { shouldValidate: true });
              }}
              onUpdateRequired={(newReq) => {
                const updated = [...questionRefs];
                updated[activeQuestionIndex].required = newReq;
                setValue('questions', updated, { shouldValidate: true });
              }}
              onDeleteQuestion={() => handleDeleteQuestion(activeRef.questionId)}
            />
          ) : (
            <div className="bg-surface rounded-2xl border border-border p-12 text-center text-xs text-text-secondary">
              Chọn hoặc tạo mới câu hỏi từ danh sách bên trái để bắt đầu chỉnh sửa.
            </div>
          )}
        </div>
      </div>

      {/* Question Bank Modal */}
      <QuestionBankSelectorModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onAddQuestions={handleAddFromBank}
        alreadyAddedQuestionIds={questionRefs.map((r) => r.questionId)}
      />
    </div>
  );
};
