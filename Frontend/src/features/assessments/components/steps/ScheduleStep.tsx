import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Clock,
  Dumbbell,
  Sparkles,
  Sliders,
  Calendar,
} from 'lucide-react';
import { AssessmentFormData } from '../../schemas/assessmentSchema';
import { TriggerType, TimeUnit, NotificationChannel, DynamicLevelRule } from '../../types';
import { ScheduleTimeline } from '../schedule/ScheduleTimeline';
import { LiveScheduleSummary } from '../schedule/LiveScheduleSummary';

const TRIGGER_TYPES_CONFIG: {
  type: TriggerType;
  title: string;
  subtitle: string;
  iconName: any;
}[] = [
  {
    type: 'TIME_BASED',
    title: 'Theo khoảng thời gian cố định',
    subtitle: 'Kích hoạt lại sau số tuần/tháng cố định (VD: 4 tuần)',
    iconName: Calendar,
  },
  {
    type: 'DYNAMIC_LEVEL',
    title: 'Tự động thích ứng theo Cấp độ thể lực',
    subtitle: 'Beginner 4 tuần, Intermediate 6 tuần, Advanced 8 tuần...',
    iconName: Sparkles,
  },
  {
    type: 'WORKOUT_BASED',
    title: 'Theo số buổi tập tích lũy',
    subtitle: 'Kích hoạt lại khi học viên hoàn thành đủ số buổi (VD: 20 buổi)',
    iconName: Dumbbell,
  },
  {
    type: 'MANUAL',
    title: 'Chỉ định thủ công (Coach / Admin)',
    subtitle: 'Không tự động gửi, chỉ mở khi Huấn luyện viên yêu cầu',
    iconName: Sliders,
  },
];

