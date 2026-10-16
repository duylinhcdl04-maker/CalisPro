import React from 'react';
import { Bot, Sparkles, Clock, Bell, Dumbbell, Shield } from 'lucide-react';
import { AssessmentSchedule } from '../../types';

interface LiveScheduleSummaryProps {
  schedule: AssessmentSchedule;
  assessmentDisplayName?: string;
}

export const LiveScheduleSummary: React.FC<LiveScheduleSummaryProps> = ({
  schedule,
  assessmentDisplayName = 'Bài đánh giá thể lực',
}) => {
  if (!schedule?.enabled) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-text-secondary" />
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Cấu hình Tự động Hóa
          </h3>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-elevated/40 border border-border text-xs text-text-secondary">
          <span className="font-bold text-text-primary block mb-1">Chế độ thủ công (Manual)</span>
          Bài đánh giá này sẽ <strong>không tự động kích hoạt</strong> theo chu kỳ. Chỉ được giao khi Huấn luyện viên (Coach) hoặc Quản trị viên chỉ định trực tiếp cho học viên.
        </div>
      </div>
    );
  }

  const freqValue = schedule.timeFrequency?.value || 4;
  const freqUnit = schedule.timeFrequency?.unit === 'WEEKS' ? 'tuần' : schedule.timeFrequency?.unit === 'DAYS' ? 'ngày' : 'tháng';
  const hasDynamicRules = schedule.triggerTypes.includes('DYNAMIC_LEVEL');
  const hasWorkoutTrigger = schedule.triggerTypes.includes('WORKOUT_BASED') && schedule.workoutTrigger?.enabled;
  const workoutCount = schedule.workoutTrigger?.requiredWorkoutsCount || 20;
  const graceDays = schedule.gracePeriodDays || 7;
  const enabledRemindersCount = (schedule.reminders || []).filter((r) => r.enabled).length;

  return (
    <div className="bg-surface rounded-2xl border border-accent/30 p-5 shadow-sm space-y-4 sticky top-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Tóm tắt Tự động hóa (Live AI Summary)
            </h3>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Đang hoạt động tự động
            </span>
          </div>
        </div>
      </div>

      {/* Natural Language Narrative */}
      <div className="space-y-2.5 text-xs text-text-primary leading-relaxed">
        <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p>
            Học viên mới đăng ký sẽ được yêu cầu thực hiện bài test{' '}
            <strong className="text-accent">"{assessmentDisplayName}"</strong> ngay trong lần đăng nhập đầu tiên để thiết lập Hồ sơ Thể lực ban đầu.
          </p>
        </div>

        {hasDynamicRules ? (
          <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-text-secondary">
              Chu kỳ đánh giá lại được cá nhân hóa thông minh: Học viên <strong className="text-text-primary">Beginner</strong> kiểm tra mỗi{' '}
              <strong className="text-text-primary">4 tuần</strong>, <strong className="text-text-primary">Intermediate</strong> mỗi <strong className="text-text-primary">6 tuần</strong>, <strong className="text-text-primary">Advanced</strong> mỗi{' '}
              <strong className="text-text-primary">8 tuần</strong>, và <strong className="text-text-primary">Elite</strong> mỗi <strong className="text-text-primary">12 tuần</strong>.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-text-secondary">
              Học viên sẽ được đánh giá lại định kỳ cố định mỗi{' '}
              <strong className="text-text-primary">
                {freqValue} {freqUnit}
              </strong>
              .
            </p>
          </div>
        )}

        {hasWorkoutTrigger && (
          <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border flex items-start gap-2.5">
            <Dumbbell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-text-secondary">
              Điều kiện {schedule.triggerLogic === 'OR' ? 'HOẶC (OR)' : 'VÀ (AND)'}: Khi học viên tích lũy đủ{' '}
              <strong className="text-text-primary">{workoutCount} buổi tập</strong> hoàn thành, bài đánh giá lại cũng sẽ lập tức được kích hoạt.
            </p>
          </div>
        )}

        <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border flex items-start gap-2.5">
          <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-text-secondary">
            Đã bật <strong className="text-text-primary">{enabledRemindersCount} mốc nhắc nhở</strong> qua các kênh thông báo để đảm bảo tỷ lệ hoàn thành cao nhất.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <p className="text-text-secondary">
            Thời gian gia hạn (Grace Period) là <strong className="text-text-primary">{graceDays} ngày</strong> giúp học viên linh hoạt hoàn thành mà không bị đánh dấu quá hạn (Overdue).
          </p>
        </div>
      </div>
    </div>
  );
};
