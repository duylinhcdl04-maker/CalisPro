import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Dumbbell,
  Play,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Layers,
  Sparkles,
  Award,
  Smartphone,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { workoutPlansService } from "../../services/mock/workoutPlansService";
import { useWorkoutPlanScope } from "../../features/workout-plans/useWorkoutPlanScope";
import { WorkoutPlan, WorkoutWeek, TrainingDay } from "../../types/workoutPlan";

export default function AdminWorkoutPlanPreviewPage() {
  const { base, isCoach } = useWorkoutPlanScope();
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      if (!id) return;
      const p = await workoutPlansService.getWorkoutPlanById(id);
      setPlan(p);
    }
    load();
  }, [id]);

  if (!plan) {
    return <div className="p-8 text-center text-xs text-text-secondary">Đang tải mô phỏng giáo án...</div>;
  }

  const currentWeek = plan.weeks[selectedWeekIndex] || plan.weeks[0];
  const currentDay = currentWeek?.days[selectedDayIndex] || currentWeek?.days[0];

  function toggleCompleteExercise(exId: string) {
    setCompletedExercises((prev) => ({
      ...prev,
      [exId]: !prev[exId],
    }));
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* 1. Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            to={`${base}/${plan.id}`}
            className="rounded-xl border border-border bg-surface p-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-base font-black text-text-primary flex items-center gap-2">
              <span>Mô phỏng Trải nghiệm Học viên</span>
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-strong border border-accent/20">
                Live Simulator
              </span>
            </h1>
            <p className="text-xs text-text-secondary">{plan.name} • {plan.durationWeeks} Tuần • Cấp độ {plan.fitnessLevel}</p>
          </div>
        </div>

        {/* Device Mode Selector */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setPreviewDevice("desktop")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                previewDevice === "desktop" ? "bg-accent text-white shadow-xs" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Monitor size={14} /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice("mobile")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                previewDevice === "mobile" ? "bg-accent text-white shadow-xs" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Smartphone size={14} /> Mobile
            </button>
          </div>
        </div>
      </div>

      {/* 2. Simulator Container */}
      <div className={`mx-auto transition-all duration-300 ${previewDevice === "mobile" ? "max-w-md rounded-3xl border-4 border-text-primary bg-background p-4 shadow-2xl space-y-4" : "space-y-6"}`}>
        {/* Week Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {plan.weeks.map((w, idx) => (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                setSelectedWeekIndex(idx);
                setSelectedDayIndex(0);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedWeekIndex === idx
                  ? "bg-accent text-white shadow-xs"
                  : "bg-surface text-text-secondary border border-border hover:text-text-primary"
              }`}
            >
              Tuần {w.weekNumber}
            </button>
          ))}
        </div>

        {/* Day Selector */}
        <div className="grid grid-cols-3 gap-2">
          {currentWeek?.days.map((day, dIdx) => (
            <button
              key={day.id}
              type="button"
              onClick={() => setSelectedDayIndex(dIdx)}
              className={`rounded-2xl border p-2.5 text-left transition-all cursor-pointer ${
                selectedDayIndex === dIdx
                  ? "border-accent bg-accent-soft/20 ring-1 ring-accent text-accent-strong"
                  : "border-border bg-surface hover:border-border/80 text-text-secondary"
              }`}
            >
              <div className="text-[10px] font-bold uppercase">{day.dayOfWeekTitle}</div>
              <div className="text-xs font-black text-text-primary truncate">{day.name}</div>
            </button>
          ))}
        </div>

        {/* Current Active Day Simulation */}
        {currentDay && (
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-xs space-y-5">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                  {currentDay.dayOfWeekTitle}
                </span>
                <h2 className="text-base font-black text-text-primary mt-1">{currentDay.name}</h2>
                <div className="flex items-center gap-2 text-[11px] text-text-secondary mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> ~{currentDay.estimatedDurationMinutes} phút
                  </span>
                  <span>•</span>
                  <span>Tiêu điểm: {currentDay.focus}</span>
                </div>
              </div>

              <Link
                to={`/workout/${plan.id}/active`}
                className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-black text-white hover:bg-accent-strong shadow-xs transition-colors"
              >
                <Play size={14} fill="currentColor" /> Bắt đầu Tập
              </Link>
            </div>

            {/* Sections & Exercises */}
            <div className="space-y-4">
              {currentDay.sections.map((sec) => (
                <div key={sec.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-text-primary">
                    <span>{sec.name}</span>
                    <span className="text-[10px] text-text-secondary font-semibold">
                      {sec.exercises.length} động tác
                    </span>
                  </div>

                  <div className="space-y-2">
                    {sec.exercises.map((ex) => {
                      const isDone = !!completedExercises[ex.id];
                      return (
                        <div
                          key={ex.id}
                          onClick={() => toggleCompleteExercise(ex.id)}
                          className={`flex items-center justify-between rounded-2xl border p-3.5 transition-all cursor-pointer ${
                            isDone
                              ? "border-emerald-500/40 bg-emerald-500/10 text-text-primary"
                              : "border-border bg-background hover:border-accent"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative h-12 w-14 rounded-xl overflow-hidden border border-border shrink-0">
                              <img src={ex.exerciseImageUrl} alt={ex.exerciseName} className="h-full w-full object-cover" />
                              {isDone && (
                                <div className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center text-white">
                                  <CheckCircle2 size={18} />
                                </div>
                              )}
                            </div>

                            <div className="truncate">
                              <div className={`text-xs font-black truncate ${isDone ? "line-through text-text-secondary" : "text-text-primary"}`}>
                                {ex.exerciseName}
                              </div>
                              <div className="text-[11px] text-text-secondary flex items-center gap-2 mt-0.5">
                                <span className="font-bold text-accent-strong">
                                  {ex.sets} hiệp × {ex.reps}
                                </span>
                                <span>•</span>
                                <span>Nghỉ: {ex.restSeconds}s</span>
                                {ex.rpe && <span>• RPE {ex.rpe}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                                isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-border text-transparent"
                              }`}
                            >
                              <CheckCircle2 size={14} />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
