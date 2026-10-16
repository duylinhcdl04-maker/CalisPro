import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Sliders,
  Play,
  Dumbbell,
  FileText,
  Layers,
  HelpCircle,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Info,
  Scale,
  ListChecks,
} from 'lucide-react';
import {
  Question,
  QuestionType,
  FitnessDimension,
  QuestionOption,
  ScoringRule,
  ConditionOperator,
} from '../../types';
import { FITNESS_DIMENSION_CONFIGS } from '../../constants/fitnessDimensions';
import { QUESTION_TYPE_CONFIGS } from '../../constants/questionTypes';
import { toast } from 'sonner';

interface QuestionBankFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Partial<Question>) => Promise<void>;
  initialQuestion?: Question | null;
}

export const QuestionBankFormModal: React.FC<QuestionBankFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialQuestion = null,
}) => {
  const isEditing = Boolean(initialQuestion?.id);

  // Tabs
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'CONFIG' | 'SCORING'>('GENERAL');

  // General Form States
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');
  const [instruction, setInstruction] = useState('');
  const [type, setType] = useState<QuestionType>('PERFORMANCE_TEST');
  const [category, setCategory] = useState<FitnessDimension>('UPPER_BODY_STRENGTH');
  const [unit, setUnit] = useState('reps');
  const [weight, setWeight] = useState(10);
  const [required, setRequired] = useState(true);

  // Performance Config States
  const [exerciseName, setExerciseName] = useState('');
  const [measurementType, setMeasurementType] = useState<'REPETITIONS' | 'HOLD_DURATION_SECONDS' | 'DISTANCE_CM' | 'WEIGHT_KG'>('REPETITIONS');
  const [perfMinValue, setPerfMinValue] = useState(0);
  const [perfMaxValue, setPerfMaxValue] = useState(100);
  const [videoUrl, setVideoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Options States (for Single/Multiple Choice)
  const [options, setOptions] = useState<QuestionOption[]>([
    { id: 'opt-1', label: 'Chưa làm được / Mức 1', value: '1', score: 20 },
    { id: 'opt-2', label: 'Cơ bản / Mức 2', value: '2', score: 50 },
    { id: 'opt-3', label: 'Khá / Mức 3', value: '3', score: 75 },
    { id: 'opt-4', label: 'Thành thạo / Mức 4', value: '4', score: 100 },
  ]);

  // Measurement Config States
  const [metricName, setMetricName] = useState('');
  const [measureMinValue, setMeasureMinValue] = useState(0);
  const [measureMaxValue, setMeasureMaxValue] = useState(250);
  const [guideText, setGuideText] = useState('');

  // Rating Config States
  const [minScale, setMinScale] = useState(1);
  const [maxScale, setMaxScale] = useState(10);
  const [minLabel, setMinLabel] = useState('Rất yếu / Rất đau');
  const [maxLabel, setMaxLabel] = useState('Rất tốt / Sung sức');
  const [scaleStep, setScaleStep] = useState(1);

  // Scoring Rules States
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([]);
  const [testSimValue, setTestSimValue] = useState<number>(15);

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      setActiveTab('GENERAL');
      if (initialQuestion) {
        setText(initialQuestion.text || '');
        setDescription(initialQuestion.description || '');
        setInstruction(initialQuestion.instruction || '');
        setType(initialQuestion.type || 'PERFORMANCE_TEST');
        setCategory(initialQuestion.category || 'UPPER_BODY_STRENGTH');
        setUnit(initialQuestion.unit || (initialQuestion.type === 'PERFORMANCE_TEST' ? 'reps' : ''));
        setWeight(initialQuestion.weight ?? 10);
        setRequired(initialQuestion.required ?? true);

        // Performance config
        if (initialQuestion.performanceConfig) {
          setExerciseName(initialQuestion.performanceConfig.exerciseName || '');
          setMeasurementType(initialQuestion.performanceConfig.measurementType || 'REPETITIONS');
          setPerfMinValue(initialQuestion.performanceConfig.minValue ?? 0);
          setPerfMaxValue(initialQuestion.performanceConfig.maxValue ?? 100);
          setVideoUrl(initialQuestion.performanceConfig.videoUrl || '');
          setImageUrl(initialQuestion.performanceConfig.imageUrl || '');
        } else {
          setExerciseName(initialQuestion.text || '');
          setMeasurementType('REPETITIONS');
          setPerfMinValue(0);
          setPerfMaxValue(100);
          setVideoUrl('');
          setImageUrl('');
        }

        // Options
        if (initialQuestion.options && initialQuestion.options.length > 0) {
          setOptions(initialQuestion.options);
        } else {
          setOptions([
            { id: 'opt-1', label: 'Chưa làm được / Mức 1', value: '1', score: 20 },
            { id: 'opt-2', label: 'Cơ bản / Mức 2', value: '2', score: 50 },
            { id: 'opt-3', label: 'Khá / Mức 3', value: '3', score: 75 },
            { id: 'opt-4', label: 'Thành thạo / Mức 4', value: '4', score: 100 },
          ]);
        }

        // Measurement config
        if (initialQuestion.measurementConfig) {
          setMetricName(initialQuestion.measurementConfig.metricName || '');
          setMeasureMinValue(initialQuestion.measurementConfig.minValue ?? 0);
          setMeasureMaxValue(initialQuestion.measurementConfig.maxValue ?? 250);
          setGuideText(initialQuestion.measurementConfig.guideText || '');
        }

        // Rating config
        if (initialQuestion.ratingConfig) {
          setMinScale(initialQuestion.ratingConfig.minScale ?? 1);
          setMaxScale(initialQuestion.ratingConfig.maxScale ?? 10);
          setMinLabel(initialQuestion.ratingConfig.minLabel || 'Rất yếu');
          setMaxLabel(initialQuestion.ratingConfig.maxLabel || 'Rất tốt');
          setScaleStep(initialQuestion.ratingConfig.step ?? 1);
        }

        // Scoring rules
        if (initialQuestion.scoringRules && initialQuestion.scoringRules.length > 0) {
          setScoringRules(initialQuestion.scoringRules);
        } else {
          setScoringRules(getDefaultRulesForType(initialQuestion.type || 'PERFORMANCE_TEST', initialQuestion.unit || 'reps'));
        }
      } else {
        // Reset to default new form
        setText('');
        setDescription('');
        setInstruction('');
        setType('PERFORMANCE_TEST');
        setCategory('UPPER_BODY_STRENGTH');
        setUnit('reps');
        setWeight(10);
        setRequired(true);
        setExerciseName('');
        setMeasurementType('REPETITIONS');
        setPerfMinValue(0);
        setPerfMaxValue(100);
        setVideoUrl('');
        setImageUrl('');
        setOptions([
          { id: 'opt-1', label: 'Chưa đạt / Dưới chuẩn', value: '1', score: 25 },
          { id: 'opt-2', label: 'Mức trung bình', value: '2', score: 50 },
          { id: 'opt-3', label: 'Mức tốt', value: '3', score: 75 },
          { id: 'opt-4', label: 'Xuất sắc / Vượt chuẩn', value: '4', score: 100 },
        ]);
        setMetricName('');
        setMeasureMinValue(0);
        setMeasureMaxValue(250);
        setGuideText('');
        setMinScale(1);
        setMaxScale(10);
        setMinLabel('Rất yếu / Rất đau');
        setMaxLabel('Rất tốt / Sung sức');
        setScaleStep(1);
        setScoringRules(getDefaultRulesForType('PERFORMANCE_TEST', 'reps'));
        setTestSimValue(15);
      }
    }
  }, [isOpen, initialQuestion]);

  if (!isOpen) return null;

  function getDefaultRulesForType(qType: QuestionType, u: string): ScoringRule[] {
    if (qType === 'PERFORMANCE_TEST' || qType === 'NUMERIC_INPUT') {
      return [
        { id: 'r1', questionId: '', operator: 'BETWEEN', minValue: 0, maxValue: 5, score: 20, label: `0 - 5 ${u}` },
        { id: 'r2', questionId: '', operator: 'BETWEEN', minValue: 6, maxValue: 12, score: 50, label: `6 - 12 ${u}` },
        { id: 'r3', questionId: '', operator: 'BETWEEN', minValue: 13, maxValue: 22, score: 75, label: `13 - 22 ${u}` },
        { id: 'r4', questionId: '', operator: 'GTE', minValue: 23, score: 100, label: `23+ ${u}` },
      ];
    }
    return [];
  }

  // Handle unit auto-fill when type/measurementType changes
  const handleMeasurementTypeChange = (newMType: typeof measurementType) => {
    setMeasurementType(newMType);
    if (newMType === 'REPETITIONS') setUnit('reps');
    else if (newMType === 'HOLD_DURATION_SECONDS') setUnit('giây');
    else if (newMType === 'DISTANCE_CM') setUnit('cm');
    else if (newMType === 'WEIGHT_KG') setUnit('kg');
  };

  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    if (newType === 'PERFORMANCE_TEST') {
      setUnit('reps');
    } else if (newType === 'MEASUREMENT') {
      setUnit('cm');
    } else if (newType === 'RATING_SCALE') {
      setUnit('điểm');
    } else {
      setUnit('');
    }
    setScoringRules(getDefaultRulesForType(newType, unit || 'reps'));
  };

  // Option handlers
  const handleAddOption = () => {
    const nextIdx = options.length + 1;
    const newOpt: QuestionOption = {
      id: `opt-${Date.now()}`,
      label: `Lựa chọn ${nextIdx}`,
      value: `${nextIdx}`,
      score: Math.min(100, nextIdx * 25),
    };
    setOptions([...options, newOpt]);
  };

  const handleUpdateOption = (index: number, field: keyof QuestionOption, val: any) => {
    const next = [...options];
    next[index] = { ...next[index], [field]: val };
    setOptions(next);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error('Phải giữ lại ít nhất 2 lựa chọn.');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  // Scoring rule handlers
  const handleAddRule = () => {
    const newRule: ScoringRule = {
      id: `r-${Date.now()}`,
      questionId: initialQuestion?.id || '',
      operator: 'BETWEEN',
      minValue: 0,
      maxValue: 10,
      score: 50,
      label: 'Khoảng điểm mới',
    };
    setScoringRules([...scoringRules, newRule]);
  };

  const handleUpdateRule = (index: number, field: keyof ScoringRule, val: any) => {
    const next = [...scoringRules];
    next[index] = { ...next[index], [field]: val };
    setScoringRules(next);
  };

  const handleRemoveRule = (index: number) => {
    setScoringRules(scoringRules.filter((_, i) => i !== index));
  };

  // Live simulation calculator
  const calculateSimulatedScore = (): number => {
    if (type === 'SINGLE_CHOICE' || type === 'YES_NO') {
      return 100;
    }
    if (!scoringRules || scoringRules.length === 0) return 50;

    for (const r of scoringRules) {
      if (r.operator === 'BETWEEN' && r.minValue !== undefined && r.maxValue !== undefined) {
        if (testSimValue >= r.minValue && testSimValue <= r.maxValue) return r.score;
      } else if (r.operator === 'GTE' && r.minValue !== undefined) {
        if (testSimValue >= r.minValue) return r.score;
      } else if (r.operator === 'GT' && r.minValue !== undefined) {
        if (testSimValue > r.minValue) return r.score;
      } else if (r.operator === 'LTE' && r.maxValue !== undefined) {
        if (testSimValue <= r.maxValue) return r.score;
      } else if (r.operator === 'LT' && r.maxValue !== undefined) {
        if (testSimValue < r.maxValue) return r.score;
      } else if (r.operator === 'EQ' && r.exactValue !== undefined) {
        if (testSimValue === Number(r.exactValue)) return r.score;
      }
    }
    return 50;
  };

  const simScore = calculateSimulatedScore();

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi.');
      setActiveTab('GENERAL');
      return;
    }

    const payload: Partial<Question> = {
      id: initialQuestion?.id,
      text: text.trim(),
      description: description.trim() || undefined,
      instruction: instruction.trim() || undefined,
      type,
      category,
      unit: unit.trim() || undefined,
      weight: Number(weight) || 10,
      required,
    };

    if (type === 'PERFORMANCE_TEST') {
      payload.performanceConfig = {
        exerciseName: exerciseName.trim() || text.trim(),
        measurementType,
        unit: unit || 'reps',
        minValue: Number(perfMinValue) || 0,
        maxValue: Number(perfMaxValue) || 100,
        instructionText: instruction.trim() || description.trim() || 'Thực hiện động tác chuẩn form theo hướng dẫn.',
        videoUrl: videoUrl.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      };
      payload.scoringRules = scoringRules;
    } else if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'YES_NO') {
      payload.options = options;
    } else if (type === 'MEASUREMENT') {
      payload.measurementConfig = {
        metricName: metricName.trim() || text.trim(),
        unit: unit || 'cm',
        minValue: Number(measureMinValue) || 0,
        maxValue: Number(measureMaxValue) || 250,
        guideText: guideText.trim() || instruction.trim() || undefined,
      };
      payload.scoringRules = scoringRules;
    } else if (type === 'RATING_SCALE') {
      payload.ratingConfig = {
        minScale: Number(minScale) || 1,
        maxScale: Number(maxScale) || 10,
        minLabel: minLabel.trim() || 'Rất yếu',
        maxLabel: maxLabel.trim() || 'Rất tốt',
        step: Number(scaleStep) || 1,
      };
    } else if (type === 'NUMERIC_INPUT') {
      payload.scoringRules = scoringRules;
    }

    try {
      await onSave(payload);
      onClose();
    } catch {
      toast.error('Có lỗi xảy ra khi lưu câu hỏi.');
    }
  };

  const currentDimConfig = FITNESS_DIMENSION_CONFIGS[category] || FITNESS_DIMENSION_CONFIGS.UPPER_BODY_STRENGTH;
  const currentTypeConfig = QUESTION_TYPE_CONFIGS.find((t) => t.type === type) || QUESTION_TYPE_CONFIGS[0];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-surface rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">
                  {isEditing ? 'Chỉnh sửa Câu hỏi Ngân hàng' : 'Thêm Câu hỏi mới vào Ngân hàng'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold">
                  {currentTypeConfig.tag}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                  {currentDimConfig.shortLabel}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Định cấu hình nội dung, phương thức đo lường và thang điểm quy đổi chuẩn khoa học thể thao.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-border bg-surface flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('GENERAL')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'GENERAL'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <FileText className="w-4 h-4" />
            1. Thông tin chung & Phân loại
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CONFIG')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'CONFIG'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sliders className="w-4 h-4" />
            2. Cấu hình chi tiết ({currentTypeConfig.tag})
          </button>

          {(type === 'PERFORMANCE_TEST' || type === 'NUMERIC_INPUT' || type === 'MEASUREMENT') && (
            <button
              type="button"
              onClick={() => setActiveTab('SCORING')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'SCORING'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Scale className="w-4 h-4" />
              3. Thang điểm & Quy đổi ({scoringRules.length} mốc)
            </button>
          )}
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: GENERAL INFO */}
          {activeTab === 'GENERAL' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Question Text */}
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  Nội dung câu hỏi kiểm tra <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="VD: Thực hiện số lần Push Up (Hít đất) chuẩn kỹ thuật tối đa trong 1 hiệp"
                  className="w-full px-3.5 py-2.5 text-xs bg-background border border-border text-text-primary rounded-xl focus:ring-2 focus:ring-accent focus:outline-none placeholder:text-text-secondary/50 font-medium"
                />
                <p className="text-[11px] text-text-secondary mt-1">
                  Mô tả hành động hoặc câu hỏi rõ ràng, dễ hiểu cho học viên khi làm bài test.
                </p>
              </div>

              {/* Grid 2 Cols: Question Type & Fitness Dimension */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">
                    Loại câu hỏi (Question Type)
                  </label>
                  <select
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                    className="w-full px-3.5 py-2.5 text-xs bg-background border border-border text-text-primary rounded-xl focus:ring-2 focus:ring-accent focus:outline-none font-medium"
                  >
                    {QUESTION_TYPE_CONFIGS.map((t) => (
                      <option key={t.type} value={t.type}>
                        {t.title} ({t.tag})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">
                    Chiều đo thể chất (Fitness Dimension)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FitnessDimension)}
                    className="w-full px-3.5 py-2.5 text-xs bg-background border border-border text-text-primary rounded-xl focus:ring-2 focus:ring-accent focus:outline-none font-medium"
                  >
                    {Object.values(FITNESS_DIMENSION_CONFIGS).map((dim) => (
                      <option key={dim.key} value={dim.key}>
                        {dim.label} ({dim.shortLabel})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  Mô tả mục đích khoa học thể thao
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="VD: Kiểm tra sức mạnh bộc phát và sức bền cơ ngực, vai trước và tay sau (Upper Body Push)..."
                  className="w-full px-3.5 py-2.5 text-xs bg-background border border-border text-text-primary rounded-xl focus:ring-2 focus:ring-accent focus:outline-none placeholder:text-text-secondary/50"
                />
              </div>

              {/* Instruction Text */}
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  Hướng dẫn thực hiện chuẩn Form & Lưu ý an toàn
                </label>
                <textarea
                  rows={2}
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="VD: Giữ thân người thẳng từ đầu đến gót, ngực chạm cách mặt sàn 5cm, khóa thẳng khuỷu tay ở đỉnh..."
                  className="w-full px-3.5 py-2.5 text-xs bg-background border border-border text-text-primary rounded-xl focus:ring-2 focus:ring-accent focus:outline-none placeholder:text-text-secondary/50"
                />
              </div>

              {/* Grid 3 cols: Unit, Default Weight, Required */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">
                    Đơn vị đo (Unit)
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="VD: reps, giây, cm, kg..."
                    className="w-full px-3 py-2 text-xs bg-background border border-border text-text-primary rounded-xl focus:ring-2 focus:ring-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">
                    Trọng số mặc định (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-background border border-border text-text-primary rounded-xl focus:ring-2 focus:ring-accent focus:outline-none font-bold text-center"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2.5 p-2.5 bg-surface-elevated/40 border border-border rounded-xl cursor-pointer hover:bg-surface-elevated transition-colors">
                    <input
                      type="checkbox"
                      checked={required}
                      onChange={(e) => setRequired(e.target.checked)}
                      className="rounded bg-background border-border text-accent focus:ring-accent w-4 h-4"
                    />
                    <span className="text-xs font-bold text-text-primary">Bắt buộc làm</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TYPE-SPECIFIC CONFIGURATION */}
          {activeTab === 'CONFIG' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* PERFORMANCE_TEST CONFIG */}
              {type === 'PERFORMANCE_TEST' && (
                <div className="space-y-4 p-4 rounded-2xl bg-surface-elevated/30 border border-border">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <Dumbbell className="w-4 h-4 text-accent" />
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Cấu hình Bài test Vận động Thể lực (Performance Test)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-text-primary mb-1.5">
                        Tên bài tập liên kết (Exercise Name)
                      </label>
                      <input
                        type="text"
                        value={exerciseName}
                        onChange={(e) => setExerciseName(e.target.value)}
                        placeholder="VD: Push Up (Hít đất), Plank, Pull Up..."
                        className="w-full px-3 py-2 text-xs bg-background border border-border text-text-primary rounded-xl focus:ring-2 focus:ring-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-primary mb-1.5">
                        Hình thức đo lường
                      </label>
                      <select
                        value={measurementType}
                        onChange={(e) => handleMeasurementTypeChange(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-background border border-border text-text-primary rounded-xl focus:ring-2 focus:ring-accent focus:outline-none font-medium"
                      >
                        <option value="REPETITIONS">Số lần lặp lại (Reps)</option>
                        <option value="HOLD_DURATION_SECONDS">Thời gian giữ đẳng trường (Seconds)</option>
                        <option value="DISTANCE_CM">Khoảng cách di chuyển (cm)</option>
                        <option value="WEIGHT_KG">Mức tạ / Cân nặng (kg)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-primary mb-1.5">
                        Giới hạn giá trị (Min - Max)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={perfMinValue}
                          onChange={(e) => setPerfMinValue(Number(e.target.value))}
                          placeholder="Min"
                          className="w-24 px-3 py-2 text-xs bg-background border border-border text-text-primary rounded-xl text-center font-bold"
                        />
                        <span className="text-xs text-text-secondary">đến</span>
                        <input
                          type="number"
                          value={perfMaxValue}
                          onChange={(e) => setPerfMaxValue(Number(e.target.value))}
                          placeholder="Max"
                          className="w-24 px-3 py-2 text-xs bg-background border border-border text-text-primary rounded-xl text-center font-bold"
                        />
                        <span className="text-xs font-semibold text-accent">{unit || 'reps'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-sky-400" /> Link Video hướng dẫn kỹ thuật (URL)
                      </label>
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full px-3 py-2 text-xs bg-background border border-border text-text-primary rounded-xl focus:ring-2 focus:ring-accent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SINGLE/MULTIPLE CHOICE CONFIG */}
              {(type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'YES_NO') && (
                <div className="space-y-4 p-4 rounded-2xl bg-surface-elevated/30 border border-border">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-accent" />
                      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        Danh sách Lựa chọn & Điểm số quy đổi
                      </h4>
                    </div>
                    {type !== 'YES_NO' && (
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="px-3 py-1 text-xs font-bold text-accent bg-accent/10 border border-accent/20 rounded-xl hover:bg-accent hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> + Thêm lựa chọn
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {options.map((opt, idx) => (
                      <div
                        key={opt.id || idx}
                        className="p-3 rounded-xl bg-surface border border-border flex items-center gap-3"
                      >
                        <span className="w-6 h-6 rounded-lg bg-surface-elevated border border-border text-xs font-bold text-text-primary flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => handleUpdateOption(idx, 'label', e.target.value)}
                            placeholder="Nhãn lựa chọn (VD: 1 - 5 lần)"
                            className="w-full px-3 py-1.5 text-xs bg-background border border-border text-text-primary rounded-lg focus:ring-1 focus:ring-accent font-medium"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-bold text-text-secondary">Điểm:</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={opt.score}
                            onChange={(e) => handleUpdateOption(idx, 'score', Number(e.target.value))}
                            className="w-16 px-2 py-1.5 text-xs font-bold text-center bg-background border border-border text-emerald-400 rounded-lg"
                          />
                          <span className="text-[11px] text-text-secondary">pts</span>
                        </div>

                        {type !== 'YES_NO' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="p-1.5 text-text-secondary hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Xóa lựa chọn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MEASUREMENT CONFIG */}
              {type === 'MEASUREMENT' && (
                <div className="space-y-4 p-4 rounded-2xl bg-surface-elevated/30 border border-border">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <Scale className="w-4 h-4 text-accent" />
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Cấu hình Đo lường Chỉ số Thể chất (Measurement)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-text-primary mb-1.5">
                        Tên chỉ số (Metric Name)
                      </label>
                      <input
                        type="text"
                        value={metricName}
                        onChange={(e) => setMetricName(e.target.value)}
                        placeholder="VD: Sải tay ngang (Wingspan), Vòng eo..."
                        className="w-full px-3 py-2 text-xs bg-background border border-border text-text-primary rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-primary mb-1.5">
                        Khoảng đo hợp lệ (Min - Max)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={measureMinValue}
                          onChange={(e) => setMeasureMinValue(Number(e.target.value))}
                          className="w-24 px-3 py-2 text-xs bg-background border border-border text-text-primary rounded-xl text-center font-bold"
                        />
                        <span className="text-xs text-text-secondary">đến</span>
                        <input
                          type="number"
                          value={measureMaxValue}
                          onChange={(e) => setMeasureMaxValue(Number(e.target.value))}
                          className="w-24 px-3 py-2 text-xs bg-background border border-border text-text-primary rounded-xl text-center font-bold"
                        />
                        <span className="text-xs font-semibold text-accent">{unit || 'cm'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RATING SCALE CONFIG */}
              {type === 'RATING_SCALE' && (
                <div className="space-y-4 p-4 rounded-2xl bg-surface-elevated/30 border border-border">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <Sliders className="w-4 h-4 text-accent" />
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Cấu hình Thang đánh giá cảm nhận (Rating Scale)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-text-primary mb-1.5">Thang điểm (Min - Max)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={minScale}
                          onChange={(e) => setMinScale(Number(e.target.value))}
                          className="w-16 px-2 py-1.5 text-xs bg-background border border-border text-text-primary rounded-lg text-center font-bold"
                        />
                        <span className="text-xs text-text-secondary">đến</span>
                        <input
                          type="number"
                          value={maxScale}
                          onChange={(e) => setMaxScale(Number(e.target.value))}
                          className="w-16 px-2 py-1.5 text-xs bg-background border border-border text-text-primary rounded-lg text-center font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-primary mb-1.5">Nhãn mức thấp nhất</label>
                      <input
                        type="text"
                        value={minLabel}
                        onChange={(e) => setMinLabel(e.target.value)}
                        placeholder="VD: Rất mệt"
                        className="w-full px-3 py-1.5 text-xs bg-background border border-border text-text-primary rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-primary mb-1.5">Nhãn mức cao nhất</label>
                      <input
                        type="text"
                        value={maxLabel}
                        onChange={(e) => setMaxLabel(e.target.value)}
                        placeholder="VD: Rất sung sức"
                        className="w-full px-3 py-1.5 text-xs bg-background border border-border text-text-primary rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SCORING RULES & SIMULATOR */}
          {activeTab === 'SCORING' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-surface-elevated/30 border border-border space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Bảng Quy đổi Điểm số (0 - 100 điểm)
                    </h4>
                    <p className="text-[11px] text-text-secondary">
                      Chuyển đổi kết quả số thực tế ({unit || 'reps'}) thành điểm chuẩn hóa.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-bold hover:bg-accent hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Thêm mốc quy đổi
                  </button>
                </div>

                {/* Rules Table */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-elevated/70 border-b border-border text-text-secondary font-bold">
                      <tr>
                        <th className="p-3">Toán tử so sánh</th>
                        <th className="p-3">Dải giá trị ({unit || 'reps'})</th>
                        <th className="p-3 text-center">Điểm số chuẩn (0 - 100)</th>
                        <th className="p-3 text-right">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {scoringRules.map((rule, rIdx) => (
                        <tr key={rule.id || rIdx} className="hover:bg-surface-elevated/30">
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

                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={rule.score}
                                onChange={(e) => handleUpdateRule(rIdx, 'score', Number(e.target.value))}
                                className="w-16 px-2 py-1 bg-background border border-border text-emerald-400 font-bold text-center rounded-lg"
                              />
                              <span className="text-[11px] font-semibold text-text-secondary">pts</span>
                            </div>
                          </td>

                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveRule(rIdx)}
                              className="p-1 text-text-secondary hover:text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Interactive Simulator */}
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-accent fill-accent" />
                    <h5 className="text-xs font-bold text-accent uppercase tracking-wider">
                      Mô phỏng Thử nghiệm Điểm số
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-surface p-3.5 rounded-xl border border-border">
                    <div>
                      <label className="block text-xs font-bold text-text-primary mb-1">
                        Nhập thử kết quả:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={testSimValue}
                          onChange={(e) => setTestSimValue(Number(e.target.value))}
                          className="w-24 px-3 py-1.5 text-sm font-bold bg-background border border-border text-text-primary rounded-xl text-center focus:ring-2 focus:ring-accent"
                        />
                        <span className="text-xs font-semibold text-accent">{unit || 'reps'}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-bold text-text-secondary">Điểm quy đổi:</span>
                        <span className="text-xl font-bold text-accent">
                          {simScore} <span className="text-xs font-normal text-text-secondary">/ 100 pts</span>
                        </span>
                      </div>
                      <div className="w-full bg-background h-2 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-accent h-full rounded-full transition-all duration-300"
                          style={{ width: `${simScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border mt-4">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Info className="w-4 h-4 text-accent" />
              <span>Câu hỏi được lưu sẽ có thể sử dụng ngay trong tất cả bài test đánh giá.</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-strong rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isEditing ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi vào Ngân hàng'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
