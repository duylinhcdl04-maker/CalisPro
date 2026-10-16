import React, { useMemo, useState } from 'react';
import { Flag, Eye, Power, RefreshCw, AlertTriangle, CheckCircle2, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Assessment } from '../types';
import { assessmentsApi, apiErrorMessage, type OnboardingSettings } from '../api/assessmentsApi';

interface OnboardingAssessmentCardProps {
  settings: OnboardingSettings | null;
  assessments: Assessment[];
  onChanged: () => Promise<void> | void;
  onPreview: (assessment: Assessment) => void;
}

/**
 * Nơi DUY NHẤT quyết định bài nào hiện ra cho người dùng mới đăng nhập (bài test đầu vào),
 * kèm các tùy chọn: bắt buộc / cho bỏ qua, hành vi khi chưa chọn bài, yêu cầu tất cả làm lại.
 */
export const OnboardingAssessmentCard: React.FC<OnboardingAssessmentCardProps> = ({ settings, assessments, onChanged, onPreview }) => {
  const [isPicking, setIsPicking] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [saving, setSaving] = useState(false);

  const published = useMemo(() => assessments.filter((a) => a.status === 'PUBLISHED'), [assessments]);
  const active = assessments.find((a) => a.id === settings?.activeTemplateId) ?? null;

  const update = async (patch: Parameters<typeof assessmentsApi.updateOnboardingSettings>[0], success: string) => {
    try {
      setSaving(true);
      await assessmentsApi.updateOnboardingSettings(patch);
      toast.success(success);
      setIsPicking(false);
      await onChanged();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Không thể cập nhật bài test đầu vào.'), { duration: 10000 });
    } finally {
      setSaving(false);
    }
  };

  const handleRetake = async () => {
    if (!window.confirm('Tất cả người dùng (kể cả người đã làm) sẽ phải làm lại bài test đầu vào ở lần đăng nhập tới. Tiếp tục?')) return;
    try {
      setSaving(true);
      await assessmentsApi.requireOnboardingRetake();
      toast.success('Đã yêu cầu tất cả người dùng làm lại bài test đầu vào.');
      await onChanged();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Không thể thực hiện.'));
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return null;
  const invalid = settings.validation && !settings.validation.valid;

  return (
    <div className="bg-surface rounded-2xl border-2 border-accent/30 p-5 shadow-xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Flag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Bài test đầu vào cho người dùng mới</p>
            {settings.activeTemplateId ? (
              <p className="text-sm font-bold text-text-primary truncate">
                {settings.activeTemplateName}{' '}
                <span className="text-xs font-semibold text-text-secondary">· phiên bản v{settings.activeTemplateVersion}</span>
              </p>
            ) : (
              <p className="text-sm font-bold text-amber-600">Chưa chọn bài — người dùng mới {settings.blockWhenMissing ? 'đang bị chặn ở màn chờ' : 'vào thẳng ứng dụng'}</p>
            )}
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-secondary">
              <Users className="w-3 h-3" /> {settings.completedCount} người đã hoàn thành ở vòng hiện tại (vòng {settings.round})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => { setIsPicking((v) => !v); setSelectedId(settings.activeTemplateId ?? ''); }}
            className="px-3.5 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-strong cursor-pointer"
          >
            {settings.activeTemplateId ? 'Đổi bài' : 'Chọn bài'}
          </button>
          {active && (
            <button
              type="button"
              onClick={() => onPreview(active)}
              className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-text-primary hover:bg-surface-elevated flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Xem trước như học viên
            </button>
          )}
          {settings.activeTemplateId && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                if (window.confirm('Tắt bài test đầu vào? Người dùng mới sẽ không còn phải làm bài.')) {
                  update({ activeTemplateId: '' }, 'Đã tắt bài test đầu vào.');
                }
              }}
              className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-rose-500 hover:bg-rose-500/10 flex items-center gap-1.5 cursor-pointer"
            >
              <Power className="w-3.5 h-3.5" /> Tắt
            </button>
          )}
        </div>
      </div>

      {isPicking && (
        <div className="rounded-xl border border-border bg-background p-3 flex flex-col sm:flex-row gap-2 sm:items-center">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="">— Chọn bài đã xuất bản —</option>
            {published.map((a) => (
              <option key={a.id} value={a.id}>
                {a.displayName || a.name} (v{a.version} · {a.questions.length} câu)
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedId || saving}
            onClick={() => update({ activeTemplateId: selectedId }, 'Đã đặt bài test đầu vào.')}
            className="px-3.5 py-2 rounded-xl bg-accent text-white text-xs font-bold disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Áp dụng
          </button>
          {published.length === 0 && (
            <span className="text-[11px] text-amber-600">Chưa có bài nào được xuất bản.</span>
          )}
        </div>
      )}

      {invalid && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-xs space-y-1">
          <p className="font-bold text-rose-600 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Bài test đầu vào hiện tại đang có vấn đề:
          </p>
          <ul className="list-disc pl-5 text-text-secondary">
            {settings.validation!.errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}
      {settings.activeTemplateId && !invalid && (
        <p className="flex items-center gap-1.5 text-[11px] text-emerald-600">
          <CheckCircle2 className="w-3.5 h-3.5" /> Bài hợp lệ: đã xuất bản, đủ cách chấm điểm và mức trình độ phủ kín thang điểm.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-border pt-4 text-xs">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.mandatory}
            disabled={saving}
            onChange={(e) => update({ mandatory: e.target.checked }, e.target.checked ? 'Bài test đầu vào là bắt buộc.' : 'Đã cho phép học viên bỏ qua bài test.')}
            className="mt-0.5 accent-[var(--color-accent)]"
          />
          <span>
            <span className="font-bold text-text-primary block">Bắt buộc làm trước khi vào ứng dụng</span>
            <span className="text-text-secondary">Bỏ chọn để cho phép học viên bấm "Bỏ qua".</span>
          </span>
        </label>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.blockWhenMissing}
            disabled={saving}
            onChange={(e) => update({ blockWhenMissing: e.target.checked }, 'Đã cập nhật hành vi khi chưa chọn bài.')}
            className="mt-0.5"
          />
          <span>
            <span className="font-bold text-text-primary block">Chặn người dùng mới khi chưa chọn bài</span>
            <span className="text-text-secondary">Bỏ chọn: người dùng mới vào thẳng ứng dụng nếu chưa có bài test.</span>
          </span>
        </label>
        <div className="flex items-start gap-2.5">
          <RefreshCw className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" />
          <span>
            <span className="font-bold text-text-primary block">Người dùng cũ không phải làm lại khi đổi bài</span>
            <button
              type="button"
              disabled={saving || !settings.activeTemplateId}
              onClick={handleRetake}
              className="mt-1 text-rose-500 font-semibold hover:underline disabled:opacity-50 cursor-pointer"
            >
              Yêu cầu tất cả làm lại…
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};
