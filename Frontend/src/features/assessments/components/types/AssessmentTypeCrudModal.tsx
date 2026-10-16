import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  RefreshCw,
  Dumbbell,
  Flame,
  Activity,
  Award,
  Sliders,
  HeartPulse,
  Target,
  Zap,
  Shield,
  Compass,
  Check,
  RotateCcw,
} from 'lucide-react';
import { AssessmentTypeConfig } from '../../constants/assessmentTypes';
import { assessmentsApi } from '../../api/assessmentsApi';
import { toast } from 'sonner';

interface AssessmentTypeCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTypesUpdated: (types: AssessmentTypeConfig[]) => void;
  initialEditType?: AssessmentTypeConfig | null;
}

const AVAILABLE_ICONS: { name: string; label: string; icon: any }[] = [
  { name: 'Sparkles', label: 'Sparkles (Tỏa sáng / Mới)', icon: Sparkles },
  { name: 'RefreshCw', label: 'Refresh (Định kỳ / Vòng lặp)', icon: RefreshCw },
  { name: 'Dumbbell', label: 'Dumbbell (Sức mạnh)', icon: Dumbbell },
  { name: 'Flame', label: 'Flame (Sức bền / Năng lượng)', icon: Flame },
  { name: 'Activity', label: 'Activity (Linh hoạt / Hoạt động)', icon: Activity },
  { name: 'Award', label: 'Award (Kỹ năng / Cột mốc)', icon: Award },
  { name: 'Sliders', label: 'Sliders (Tùy chỉnh)', icon: Sliders },
  { name: 'HeartPulse', label: 'HeartPulse (Tim mạch / Cardio)', icon: HeartPulse },
  { name: 'Zap', label: 'Zap (Bộc phát / Tốc độ)', icon: Zap },
  { name: 'Shield', label: 'Shield (Phòng hộ / Cốt lõi)', icon: Shield },
  { name: 'Target', label: 'Target (Mục tiêu chuẩn)', icon: Target },
  { name: 'Compass', label: 'Compass (Định hướng)', icon: Compass },
];

