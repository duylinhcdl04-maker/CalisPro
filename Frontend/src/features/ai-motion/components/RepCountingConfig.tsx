import { useState, useEffect } from 'react';
import {
  RotateCcw,
  Save,
  CheckCircle2,
  Sliders,
  Sparkles,
  Timer,
  Zap,
  ArrowDownUp,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { aiMotionApi } from '../api/aiMotionApi';
import type { ExerciseAiProfileDto } from '../types/aiMotion.types';
import { Button } from '../../../components/ui/Button';

interface Props {
  profile: ExerciseAiProfileDto;
  onProfileUpdated: (updated: ExerciseAiProfileDto) => void;
}

export function RepCountingConfig({ profile, onProfileUpdated }: Props) {
  const [formData, setFormData] = useState<ExerciseAiProfileDto>({ ...profile });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData({ ...profile });
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await aiMotionApi.saveProfile(formData);
      onProfileUpdated(updated);
      toast.success('Cập nhật thuật toán đếm Reps thành công!');
    } catch {
      toast.error('Lỗi khi lưu cấu hình đếm Reps');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* STATE MACHINE PIPELINE VISUALIZER */}
      <div className="rounded-3xl border border-border/80 bg-surface p-6 shadow-elevated space-y-4">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
              <Layers size={18} className="text-accent" />
              Sơ đồ Trạng thái Đếm Rep (Finite State Machine Pipeline)
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Chu trình khép kín: Chuẩn bị → Điểm bắt đầu → Điểm đảo chiều (Peak) → Khóa khớp → Cộng điểm Rep.
            </p>
          </div>
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent border border-accent/20">
            {formData.repDirection === 'DESCENDING_FIRST' ? 'Hạ xuống trước (Eccentric)' : 'Kéo lên trước (Concentric)'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              step: '1. IDLE / SETUP',
              desc: 'Học viên vào tư thế chuẩn',
              color: 'border-slate-500/30 bg-slate-500/5',
              badge: 'Chờ nhận diện',
            },
            {
              step: '2. START / ECCENTRIC',
              desc: `Bắt đầu gập khớp (< ${formData.repStartThreshold}°)`,
              color: 'border-indigo-500/30 bg-indigo-500/5',
              badge: 'Đang chuyển động',
            },
            {
              step: '3. INFLECTION / PEAK',
              desc: `Chạm ngưỡng đáy (≤ ${formData.repPeakThreshold}°)`,
              color: 'border-amber-500/30 bg-amber-500/5',
              badge: 'Đạt Full ROM',
            },
            {
              step: '4. CONCENTRIC',
              desc: `Đẩy/Kéo trở lại (> ${formData.repEndThreshold}°)`,
              color: 'border-blue-500/30 bg-blue-500/5',
              badge: 'Hồi phục vị trí',
            },
            {
              step: '5. VALIDATION',
              desc: `Kiểm tra Form & Lỗi sai`,
              color: 'border-emerald-500/30 bg-emerald-500/5',
              badge: 'Chấm điểm Form',
            },
            {
              step: '6. REP +1 & RESET',
              desc: `Debounce ${formData.repDebounceMs}ms`,
              color: 'border-accent/40 bg-accent/10',
              badge: 'Ghi nhận Rep',
            },
          ].map((s, idx) => (
            <div key={idx} className={`rounded-2xl border p-3.5 space-y-1.5 ${s.color}`}>
              <div className="text-[10px] font-mono font-bold text-accent">{s.badge}</div>
              <div className="text-xs font-black text-text-primary">{s.step}</div>
              <p className="text-[11px] text-text-secondary leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PARAMETERS CONFIGURATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Primary Metrics & Thresholds */}
        <div className="lg:col-span-7 rounded-3xl border border-border/80 bg-surface p-6 shadow-elevated space-y-5">
          <div className="border-b border-border/70 pb-3">
            <h4 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
              <Sliders size={16} className="text-accent" />
              Chỉ số Đo lường & Ngưỡng Góc Sinh học
            </h4>
          </div>

          {/* Primary Metric */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Chỉ số chính kích hoạt chu trình đếm Rep (Primary Metric)
            </label>
            <select
              value={formData.repCountPrimaryMetric}
              onChange={(e) => setFormData({ ...formData, repCountPrimaryMetric: e.target.value })}
              className="w-full rounded-2xl border border-border/80 bg-background px-3 py-2.5 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="ELBOW_ANGLE_LEFT">Góc gập khuỷu tay trái (Left Elbow Angle: 11-13-15)</option>
              <option value="ELBOW_ANGLE_RIGHT">Góc gập khuỷu tay phải (Right Elbow Angle: 12-14-16)</option>
              <option value="ELBOW_ANGLE_AVG">Trung bình 2 khuỷu tay (Average Elbow Angle)</option>
              <option value="KNEE_ANGLE_LEFT">Góc gập đầu gối trái (Left Knee Angle: 23-25-27)</option>
              <option value="KNEE_ANGLE_AVG">Trung bình 2 đầu gối (Squat Knee Angle)</option>
              <option value="CHIN_ABOVE_WRIST_Y">Khoảng cách cằm vượt xà (Pull-Up Chin Y-Axis)</option>
              <option value="SPINE_ALIGNMENT_ANGLE">Góc thẳng cột sống (Plank: 11-23-25)</option>
            </select>
          </div>

          {/* Movement Direction */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Hướng chuyển động ban đầu (Movement Direction)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, repDirection: 'DESCENDING_FIRST' })}
                className={`rounded-2xl border p-3 text-left transition-all ${
                  formData.repDirection === 'DESCENDING_FIRST'
                    ? 'border-accent bg-accent/10 shadow-sm'
                    : 'border-border/70 bg-background/50 hover:border-accent/40'
                }`}
              >
                <div className="text-xs font-bold text-text-primary">Hạ xuống trước (Descending First)</div>
                <div className="text-[10px] text-text-secondary mt-0.5">Dành cho Push-Up, Squat, Dips</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, repDirection: 'ASCENDING_FIRST' })}
                className={`rounded-2xl border p-3 text-left transition-all ${
                  formData.repDirection === 'ASCENDING_FIRST'
                    ? 'border-accent bg-accent/10 shadow-sm'
                    : 'border-border/70 bg-background/50 hover:border-accent/40'
                }`}
              >
                <div className="text-xs font-bold text-text-primary">Kéo lên trước (Ascending First)</div>
                <div className="text-[10px] text-text-secondary mt-0.5">Dành cho Pull-Up, Muscle-Up</div>
              </button>
            </div>
          </div>

          {/* 3 Angle Threshold Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5 rounded-2xl border border-border/60 bg-background/50 p-3.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-text-secondary">Start Threshold</span>
                <span className="text-accent">{formData.repStartThreshold}°</span>
              </div>
              <input
                type="range"
                min="90"
                max="180"
                value={formData.repStartThreshold}
                onChange={(e) => setFormData({ ...formData, repStartThreshold: parseInt(e.target.value) })}
                className="w-full accent-accent cursor-pointer"
              />
              <p className="text-[10px] text-text-secondary">Ngưỡng góc khi bắt đầu động tác</p>
            </div>

            <div className="space-y-1.5 rounded-2xl border border-border/60 bg-background/50 p-3.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-text-secondary">Peak/Inflection</span>
                <span className="text-amber-600">{formData.repPeakThreshold}°</span>
              </div>
              <input
                type="range"
                min="30"
                max="130"
                value={formData.repPeakThreshold}
                onChange={(e) => setFormData({ ...formData, repPeakThreshold: parseInt(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[10px] text-text-secondary">Góc tối đa tại điểm chạm đáy (ROM Peak)</p>
            </div>

            <div className="space-y-1.5 rounded-2xl border border-border/60 bg-background/50 p-3.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-text-secondary">End Lockout</span>
                <span className="text-emerald-600">{formData.repEndThreshold}°</span>
              </div>
              <input
                type="range"
                min="90"
                max="180"
                value={formData.repEndThreshold}
                onChange={(e) => setFormData({ ...formData, repEndThreshold: parseInt(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[10px] text-text-secondary">Ngưỡng góc hồi phục kết thúc rep</p>
            </div>
          </div>
        </div>

        {/* Right: Anti-Cheat & Quality Controls */}
        <div className="lg:col-span-5 rounded-3xl border border-border/80 bg-surface p-6 shadow-elevated space-y-5">
          <div className="border-b border-border/70 pb-3">
            <h4 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
              <ShieldAlert size={16} className="text-accent" />
              Bộ lọc Chống Gian lận & Rung nhiễu
            </h4>
          </div>

          {/* Min ROM % */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-text-secondary uppercase tracking-wider">Yêu cầu Biên độ ROM tối thiểu</span>
              <span className="text-accent">{formData.minRomPercentage}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={formData.minRomPercentage}
              onChange={(e) => setFormData({ ...formData, minRomPercentage: parseInt(e.target.value) })}
              className="w-full accent-accent cursor-pointer"
            />
            <p className="text-[11px] text-text-secondary">
              Nếu học viên chỉ thực hiện nửa biên độ (Half Rep), AI sẽ từ chối cộng rep.
            </p>
          </div>

          {/* Debounce Ms */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-text-secondary uppercase tracking-wider">Thời gian chống nhiễu (Debounce)</span>
              <span className="text-accent">{formData.repDebounceMs} ms</span>
            </div>
            <input
              type="range"
              min="100"
              max="1500"
              step="50"
              value={formData.repDebounceMs}
              onChange={(e) => setFormData({ ...formData, repDebounceMs: parseInt(e.target.value) })}
              className="w-full accent-accent cursor-pointer"
            />
            <p className="text-[11px] text-text-secondary">
              Khoảng nghỉ tối thiểu giữa 2 rep liên tiếp để tránh đếm đúp.
            </p>
          </div>

          {/* Min Rep Duration Ms */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-text-secondary uppercase tracking-wider">Thời gian thực hiện tối thiểu</span>
              <span className="text-accent">{formData.minRepDurationMs} ms</span>
            </div>
            <input
              type="range"
              min="400"
              max="3000"
              step="100"
              value={formData.minRepDurationMs}
              onChange={(e) => setFormData({ ...formData, minRepDurationMs: parseInt(e.target.value) })}
              className="w-full accent-accent cursor-pointer"
            />
            <p className="text-[11px] text-text-secondary">
              Ngăn ngừa người tập làm quá nhanh bằng quán tính không kiểm soát cơ bắp.
            </p>
          </div>

          {/* Smoothing Alpha Filter */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-text-secondary uppercase tracking-wider">Bộ lọc làm mịn Kalman/EMA Alpha</span>
              <span className="text-accent">{formData.smoothingAlpha}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={formData.smoothingAlpha}
              onChange={(e) => setFormData({ ...formData, smoothingAlpha: parseFloat(e.target.value) })}
              className="w-full accent-accent cursor-pointer"
            />
            <p className="text-[11px] text-text-secondary">
              Alpha cao = Phản hồi tức thời; Alpha thấp = Khử nhiễu rung lắc camera cao hơn.
            </p>
          </div>
        </div>
      </div>

      {/* Save Action */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-accent hover:bg-accent-strong text-white font-bold text-xs gap-1.5 px-6"
        >
          <Save size={14} />
          {isSaving ? 'Đang lưu cấu hình...' : 'Lưu Thuật toán Đếm Reps'}
        </Button>
      </div>
    </form>
  );
}
