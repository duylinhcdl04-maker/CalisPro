import React from 'react';
import { Sparkles, Dumbbell, Bell, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AssessmentSchedule } from '../../types';

interface ScheduleTimelineProps {
  schedule: AssessmentSchedule;
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({ schedule }) => {
  const frequencyText = `${schedule.timeFrequency?.value || 4} ${
    schedule.timeFrequency?.unit === 'WEEKS' ? 'tuần' : 'ngày'
  }`;

  const graceDays = schedule.gracePeriodDays || 7;

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Dòng thời gian Chu kỳ Tự động (Visual Schedule Timeline)
          </h3>
        </div>
        <span className="text-[10px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
          Chu kỳ: {frequencyText}
        </span>
      </div>

      {/* Horizontal / Flow Stepper Timeline */}
      <div className="relative pt-2 pb-2">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative z-10">
          {/* Node 1: Initial Assessment */}
          <div className="p-3 rounded-xl bg-accent/10 border border-accent/30 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center text-xs font-bold mb-2">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-text-primary">01. Đăng ký & Test Đầu vào</h4>
              <p className="text-[10px] text-text-secondary mt-1">
                Lần đầu tiên đăng nhập ứng dụng CalisHealth.
              </p>
            </div>
            <span className="text-[10px] font-bold text-accent mt-2 block">Ngày 0 (Khởi đầu)</span>
          </div>

          {/* Node 2: Training Period */}
          <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold mb-2">
                <Dumbbell className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-text-primary">02. Giai đoạn Luyện tập</h4>
              <p className="text-[10px] text-text-secondary mt-1">
                Tập theo giáo án AI điều chỉnh (20 buổi hoặc ~{frequencyText}).
              </p>
            </div>
            <span className="text-[10px] font-semibold text-text-secondary mt-2 block">
              Tuần 1 → Tuần {schedule.timeFrequency?.value || 4}
            </span>
          </div>

          {/* Node 3: Reminders */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold mb-2">
                <Bell className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-amber-400">03. Thông báo Nhắc hẹn</h4>
              <p className="text-[10px] text-text-secondary mt-1">
                Nhắc nhở qua In-App, Email và Push trước 7 ngày & 3 ngày.
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-400 mt-2 block">-7 ngày & -3 ngày</span>
          </div>

          {/* Node 4: Reassessment Due */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-bold mb-2">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-emerald-400">04. Ngày đến hạn Re-Test</h4>
              <p className="text-[10px] text-text-secondary mt-1">
                Bài test định kỳ kích hoạt nổi bật trên màn hình Home.
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 mt-2 block">Ngày đến hạn</span>
          </div>

          {/* Node 5: Grace Period & Plan Update */}
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center text-xs font-bold mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-sky-400">05. Gia hạn & Cập nhật AI</h4>
              <p className="text-[10px] text-text-secondary mt-1">
                Gia hạn {graceDays} ngày. Hoàn thành sẽ lập tức cập nhật Level & Giáo án mới.
              </p>
            </div>
            <span className="text-[10px] font-bold text-sky-400 mt-2 block">+{graceDays} ngày Grace</span>
          </div>
        </div>
      </div>
    </div>
  );
};
