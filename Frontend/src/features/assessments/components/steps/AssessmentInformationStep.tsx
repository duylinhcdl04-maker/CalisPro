import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Sparkles,
  Info,
  Target,
  Clock,
  Tag,
  Plus,
  Settings,
  Edit3,
  Trash2,
} from 'lucide-react';
import { AssessmentFormData } from '../../schemas/assessmentSchema';
import { AssessmentTypeConfig, ASSESSMENT_TYPE_CONFIGS } from '../../constants/assessmentTypes';
import { AssessmentTypeCrudModal } from '../types/AssessmentTypeCrudModal';
import { TargetAudienceCrudModal } from '../types/TargetAudienceCrudModal';
import {
  assessmentsApi,
  TargetLevelConfig,
  TrainingGoalConfig,
  DEFAULT_TARGET_LEVELS,
  DEFAULT_TRAINING_GOALS,
} from '../../api/assessmentsApi';
import { toast } from 'sonner';

export const AssessmentInformationStep: React.FC = () => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<AssessmentFormData>();

  const selectedType = watch('type');
  const selectedLevels = watch('targetAudience.fitnessLevels') || [];
  const selectedGoals = watch('targetAudience.goals') || [];
  const tags = watch('tags') || [];

  // Assessment Types State & CRUD Modal
  const [typesList, setTypesList] = useState<AssessmentTypeConfig[]>(ASSESSMENT_TYPE_CONFIGS);
  const [isTypeCrudModalOpen, setIsTypeCrudModalOpen] = useState(false);
  const [editTypeItem, setEditTypeItem] = useState<AssessmentTypeConfig | null>(null);

  // Target Levels & Goals State & CRUD Modal
  const [targetLevelsList, setTargetLevelsList] = useState<TargetLevelConfig[]>(DEFAULT_TARGET_LEVELS);
  const [trainingGoalsList, setTrainingGoalsList] = useState<TrainingGoalConfig[]>(DEFAULT_TRAINING_GOALS);
  const [isAudienceModalOpen, setIsAudienceModalOpen] = useState(false);
  const [audienceModalTab, setAudienceModalTab] = useState<'LEVELS' | 'GOALS'>('LEVELS');
  const [editAudienceItem, setEditAudienceItem] = useState<{
    type: 'LEVEL' | 'GOAL';
    item: TargetLevelConfig | TrainingGoalConfig;
  } | null>(null);

  // Bài đánh giá ban đầu áp dụng cho mọi người dùng mới: điền đủ cấp độ và mục tiêu để dữ liệu hợp lệ (không còn bắt người soạn chọn)
  useEffect(() => {
    if (selectedType !== 'INITIAL') return;
    setValue('targetAudience.fitnessLevels', ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE'], { shouldValidate: true });
    setValue('targetAudience.goals', ['GENERAL_FITNESS', 'STRENGTH', 'MUSCLE_BUILDING', 'SKILL', 'MOBILITY', 'ENDURANCE'], { shouldValidate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  useEffect(() => {
    Promise.all([
      assessmentsApi.getAssessmentTypes(),
      assessmentsApi.getTargetLevels(),
      assessmentsApi.getTrainingGoals(),
    ]).then(([types, levels, goals]) => {
      if (types && types.length > 0) setTypesList(types);
      if (levels && levels.length > 0) setTargetLevelsList(levels);
      if (goals && goals.length > 0) setTrainingGoalsList(goals);
    });
  }, []);

  const handleLevelToggle = (levelCode: string) => {
    const exists = selectedLevels.includes(levelCode as any);
    const updated = exists
      ? selectedLevels.filter((l) => l !== levelCode)
      : [...selectedLevels, levelCode as any];
    setValue('targetAudience.fitnessLevels', updated, { shouldValidate: true });
  };

  const handleGoalToggle = (goalCode: string) => {
    const exists = selectedGoals.includes(goalCode as any);
    const updated = exists
      ? selectedGoals.filter((g) => g !== goalCode)
      : [...selectedGoals, goalCode as any];
    setValue('targetAudience.goals', updated, { shouldValidate: true });
  };

  const [tagInput, setTagInput] = React.useState('');

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue('tags', [...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      'tags',
      tags.filter((t) => t !== tagToRemove)
    );
  };

  const handleOpenCreateType = () => {
    setEditTypeItem(null);
    setIsTypeCrudModalOpen(true);
  };

  const handleOpenEditType = (e: React.MouseEvent, typeConfig: AssessmentTypeConfig) => {
    e.stopPropagation();
    setEditTypeItem(typeConfig);
    setIsTypeCrudModalOpen(true);
  };

  const handleDeleteTypeQuick = async (e: React.MouseEvent, typeCode: string) => {
    e.stopPropagation();
    if (typesList.length <= 1) {
      toast.error('Cần giữ lại ít nhất 1 loại bài đánh giá.');
      return;
    }
    try {
      const updated = await assessmentsApi.deleteAssessmentType(typeCode);
      setTypesList(updated);
      toast.success('Đã xóa loại bài đánh giá.');
      if (selectedType === typeCode && updated.length > 0) {
        setValue('type', updated[0].type as any, { shouldValidate: true });
      }
    } catch {
      toast.error('Không thể xóa loại bài.');
    }
  };

  // Audience Quick Handlers
  const handleOpenCreateLevel = () => {
    setAudienceModalTab('LEVELS');
    setEditAudienceItem(null);
    setIsAudienceModalOpen(true);
  };

  const handleOpenEditLevel = (e: React.MouseEvent, lvl: TargetLevelConfig) => {
    e.stopPropagation();
    setAudienceModalTab('LEVELS');
    setEditAudienceItem({ type: 'LEVEL', item: lvl });
    setIsAudienceModalOpen(true);
  };

  const handleDeleteLevelQuick = async (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    if (targetLevelsList.length <= 1) {
      toast.error('Phải giữ lại ít nhất 1 cấp độ.');
      return;
    }
    try {
      const updated = await assessmentsApi.deleteTargetLevel(code);
      setTargetLevelsList(updated);
      toast.success('Đã xóa cấp độ thể lực.');
      setValue(
        'targetAudience.fitnessLevels',
        selectedLevels.filter((l) => l !== code)
      );
    } catch {
      toast.error('Không thể xóa.');
    }
  };

  const handleOpenCreateGoal = () => {
    setAudienceModalTab('GOALS');
    setEditAudienceItem(null);
    setIsAudienceModalOpen(true);
  };

  const handleOpenEditGoal = (e: React.MouseEvent, goal: TrainingGoalConfig) => {
    e.stopPropagation();
    setAudienceModalTab('GOALS');
    setEditAudienceItem({ type: 'GOAL', item: goal });
    setIsAudienceModalOpen(true);
  };

  const handleDeleteGoalQuick = async (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    if (trainingGoalsList.length <= 1) {
      toast.error('Phải giữ lại ít nhất 1 mục tiêu.');
      return;
    }
    try {
      const updated = await assessmentsApi.deleteTrainingGoal(code);
      setTrainingGoalsList(updated);
      toast.success('Đã xóa mục tiêu luyện tập.');
      setValue(
        'targetAudience.goals',
        selectedGoals.filter((g) => g !== code)
      );
    } catch {
      toast.error('Không thể xóa.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">01. Thông tin cơ bản bài đánh giá</h2>
            <p className="text-xs text-text-secondary">
              Thiết lập danh tính, mục đích đánh giá và đối tượng học viên mục tiêu.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          {/* Internal System Name */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              Tên hệ thống (System Identifier) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="VD: Initial Fitness Assessment"
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:ring-2 focus:ring-accent focus:outline-none text-text-primary placeholder:text-text-secondary/50"
            />
            {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
            <p className="text-[11px] text-text-secondary mt-1">Dùng để phân loại nội bộ và đồng bộ API.</p>
          </div>

          {/* User Display Name */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              Tên hiển thị học viên (Display Name) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              {...register('displayName')}
              placeholder="VD: Đánh giá Thể lực & Sức khỏe Ban đầu"
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:ring-2 focus:ring-accent focus:outline-none text-text-primary placeholder:text-text-secondary/50"
            />
            {errors.displayName && (
              <p className="text-xs text-rose-400 mt-1">{errors.displayName.message}</p>
            )}
            <p className="text-[11px] text-text-secondary mt-1">Tên bài test học viên nhìn thấy trên ứng dụng.</p>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              Mô tả mục đích & khoa học bài test <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Mô tả chi tiết bài đánh giá kiểm tra các khía cạnh thể lực nào, phương pháp chuẩn khoa học thể thao..."
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:ring-2 focus:ring-accent focus:outline-none text-text-primary placeholder:text-text-secondary/50"
            />
            {errors.description && (
              <p className="text-xs text-rose-400 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Estimated Duration */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              Thời lượng dự kiến (phút) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                {...register('estimatedDuration', { valueAsNumber: true })}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:ring-2 focus:ring-accent focus:outline-none text-text-primary"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-secondary">
                phút
              </span>
            </div>
            {errors.estimatedDuration && (
              <p className="text-xs text-rose-400 mt-1">{errors.estimatedDuration.message}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-accent" />
              Thẻ phân loại (Tags)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Nhập tag rồi ấn Enter (VD: Onboarding)"
                className="flex-1 px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:ring-2 focus:ring-accent focus:outline-none text-text-primary placeholder:text-text-secondary/50"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3.5 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-bold hover:bg-accent hover:text-white transition-colors"
              >
                + Thêm
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 text-accent border border-accent/20 text-xs font-semibold"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-400 font-bold ml-1 text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Type Cards with CRUD actions */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">Loại bài đánh giá thể lực</h3>
                <span className="text-[11px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
                  {typesList.length} loại bài
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                Lựa chọn đúng mục đích phân loại hoặc tạo mới/chỉnh sửa danh mục loại bài test.
              </p>
            </div>
          </div>

          {/* CRUD Management Buttons next to header */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditTypeItem(null);
                setIsTypeCrudModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-surface-elevated/60 hover:bg-surface-elevated text-text-secondary hover:text-text-primary border border-border text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-accent" />
              Quản lý danh mục
            </button>

            <button
              type="button"
              onClick={handleOpenCreateType}
              className="px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-strong text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              + Thêm loại bài mới
            </button>
          </div>
        </div>

        {/* Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {typesList.map((t) => {
            const isSelected = selectedType === t.type;
            return (
              <div
                key={t.type}
                onClick={() => {
                  setValue('type', t.type as any, { shouldValidate: true });
                  if (!watch('estimatedDuration')) {
                    setValue('estimatedDuration', t.suggestedDurationMinutes);
                  }
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between group relative ${
                  isSelected
                    ? 'border-accent bg-accent/10 shadow-sm ring-1 ring-accent'
                    : 'border-border bg-surface-elevated/30 hover:border-accent/40 hover:bg-surface-elevated/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-accent uppercase tracking-wider">
                      {t.badge}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Quick Edit button */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditType(e, t)}
                        className="p-1 rounded-md text-text-secondary hover:text-accent hover:bg-surface-elevated transition-colors opacity-0 group-hover:opacity-100"
                        title="Chỉnh sửa loại bài này"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Quick Delete button (if not the only one) */}
                      {typesList.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTypeQuick(e, t.type)}
                          className="p-1 rounded-md text-text-secondary hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Xóa loại bài này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-accent bg-accent' : 'border-border'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-text-primary mb-1">{t.title}</h4>
                  <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border text-[11px] font-semibold text-text-secondary flex items-center justify-between">
                  <span>Thời lượng: ~{t.suggestedDurationMinutes} phút</span>
                  <span className="text-[10px] text-text-secondary font-mono">{t.type}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bài đánh giá ban đầu: người làm bài chưa có level nên không có "đối tượng theo cấp độ" để chọn */}
      {selectedType === 'INITIAL' ? (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
          <h3 className="flex items-center gap-2 text-base font-bold text-text-primary"><Target className="h-5 w-5 text-accent" /> Đối tượng: mọi người dùng mới</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Bài đánh giá ban đầu dành cho người chưa có level, nên không giới hạn theo cấp độ hay mục tiêu. Cấp độ và mục tiêu của người làm bài được xác định
            từ chính câu trả lời trong bài này.
          </p>
        </div>
      ) : (
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">Đối tượng áp dụng (Target Users)</h3>
                <span className="text-[11px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
                  {targetLevelsList.length} Cấp độ • {trainingGoalsList.length} Mục tiêu
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                Chỉ định các cấp độ và mục tiêu luyện tập mà bài đánh giá này nhắm tới.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAudienceModalTab('LEVELS');
                setEditAudienceItem(null);
                setIsAudienceModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-surface-elevated/60 hover:bg-surface-elevated text-text-secondary hover:text-text-primary border border-border text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-accent" />
              Quản lý Cấp độ & Mục tiêu
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {/* Target Fitness Levels with CRUD */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-text-primary">
                Cấp độ thể lực áp dụng:
              </label>
              <button
                type="button"
                onClick={handleOpenCreateLevel}
                className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> + Thêm cấp độ
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {targetLevelsList.map((lvl) => {
                const checked = selectedLevels.includes(lvl.code as any);
                return (
                  <div
                    key={lvl.code}
                    onClick={() => handleLevelToggle(lvl.code)}
                    className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between group cursor-pointer ${
                      checked
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'bg-surface-elevated/30 border-border text-text-secondary hover:bg-surface-elevated'
                    }`}
                  >
                    <span className="truncate pr-1">{lvl.label}</span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Hover Edit */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditLevel(e, lvl)}
                        className="p-1 rounded text-text-secondary hover:text-accent hover:bg-surface-elevated opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Sửa cấp độ"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Hover Delete */}
                      {targetLevelsList.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteLevelQuick(e, lvl.code)}
                          className="p-1 rounded text-text-secondary hover:text-rose-400 hover:bg-surface-elevated opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Xóa cấp độ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="rounded bg-background border-border text-accent focus:ring-accent"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Goals with CRUD */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-text-primary">
                Mục tiêu luyện tập phù hợp:
              </label>
              <button
                type="button"
                onClick={handleOpenCreateGoal}
                className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> + Thêm mục tiêu
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {trainingGoalsList.map((goal) => {
                const checked = selectedGoals.includes(goal.code as any);
                return (
                  <div
                    key={goal.code}
                    onClick={() => handleGoalToggle(goal.code)}
                    className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between group cursor-pointer ${
                      checked
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'bg-surface-elevated/30 border-border text-text-secondary hover:bg-surface-elevated'
                    }`}
                  >
                    <span className="truncate pr-1">{goal.label}</span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Hover Edit */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditGoal(e, goal)}
                        className="p-1 rounded text-text-secondary hover:text-accent hover:bg-surface-elevated opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Sửa mục tiêu"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Hover Delete */}
                      {trainingGoalsList.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteGoalQuick(e, goal.code)}
                          className="p-1 rounded text-text-secondary hover:text-rose-400 hover:bg-surface-elevated opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Xóa mục tiêu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="rounded bg-background border-border text-accent focus:ring-accent"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* CRUD Modal for Assessment Types */}
      <AssessmentTypeCrudModal
        isOpen={isTypeCrudModalOpen}
        onClose={() => {
          setIsTypeCrudModalOpen(false);
          setEditTypeItem(null);
        }}
        onTypesUpdated={(newTypes) => setTypesList(newTypes)}
        initialEditType={editTypeItem}
      />

      {/* CRUD Modal for Target Audience (Levels & Goals) */}
      <TargetAudienceCrudModal
        isOpen={isAudienceModalOpen}
        onClose={() => {
          setIsAudienceModalOpen(false);
          setEditAudienceItem(null);
        }}
        activeTab={audienceModalTab}
        onLevelsUpdated={(newLevels) => setTargetLevelsList(newLevels)}
        onGoalsUpdated={(newGoals) => setTrainingGoalsList(newGoals)}
        initialEditItem={editAudienceItem}
      />
    </div>
  );
};
