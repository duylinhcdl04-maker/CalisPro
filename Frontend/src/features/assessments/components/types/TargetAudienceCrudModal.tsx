import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit3,
  Trash2,
  Target,
  Dumbbell,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { TargetLevelConfig, TrainingGoalConfig, assessmentsApi } from '../../api/assessmentsApi';
import { toast } from 'sonner';

interface TargetAudienceCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: 'LEVELS' | 'GOALS';
  onLevelsUpdated: (levels: TargetLevelConfig[]) => void;
  onGoalsUpdated: (goals: TrainingGoalConfig[]) => void;
  initialEditItem?: { type: 'LEVEL' | 'GOAL'; item: TargetLevelConfig | TrainingGoalConfig } | null;
}

export const TargetAudienceCrudModal: React.FC<TargetAudienceCrudModalProps> = ({
  isOpen,
  onClose,
  activeTab = 'LEVELS',
  onLevelsUpdated,
  onGoalsUpdated,
  initialEditItem = null,
}) => {
  const [tab, setTab] = useState<'LEVELS' | 'GOALS'>(activeTab);
  const [levels, setLevels] = useState<TargetLevelConfig[]>([]);
  const [goals, setGoals] = useState<TrainingGoalConfig[]>([]);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formLabel, setFormLabel] = useState('');

  const loadData = async () => {
    const [lvlList, goalList] = await Promise.all([
      assessmentsApi.getTargetLevels(),
      assessmentsApi.getTrainingGoals(),
    ]);
    setLevels(lvlList);
    setGoals(goalList);
    onLevelsUpdated(lvlList);
    onGoalsUpdated(goalList);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setTab(activeTab);
      if (initialEditItem) {
        setTab(initialEditItem.type === 'LEVEL' ? 'LEVELS' : 'GOALS');
        startEdit(initialEditItem.item);
      } else {
        resetForm();
      }
    }
  }, [isOpen, activeTab, initialEditItem]);

  if (!isOpen) return null;

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingCode(null);
    setFormCode('');
    setFormLabel('');
  };

  const startCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const startEdit = (item: TargetLevelConfig | TrainingGoalConfig) => {
    setEditingCode(item.code);
    setFormCode(item.code);
    setFormLabel(item.label);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) {
      toast.error('Vui lòng nhập tên hiển thị.');
      return;
    }

    const code = editingCode || (formCode.trim().toUpperCase().replace(/\s+/g, '_') || `CUSTOM_${Date.now()}`);

    try {
      if (tab === 'LEVELS') {
        const updated = await assessmentsApi.saveTargetLevel({
          code,
          label: formLabel.trim(),
        });
        setLevels(updated);
        onLevelsUpdated(updated);
        toast.success(editingCode ? 'Đã cập nhật cấp độ thể lực!' : 'Đã thêm cấp độ thể lực mới!');
      } else {
        const updated = await assessmentsApi.saveTrainingGoal({
          code,
          label: formLabel.trim(),
        });
        setGoals(updated);
        onGoalsUpdated(updated);
        toast.success(editingCode ? 'Đã cập nhật mục tiêu luyện tập!' : 'Đã thêm mục tiêu luyện tập mới!');
      }
      resetForm();
    } catch {
      toast.error('Có lỗi xảy ra khi lưu.');
    }
  };

  const handleDelete = async (code: string) => {
    try {
      if (tab === 'LEVELS') {
        if (levels.length <= 1) {
          toast.error('Phải giữ lại ít nhất 1 cấp độ.');
          return;
        }
        const updated = await assessmentsApi.deleteTargetLevel(code);
        setLevels(updated);
        onLevelsUpdated(updated);
        toast.success('Đã xóa cấp độ.');
      } else {
        if (goals.length <= 1) {
          toast.error('Phải giữ lại ít nhất 1 mục tiêu.');
          return;
        }
        const updated = await assessmentsApi.deleteTrainingGoal(code);
        setGoals(updated);
        onGoalsUpdated(updated);
        toast.success('Đã xóa mục tiêu.');
      }
      if (editingCode === code) resetForm();
    } catch {
      toast.error('Không thể xóa.');
    }
  };

  const handleResetDefaults = async () => {
    try {
      if (tab === 'LEVELS') {
        const res = await assessmentsApi.resetTargetLevels();
        setLevels(res);
        onLevelsUpdated(res);
        toast.success('Đã khôi phục các cấp độ mặc định.');
      } else {
        const res = await assessmentsApi.resetTrainingGoals();
        setGoals(res);
        onGoalsUpdated(res);
        toast.success('Đã khôi phục các mục tiêu mặc định.');
      }
      resetForm();
    } catch {
      toast.error('Không thể khôi phục mặc định.');
    }
  };

  const currentList = tab === 'LEVELS' ? levels : goals;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-border animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Quản lý Đối tượng Áp dụng (Target Audience)
              </h3>
              <p className="text-xs text-text-secondary">
                Thêm mới, sửa đổi hoặc tùy biến các Cấp độ thể lực và Mục tiêu luyện tập trong hệ thống.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 pt-4 border-b border-border bg-surface flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setTab('LEVELS');
              resetForm();
            }}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              tab === 'LEVELS'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Cấp độ thể lực áp dụng ({levels.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('GOALS');
              resetForm();
            }}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              tab === 'GOALS'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            Mục tiêu luyện tập phù hợp ({goals.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              Danh sách các {tab === 'LEVELS' ? 'cấp độ' : 'mục tiêu'} có sẵn trong hệ thống:
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Khôi phục mặc định
              </button>

              <button
                type="button"
                onClick={startCreate}
                className="px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-strong text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> + Thêm {tab === 'LEVELS' ? 'cấp độ' : 'mục tiêu'} mới
              </button>
            </div>
          </div>

          {/* Inline Form */}
          {isFormOpen && (
            <form
              onSubmit={handleSave}
              className="p-4 rounded-2xl bg-accent/5 border border-accent/30 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-2 border-b border-accent/20">
                <h4 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4" />
                  {editingCode
                    ? `Chỉnh sửa ${tab === 'LEVELS' ? 'cấp độ' : 'mục tiêu'}`
                    : `Thêm ${tab === 'LEVELS' ? 'cấp độ' : 'mục tiêu'} mới`}
                </h4>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-text-secondary hover:text-text-primary"
                >
                  Đóng
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Mã định danh (Code Identifier)
                  </label>
                  <input
                    type="text"
                    disabled={!!editingCode}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="VD: ADVANCED_PLUS"
                    className="w-full px-3 py-2 text-xs bg-background border border-border text-text-primary rounded-xl focus:ring-2 focus:ring-accent disabled:opacity-50 uppercase font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Tên hiển thị <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="VD: Advanced Plus (Cao cấp nâng cao)"
                    className="w-full px-3 py-2 text-xs bg-background border border-border text-text-primary rounded-xl focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-accent hover:bg-accent-strong rounded-xl shadow-sm"
                >
                  {editingCode ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
              </div>
            </form>
          )}

          {/* List items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentList.map((item) => (
              <div
                key={item.code}
                className="p-3.5 rounded-2xl bg-surface-elevated/40 border border-border hover:border-accent/40 hover:bg-surface-elevated transition-all flex items-center justify-between"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <h4 className="text-xs font-bold text-text-primary truncate">{item.label}</h4>
                  <span className="text-[10px] text-text-secondary font-mono block mt-0.5">
                    Mã: {item.code}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.code)}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface-elevated/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-strong rounded-xl transition-colors shadow-sm"
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