export const AssessmentTypeCrudModal: React.FC<AssessmentTypeCrudModalProps> = ({
  isOpen,
  onClose,
  onTypesUpdated,
  initialEditType = null,
}) => {
  const [typesList, setTypesList] = useState<AssessmentTypeConfig[]>([]);
  const [editingItem, setEditingItem] = useState<AssessmentTypeConfig | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [typeCode, setTypeCode] = useState('');
  const [title, setTitle] = useState('');
  const [badge, setBadge] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(10);
  const [iconName, setIconName] = useState('Sparkles');

  const loadTypes = async () => {
    const list = await assessmentsApi.getAssessmentTypes();
    setTypesList(list);
    onTypesUpdated(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadTypes();
      if (initialEditType) {
        startEdit(initialEditType);
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialEditType]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingItem(null);
    setTypeCode('');
    setTitle('');
    setBadge('');
    setDescription('');
    setDuration(10);
    setIconName('Sparkles');
    setIsFormOpen(false);
  };

  const startEdit = (item: AssessmentTypeConfig) => {
    setEditingItem(item);
    setTypeCode(item.type);
    setTitle(item.title);
    setBadge(item.badge);
    setDescription(item.description);
    setDuration(item.suggestedDurationMinutes || 10);
    setIconName(item.iconName || 'Sparkles');
    setIsFormOpen(true);
  };

  const startCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !badge.trim() || !description.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin loại bài đánh giá.');
      return;
    }

    const code = editingItem ? editingItem.type : (typeCode.trim().toUpperCase().replace(/\s+/g, '_') || `CUSTOM_${Date.now()}`);

    const newConfig: AssessmentTypeConfig = {
      type: code,
      title: title.trim(),
      badge: badge.trim(),
      description: description.trim(),
      iconName,
      suggestedDurationMinutes: Number(duration) || 10,
      isSystem: editingItem?.isSystem ?? false,
    };

    try {
      const updated = await assessmentsApi.saveAssessmentType(newConfig);
      setTypesList(updated);
      onTypesUpdated(updated);
      toast.success(editingItem ? 'Đã cập nhật loại bài đánh giá!' : 'Đã thêm loại bài đánh giá mới!');
      resetForm();
    } catch {
      toast.error('Có lỗi xảy ra khi lưu.');
    }
  };

  const handleDelete = async (type: string) => {
    if (typesList.length <= 1) {
      toast.error('Hệ thống phải có ít nhất 1 loại bài đánh giá.');
      return;
    }
    try {
      const updated = await assessmentsApi.deleteAssessmentType(type);
      setTypesList(updated);
      onTypesUpdated(updated);
      toast.success('Đã xóa loại bài đánh giá.');
      if (editingItem?.type === type) resetForm();
    } catch {
      toast.error('Không thể xóa loại bài.');
    }
  };

  const handleResetDefaults = async () => {
    try {
      const defaults = await assessmentsApi.resetAssessmentTypes();
      setTypesList(defaults);
      onTypesUpdated(defaults);
      toast.success('Đã khôi phục các loại bài đánh giá mặc định ban đầu.');
      resetForm();
    } catch {
      toast.error('Không thể khôi phục mặc định.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-border animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-elevated/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Quản lý Danh mục Loại bài Đánh giá Thể lực (Assessment Types)
              </h3>
              <p className="text-xs text-text-secondary">
                Thêm mới, chỉnh sửa thông tin, nhãn hiển thị và thời lượng khuyến nghị của các loại bài test.
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

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Actions: Add New / Reset */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-primary">
                Hiện có {typesList.length} loại bài đánh giá
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Khôi phục mặc định
              </button>

              <button
                type="button"
                onClick={startCreate}
                className="px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-strong text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> + Thêm loại bài mới
              </button>
            </div>
          </div>

          {/* Form Editor (if opened) */}
          {isFormOpen && (
            <form
              onSubmit={handleSave}
              className="p-5 rounded-2xl bg-surface-elevated/40 border-2 border-accent/40 space-y-4 animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h4 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4" />
                  {editingItem ? `Chỉnh sửa loại bài: ${editingItem.title}` : 'Tạo loại bài đánh giá mới'}
                </h4>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  Đóng form
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Code Identifier */}
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Mã định danh (Type Code) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!!editingItem}
                    value={typeCode}
                    onChange={(e) => setTypeCode(e.target.value)}
                    placeholder="VD: CARDIO_ENDURANCE"
                    className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:border-accent disabled:opacity-60 uppercase font-semibold text-text-primary focus:outline-none"
                  />
                  <p className="text-[10px] text-text-secondary mt-0.5">Dùng trong database & code</p>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Tên loại bài test <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Đánh giá Sức bền Tim mạch"
                    className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:border-accent text-text-primary focus:outline-none"
                  />
                </div>

                {/* Badge */}
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Badge thẻ (Header Tag) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="VD: Cardio & VO2Max"
                    className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:border-accent text-text-primary focus:outline-none"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Thời lượng khuyến nghị (phút)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:border-accent text-text-primary focus:outline-none"
                  />
                </div>

                {/* Icon Picker */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Biểu tượng Icon
                  </label>
                  <select
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic.name} value={ic.name}>
                        {ic.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Mô tả chi tiết mục đích loại bài đánh giá <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả mục tiêu của loại bài đánh giá này và trường hợp sử dụng..."
                    className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:border-accent text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-strong rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingItem ? 'Lưu cập nhật' : 'Thêm vào danh sách'}
                </button>
              </div>
            </form>
          )}

          {/* Types List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {typesList.map((t) => {
              const matchedIcon = AVAILABLE_ICONS.find((i) => i.name === t.iconName)?.icon || Sparkles;
              const IconComp = matchedIcon;

              return (
                <div
                  key={t.type}
                  className="p-4 rounded-2xl bg-surface border border-border shadow-xs hover:border-accent/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-accent uppercase tracking-wider bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
                        {t.badge}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(t)}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-surface-elevated transition-colors cursor-pointer"
                          title="Chỉnh sửa loại bài này"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.type)}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Xóa loại bài này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent shrink-0">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-text-primary">{t.title}</h4>
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-2 mt-1.5 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-text-secondary">
                    <span>Mã: <strong className="text-text-primary font-mono">{t.type}</strong></span>
                    <span>~{t.suggestedDurationMinutes} phút</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface-elevated/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-strong rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
