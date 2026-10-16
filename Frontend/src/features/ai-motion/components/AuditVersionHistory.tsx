import { useState, useEffect } from 'react';
import {
  History,
  GitBranch,
  RotateCcw,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { aiMotionApi } from '../api/aiMotionApi';
import type {
  AiConfigurationVersionDto,
  AiConfigurationAuditLogDto,
  ExerciseAiProfileDto,
} from '../types/aiMotion.types';
import { Button } from '../../../components/ui/Button';

interface Props {
  profile: ExerciseAiProfileDto;
  onProfileUpdated: (updated: ExerciseAiProfileDto) => void;
}

export function AuditVersionHistory({ profile, onProfileUpdated }: Props) {
  const [versions, setVersions] = useState<AiConfigurationVersionDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AiConfigurationAuditLogDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [newVersionLabel, setNewVersionLabel] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [profile.id]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [vList, aList] = await Promise.all([
        aiMotionApi.getVersions(profile.id),
        aiMotionApi.getAuditLogs(profile.id),
      ]);
      setVersions(vList);
      setAuditLogs(aList);
    } catch {
      toast.error('Không thể tải lịch sử phiên bản');
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!newVersionLabel.trim()) {
      toast.warning('Vui lòng nhập tên phiên bản (Version Label)');
      return;
    }
    setIsPublishing(true);
    try {
      const updated = await aiMotionApi.publishProfile(profile.id, newVersionLabel, changeSummary);
      onProfileUpdated(updated);
      toast.success('Phát hành phiên bản AI mới thành công!');
      setShowPublishModal(false);
      setNewVersionLabel('');
      setChangeSummary('');
      loadData();
    } catch {
      toast.error('Lỗi khi phát hành phiên bản');
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleRollback(targetVersion: number) {
    const reason = prompt(`Nhập lý do Rollback về Version v${targetVersion}:`);
    if (!reason) return;
    try {
      const updated = await aiMotionApi.rollbackProfile(profile.id, targetVersion, reason);
      onProfileUpdated(updated);
      toast.success(`Đã Rollback về Version v${targetVersion}!`);
      loadData();
    } catch {
      toast.error('Lỗi khi rollback');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-text-secondary">
        <RefreshCw className="h-6 w-6 animate-spin text-accent" />
        <span className="ml-2 font-medium">Đang tải lịch sử phiên bản và nhật ký kiểm toán...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border/80 bg-surface p-5 shadow-elevated">
        <div>
          <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
            <GitBranch size={18} className="text-accent" />
            Quản lý Phiên bản & Nhật ký Kiểm toán (Versioning & Audit Trail)
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Phiên bản hiện tại: <span className="font-bold text-accent">v{profile.version}.0 ({profile.status})</span>
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowPublishModal(true)}
          className="bg-accent hover:bg-accent-strong text-white font-bold text-xs gap-1.5"
        >
          <Sparkles size={14} />
          Phát hành Phiên bản Mới (Publish Version)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: VERSION TIMELINE */}
        <div className="lg:col-span-6 rounded-3xl border border-border/80 bg-surface p-6 shadow-elevated space-y-4">
          <div className="border-b border-border/70 pb-3">
            <h4 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
              <History size={16} className="text-accent" />
              Lịch sử các phiên bản đã phát hành
            </h4>
          </div>

          <div className="space-y-3">
            {versions.map((v) => (
              <div
                key={v.id}
                className={`rounded-2xl border p-4 transition-all ${
                  v.isActive
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-border/70 bg-background/40 hover:bg-background/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-text-primary">
                      v{v.versionNumber}.0
                    </span>
                    <span className="text-xs font-bold text-text-primary">{v.versionLabel}</span>
                    {v.isActive && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Đang Active
                      </span>
                    )}
                  </div>

                  {!v.isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRollback(v.versionNumber)}
                      className="text-[11px] h-7 px-2.5 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1"
                    >
                      <RotateCcw size={12} />
                      Rollback
                    </Button>
                  )}
                </div>

                <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                  {v.changeSummary || 'Không có mô tả thay đổi.'}
                </p>

                <div className="flex items-center gap-3 text-[10px] text-text-secondary mt-3 pt-2 border-t border-border/50">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(v.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    {v.createdBy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: AUDIT TRAIL LOGS */}
        <div className="lg:col-span-6 rounded-3xl border border-border/80 bg-surface p-6 shadow-elevated space-y-4">
          <div className="border-b border-border/70 pb-3">
            <h4 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              Nhật ký Thay đổi Hệ thống (Audit Trail)
            </h4>
          </div>

          <div className="max-h-[450px] overflow-y-auto space-y-2.5 pr-1">
            {auditLogs.map((log) => {
              const actionColor =
                log.action === 'PUBLISH'
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : log.action === 'ROLLBACK'
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  : log.action === 'API_KEY_UPDATE'
                  ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                  : 'bg-blue-500/10 text-blue-600 border-blue-500/20';

              return (
                <div
                  key={log.id}
                  className="rounded-2xl border border-border/60 bg-background/50 p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-black ${actionColor}`}>
                        {log.action}
                      </span>
                      <span className="font-bold text-text-primary">{log.entityType}</span>
                    </div>
                    <span className="text-[10px] text-text-secondary">
                      {new Date(log.createdAt).toLocaleTimeString('vi-VN')}
                    </span>
                  </div>

                  {log.newValue && (
                    <div className="text-[11px] text-text-secondary truncate">
                      <span className="font-semibold text-text-primary">Chi tiết:</span> {log.newValue}
                    </div>
                  )}

                  {log.reason && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400">
                      Lý do: {log.reason}
                    </div>
                  )}

                  <div className="text-[10px] text-text-secondary pt-1 flex items-center gap-1">
                    <User size={10} />
                    Bởi: {log.performedBy}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Publish Version Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-surface p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-base font-bold text-text-primary">
              Phát hành Phiên bản AI Configuration Mới
            </h3>
            <form onSubmit={handlePublish} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">
                  Tên phiên bản (Version Label)
                </label>
                <input
                  type="text"
                  required
                  value={newVersionLabel}
                  onChange={(e) => setNewVersionLabel(e.target.value)}
                  className="w-full rounded-2xl border border-border/80 bg-background px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  placeholder="Ví dụ: v2.2 - Tối ưu phát hiện cong lưng"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">
                  Tóm tắt các thay đổi (Changelog)
                </label>
                <textarea
                  rows={3}
                  required
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="w-full rounded-2xl border border-border/80 bg-background p-3 text-xs text-text-primary focus:border-accent focus:outline-none"
                  placeholder="Mô tả các góc độ, quy tắc hoặc giọng nói được cải tiến..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowPublishModal(false)} className="text-xs">
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isPublishing}
                  className="bg-accent hover:bg-accent-strong text-white font-bold text-xs"
                >
                  {isPublishing ? 'Đang phát hành...' : 'Xác nhận Phát hành'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
