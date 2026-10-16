import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trophy,
  Award,
  Zap,
  Activity,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { Assessment, Question } from '../../types';
import { assessmentsApi } from '../../api/assessmentsApi';
import { FitnessRadarChart, RadarDataPoint } from '../fitness/FitnessRadarChart';
import { FITNESS_DIMENSION_CONFIGS } from '../../constants/fitnessDimensions';

interface AssessmentUserPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: Partial<Assessment>;
}

export const AssessmentUserPreviewModal: React.FC<AssessmentUserPreviewModalProps> = ({
  isOpen,
  onClose,
  assessment,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const questionRefs = assessment.questions || [];

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setIsCompleted(false);

      // Danh sách bài chỉ có tóm tắt -> tải bài đầy đủ (kèm định nghĩa câu hỏi riêng của bài) khi cần
      const needsFull = questionRefs.some((ref) => !ref.question) && assessment?.id && /^\d+$/.test(assessment.id);
      const refsPromise = needsFull
        ? assessmentsApi.getAssessmentById(assessment!.id as string).then((full) => full?.questions ?? questionRefs)
        : Promise.resolve(questionRefs);

      Promise.all([refsPromise, assessmentsApi.getQuestionsBank()])
        .then(([refs, allBank]) => {
          const resolved = refs
            .map((ref) => (ref.question as Question | undefined) ?? allBank.find((q) => q.id === ref.questionId))
            .filter(Boolean) as Question[];
          setQuestions(resolved);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, assessment]);

  if (!isOpen) return null;

  const currentQ = questions[currentQuestionIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100) : 0;

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const currentAns = currentQ ? userAnswers[currentQ.id] : undefined;

  // Radar result data for completed state
  const mockResultRadar: RadarDataPoint[] = [
    { dimension: 'Sức mạnh thân trên', score: 72, benchmark: 65 },
    { dimension: 'Sức bền cơ bắp', score: 81, benchmark: 70 },
    { dimension: 'Độ dẻo & Linh hoạt', score: 54, benchmark: 60 },
    { dimension: 'Độ ổn định Core', score: 63, benchmark: 65 },
    { dimension: 'Kỹ năng Calisthenics', score: 42, benchmark: 40 },
    { dimension: 'Kiểm soát cơ thể', score: 68, benchmark: 60 },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Modal Header: Mode Simulation Badge */}
        <div className="px-6 py-4 bg-surface-elevated/60 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Chế độ Mô phỏng Trải nghiệm Học viên (User Experience Simulation)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {loading ? (
            <div className="py-20 text-center text-xs text-text-secondary">Đang tải câu hỏi mô phỏng...</div>
          ) : !isCompleted && currentQ ? (
            <div className="space-y-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-text-primary">
                  <span className="text-accent flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    {assessment.displayName || 'Đánh giá Thể lực'}
                  </span>
                  <span>
                    Câu {currentQuestionIndex + 1} / {questions.length} ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden border border-border">
                  <div
                    className="bg-accent h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="p-6 rounded-2xl bg-surface-elevated/40 border border-border space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-accent/10 text-accent border border-accent/20 text-[11px] font-bold">
                    {FITNESS_DIMENSION_CONFIGS[currentQ.category]?.shortLabel || 'Thể lực'}
                  </span>
                  {currentQ.required && (
                    <span className="text-[11px] text-rose-400 font-semibold">* Bắt buộc</span>
                  )}
                </div>

                <h3 className="text-base md:text-lg font-bold text-text-primary leading-snug">
                  {currentQ.text}
                </h3>

                {currentQ.instruction && (
                  <p className="text-xs text-text-secondary leading-relaxed bg-surface p-3 rounded-xl border border-border">
                    💡 <strong className="text-text-primary">Hướng dẫn thực hiện:</strong> {currentQ.instruction}
                  </p>
                )}

                {/* Question Input Controls by Type */}
                <div className="pt-2">
                  {/* Performance Test */}
                  {currentQ.type === 'PERFORMANCE_TEST' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-text-primary">
                        Nhập số lần / thời gian đạt được:
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={currentAns || ''}
                          onChange={(e) =>
                            setUserAnswers({ ...userAnswers, [currentQ.id]: e.target.value })
                          }
                          placeholder="0"
                          className="w-32 px-4 py-3 text-xl font-bold text-center bg-background border-2 border-accent rounded-2xl text-text-primary focus:outline-none focus:ring-4 focus:ring-accent/20"
                        />
                        <span className="text-sm font-bold text-accent">
                          {currentQ.performanceConfig?.unit || currentQ.unit || 'reps'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Single Choice Options */}
                  {(currentQ.type === 'SINGLE_CHOICE' || currentQ.type === 'MULTIPLE_CHOICE') && (
                    <div className="space-y-2">
                      {(currentQ.options || []).map((opt) => {
                        const isOptSelected = currentAns === opt.value;
                        return (
                          <div
                            key={opt.id}
                            onClick={() =>
                              setUserAnswers({ ...userAnswers, [currentQ.id]: opt.value })
                            }
                            className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                              isOptSelected
                                ? 'bg-accent/10 border-accent shadow-xs font-bold text-text-primary'
                                : 'bg-surface border-border hover:bg-surface-elevated text-text-primary'
                            }`}
                          >
                            <span className="text-xs">{opt.label}</span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isOptSelected ? 'border-accent bg-accent' : 'border-border'
                              }`}
                            >
                              {isOptSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Rating Scale */}
                  {currentQ.type === 'RATING_SCALE' && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs text-text-secondary">
                        <span>{currentQ.ratingConfig?.minLabel || 'Thấp'}</span>
                        <span className="font-bold text-accent">
                          Mức chọn: {currentAns || 5}
                        </span>
                        <span>{currentQ.ratingConfig?.maxLabel || 'Cao'}</span>
                      </div>
                      <input
                        type="range"
                        min={currentQ.ratingConfig?.minScale ?? 1}
                        max={currentQ.ratingConfig?.maxScale ?? 10}
                        value={currentAns || 5}
                        onChange={(e) =>
                          setUserAnswers({ ...userAnswers, [currentQ.id]: e.target.value })
                        }
                        className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                    </div>
                  )}

                  {/* Measurement */}
                  {currentQ.type === 'MEASUREMENT' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={currentAns || ''}
                        onChange={(e) =>
                          setUserAnswers({ ...userAnswers, [currentQ.id]: e.target.value })
                        }
                        placeholder="Số đo"
                        className="w-32 px-4 py-3 text-lg font-bold text-center bg-background border border-border rounded-2xl text-text-primary focus:border-accent focus:outline-none"
                      />
                      <span className="text-xs font-bold text-text-secondary">
                        {currentQ.measurementConfig?.unit || 'cm'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={handlePrev}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-text-secondary hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-strong text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {currentQuestionIndex === questions.length - 1 ? (
                    <>
                      Hoàn thành & Xem kết quả <CheckCircle2 className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Tiếp tục câu sau <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Completed Simulation Result Screen */
            <div className="space-y-6 animate-in fade-in zoom-in-95">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mx-auto shadow-inner">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">
                  Chúc mừng! Đã hoàn thành Bài test Đánh giá
                </h3>
                <p className="text-xs text-text-secondary">
                  Hệ thống AI của CalisHealth đã phân tích kết quả và tổng hợp Hồ sơ Thể lực.
                </p>
              </div>

              {/* Score & Level Card */}
              <div className="bg-surface-elevated/40 rounded-2xl p-5 border border-border flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-text-secondary uppercase">
                    Cấp độ phân loại CalisHealth
                  </span>
                  <div className="text-xl font-bold text-accent mt-0.5">
                    Intermediate (Trung cấp)
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    Đã làm chủ tốt các bài tập thể trọng chuẩn (Push-ups, Pull-ups, Dips).
                  </p>
                </div>
                <div className="text-center bg-surface px-6 py-3 rounded-2xl border border-border shadow-xs">
                  <span className="text-[10px] font-bold text-text-secondary uppercase">Tổng điểm</span>
                  <div className="text-3xl font-bold text-text-primary">68</div>
                  <span className="text-[10px] text-accent font-bold">/ 100 điểm</span>
                </div>
              </div>

              {/* Radar Chart */}
              <div className="bg-surface rounded-2xl p-4 border border-border">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2 text-center">
                  Biểu đồ 6 Chiều đo Thể chất (Fitness Radar)
                </h4>
                <FitnessRadarChart data={mockResultRadar} height={260} showBenchmark={true} />
              </div>

              {/* Re-simulate Button */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCompleted(false);
                    setCurrentQuestionIndex(0);
                    setUserAnswers({});
                  }}
                  className="px-4 py-2 text-xs font-semibold text-accent bg-accent/10 hover:bg-accent hover:text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-accent/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Thử làm lại từ đầu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
