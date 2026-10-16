import React from 'react';
import {
  Trash2,
  Plus,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
  Ruler,
  HelpCircle,
  Sparkles,
  Info,
  GripVertical,
} from 'lucide-react';
import { Question, QuestionOption, FitnessDimension, QuestionType } from '../../types';
import { FITNESS_DIMENSION_CONFIGS, isV2Category, v2RoleLabel } from '../../constants/fitnessDimensions';
import { QUESTION_TYPE_CONFIGS } from '../../constants/questionTypes';

interface QuestionEditorProps {
  question: Question;
  questionIndex: number;
  weight: number;
  required: boolean;
  onUpdateQuestion: (updated: Question) => void;
  onUpdateWeight: (weight: number) => void;
  onUpdateRequired: (required: boolean) => void;
  onDeleteQuestion: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  questionIndex,
  weight,
  required,
  onUpdateQuestion,
  onUpdateWeight,
  onUpdateRequired,
  onDeleteQuestion,
}) => {
  const handleTextChange = (field: keyof Question, value: any) => {
    onUpdateQuestion({
      ...question,
      [field]: value,
    });
  };

  const handleOptionChange = (idx: number, field: keyof QuestionOption, val: any) => {
    const opts = [...(question.options || [])];
    opts[idx] = { ...opts[idx], [field]: val };
    onUpdateQuestion({ ...question, options: opts });
  };

  const handleAddOption = () => {
    const opts = question.options || [];
    const newOpt: QuestionOption = {
      id: `opt-${Date.now()}`,
      label: `Lựa chọn ${opts.length + 1}`,
      value: `OPTION_${opts.length + 1}`,
      score: 50,
    };
    onUpdateQuestion({ ...question, options: [...opts, newOpt] });
  };

  const handleRemoveOption = (idx: number) => {
    const opts = (question.options || []).filter((_, i) => i !== idx);
    onUpdateQuestion({ ...question, options: opts });
  };

  const handlePerformanceChange = (field: string, val: any) => {
    const current = question.performanceConfig || {
      exerciseName: 'Push Up',
      measurementType: 'REPETITIONS',
      unit: 'reps',
      minValue: 0,
      maxValue: 100,
      instructionText: '',
    };
    onUpdateQuestion({
      ...question,
      performanceConfig: {
        ...current,
        [field]: val,
      },
    });
  };

  const handleMeasurementChange = (field: string, val: any) => {
    const current = question.measurementConfig || {
      metricName: 'Khoảng cách',
      unit: 'cm',
      minValue: 0,
      maxValue: 100,
    };
    onUpdateQuestion({
      ...question,
      measurementConfig: {
        ...current,
        [field]: val,
      },
    });
  };

  const handleRatingChange = (field: string, val: any) => {
    const current = question.ratingConfig || {
      minScale: 1,
      maxScale: 10,
      minLabel: 'Thấp / Kém',
      maxLabel: 'Cao / Tốt',
      step: 1,
    };
    onUpdateQuestion({
      ...question,
      ratingConfig: {
        ...current,
        [field]: val,
      },
    });
  };

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs space-y-5">
      {/* Editor Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center text-xs font-bold shadow-xs">
            {questionIndex + 1}
          </span>
          <h3 className="text-sm font-bold text-text-primary">Chi tiết Cấu hình Câu hỏi</h3>
        </div>
        <div className="flex items-center gap-3">
          {/* Required toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-primary">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => onUpdateRequired(e.target.checked)}
              className="rounded text-accent focus:ring-accent accent-accent"
            />
            Bắt buộc trả lời
          </label>

          {/* Delete Button */}
          <button
            type="button"
            onClick={onDeleteQuestion}
            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Xóa câu hỏi khỏi bài test"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Fields */}
      <div className="space-y-4">
        {/* Question Text */}
        <div>
          <label className="block text-xs font-bold text-text-primary mb-1">
            Nội dung câu hỏi <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={question.text}
            onChange={(e) => handleTextChange('text', e.target.value)}
            placeholder="VD: Số lần Push Up (Hít đất) tối đa chuẩn form"
            className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:border-accent focus:outline-none text-text-primary font-medium"
          />
        </div>

        {/* Category & Weight & Question Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Question Type */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Loại câu hỏi
            </label>
            <select
              value={question.type}
              onChange={(e) => handleTextChange('type', e.target.value as QuestionType)}
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent font-medium"
            >
              {QUESTION_TYPE_CONFIGS.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {isV2Category(question.category) ? (
            <div className="md:col-span-2 rounded-xl border border-border bg-background p-3 text-xs text-text-secondary">
              <p className="font-bold text-text-primary">Vai trò trong bài V2: {v2RoleLabel(question.category)}</p>
              <p className="mt-1">
                Câu này thu thập thông tin hoặc đo theo thang tiến triển nên <b>không có chiều đo thể chất và không có trọng số %</b>.
                Cách chấm và xếp level do bộ quy tắc V2 quyết định.
              </p>
            </div>
          ) : (
            <>
          {/* Dimension Category */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Chiều đo thể chất đóng góp
            </label>
            <select
              value={question.category}
              onChange={(e) => handleTextChange('category', e.target.value as FitnessDimension)}
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent font-medium"
            >
              {Object.values(FITNESS_DIMENSION_CONFIGS).map((dim) => (
                <option key={dim.key} value={dim.key}>
                  {dim.label}
                </option>
              ))}
            </select>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1 flex items-center justify-between">
              <span>Trọng số bài test</span>
              <span className="text-emerald-400 font-bold">{weight}%</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={weight}
                onChange={(e) => onUpdateWeight(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent font-bold"
              />
              <span className="text-xs font-bold text-text-secondary">%</span>
            </div>
          </div>
            </>
          )}
        </div>

        {/* Description & Instruction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Mô tả ý nghĩa khoa học
            </label>
            <textarea
              rows={2}
              value={question.description || ''}
              onChange={(e) => handleTextChange('description', e.target.value)}
              placeholder="Giải thích mục tiêu đo lường..."
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:border-accent focus:outline-none text-text-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Hướng dẫn thực hiện cho học viên
            </label>
            <textarea
              rows={2}
              value={question.instruction || ''}
              onChange={(e) => handleTextChange('instruction', e.target.value)}
              placeholder="Yêu cầu kỹ thuật, lưu ý an toàn form..."
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:border-accent focus:outline-none text-text-primary"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Type-specific Editors */}
      {/* 1. PERFORMANCE TEST */}
      {question.type === 'PERFORMANCE_TEST' && (
        <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-accent">
            <Zap className="w-4 h-4" />
            <span>Cấu hình Thể lực thực tế (Performance Test)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-text-primary mb-1">Tên bài tập</label>
              <input
                type="text"
                value={question.performanceConfig?.exerciseName || ''}
                onChange={(e) => handlePerformanceChange('exerciseName', e.target.value)}
                placeholder="VD: Push Up"
                className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-primary mb-1">Chỉ số đo lường</label>
              <select
                value={question.performanceConfig?.measurementType || 'REPETITIONS'}
                onChange={(e) => handlePerformanceChange('measurementType', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="REPETITIONS">Số lần lặp (Reps)</option>
                <option value="HOLD_DURATION_SECONDS">Thời gian giữ (Giây)</option>
                <option value="DISTANCE_CM">Khoảng cách (cm)</option>
                <option value="WEIGHT_KG">Trọng lượng (kg)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-primary mb-1">Đơn vị đo</label>
              <input
                type="text"
                value={question.performanceConfig?.unit || 'reps'}
                onChange={(e) => handlePerformanceChange('unit', e.target.value)}
                placeholder="reps / giây"
                className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. SINGLE / MULTIPLE CHOICE */}
      {(question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') && (
        <div className="p-4 rounded-xl bg-surface-elevated/40 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span>Danh sách các phương án trả lời & Điểm thành phần</span>
            </div>
            <button
              type="button"
              onClick={handleAddOption}
              className="px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-bold hover:bg-accent hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm đáp án
            </button>
          </div>

          <div className="space-y-2">
            {(question.options || []).map((opt, idx) => (
              <div key={opt.id || idx} className="flex items-center gap-2 bg-surface p-2 rounded-lg border border-border">
                <GripVertical className="w-4 h-4 text-text-secondary shrink-0" />
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => handleOptionChange(idx, 'label', e.target.value)}
                  placeholder="Nhãn lựa chọn (VD: 0 - 5 reps)"
                  className="flex-1 px-2.5 py-1 text-xs bg-background border border-border hover:border-accent/40 focus:border-accent text-text-primary rounded focus:outline-none"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[11px] text-text-secondary">Điểm:</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={opt.score}
                    onChange={(e) => handleOptionChange(idx, 'score', Number(e.target.value))}
                    className="w-16 px-2 py-1 text-xs font-bold text-center bg-background border border-border rounded text-text-primary focus:border-accent focus:outline-none"
                  />
                  <span className="text-xs font-semibold text-text-secondary">pts</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  className="p-1 text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. RATING SCALE */}
      {question.type === 'RATING_SCALE' && (
        <div className="p-4 rounded-xl bg-surface-elevated/40 border border-border space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
            <SlidersHorizontal className="w-4 h-4 text-accent" />
            <span>Cấu hình Thang điểm cảm nhận (Rating Scale)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-text-primary mb-1">Mức nhỏ nhất</label>
              <input
                type="number"
                value={question.ratingConfig?.minScale ?? 1}
                onChange={(e) => handleRatingChange('minScale', Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-primary mb-1">Mức lớn nhất</label>
              <input
                type="number"
                value={question.ratingConfig?.maxScale ?? 10}
                onChange={(e) => handleRatingChange('maxScale', Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-primary mb-1">Nhãn mức thấp</label>
              <input
                type="text"
                value={question.ratingConfig?.minLabel || ''}
                onChange={(e) => handleRatingChange('minLabel', e.target.value)}
                placeholder="VD: Rất mệt"
                className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-primary mb-1">Nhãn mức cao</label>
              <input
                type="text"
                value={question.ratingConfig?.maxLabel || ''}
                onChange={(e) => handleRatingChange('maxLabel', e.target.value)}
                placeholder="VD: Rất tốt"
                className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. MEASUREMENT */}
      {question.type === 'MEASUREMENT' && (
        <div className="p-4 rounded-xl bg-surface-elevated/40 border border-border space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
            <Ruler className="w-4 h-4 text-accent" />
            <span>Cấu hình Đo lường Khớp & Độ dẻo</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-text-primary mb-1">Tên chỉ số đo</label>
              <input
                type="text"
                value={question.measurementConfig?.metricName || ''}
                onChange={(e) => handleMeasurementChange('metricName', e.target.value)}
                placeholder="VD: Khoảng cách mở vai"
                className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-primary mb-1">Đơn vị đo</label>
              <input
                type="text"
                value={question.measurementConfig?.unit || 'cm'}
                onChange={(e) => handleMeasurementChange('unit', e.target.value)}
                placeholder="cm / độ"
                className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-primary mb-1">Khoảng đo cho phép</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={question.measurementConfig?.minValue ?? 0}
                  onChange={(e) => handleMeasurementChange('minValue', Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded-lg text-center text-text-primary focus:border-accent focus:outline-none"
                />
                <span className="text-xs text-text-secondary">đến</span>
                <input
                  type="number"
                  value={question.measurementConfig?.maxValue ?? 150}
                  onChange={(e) => handleMeasurementChange('maxValue', Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded-lg text-center text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
