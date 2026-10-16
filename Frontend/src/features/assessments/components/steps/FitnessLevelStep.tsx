import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  TrendingUp,
  Plus,
  Trash2,
  Sparkles,
  Activity,
} from 'lucide-react';
import { AssessmentFormData } from '../../schemas/assessmentSchema';
import { FitnessLevel } from '../../types';
import { FitnessRadarChart, RadarDataPoint } from '../fitness/FitnessRadarChart';

const SAMPLE_RADAR_DATA: RadarDataPoint[] = [
  { dimension: 'Sức mạnh thân trên', score: 72, benchmark: 65 },
  { dimension: 'Sức bền cơ bắp', score: 81, benchmark: 70 },
  { dimension: 'Độ dẻo & Linh hoạt', score: 54, benchmark: 60 },
  { dimension: 'Độ ổn định Core', score: 63, benchmark: 65 },
  { dimension: 'Kỹ năng Calisthenics', score: 42, benchmark: 40 },
  { dimension: 'Kiểm soát cơ thể', score: 68, benchmark: 60 },
];

export const FitnessLevelStep: React.FC = () => {
  const { watch, setValue } = useFormContext<AssessmentFormData>();
  const fitnessLevels = watch('fitnessLevels') || [];

  const [activeLevelId, setActiveLevelId] = useState<string>(
    fitnessLevels.length > 0 ? fitnessLevels[0].id : 'lvl-beginner'
  );

  const handleUpdateLevel = (index: number, field: keyof FitnessLevel, val: any) => {
    const updated = [...fitnessLevels];
    updated[index] = { ...updated[index], [field]: val };
    setValue('fitnessLevels', updated, { shouldValidate: true });
  };

  const handleAddLevel = () => {
    const newLevel: FitnessLevel = {
      id: `lvl-${Date.now()}`,
      code: `CUSTOM_LVL_${fitnessLevels.length + 1}`,
      name: `Cấp độ ${fitnessLevels.length + 1}`,
      minScore: 80,
      maxScore: 100,
      description: 'Mô tả đối tượng phù hợp cho cấp độ này...',
      recommendation: 'Khuyến nghị giáo án phù hợp...',
      colorScheme: 'purple',
      badgeLabel: `Cấp độ ${fitnessLevels.length + 1}`,
    };
    setValue('fitnessLevels', [...fitnessLevels, newLevel], { shouldValidate: true });
    setActiveLevelId(newLevel.id);
  };

  const handleRemoveLevel = (index: number) => {
    const updated = fitnessLevels.filter((_, i) => i !== index);
    setValue('fitnessLevels', updated, { shouldValidate: true });
    if (updated.length > 0) setActiveLevelId(updated[0].id);
  };

  const activeLevel = fitnessLevels.find((l) => l.id === activeLevelId) || fitnessLevels[0];
  const activeLevelIdx = fitnessLevels.findIndex((l) => l.id === activeLevel?.id);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">04. Phân loại Cấp độ Thể lực & 6 Chiều đo Thể chất</h2>
            <p className="text-xs text-text-secondary">
              Thiết lập thuật toán phân loại học viên thành các nhóm cấp độ (Beginner, Intermediate, Advanced, Elite) và biểu đồ đa chiều.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Fitness Levels Manager (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Các tầng Phân loại Thể lực</h3>
                <p className="text-[11px] text-text-secondary">
                  Hệ thống tự động xếp hạng học viên vào cấp độ tương ứng dựa trên tổng điểm đạt được.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddLevel}
                className="px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-bold hover:bg-accent hover:text-white transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> + Thêm cấp độ
              </button>
            </div>

            {/* Level Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {fitnessLevels.map((lvl) => {
                const isSelected = lvl.id === activeLevel?.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setActiveLevelId(lvl.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-accent/15 border-accent ring-2 ring-accent/30 shadow-sm'
                        : 'bg-surface-elevated/40 border-border hover:bg-surface-elevated'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-accent block truncate">
                      {lvl.badgeLabel}
                    </span>
                    <h4 className="text-xs font-bold text-text-primary truncate mt-0.5">{lvl.name.split('(')[0]}</h4>
                    <span className="text-[11px] font-bold text-text-primary mt-1 block">
                      {lvl.minScore} - {lvl.maxScore} pts
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Level Editor */}
            {activeLevel && activeLevelIdx >= 0 && (
              <div className="p-4 rounded-xl bg-surface-elevated/40 border border-border space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    Chỉnh sửa: {activeLevel.name}
                  </h4>
                  {fitnessLevels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLevel(activeLevelIdx)}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa cấp độ này
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-text-primary mb-1">
                      Tên cấp độ hiển thị
                    </label>
                    <input
                      type="text"
                      value={activeLevel.name}
                      onChange={(e) => handleUpdateLevel(activeLevelIdx, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-background border border-border text-text-primary rounded-lg focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-text-primary mb-1">
                      Khoảng điểm (Score Range)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={activeLevel.minScore}
                        onChange={(e) => handleUpdateLevel(activeLevelIdx, 'minScore', Number(e.target.value))}
                        className="w-20 px-2 py-1.5 text-xs font-bold text-center bg-background border border-border text-text-primary rounded-lg"
                      />
                      <span className="text-xs text-text-secondary">đến</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={activeLevel.maxScore}
                        onChange={(e) => handleUpdateLevel(activeLevelIdx, 'maxScore', Number(e.target.value))}
                        className="w-20 px-2 py-1.5 text-xs font-bold text-center bg-background border border-border text-text-primary rounded-lg"
                      />
                      <span className="text-xs font-bold text-text-secondary">điểm</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-primary mb-1">
                    Mô tả đặc điểm thể lực cấp độ
                  </label>
                  <textarea
                    rows={2}
                    value={activeLevel.description}
                    onChange={(e) => handleUpdateLevel(activeLevelIdx, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-background border border-border text-text-primary rounded-lg focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-primary mb-1">
                    Khuyến nghị lộ trình & Giáo án CalisHealth phù hợp
                  </label>
                  <textarea
                    rows={2}
                    value={activeLevel.recommendation}
                    onChange={(e) => handleUpdateLevel(activeLevelIdx, 'recommendation', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-background border border-border text-text-primary rounded-lg focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Radar Chart & 6 Dimensions Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Mô phỏng Biểu đồ Radar Thể chất
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                6 Chiều đo
              </span>
            </div>

            {/* Radar Component */}
            <div className="bg-background rounded-xl p-2 border border-border">
              <FitnessRadarChart data={SAMPLE_RADAR_DATA} height={250} showBenchmark={true} />
            </div>

            <p className="text-[11px] text-text-secondary leading-relaxed">
              Điểm số từng câu hỏi sẽ tự động tổng hợp vào 6 trục tọa độ thể lực (Sức mạnh thân trên, Sức bền, Linh hoạt, Core, Kỹ năng, Kiểm soát cơ thể) giúp học viên nhận diện điểm mạnh và vùng cơ cần bù đắp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
