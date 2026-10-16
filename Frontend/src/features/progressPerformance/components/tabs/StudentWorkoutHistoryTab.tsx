import React from "react";
import { Sparkles, Calendar, Dumbbell, Flame, CheckCircle2 } from "lucide-react";
import { StudentPerformanceRecord } from "../../types/performance.types";

interface StudentWorkoutHistoryTabProps {
  student: StudentPerformanceRecord;
}

export const StudentWorkoutHistoryTab: React.FC<StudentWorkoutHistoryTabProps> = ({ student }) => {
  const sessions = [
    {
      id: "s1",
      title: "Full Body Calisthenics Mastery",
      date: student.lastWorkoutDate,
      duration: 52,
      exercises: 6,
      reps: 240,
      formScore: student.formScoreAverage,
      calories: 380,
      prsAchieved: 1,
    },
    {
      id: "s2",
      title: "Upper Body Hypertrophy & Pulling",
      date: "26/09/2026",
      duration: 45,
      exercises: 5,
      reps: 190,
      formScore: student.formScoreAverage - 2,
      calories: 310,
      prsAchieved: 0,
    },
    {
      id: "s3",
      title: "Core Endurance & Handstand Balance",
      date: "24/09/2026",
      duration: 40,
      exercises: 4,
      reps: 160,
      formScore: student.formScoreAverage + 1,
      calories: 260,
      prsAchieved: 1,
    },
    {
      id: "s4",
      title: "Legs & Explosive Calisthenics",
      date: "22/09/2026",
      duration: 48,
      exercises: 5,
      reps: 210,
      formScore: student.formScoreAverage - 1,
      calories: 340,
      prsAchieved: 0,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          Nhật ký các buổi tập gần đây
        </h4>
        <span className="text-xs font-semibold text-[#547EFF] dark:text-[#8CA9FF]">
          Tổng {student.totalWorkouts} buổi
        </span>
      </div>

      <div className="space-y-2.5">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all hover:border-[#8CA9FF] dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    {session.title}
                  </h5>
                  {session.prsAchieved > 0 && (
                    <span className="rounded-full bg-[#FFF2C6] px-2 py-0.2 text-[10px] font-bold text-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
                      +{session.prsAchieved} PR mới
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {session.date}
                </span>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-[#8CA9FF]/15 px-2 py-0.5 text-xs font-bold text-[#1e3a8a] dark:bg-[#8CA9FF]/20 dark:text-[#8CA9FF]">
                <Sparkles className="h-3 w-3 text-[#547EFF]" />
                <span>Form {session.formScore}/100</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 border-t border-slate-100 pt-2 text-center text-[11px] dark:border-slate-800">
              <div className="rounded-lg bg-slate-50 p-1.5 dark:bg-slate-800">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">Thời gian</span>
                <span className="font-bold text-slate-900 dark:text-white">{session.duration} ph</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-1.5 dark:bg-slate-800">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">Bài tập</span>
                <span className="font-bold text-slate-900 dark:text-white">{session.exercises} bài</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-1.5 dark:bg-slate-800">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">Tổng Reps</span>
                <span className="font-bold text-slate-900 dark:text-white">{session.reps}</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-1.5 dark:bg-slate-800">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">Calo</span>
                <span className="font-bold text-slate-900 dark:text-white">{session.calories} kcal</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
