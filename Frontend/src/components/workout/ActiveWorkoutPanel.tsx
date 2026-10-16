import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Pause, Play, SkipForward, Square } from "lucide-react";
import type { WorkoutPlanDetail } from "../../types";
import { Button } from "../ui/Button";
import { Progress } from "../ui/Progress";
import { RestTimer } from "./RestTimer";

type Phase = "active" | "resting" | "done";

export function ActiveWorkoutPanel({ plan }: { plan: WorkoutPlanDetail }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [phase, setPhase] = useState<Phase>("active");
  const [isPaused, setIsPaused] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    };
  }, []);

  const totalExercises = plan.exercises.length;
  const exercise = plan.exercises[index];
  const nextExercise = plan.exercises[index + 1];
  const isLastSetOfExercise = setNumber >= exercise.sets;
  const isLastExercise = index >= totalExercises - 1;
  const progressValue = phase === "done" ? 100 : (index / totalExercises) * 100;

  function finishWorkout() {
    setPhase("done");
    finishTimeoutRef.current = setTimeout(() => {
      toast.success("Buổi tập đã hoàn thành");
      navigate("/home");
    }, 1100);
  }

  function advance() {
    if (isLastSetOfExercise && isLastExercise) {
      finishWorkout();
      return;
    }
    if (isLastSetOfExercise) {
      setIndex((i) => i + 1);
      setSetNumber(1);
    } else {
      setSetNumber((s) => s + 1);
    }
    setPhase("active");
  }

  function completeSet() {
    if (phase !== "active" || isPaused) return;
    if (isLastSetOfExercise && isLastExercise) {
      finishWorkout();
      return;
    }
    setPhase("resting");
  }

  function skipSet() {
    if (phase !== "active" || isPaused) return;
    advance();
  }

  if (phase === "done") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
          <CheckCircle2 size={64} className="text-accent" />
        </motion.div>
        <div className="font-display text-xl font-bold text-text-primary">Hoàn thành buổi tập!</div>
        <p className="text-sm text-text-secondary">Đang chuyển về trang chủ...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center p-6">
      <Progress value={progressValue} />
      <div className="mt-2 text-center text-xs text-text-secondary">
        Bài {index + 1}/{totalExercises}
      </div>

      <div className="relative mt-8 min-h-[220px]">
        {phase === "resting" ? (
          <RestTimer
            key={`rest-${index}-${setNumber}`}
            seconds={exercise.restSeconds}
            paused={isPaused}
            onComplete={advance}
            onSkip={advance}
          />
        ) : (
          <motion.div
            key={`active-${index}-${setNumber}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-center"
          >
            <div className="text-xs uppercase tracking-[.14em] text-text-secondary">Bài tập hiện tại</div>
            <div className="mt-2 font-display text-3xl font-bold text-text-primary">{exercise.name}</div>
            <div className="mt-3 text-lg text-text-secondary">
              Set {setNumber}/{exercise.sets} · {exercise.reps} · RPE {exercise.rpe}
            </div>

            <div className="mt-6 rounded-md border border-border bg-surface p-4 text-left">
              <div className="text-[11px] uppercase tracking-[.1em] text-text-secondary">Tiếp theo</div>
              <div className="mt-1 text-sm font-semibold text-text-primary">
                {nextExercise ? nextExercise.name : "Đây là bài tập cuối cùng"}
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-surface/95 p-6 text-center backdrop-blur-sm"
            >
              <div className="font-display text-xl font-bold text-text-primary">Đã tạm dừng</div>
              <p className="text-sm text-text-secondary">Nhấn tiếp tục khi bạn sẵn sàng.</p>
              <Button size="lg" onClick={() => setIsPaused(false)}>
                <Play size={16} /> Tiếp tục buổi tập
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-10 space-y-3">
        {phase === "active" && (
          <>
            <Button className="w-full" size="lg" onClick={completeSet} disabled={isPaused}>
              Hoàn thành set
            </Button>
            <Button variant="secondary" className="w-full" onClick={skipSet} disabled={isPaused}>
              <SkipForward size={16} /> Bỏ qua
            </Button>
          </>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setIsPaused((p) => !p)}>
            {isPaused ? (
              <>
                <Play size={16} /> Tiếp tục
              </>
            ) : (
              <>
                <Pause size={16} /> Tạm dừng buổi tập
              </>
            )}
          </Button>

          {confirmEnd ? (
            <div className="flex flex-1 gap-2">
              <Button variant="destructive" className="flex-1" onClick={() => navigate(`/workout/${plan.id}`)}>
                Xác nhận
              </Button>
              <Button variant="ghost" onClick={() => setConfirmEnd(false)}>
                Hủy
              </Button>
            </div>
          ) : (
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmEnd(true)}>
              <Square size={16} /> Kết thúc buổi tập
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
