import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Bell,
  Clock,
  Dumbbell,
  Pause,
  Play,
  CheckCircle2,
  Sparkles,
  Award,
  ChevronRight,
  Flame,
  Activity,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { CURRENT_WORKOUT_SESSION, type ExerciseGuideDetail } from "../../services/mock/workoutTrainingData";
import { apiClient } from "../../lib/api/client";
import type { BackendExerciseResponse } from "../../features/exercises/api";
import { WorkoutVideoPlayer } from "./WorkoutVideoPlayer";
import { ExerciseInstructionTabs } from "./ExerciseInstructionTabs";
import { ActiveSetController } from "./ActiveSetController";
import { WorkoutSidebarWidgets } from "./WorkoutSidebarWidgets";
import { Button } from "../ui/Button";
import { useAuth } from "../../features/auth/AuthContext";
import { GlowingAvatar } from "../ui/GlowingAvatar";

export function WorkoutTrainingView() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState(CURRENT_WORKOUT_SESSION);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [repsCount, setRepsCount] = useState(10);
  const [completedSetsMap, setCompletedSetsMap] = useState<Record<string, number[]>>({});
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([]);
  const [isResting, setIsResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);
  const [totalWorkoutSeconds, setTotalWorkoutSeconds] = useState(0);
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);
  const [isWorkoutFinished, setIsWorkoutFinished] = useState(false);

  // 🚀 Fetch Real Exercises from Backend API (With Full Phases, Muscles, Cues, Mistakes)
  useEffect(() => {
    let isMounted = true;
    async function loadRealExercises() {
      try {
        const res = await apiClient.get<BackendExerciseResponse[]>("/exercises");
        if (res.data && res.data.length > 0 && isMounted) {
          // Filter exercises with complete details (e.g. push-up, knee-push-up, pike-push-up, dips, australian-pull-up)
          const detailedList = res.data.filter(
            (e) => e.details?.phases && e.details.phases.length > 0
          );
          const exercisesToUse = detailedList.length >= 3 ? detailedList : res.data;

          const mappedExercises: ExerciseGuideDetail[] = exercisesToUse.slice(0, 5).map((e) => {
            const primary = e.details?.muscleTargets
              ?.filter((m) => m.role?.toUpperCase() === "PRIMARY")
              .map((m) => m.muscleNameVi || m.muscleName || m.muscleCode) || [];
            const secondary = e.details?.muscleTargets
              ?.filter((m) => m.role?.toUpperCase() === "SECONDARY" || m.role?.toUpperCase() === "STABILIZER")
              .map((m) => m.muscleNameVi || m.muscleName || m.muscleCode) || [];

            return {
              id: e.code || String(e.id),
              name: e.name,
              category: (e.categoryName as any) || "Push",
              difficulty: (e.difficultyLevel as any) || "Intermediate",
              equipment: (e.equipmentRequired ? "Pull-up Bar" : "Bodyweight") as any,
              videoThumbnail:
                e.thumbnailUrl ||
                `https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=1200&q=80`,
              videoUrl: e.videoUrl,
              primaryMuscles: primary.length > 0 ? primary : [e.categoryName || "Toàn thân"],
              secondaryMuscles: secondary.length > 0 ? secondary : ["Calisthenics"],
              defaultSets: 3,
              targetReps: "8 - 12",
              restSeconds: 60,
              rpe: 7.5,
              instructions:
                e.details?.phases?.map(
                  (p) => `${p.vietnameseName || p.name}: ${p.description || ""}`
                ) || [e.description || ""],
              startPositionImage:
                e.details?.anatomyImages?.[0]?.url ||
                "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=600&q=80",
              bottomPositionImage:
                e.details?.anatomyImages?.[1]?.url ||
                "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80",
              tips: e.details?.coachingCues?.map((c) => c.text) || ["Giữ chắc thân người", "Hít thở đều đặn"],
              commonMistakes:
                e.details?.commonMistakes?.map((m) => `${m.name}: ${m.correction || m.problem || ""}`) || [],
              notesPrompt: `Ghi chú cho bài ${e.name}`,
              details: e.details,
            };
          });

          if (mappedExercises.length > 0) {
            setSession((prev) => ({
              ...prev,
              title: "Upper Body Strength & Biomechanics",
              exercises: mappedExercises,
            }));
          }
        }
      } catch (err) {
        console.warn("Could not load backend exercises for workout session", err);
      }
    }
    loadRealExercises();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeExercise = session.exercises[activeExerciseIndex] || session.exercises[0];
  const totalExercises = session.exercises.length;
  const currentCompletedSets = activeExercise ? (completedSetsMap[activeExercise.id] ?? []) : [];


  // Workout Timer Tick
  useEffect(() => {
    if (isWorkoutPaused || isWorkoutFinished) return;
    const interval = setInterval(() => {
      setTotalWorkoutSeconds((s) => s + 1);
      if (isResting) {
        setRestSeconds((r) => {
          if (r <= 1) {
            setIsResting(false);
            toast.info(`Hết thời gian nghỉ`, {
              description: `Bắt đầu hiệp ${currentSet} bài ${activeExercise.name}.`,
            });
            return activeExercise.restSeconds;
          }
          return r - 1;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isWorkoutPaused, isWorkoutFinished, isResting, currentSet, activeExercise.restSeconds, activeExercise.name]);

  // Overall workout progress percentage
  const progressPercent = Math.round(
    ((completedExerciseIds.length + (currentSet - 1) / activeExercise.defaultSets) / totalExercises) * 100
  );

  function handleCompleteSet() {
    const updatedSets = [...currentCompletedSets, repsCount];
    const newMap = { ...completedSetsMap, [activeExercise.id]: updatedSets };
    setCompletedSetsMap(newMap);

    // If completed all sets for this exercise
    if (updatedSets.length >= activeExercise.defaultSets) {
      if (!completedExerciseIds.includes(activeExercise.id)) {
        const nextCompleted = [...completedExerciseIds, activeExercise.id];
        setCompletedExerciseIds(nextCompleted);

        toast.success(`Hoàn thành bài ${activeExercise.name}`, {
          description: "Chuyển tiếp sang bài tập kế tiếp trong giáo án.",
        });

        // Check if finished entire workout
        if (nextCompleted.length >= totalExercises) {
          setIsWorkoutFinished(true);
          toast.success("Hoàn thành buổi tập", {
            description: "Tất cả bài tập hôm nay đã được lưu vào lịch sử tiến độ.",
          });
          return;
        }
      }

      // Advance to next exercise
      if (activeExerciseIndex < totalExercises - 1) {
        setActiveExerciseIndex(activeExerciseIndex + 1);
        setCurrentSet(1);
        setRepsCount(10);
      }
    } else {
      // Advance to next set and trigger rest timer
      setCurrentSet(currentSet + 1);
      setIsResting(true);
      setRestSeconds(activeExercise.restSeconds);
      toast.success(`Ghi nhận hiệp ${currentSet}: ${repsCount} reps`, {
        description: `Bắt đầu đếm ngược ${activeExercise.restSeconds}s thời gian nghỉ ngơi.`,
      });
    }
  }

  function handleSkipExercise() {
    if (activeExerciseIndex < totalExercises - 1) {
      setActiveExerciseIndex(activeExerciseIndex + 1);
      setCurrentSet(1);
      setRepsCount(10);
      toast.info("Đã bỏ qua bài tập", {
        description: `Chuyển sang bài ${session.exercises[activeExerciseIndex + 1].name}.`,
      });
    } else {
      setIsWorkoutFinished(true);
    }
  }

  function handleNextExercise() {
    if (activeExerciseIndex < totalExercises - 1) {
      setActiveExerciseIndex(activeExerciseIndex + 1);
      setCurrentSet(1);
      setRepsCount(10);
    } else {
      setIsWorkoutFinished(true);
    }
  }

  function handleSelectExercise(idx: number) {
    setActiveExerciseIndex(idx);
    const sets = completedSetsMap[session.exercises[idx].id] ?? [];
    setCurrentSet(Math.min(sets.length + 1, session.exercises[idx].defaultSets));
    setRepsCount(10);
    setIsResting(false);
  }

  function handleAddRestSeconds(secs: number) {
    setRestSeconds((r) => r + secs);
    toast.info(`Đã cộng thêm ${secs}s`, {
      description: "Kéo dài thời gian phục hồi cơ bắp.",
    });
  }

  function handleSkipRest() {
    setIsResting(false);
    setRestSeconds(activeExercise.restSeconds);
    toast.info("Đã kết thúc thời gian nghỉ", {
      description: "Sẵn sàng cho hiệp tập tiếp theo.",
    });
  }

  function handleTogglePause() {
    setIsWorkoutPaused(!isWorkoutPaused);
    if (isWorkoutPaused) {
      toast.success("Tiếp tục buổi tập", {
        description: "Đồng hồ và thời gian tập luyện đang chạy trở lại.",
      });
    } else {
      toast.info("Đã tạm dừng buổi tập", {
        description: "Thời gian tập luyện được giữ nguyên trạng thái.",
      });
    }
  }

  if (isWorkoutFinished) {
    return (
      <div className="mx-auto max-w-2xl py-16 px-6 text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 text-accent border-2 border-accent animate-bounce">
          <Trophy size={40} />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-3xl font-extrabold text-text-primary">
            Hoàn thành xuất sắc buổi tập!
          </h2>
          <p className="text-sm text-text-secondary">
            Bạn đã hoàn thành 100% giáo án {session.title} ({session.dayLabel}).
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-surface p-4 border border-border">
          <div className="text-center">
            <div className="text-xs text-text-secondary">Thời gian</div>
            <div className="text-lg font-bold text-text-primary">{Math.floor(totalWorkoutSeconds / 60)} phút</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-text-secondary">Bài tập</div>
            <div className="text-lg font-bold text-accent-strong">{totalExercises} bài</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-text-secondary">Calo tiêu thụ</div>
            <div className="text-lg font-bold text-amber-600">~385 kcal</div>
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate("/progress")}>
            Xem lịch sử tiến độ
          </Button>
          <Button onClick={() => navigate("/home")} className="bg-accent hover:bg-accent-strong text-white px-6">
            Trở về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 md:space-y-6 px-3 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 pb-28 lg:pb-8">
      {/* 🧭 1. TOP HEADER NAVIGATION BAR */}
      <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3 sm:pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/home"
            className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Quay lại tổng quan (Back to Workouts)</span>
            <span className="sm:hidden">Quay lại</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search on Desktop */}
          <div className="relative hidden md:block min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Tìm bài tập..."
              className="w-full rounded-xl border border-border bg-surface pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none"
            />
          </div>

          {/* User Profile Mini Badge */}
          <div className="flex items-center gap-2">
            <GlowingAvatar
              size="sm"
              fallback={user?.name?.[0] ?? "U"}
              src={user?.avatarUrl}
              isEditable={false}
            />
            <span className="text-xs font-bold text-text-primary hidden sm:inline-block">
              {user?.name ?? "Minh"}
            </span>
          </div>
        </div>
      </div>

      {/* 🏋️‍♂️ 2. WORKOUT SESSION TITLE STRIP */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 shadow-elevated">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong shadow-xs">
            <Dumbbell size={22} className="sm:w-6 sm:h-6" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-lg sm:text-xl md:text-2xl font-black text-text-primary tracking-tight truncate">
                {session.title}
              </h1>
              <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-strong border border-accent/20 shrink-0">
                {session.dayLabel}
              </span>
            </div>

            <p className="text-xs text-text-secondary max-w-xl line-clamp-2 sm:line-clamp-none">{session.description}</p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 text-[11px] sm:text-xs text-text-secondary font-medium">
              <span>{totalExercises} bài</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {session.durationMinutes}p
              </span>
              <span>•</span>
              <span className="rounded-md bg-amber-500/10 text-amber-600 font-bold px-1.5 py-0.5 text-[10px] sm:text-[11px]">
                {session.difficulty}
              </span>
              <span className="hidden sm:inline">•</span>
              <div className="hidden sm:flex items-center gap-1">
                {session.categories.map((cat) => (
                  <span key={cat} className="text-xs font-semibold text-text-primary">
                    • {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Progress Ring & Pause Button */}
        <div className="flex items-center gap-4 sm:gap-5 border-t lg:border-t-0 pt-3 lg:pt-0 justify-between lg:justify-end">
          <div className="flex items-center gap-3">
            {/* Progress Circular Ring */}
            <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 border-accent/20 bg-surface shrink-0">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-accent"
                  strokeDasharray="251"
                  strokeDashoffset={251 - (progressPercent / 100) * 251}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-xs font-black text-text-primary">{progressPercent}%</span>
            </div>

            <div>
              <div className="text-xs font-bold text-text-primary">Tiến độ buổi tập</div>
              <div className="text-[11px] text-text-secondary">
                {completedExerciseIds.length} / {totalExercises} bài xong
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleTogglePause}
            className={`gap-1.5 px-3.5 sm:px-4 font-bold text-xs shrink-0 ${
              isWorkoutPaused
                ? "bg-accent hover:bg-accent-strong text-white"
                : "bg-surface-elevated text-text-primary border border-border hover:bg-accent-soft"
            }`}
          >
            {isWorkoutPaused ? <Play size={14} className="fill-current" /> : <Pause size={14} />}
            {isWorkoutPaused ? "Tiếp tục" : "Tạm dừng"}
          </Button>
        </div>
      </div>

      {/* 📱 MOBILE HORIZONTAL EXERCISE SWIPER / SELECTOR (Visible on mobile/tablet, hidden on desktop) */}
      <div className="lg:hidden rounded-2xl border border-border/80 bg-surface p-3 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-bold text-text-primary">Danh sách bài tập hôm nay</span>
          <span className="text-[11px] text-accent-strong font-bold">
            {activeExerciseIndex + 1}/{totalExercises} • Bài {activeExercise.name}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
          {session.exercises.map((ex, idx) => {
            const isCurrent = idx === activeExerciseIndex;
            const isDone = completedExerciseIds.includes(ex.id);

            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleSelectExercise(idx)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 border shrink-0 text-left transition-all cursor-pointer ${
                  isCurrent
                    ? "border-accent bg-accent-soft/40 shadow-xs ring-1 ring-accent"
                    : isDone
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-border/70 bg-surface-elevated text-text-secondary"
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-accent text-white"
                      : "bg-surface text-text-secondary border border-border"
                  }`}
                >
                  {isDone ? <CheckCircle2 size={12} className="stroke-[3]" /> : idx + 1}
                </div>

                <div className="max-w-[120px]">
                  <div
                    className={`text-xs font-bold truncate ${
                      isCurrent ? "text-accent-strong" : isDone ? "text-text-primary" : "text-text-primary"
                    }`}
                  >
                    {ex.name}
                  </div>
                  <div className="text-[10px] text-text-secondary truncate">
                    {ex.defaultSets} sets • {ex.targetReps} reps
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🔔 MOBILE FLOATING REST TIMER NOTIFICATION (When resting on mobile) */}
      {isResting && (
        <div className="lg:hidden rounded-2xl border-2 border-accent bg-gradient-to-r from-accent-soft/50 via-surface to-accent-soft/30 p-3.5 shadow-elevated flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white font-black text-sm shadow-md">
              {restSeconds}s
            </div>
            <div>
              <div className="text-xs font-black text-text-primary">Đang trong thời gian nghỉ ngơi</div>
              <div className="text-[11px] text-text-secondary">
                Chuẩn bị hiệp {currentSet} bài {activeExercise.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleAddRestSeconds(10)}
              className="rounded-lg bg-surface-elevated border border-border px-2.5 py-1.5 text-xs font-bold text-text-primary hover:bg-accent-soft"
            >
              +10s
            </button>
            <button
              type="button"
              onClick={handleSkipRest}
              className="rounded-lg bg-accent text-white px-2.5 py-1.5 text-xs font-bold hover:bg-accent-strong"
            >
              Xong
            </button>
          </div>
        </div>
      )}

      {/* 🚀 3. MASTER 2-COLUMN TRAINING GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
        {/* LEFT COLUMN: Video Player + Active Set Controller + Instructions Tabs (8 Cols) */}
        <div className="lg:col-span-8 space-y-4 md:space-y-6">
          {/* Main Video & Visual Player */}
          <WorkoutVideoPlayer
            exercise={activeExercise}
            exerciseIndex={activeExerciseIndex}
            totalExercises={totalExercises}
            isPaused={isWorkoutPaused}
            onTogglePause={handleTogglePause}
          />

          {/* Active Set Controller with Circular Rep Counter */}
          <ActiveSetController
            exercise={activeExercise}
            currentSet={currentSet}
            totalSets={activeExercise.defaultSets}
            repsCount={repsCount}
            onRepsChange={setRepsCount}
            completedSets={currentCompletedSets}
            onCompleteSet={handleCompleteSet}
            onSkipExercise={handleSkipExercise}
            onNextExercise={handleNextExercise}
            isLastExercise={activeExerciseIndex >= totalExercises - 1}
          />

          {/* Exercise Instructions & Anatomy Tabs */}
          <ExerciseInstructionTabs exercise={activeExercise} />
        </div>

        {/* RIGHT COLUMN: Sidebar Widgets (Today's List, Timer, Notes) (4 Cols) */}
        <div className="lg:col-span-4">
          <WorkoutSidebarWidgets
            exercises={session.exercises}
            activeExerciseIndex={activeExerciseIndex}
            onSelectExercise={handleSelectExercise}
            completedExerciseIds={completedExerciseIds}
            isResting={isResting}
            restSeconds={restSeconds}
            onAddRestSeconds={handleAddRestSeconds}
            onSkipRest={handleSkipRest}
            totalWorkoutSeconds={totalWorkoutSeconds}
            isWorkoutPaused={isWorkoutPaused}
            onTogglePause={handleTogglePause}
          />
        </div>
      </div>

      {/* 📱 4. MOBILE STICKY BOTTOM ACTION BAR (Floating quick-action footer for mobile) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md p-3 border-t border-border shadow-2xl flex items-center gap-2 sm:gap-3 lg:hidden safe-area-bottom">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSkipExercise}
          className="text-xs h-12 px-3 text-text-secondary border-border shrink-0"
        >
          Bỏ qua
        </Button>

        <Button
          size="lg"
          onClick={handleCompleteSet}
          className="flex-1 h-12 bg-accent hover:bg-accent-strong text-white font-bold text-xs sm:text-sm shadow-md gap-1.5 rounded-xl"
        >
          <CheckCircle2 size={17} className="stroke-[2.5]" />
          <span>Hoàn thành hiệp {currentSet}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNextExercise}
          className="text-xs h-12 px-3 border-border hover:border-accent shrink-0"
        >
          {activeExerciseIndex >= totalExercises - 1 ? "Kết thúc" : "Bài tiếp"}
        </Button>
      </div>
    </div>
  );
}
