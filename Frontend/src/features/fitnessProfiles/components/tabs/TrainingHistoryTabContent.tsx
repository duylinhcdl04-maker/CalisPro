import React from "react";
import { Dumbbell, Calendar, Flame, CheckCircle, Clock } from "lucide-react";
import { FitnessProfile } from "../../types/fitnessProfile";

interface TrainingHistoryTabContentProps {
  profile: FitnessProfile;
}

export const TrainingHistoryTabContent: React.FC<TrainingHistoryTabContentProps> = ({
  profile,
}) => {
  const recentSessions = [
    {
      id: "sess-01",
      title: "Upper Body Strength & Pull-up Mastery",
      date: "26/09/2026 - 17:30",
      duration: 45,
      exercisesCount: 5,
      completedSets: 18,
      volumeKg: "3,450 kg",
      caloriesBurned: 320,
      coachFeedback: "Thực hiện rep kéo xà rất chuẩn, hoàn thành 100% mục tiêu.",
    },
    {
      id: "sess-02",
      title: "Core Stability & Compression Training",
      date: "24/09/2026 - 07:00",
      duration: 40,
      exercisesCount: 4,
      completedSets: 16,
      volumeKg: "Bodyweight",
      caloriesBurned: 280,
      coachFeedback: "Hollow body hold duy trì trên 45 giây liên tục.",
    },
    {
      id: "sess-03",
      title: "Shoulder & Wrist Mobility Routine",
      date: "22/09/2026 - 18:00",
      duration: 30,
      exercisesCount: 6,
      completedSets: 12,
      volumeKg: "Bands / Light",
      caloriesBurned: 180,
      coachFeedback: "Khớp vai mở tốt hơn 15% so với tuần trước.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Dumbbell className="h-4 w-4 text-[#547EFF]" />
            TỔNG BUỔI TẬP HOÀN THÀNH
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {profile.totalWorkoutsCompleted} <span className="text-xs font-normal text-slate-400">buổi</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Flame className="h-4 w-4 text-amber-500" />
            CHUỖI TẬP LIÊN TỤC (STREAK)
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {profile.activeStreakDays} <span className="text-xs font-normal text-slate-400">ngày</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            TỶ LỆ HOÀN THÀNH GIÁO ÁN
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            94%
          </div>
        </div>
      </div>

      {/* Session Logs List */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Nhật ký các Buổi tập gần đây
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Theo dõi khối lượng vận động và độ tuân thủ lộ trình cá nhân hóa
        </p>

        <div className="mt-4 space-y-3">
          {recentSessions.map((sess) => (
            <div
              key={sess.id}
              className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 transition-all hover:border-[#8CA9FF] hover:bg-[#8CA9FF]/5 dark:border-slate-800 dark:bg-slate-800/40"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {sess.title}
                  </h4>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {sess.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {sess.duration} phút
                    </span>
                    <span>•</span>
                    <span>{sess.exercisesCount} động tác ({sess.completedSets} sets)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-amber-600 shadow-xs dark:bg-zinc-700 dark:text-amber-400">
                    🔥 {sess.caloriesBurned} kcal
                  </span>
                </div>
              </div>

              {sess.coachFeedback && (
                <div className="mt-3 border-t border-black/5 pt-2 text-xs text-[#172019] dark:border-white/5 dark:text-zinc-300">
                  <span className="font-semibold text-[#547EFF]">💡 Phản hồi: </span>
                  {sess.coachFeedback}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
