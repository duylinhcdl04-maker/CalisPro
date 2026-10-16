import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Sparkles,
  Info,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { aiMotionApi } from '../api/aiMotionApi';
import {
  MEDIAPIPE_LANDMARKS,
  getLandmarkName,
} from '../constants/landmarks';
import type {
  AiLandmarkRequirementDto,
  BodyRegion,
  LandmarkVisibility,
} from '../types/aiMotion.types';
import { Button } from '../../../components/ui/Button';
import { PoseBiomechanics3DViewer } from '../biomechanics/components/PoseBiomechanics3DViewer';
import { mergeLandmarks3D } from '../biomechanics/utils';

interface Props {
  profileId: number;
  exerciseCode?: string;
}

export function PoseLandmarkConfig({ profileId, exerciseCode }: Props) {
  const [landmarks, setLandmarks] = useState<AiLandmarkRequirementDto[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedLandmarkIndex, setSelectedLandmarkIndex] = useState<number | null>(13); // Default Left Elbow
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadLandmarks();
  }, [profileId]);

  async function loadLandmarks() {
    setIsLoading(true);
    try {
      const data = await aiMotionApi.getLandmarks(profileId);
      setLandmarks(data);
    } catch {
      toast.error('Không thể tải cấu hình Landmarks');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const updated = await aiMotionApi.saveLandmarks(profileId, landmarks);
      setLandmarks(updated);
      toast.success('Lưu cấu hình 33 MediaPipe Landmarks thành công!');
    } catch {
      toast.error('Lỗi khi lưu cấu hình landmarks');
    } finally {
      setIsSaving(false);
    }
  }

  function updateLandmark(
    index: number,
    field: keyof AiLandmarkRequirementDto,
    value: any
  ) {
    setLandmarks((prev) =>
      prev.map((lm) => (lm.landmarkIndex === index ? { ...lm, [field]: value } : lm))
    );
  }

  function handleBatchVisibility(visibility: LandmarkVisibility) {
    setLandmarks((prev) =>
      prev.map((lm) => {
        if (selectedRegion === 'ALL' || lm.bodyRegion === selectedRegion) {
          return { ...lm, visibilityRequirement: visibility };
        }
        return lm;
      })
    );
    toast.info(`Đã đặt trạng thái ${visibility} cho các khớp đã lọc`);
  }

  const landmarks3D = useMemo(() => mergeLandmarks3D(landmarks), [landmarks]);

  const filteredLandmarks = landmarks.filter((lm) => {
    if (selectedRegion === 'ALL') return true;
    return lm.bodyRegion === selectedRegion;
  });

  const activeCount = landmarks.filter((lm) => lm.visibilityRequirement === 'REQUIRED').length;
  const optionalCount = landmarks.filter((lm) => lm.visibilityRequirement === 'OPTIONAL').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-text-secondary">
        <RefreshCw className="h-6 w-6 animate-spin text-accent" />
        <span className="ml-2 font-medium">Đang tải cấu hình Pose Detection 3D...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER BAR & SUMMARY */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border/80 bg-surface p-5 shadow-elevated">
        <div>
          <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
            <Activity size={18} className="text-accent" />
            Hệ Thống 3D Biomechanics & Cấu Hình 33 Khớp Xương (MediaPipe 3D)
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Bắt buộc (Required): <span className="font-bold text-emerald-500">{activeCount}</span> | Tùy chọn (Optional): <span className="font-bold text-indigo-500">{optionalCount}</span> | Vô hiệu (Disabled): <span className="font-bold text-slate-500">{33 - activeCount - optionalCount}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-accent hover:bg-accent-strong text-white font-bold text-xs gap-1.5 shadow-md shadow-accent/20"
          >
            <Save size={14} />
            {isSaving ? 'Đang lưu...' : 'Lưu Thay đổi'}
          </Button>
        </div>
      </div>

      {/* 3D BIOMECHANICS VISUALIZER & TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: 3D BIOMECHANICS VIEWER */}
        <div className="lg:col-span-6 xl:col-span-6">
          <PoseBiomechanics3DViewer
            landmarks3D={landmarks3D}
            selectedLandmarkIndex={selectedLandmarkIndex}
            onLandmarkSelect={(idx) => setSelectedLandmarkIndex(idx)}
            selectedRegion={selectedRegion}
            exerciseCode={exerciseCode}
          />
        </div>

        {/* RIGHT: REGION FILTER & LANDMARKS TABLE */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-4">
          {/* Region Filter Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'Tất cả (33)' },
                { id: 'UPPER_BODY', label: 'Thân trên & Tay' },
                { id: 'CORE', label: 'Lưng & Hông' },
                { id: 'LOWER_BODY', label: 'Chân & Gối' },
                { id: 'HEAD', label: 'Đầu & Mắt' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedRegion(tab.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    selectedRegion === tab.id
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-surface border border-border/80 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBatchVisibility('REQUIRED')}
                className="text-[11px] h-7 px-2.5 font-bold text-emerald-600 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
              >
                Bật bắt buộc
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBatchVisibility('DISABLED')}
                className="text-[11px] h-7 px-2.5 font-bold text-rose-500 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20"
              >
                Tắt vùng
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-3xl border border-border/80 bg-surface overflow-hidden shadow-elevated">
            <div className="max-h-[620px] overflow-y-auto divide-y divide-border/60">
              {filteredLandmarks.map((lm) => {
                const isSelected = selectedLandmarkIndex === lm.landmarkIndex;
                const def = MEDIAPIPE_LANDMARKS.find((l) => l.index === lm.landmarkIndex);

                return (
                  <div
                    key={lm.landmarkIndex}
                    ref={isSelected ? selectedRowRef : null}
                    onClick={() => setSelectedLandmarkIndex(lm.landmarkIndex)}
                    className={`p-3 sm:p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-accent/10 border-l-4 border-accent shadow-inner'
                        : 'hover:bg-background/50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-black ${isSelected ? 'text-accent' : 'text-text-secondary'}`}>
                          #{lm.landmarkIndex.toString().padStart(2, '0')}
                        </span>
                        <span className="text-xs font-bold text-text-primary">
                          {def?.nameVi || lm.landmarkName}
                        </span>
                        <span className="text-[10px] font-mono text-text-secondary">
                          ({lm.landmarkName})
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary">{lm.description || 'Toạ độ 3D không gian cơ thể'}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end" onClick={(e) => e.stopPropagation()}>
                      {/* Visibility select */}
                      <select
                        value={lm.visibilityRequirement}
                        onChange={(e) =>
                          updateLandmark(lm.landmarkIndex, 'visibilityRequirement', e.target.value)
                        }
                        className={`rounded-xl border px-2.5 py-1 text-xs font-bold ${
                          lm.visibilityRequirement === 'REQUIRED'
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : lm.visibilityRequirement === 'OPTIONAL'
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-400 bg-slate-500/10 text-text-secondary'
                        }`}
                      >
                        <option value="REQUIRED">Bắt buộc</option>
                        <option value="OPTIONAL">Tùy chọn</option>
                        <option value="DISABLED">Vô hiệu</option>
                      </select>

                      {/* Confidence slider */}
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-text-secondary font-medium">Conf:</span>
                        <input
                          type="range"
                          min="0.3"
                          max="0.95"
                          step="0.05"
                          value={lm.minConfidence}
                          onChange={(e) =>
                            updateLandmark(
                              lm.landmarkIndex,
                              'minConfidence',
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-16 accent-accent cursor-pointer"
                        />
                        <span className="font-mono font-bold text-accent w-7 text-right">
                          {Math.round(lm.minConfidence * 100)}%
                        </span>
                      </div>

                      {/* Weight input */}
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-text-secondary font-medium">Trọng số:</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="5.0"
                          value={lm.weight}
                          onChange={(e) =>
                            updateLandmark(
                              lm.landmarkIndex,
                              'weight',
                              parseFloat(e.target.value) || 1.0
                            )
                          }
                          className="w-12 rounded-lg border border-border/80 bg-background px-1.5 py-0.5 text-center font-mono font-bold text-text-primary text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
