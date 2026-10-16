import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAssessmentScope } from '../useAssessmentScope';
import {
  MoreVertical,
  Search,
  Filter,
  Play,
  Edit3,
  Copy,
  BarChart3,
  Archive,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Assessment, AssessmentFilterState, AssessmentStatus } from '../types';
import { ASSESSMENT_TYPE_CONFIGS } from '../constants/assessmentTypes';
import { toast } from 'sonner';

interface AssessmentTableProps {
  assessments: Assessment[];
  onDuplicate: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPublish: (id: string) => Promise<void>;
  onOpenPreview: (assessment: Assessment) => void;
  onSetOnboarding?: (id: string) => Promise<void>;
}

export const AssessmentTable: React.FC<AssessmentTableProps> = ({
  assessments,
  onDuplicate,
  onArchive,
  onDelete,
  onPublish,
  onOpenPreview,
  onSetOnboarding,
}) => {
  const navigate = useNavigate();
  const { base, isCoach } = useAssessmentScope();

  const [filters, setFilters] = useState<AssessmentFilterState>({
    search: '',
    type: 'ALL',
    status: 'ALL',
    fitnessLevel: 'ALL',
    sortBy: 'NEWEST',
  });

  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number }>({ right: 0 });
  const [deleteModalItem, setDeleteModalItem] = useState<Assessment | null>(null);
  const [archiveModalItem, setArchiveModalItem] = useState<Assessment | null>(null);
  const [publishModalItem, setPublishModalItem] = useState<Assessment | null>(null);

  // Filter and sort logic
  const filteredAssessments = assessments
    .filter((item) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q) || item.displayName.toLowerCase().includes(q);
        const matchesTag = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesTag) return false;
      }
      if (filters.type !== 'ALL' && item.type !== filters.type) return false;
      if (filters.status !== 'ALL' && item.status !== filters.status) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'NEWEST') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (filters.sortBy === 'OLDEST') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (filters.sortBy === 'MOST_USED') return b.attemptsCount - a.attemptsCount;
      if (filters.sortBy === 'HIGHEST_COMPLETION') return b.completionRate - a.completionRate;
      if (filters.sortBy === 'LOWEST_COMPLETION') return a.completionRate - b.completionRate;
      return 0;
    });

  const getStatusBadge = (status: AssessmentStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Published
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Nháp (Draft)
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
            Lưu trữ
          </span>
        );
    }
  };

  const getTypeConfig = (type: string) => {
    return ASSESSMENT_TYPE_CONFIGS.find((c) => c.type === type) || ASSESSMENT_TYPE_CONFIGS[0];
  };

  const getScheduleLabel = (assessment: Assessment) => {
    if (!assessment.schedule?.enabled) return 'Chỉ khi yêu cầu';
    if (assessment.schedule.triggerTypes.includes('DYNAMIC_LEVEL')) return 'Tự động theo cấp độ';
    const { value, unit } = assessment.schedule.timeFrequency || { value: 4, unit: 'WEEKS' };
    const unitText = unit === 'WEEKS' ? 'tuần' : unit === 'DAYS' ? 'ngày' : 'tháng';
    return `Mỗi ${value} ${unitText}`;
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-surface rounded-2xl p-4 border border-border shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên bài đánh giá, mục đích, thẻ tags..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-accent text-text-primary placeholder:text-text-secondary"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
            className="px-3 py-2 text-xs font-medium bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="ALL">Tất cả loại bài</option>
            {ASSESSMENT_TYPE_CONFIGS.map((t) => (
              <option key={t.type} value={t.type}>
                {t.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            className="px-3 py-2 text-xs font-medium bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PUBLISHED">Published (Đang phát hành)</option>
            <option value="DRAFT">Nháp (Draft)</option>
            <option value="ARCHIVED">Lưu trữ (Archived)</option>
          </select>

          {/* Sort By */}
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
            className="px-3 py-2 text-xs font-medium bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="NEWEST">Mới cập nhật nhất</option>
            <option value="OLDEST">Cũ nhất</option>
            <option value="MOST_USED">Lượt làm nhiều nhất</option>
            <option value="HIGHEST_COMPLETION">Tỷ lệ hoàn thành cao nhất</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-elevated/50 border-b border-border text-xs font-bold text-text-secondary uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Bài đánh giá</th>
                <th className="py-3.5 px-4 font-semibold">Phân loại</th>
                <th className="py-3.5 px-4 font-semibold text-center">Số câu hỏi</th>
                <th className="py-3.5 px-4 font-semibold text-center">Điểm TB</th>
                <th className="py-3.5 px-4 font-semibold">Tỷ lệ hoàn thành</th>
                <th className="py-3.5 px-4 font-semibold">Chu kỳ đánh giá</th>
                <th className="py-3.5 px-4 font-semibold text-center">Trạng thái</th>
                <th className="py-3.5 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-3">
                        <AlertCircle className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-text-primary">Chưa có bài đánh giá phù hợp</h3>
                      <p className="text-xs text-text-secondary mt-1">
                        Không tìm thấy bài test nào khớp với bộ lọc hiện tại. Hãy thử thay đổi từ khóa hoặc tạo bài test mới.
                      </p>
                      <button
                        onClick={() => navigate(`${base}/new`)}
                        className="mt-4 px-4 py-2 rounded-xl bg-accent hover:bg-accent-strong text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        + Tạo bài đánh giá mới
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((item) => {
                  const typeConfig = getTypeConfig(item.type);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-elevated/40 transition-colors group"
                    >
                      {/* Name & Display Name */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <button
                            onClick={() => navigate(`${base}/${item.id}/edit`)}
                            className="text-sm font-bold text-text-primary hover:text-accent text-left transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            {item.displayName}
                            <span className="text-[11px] font-normal text-text-secondary">v{item.version}</span>
                          </button>
                          {item.isOnboarding && (
                            <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                              🚩 Bài test đầu vào
                            </span>
                          )}
                          <span className="text-xs text-text-secondary mt-0.5 line-clamp-1">{item.name}</span>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-1.5 py-0.5 bg-accent/10 text-accent text-[10px] font-medium rounded border border-accent/20"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-elevated border border-border text-xs font-medium text-text-primary">
                          <Sparkles className="w-3.5 h-3.5 text-accent" />
                          {typeConfig.badge}
                        </span>
                      </td>

                      {/* Questions Count */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-text-primary">{item.questions?.length || 0}</span>
                        <span className="text-xs text-text-secondary block">~{item.estimatedDuration} phút</span>
                      </td>

                      {/* Average Score */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-bold text-text-primary">
                            {item.averageScore > 0 ? `${item.averageScore}/100` : '—'}
                          </span>
                          <span className="text-[10px] text-text-secondary">
                            {item.attemptsCount.toLocaleString('vi-VN')} lượt
                          </span>
                        </div>
                      </td>

                      {/* Completion Rate Progress */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-text-primary">
                            <span>{item.completionRate}%</span>
                          </div>
                          <div className="w-full bg-surface-elevated h-1.5 rounded-full overflow-hidden border border-border">
                            <div
                              className="bg-accent h-full rounded-full transition-all"
                              style={{ width: `${item.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-text-primary font-medium">
                          <Calendar className="w-3.5 h-3.5 text-accent" />
                          {getScheduleLabel(item)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live Preview Button */}
                          <button
                            title="Xem trước giao diện học viên"
                            onClick={() => onOpenPreview(item)}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Analytics / Results Button */}
                          <button
                            title="Xem báo cáo kết quả & phân tích"
                            onClick={() => navigate(`${base}/${item.id}/results`)}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-surface-elevated transition-colors cursor-pointer"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            title="Chỉnh sửa bài đánh giá"
                            onClick={() => navigate(`${base}/${item.id}/edit`)}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-surface-elevated transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                if (actionMenuOpenId === item.id) { setActionMenuOpenId(null); return; }
                                const r = e.currentTarget.getBoundingClientRect();
                                const openUp = window.innerHeight - r.bottom < 240;
                                setMenuPos(openUp
                                  ? { bottom: window.innerHeight - r.top + 4, right: window.innerWidth - r.right }
                                  : { top: r.bottom + 4, right: window.innerWidth - r.right });
                                setActionMenuOpenId(item.id);
                              }}
                              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {actionMenuOpenId === item.id && createPortal(
                              <>
                                <div
                                  className="fixed inset-0 z-[60]"
                                  onClick={() => setActionMenuOpenId(null)}
                                />
                                <div style={{ position: 'fixed', top: menuPos.top, bottom: menuPos.bottom, right: menuPos.right }} className="w-48 bg-surface border border-border rounded-xl shadow-2xl z-[61] py-1.5 text-xs text-text-primary">
                                  {!isCoach && item.status !== 'PUBLISHED' && (
                                    <button
                                      onClick={() => {
                                        setActionMenuOpenId(null);
                                        setPublishModalItem(item);
                                      }}
                                      className="w-full px-3.5 py-2 text-left hover:bg-surface-elevated text-emerald-400 font-semibold flex items-center gap-2 cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Phát hành (Publish)
                                    </button>
                                  )}

                                  {!isCoach && onSetOnboarding && item.status === 'PUBLISHED' && !item.isOnboarding && (
                                    <button
                                      onClick={() => {
                                        setActionMenuOpenId(null);
                                        onSetOnboarding(item.id);
                                      }}
                                      className="w-full px-3.5 py-2 text-left hover:bg-surface-elevated text-accent font-semibold flex items-center gap-2 cursor-pointer"
                                    >
                                      🚩 Đặt làm bài test đầu vào
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setActionMenuOpenId(null);
                                      onDuplicate(item.id);
                                    }}
                                    className="w-full px-3.5 py-2 text-left hover:bg-surface-elevated flex items-center gap-2 cursor-pointer text-text-primary"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-text-secondary" />
                                    Tạo bản sao (Duplicate)
                                  </button>

                                  {!isCoach && item.status !== 'ARCHIVED' && (
                                    <button
                                      onClick={() => {
                                        setActionMenuOpenId(null);
                                        setArchiveModalItem(item);
                                      }}
                                      className="w-full px-3.5 py-2 text-left hover:bg-surface-elevated text-amber-400 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Archive className="w-3.5 h-3.5" />
                                      Lưu trữ (Archive)
                                    </button>
                                  )}

                                  {!isCoach && <div className="my-1 border-t border-border" />}

                                  {!isCoach && <button
                                    onClick={() => {
                                      setActionMenuOpenId(null);
                                      setDeleteModalItem(item);
                                    }}
                                    className="w-full px-3.5 py-2 text-left hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 font-medium cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Xóa bài test
                                  </button>}
                                </div>
                              </>,
                              document.body
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalItem && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Xác nhận xóa bài đánh giá?</h3>
            <p className="text-xs text-text-secondary mt-2">
              Bạn có chắc chắn muốn xóa bài đánh giá <strong className="text-text-primary">"{deleteModalItem.displayName}"</strong>?
              Thao tác này sẽ gỡ bỏ bài test khỏi danh sách quản trị.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                onClick={() => setDeleteModalItem(null)}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={async () => {
                  await onDelete(deleteModalItem.id);
                  setDeleteModalItem(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Archive Confirmation Modal */}
      {archiveModalItem && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Archive className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Lưu trữ bài đánh giá?</h3>
            <p className="text-xs text-text-secondary mt-2">
              Lưu trữ bài đánh giá <strong className="text-text-primary">"{archiveModalItem.displayName}"</strong>. Các kết quả lịch sử đã làm trước đây của học viên vẫn được bảo lưu, nhưng bài test sẽ không còn tự động phân phối cho học viên mới.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                onClick={() => setArchiveModalItem(null)}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={async () => {
                  await onArchive(archiveModalItem.id);
                  setArchiveModalItem(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Xác nhận lưu trữ
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Publish Confirmation Modal */}
      {publishModalItem && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Phát hành bài đánh giá?</h3>
            <p className="text-xs text-text-secondary mt-2">
              Bài đánh giá <strong className="text-text-primary">"{publishModalItem.displayName}"</strong> gồm {publishModalItem.questions?.length} câu hỏi sẽ chính thức có hiệu lực trên toàn hệ thống CalisHealth theo đúng chu kỳ tự động đã cấu hình.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                onClick={() => setPublishModalItem(null)}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={async () => {
                  await onPublish(publishModalItem.id);
                  setPublishModalItem(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent-strong rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Phát hành ngay
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
