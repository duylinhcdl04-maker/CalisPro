import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Award,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { AssessmentFormData } from '../../schemas/assessmentSchema';
import { Question, ScoringRule, ConditionOperator } from '../../types';
import { assessmentsApi } from '../../api/assessmentsApi';

export const ScoringStep: React.FC = () => {
  const { watch, setValue } = useFormContext<AssessmentFormData>();
  const questionRefs = watch('questions') || [];

  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [testInputResult, setTestInputResult] = useState<number>(18);

  useEffect(() => {
    assessmentsApi.getQuestionsBank().then((allQuestions) => {
      // Ưu tiên định nghĩa trong bài (gồm câu hỏi tạo mới / đã sửa trong bài), sau đó mới tới ngân hàng
      const filtered = questionRefs
        .map((ref) => (ref.question as Question | undefined) ?? allQuestions.find((q) => q.id === ref.questionId))
        .filter(Boolean) as Question[];
      setQuestions(filtered);
      if (filtered.length > 0 && !selectedQuestionId) {
        setSelectedQuestionId(filtered[0].id);
      }
    });
  }, [questionRefs]);

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId) || questions[0];

  // Quy tắc chấm điểm lưu trong form (scoringConfig.questionScoring) để được gửi lên backend khi lưu.
  // Câu chưa có quy tắc riêng trong bài -> hiển thị quy tắc mặc định của câu hỏi trong ngân hàng.
  const questionScoring: { questionId: string; rules: ScoringRule[] }[] = watch('scoringConfig.questionScoring') || [];
  const rulesInForm = (qid: string) => questionScoring.find((x) => x.questionId === qid)?.rules;

  const activeRules: ScoringRule[] = selectedQuestion
    ? rulesInForm(selectedQuestion.id) || selectedQuestion.scoringRules || []
    : [];

  const setRules = (qid: string, rules: ScoringRule[]) => {
    const others = questionScoring.filter((x) => x.questionId !== qid);
    setValue('scoringConfig.questionScoring', [...others, { questionId: qid, rules }], { shouldDirty: true });
  };

  const handleAddRule = () => {
    if (!selectedQuestion) return;
    const newRule: ScoringRule = {
      id: `r-${Date.now()}`,
      questionId: selectedQuestion.id,
      operator: 'BETWEEN',
      minValue: 0,
      maxValue: 10,
      score: 50,
      label: 'Điều kiện mới',
    };
    setRules(selectedQuestion.id, [...activeRules, newRule]);
  };

  const handleUpdateRule = (ruleIndex: number, field: keyof ScoringRule, val: any) => {
    if (!selectedQuestion) return;
    const rules = [...activeRules];
    rules[ruleIndex] = { ...rules[ruleIndex], [field]: val };
    setRules(selectedQuestion.id, rules);
  };

  const handleRemoveRule = (ruleIndex: number) => {
    if (!selectedQuestion) return;
    setRules(selectedQuestion.id, activeRules.filter((_, i) => i !== ruleIndex));
  };

  // Compute preview score based on testInputResult
  const calculateTestScore = () => {
    if (!activeRules || activeRules.length === 0) return 60;
    for (const r of activeRules) {
      if (r.operator === 'BETWEEN' && r.minValue !== undefined && r.maxValue !== undefined) {
        if (testInputResult >= r.minValue && testInputResult <= r.maxValue) return r.score;
      } else if (r.operator === 'GTE' && r.minValue !== undefined) {
        if (testInputResult >= r.minValue) return r.score;
      } else if (r.operator === 'GT' && r.minValue !== undefined) {
        if (testInputResult > r.minValue) return r.score;
      } else if (r.operator === 'LTE' && r.maxValue !== undefined) {
        if (testInputResult <= r.maxValue) return r.score;
      } else if (r.operator === 'LT' && r.maxValue !== undefined) {
        if (testInputResult < r.maxValue) return r.score;
      } else if (r.operator === 'EQ' && r.exactValue !== undefined) {
        if (testInputResult === Number(r.exactValue)) return r.score;
      }
    }
    return 50;
  };

  const computedPreviewScore = calculateTestScore();

  return (
    <div className="space-y-5">
      {/* Scoring Overview Card */}
      <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">03. Quy tắc tính điểm & Thang đo (Scoring)</h2>
            <p className="text-xs text-text-secondary">
              Quy đổi kết quả bài kiểm tra thể lực thành điểm số chuẩn hóa (0 - 100 điểm) theo cơ chế khoa học thể thao.
            </p>
          </div>
        </div>

        {/* 4 KPI overview metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-surface-elevated/40 border border-border">
            <span className="text-[11px] font-bold text-text-secondary uppercase">Thang điểm tối đa</span>
            <div className="text-2xl font-bold text-text-primary mt-1">100 điểm</div>
            <span className="text-[10px] text-text-secondary/70">Thang chuẩn hóa</span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-elevated/40 border border-border">
            <span className="text-[11px] font-bold text-text-secondary uppercase">Tổng số câu hỏi</span>
            <div className="text-2xl font-bold text-text-primary mt-1">{questionRefs.length} câu</div>
            <span className="text-[10px] text-text-secondary/70">Đo lường đa chiều</span>
          </div>

          <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/30">
            <span className="text-[11px] font-bold text-accent uppercase">Tổng trọng số</span>
            <div className="text-2xl font-bold text-accent mt-1">100%</div>
            <span className="text-[10px] text-accent font-semibold">✓ Đã cân đối hoàn hảo</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[11px] font-bold text-emerald-400 uppercase">Trạng thái công thức</span>
            <div className="text-sm font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Hợp lệ & Sẵn sàng
            </div>
            <span className="text-[10px] text-emerald-400/80">Đã kiểm tra dải điểm</span>
          </div>
        </div>
      </div>

      {/* Main Scoring Builder & Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Select question to config rules (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Chọn câu hỏi cấu hình
            </span>
          </div>

          <div className="space-y-2">
            {questions.map((q, idx) => {
              const isSelected = q.id === selectedQuestion?.id;
              const ref = questionRefs.find((r) => r.questionId === q.id);

              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestionId(q.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-accent/15 border-accent shadow-sm ring-1 ring-accent'
                      : 'bg-surface border-border hover:bg-surface-elevated'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded bg-surface-elevated border border-border text-[10px] font-bold text-text-primary flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-text-primary truncate">{q.text}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0 ml-2">
                    {ref?.weight || 10}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Scoring Rules Table & Live Interactive Simulator (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedQuestion && (
            <>
              {/* Rules Table */}
              <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">
                      Thang điểm cho: "{selectedQuestion.text}"
                    </h3>
                    <p className="text-[11px] text-text-secondary">
                      Đơn vị đo: <strong className="text-text-primary">{selectedQuestion.unit || selectedQuestion.performanceConfig?.unit || 'reps'}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-bold hover:bg-accent hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Thêm khoảng điểm
                  </button>
                </div>

                {/* Table */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-elevated/60 border-b border-border text-text-secondary font-bold">
                      <tr>
                        <th className="p-3">Toán tử so sánh</th>
                        <th className="p-3">Dải giá trị đo thực tế</th>
                        <th className="p-3 text-center">Điểm quy đổi (0 - 100)</th>
                        <th className="p-3 text-right">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activeRules.map((rule, rIdx) => (
                        <tr key={rule.id || rIdx} className="hover:bg-surface-elevated/40">
                          {/* Operator */}
                          <td className="p-3">
                            <select
                              value={rule.operator}
                              onChange={(e) => handleUpdateRule(rIdx, 'operator', e.target.value as ConditionOperator)}
                              className="px-2 py-1 bg-background border border-border text-text-primary rounded-lg text-xs font-medium focus:ring-1 focus:ring-accent"
                            >
                              <option value="BETWEEN">Trong khoảng (Between)</option>
                              <option value="GTE">Lớn hơn hoặc bằng (&gt;=)</option>
                              <option value="GT">Lớn hơn (&gt;)</option>
                              <option value="LTE">Nhỏ hơn hoặc bằng (&lt;=)</option>
                              <option value="LT">Nhỏ hơn (&lt;)</option>
                              <option value="EQ">Bằng chính xác (=)</option>
                            </select>
                          </td>

                          {/* Values */}
                          <td className="p-3">
                            {rule.operator === 'BETWEEN' ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={rule.minValue ?? 0}
                                  onChange={(e) => handleUpdateRule(rIdx, 'minValue', Number(e.target.value))}
                                  className="w-16 px-2 py-1 bg-background border border-border text-text-primary rounded-lg text-center font-semibold"
                                />
                                <span className="text-text-secondary">đến</span>
                                <input
                                  type="number"
                                  value={rule.maxValue ?? 10}
                                  onChange={(e) => handleUpdateRule(rIdx, 'maxValue', Number(e.target.value))}
                                  className="w-16 px-2 py-1 bg-background border border-border text-text-primary rounded-lg text-center font-semibold"
                                />
                              </div>
                            ) : (
                              <input
                                type="number"
                                value={rule.minValue ?? rule.maxValue ?? 0}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  if (rule.operator === 'GT' || rule.operator === 'GTE') {
                                    handleUpdateRule(rIdx, 'minValue', val);
                                  } else {
                                    handleUpdateRule(rIdx, 'maxValue', val);
                                  }
                                }}
                                className="w-24 px-2 py-1 bg-background border border-border text-text-primary rounded-lg text-center font-semibold"
                              />
                            )}
                          </td>

                          {/* Score */}
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={rule.score}
                                onChange={(e) => handleUpdateRule(rIdx, 'score', Number(e.target.value))}
                                className="w-16 px-2 py-1 bg-background border border-border rounded-lg text-center font-bold text-emerald-400"
                              />
                              <span className="text-[11px] font-semibold text-text-secondary">pts</span>
                            </div>
                          </td>

                          {/* Delete */}
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveRule(rIdx)}
                              className="p-1 text-text-secondary hover:text-rose-400 hover:bg-rose-500/10 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interactive Scoring Simulator */}
              <div className="bg-accent/10 rounded-2xl border border-accent/30 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-accent fill-accent" />
                  <h3 className="text-xs font-bold text-accent uppercase tracking-wider">
                    Mô phỏng Chấm điểm Trực tiếp (Live Scoring Preview)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-surface p-4 rounded-xl border border-border">
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5">
                      Nhập thử kết quả của học viên:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={testInputResult}
                        onChange={(e) => setTestInputResult(Number(e.target.value))}
                        className="w-28 px-3 py-2 text-base font-bold bg-background border border-border text-text-primary rounded-xl text-center focus:ring-2 focus:ring-accent"
                      />
                      <span className="text-xs font-semibold text-text-secondary">
                        {selectedQuestion.unit || selectedQuestion.performanceConfig?.unit || 'reps'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-elevated/40 border border-border flex flex-col justify-center">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-bold text-text-secondary">Điểm số tính toán:</span>
                      <span className="text-2xl font-bold text-accent">
                        {computedPreviewScore} <span className="text-xs font-normal text-text-secondary">/ 100</span>
                      </span>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full bg-background h-2 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-accent h-full rounded-full transition-all duration-300"
                        style={{ width: `${computedPreviewScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