export const ScheduleStep: React.FC = () => {
  const { watch, setValue } = useFormContext<AssessmentFormData>();
  const schedule = watch('schedule') || ({} as any);
  const displayName = watch('displayName');

  const isEnabled = schedule.enabled ?? true;
  const triggerTypes = schedule.triggerTypes || ['TIME_BASED', 'DYNAMIC_LEVEL', 'WORKOUT_BASED'];
  const triggerLogic = schedule.triggerLogic || 'OR';
  const dynamicRules = schedule.dynamicRules || [];
  const reminders = schedule.reminders || [];

  const handleToggleAuto = (val: boolean) => {
    setValue('schedule.enabled', val, { shouldValidate: true });
  };

  const handleToggleTriggerType = (type: TriggerType) => {
    const exists = triggerTypes.includes(type);
    let updated = exists ? triggerTypes.filter((t: string) => t !== type) : [...triggerTypes, type];
    if (updated.length === 0) updated = ['TIME_BASED'];
    setValue('schedule.triggerTypes', updated, { shouldValidate: true });
  };

  const handleUpdateDynamicRule = (idx: number, field: keyof DynamicLevelRule, val: any) => {
    const updated = [...dynamicRules];
    updated[idx] = { ...updated[idx], [field]: val };
    setValue('schedule.dynamicRules', updated, { shouldValidate: true });
  };

  const handleToggleReminder = (idx: number, checked: boolean) => {
    const updated = [...reminders];
    updated[idx].enabled = checked;
    setValue('schedule.reminders', updated, { shouldValidate: true });
  };

  const handleToggleChannel = (rIdx: number, channel: NotificationChannel) => {
    const updated = [...reminders];
    const channels = updated[rIdx].channels || [];
    const exists = channels.includes(channel);
    updated[rIdx].channels = exists ? channels.filter((c) => c !== channel) : [...channels, channel];
    setValue('schedule.reminders', updated, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      {/* Master Toggle Banner */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              05. Chu kỳ Đánh giá lại & Tự động hóa (Automation Engine)
            </h2>
            <p className="text-xs text-text-secondary">
              Hệ thống tự động điều phối thời điểm học viên cần kiểm tra lại thể lực để nâng cấp giáo án CalisHealth.
            </p>
          </div>
        </div>

        {/* Large Switch */}
        <label className="flex items-center gap-3 cursor-pointer bg-surface-elevated/60 px-4 py-2.5 rounded-xl border border-border hover:bg-surface-elevated transition-colors">
          <span className="text-xs font-bold text-text-primary">
            {isEnabled ? 'Tự động đánh giá lại: BẬT' : 'Tự động đánh giá lại: TẮT'}
          </span>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => handleToggleAuto(e.target.checked)}
            className="w-5 h-5 rounded bg-background border-border text-accent focus:ring-accent"
          />
        </label>
      </div>

      {isEnabled && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Schedule Configuration Details (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Trigger Types Selector */}
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-text-primary">Các điều kiện Kích hoạt (Trigger Types)</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TRIGGER_TYPES_CONFIG.map((t) => {
                  const isSelected = triggerTypes.includes(t.type);
                  const Icon = t.iconName;

                  return (
                    <div
                      key={t.type}
                      onClick={() => handleToggleTriggerType(t.type)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-accent/15 border-accent shadow-sm'
                          : 'bg-surface-elevated/40 border-border hover:bg-surface-elevated'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-accent text-white' : 'bg-surface-elevated text-text-secondary'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-text-primary">{t.title}</h4>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded bg-background border-border text-accent focus:ring-accent"
                          />
                        </div>
                        <p className="text-[11px] text-text-secondary mt-0.5 leading-tight">{t.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trigger Logic (OR / AND) */}
              {triggerTypes.length > 1 && (
                <div className="p-3.5 rounded-xl bg-surface-elevated/40 border border-border flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-text-primary">Toán tử logic kích hoạt:</span>
                    <p className="text-[11px] text-text-secondary">
                      {triggerLogic === 'OR'
                        ? 'Chỉ cần thỏa mãn MỘT TRONG CÁC điều kiện (Khuyến nghị)'
                        : 'Bắt buộc phải thỏa mãn ĐỒNG THỜI TẤT CẢ các điều kiện'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => setValue('schedule.triggerLogic', 'OR')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                        triggerLogic === 'OR' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      OR (Hoặc)
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('schedule.triggerLogic', 'AND')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                        triggerLogic === 'AND' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      AND (Và)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Rules by Fitness Level Table */}
            {triggerTypes.includes('DYNAMIC_LEVEL') && (
              <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">
                      Chu kỳ Tùy biến theo Cấp độ (Dynamic Level Rules)
                    </h3>
                    <p className="text-[11px] text-text-secondary">
                      Người mới bắt đầu (Beginner) cần đánh giá thường xuyên hơn so với học viên Advanced.
                    </p>
                  </div>
                </div>

                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-elevated/60 border-b border-border text-text-secondary font-bold">
                      <tr>
                        <th className="p-3">Cấp độ thể lực</th>
                        <th className="p-3">Tần suất kiểm tra lại</th>
                        <th className="p-3">Đơn vị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {dynamicRules.map((r, rIdx) => (
                        <tr key={r.levelCode} className="hover:bg-surface-elevated/40">
                          <td className="p-3 font-bold text-text-primary">{r.levelName}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-text-secondary">Mỗi</span>
                              <input
                                type="number"
                                min={1}
                                value={r.intervalValue}
                                onChange={(e) =>
                                  handleUpdateDynamicRule(rIdx, 'intervalValue', Number(e.target.value))
                                }
                                className="w-16 px-2 py-1 bg-background border border-border rounded text-center font-bold text-accent"
                              />
                            </div>
                          </td>
                          <td className="p-3">
                            <select
                              value={r.intervalUnit}
                              onChange={(e) =>
                                handleUpdateDynamicRule(rIdx, 'intervalUnit', e.target.value as TimeUnit)
                              }
                              className="px-2 py-1 bg-background border border-border text-text-primary rounded text-xs font-semibold"
                            >
                              <option value="WEEKS">Tuần</option>
                              <option value="DAYS">Ngày</option>
                              <option value="MONTHS">Tháng</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Workout Trigger Config */}
            {triggerTypes.includes('WORKOUT_BASED') && (
              <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-text-primary">
                  Số buổi tập tích lũy để kích hoạt lại
                </h3>
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-elevated/40 border border-border">
                  <span className="text-xs text-text-primary font-medium">Đánh giá lại ngay sau khi hoàn thành:</span>
                  <input
                    type="number"
                    min={1}
                    value={schedule.workoutTrigger?.requiredWorkoutsCount || 20}
                    onChange={(e) =>
                      setValue('schedule.workoutTrigger.requiredWorkoutsCount', Number(e.target.value))
                    }
                    className="w-20 px-3 py-1.5 text-sm font-bold text-center bg-background border border-border rounded-xl text-accent focus:ring-2 focus:ring-accent"
                  />
                  <span className="text-xs font-bold text-text-secondary">buổi tập chuẩn</span>
                </div>
              </div>
            )}

            {/* Grace Period */}
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    Thời gian Gia hạn Linh hoạt (Grace Period)
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    Số ngày học viên có thể hoàn thành bài test sau ngày đến hạn mà không bị đánh dấu trễ hạn.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={schedule.gracePeriodDays ?? 7}
                    onChange={(e) => setValue('schedule.gracePeriodDays', Number(e.target.value))}
                    className="w-16 px-2.5 py-1.5 text-sm font-bold text-center bg-background border border-border text-text-primary rounded-xl"
                  />
                  <span className="text-xs font-bold text-text-secondary">ngày</span>
                </div>
              </div>
            </div>

            {/* Reminders Configuration */}
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-text-primary">
                Cấu hình Thông báo Nhắc hẹn (Reminder Settings)
              </h3>

              <div className="space-y-2.5">
                {reminders.map((rem, rIdx) => (
                  <div
                    key={rem.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      rem.enabled ? 'bg-accent/10 border-accent/30' : 'bg-surface-elevated/40 border-border opacity-60'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rem.enabled}
                        onChange={(e) => handleToggleReminder(rIdx, e.target.checked)}
                        className="rounded bg-background border-border text-accent focus:ring-accent"
                      />
                      <span className="text-xs font-bold text-text-primary">{rem.timingLabel}</span>
                    </label>

                    {rem.enabled && (
                      <div className="flex items-center gap-2 pl-6 sm:pl-0">
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Kênh:</span>
                        <button
                          type="button"
                          onClick={() => handleToggleChannel(rIdx, 'IN_APP')}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                            rem.channels.includes('IN_APP')
                              ? 'bg-accent text-white'
                              : 'bg-surface-elevated border border-border text-text-secondary'
                          }`}
                        >
                          In-App
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleChannel(rIdx, 'EMAIL')}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                            rem.channels.includes('EMAIL')
                              ? 'bg-accent text-white'
                              : 'bg-surface-elevated border border-border text-text-secondary'
                          }`}
                        >
                          Email
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleChannel(rIdx, 'PUSH')}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                            rem.channels.includes('PUSH')
                              ? 'bg-accent text-white'
                              : 'bg-surface-elevated border border-border text-text-secondary'
                          }`}
                        >
                          Push
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Timeline */}
            <ScheduleTimeline schedule={schedule} />
          </div>

          {/* Right: Sticky Real-time Natural Language Summary (5 cols) */}
          <div className="lg:col-span-5">
            <LiveScheduleSummary schedule={schedule} assessmentDisplayName={displayName} />
          </div>
        </div>
      )}
    </div>
  );
};
