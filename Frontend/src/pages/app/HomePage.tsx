import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Battery,
  Moon,
  Activity,
  Frown,
  Sparkles,
  Trophy,
  Flame,
  Calendar,
  Clock,
  ArrowRight,
  Dumbbell,
} from "lucide-react";
import { Tooltip, Progress, Badge as AntBadge } from "antd";
import { useAuth } from "../../features/auth/AuthContext";
import { useHomeQuery } from "../../features/home/hooks";
import { WorkoutSkeleton, CardSkeleton } from "../../components/ui/Skeleton";
import { TodayWorkoutCard } from "../../components/workout/TodayWorkoutCard";
import { FitnessScoreRadial } from "../../components/fitness/FitnessScoreRadial";
import { FitnessStatusGrid } from "../../components/fitness/FitnessStatusGrid";
import { AICoachCard } from "../../components/coach/AICoachCard";
import { ClayTileIcon } from "../../components/ui/ClayTileIcon";
import { JourneyCard } from "../../features/assessment-v2/journey";
import { LevelPendingBanner } from "../../features/level/LevelPendingBanner";
import { PlanChoiceBanner } from "../../features/plan-choice/PlanChoiceBanner";
import { RecommendedExercises } from "../../features/plan-choice/RecommendedExercises";
import { DailyCheckinCard } from "../../features/exp/DailyCheckinCard";
import { HomeStreakBannerCard } from "../../components/streak/HomeStreakBannerCard";
import { EXERCISES } from "../../services/mock/exerciseLibrary";
import type { PersonalRecord } from "../../types";

function Section({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 16 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      {children}
    </motion.div>
  );
}

const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus } as const;

function PersonalRecordCard({ record }: { record: PersonalRecord }) {
  const TrendIcon = TREND_ICON[record.trend];
  const colorClass =
    record.trend === "up" ? "text-emerald-500 bg-emerald-500/10" : record.trend === "down" ? "text-rose-500 bg-rose-500/10" : "text-text-secondary bg-black/5";

  return (
    <div className="clay-card-interactive p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <div className="text-xs font-semibold text-text-secondary truncate">{record.exercise}</div>
        <div className="mt-2 text-2xl font-black tracking-tight text-text-primary">
          {record.value}
          {record.unit && <span className="ml-1 text-xs font-semibold text-text-secondary">{record.unit}</span>}
        </div>
      </div>
      <div className={`mt-3 inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-0.5 text-xs font-bold ${colorClass}`}>
        <TrendIcon size={12} />
        <span>{record.changeLabel}</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } = useHomeQuery(user?.name ?? "");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-10">
        <WorkoutSkeleton />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-5xl p-6 md:p-10">
        <div className="clay-card p-10 text-center">
          <p className="text-text-secondary font-medium">Không tải được dữ liệu tổng quan. Vui lòng thử lại.</p>
          <button
            type="button"
            className="clay-btn clay-btn-emerald mt-4 text-sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Đang thử lại..." : "Thử lại"}
          </button>
        </div>
      </div>
    );
  }

  const firstName = data.user.name.trim().split(/\s+/)[0] || data.user.name;
  const completionRate =
    data.weeklySummary.plannedWorkouts > 0
      ? Math.round((data.weeklySummary.completedWorkouts / data.weeklySummary.plannedWorkouts) * 100)
      : 0;

  const readinessMessage =
    data.readiness.score >= 70
      ? "Chỉ số phục hồi rất tốt! Cơ thể bạn đang ở trạng thái sung mãn nhất cho buổi tập hôm nay."
      : "Khả năng phục hồi của bạn đang ở mức trung bình. Hãy khởi động kỹ và cân nhắc bài tập nhẹ nhàng hơn.";

  const recommendedIds = data.recommendedExerciseIds ?? [];
  const recommendedExercises = (
    recommendedIds.length > 0
      ? recommendedIds.map((id) => EXERCISES.find((e) => e.id === id)).filter((e): e is typeof EXERCISES[number] => !!e)
      : EXERCISES.slice(0, 4)
  ).slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl space-y-7 p-5 sm:p-8 md:p-10">
      {/* Nhắc hành trình đánh giá V2 (tự ẩn khi V2 tắt hoặc đã xong) */}
      <JourneyCard />
      <LevelPendingBanner />
      <PlanChoiceBanner />
      <RecommendedExercises />
      <DailyCheckinCard />

      {/* 1. Senior Executive Header Greeting with Quick Status Chips */}
      <Section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              Chào {firstName} <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="mt-1 text-sm text-text-secondary font-medium">
              Sẵn sàng cho buổi tập calisthenics hôm nay chưa?
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Level Chip */}
            <div className="inline-flex items-center gap-1.5 rounded-2xl bg-surface border border-white/90 dark:border-white/10 px-3.5 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 shadow-[0_4px_14px_rgba(0,0,0,0.03),inset_0_1.5px_2px_rgba(255,255,255,0.9)]">
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
              <span>Level 3 • Chiến binh</span>
            </div>

            {/* Streak Chip */}
            <Link
              to="/progress?tab=streak"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 text-xs font-extrabold text-amber-600 shadow-2xs hover:bg-amber-500/20 hover:scale-105 transition-all"
            >
              <ClayTileIcon icon={Flame} color="amber" size="xs" />
              <span>{data.weeklySummary.streak} ngày streak</span>
              <ArrowRight size={12} className="opacity-70" />
            </Link>
          </div>
        </div>
      </Section>

      {/* 1.5. Interactive Streak & Milestones Banner */}
      <Section delay={0.03}>
        <HomeStreakBannerCard />
      </Section>

      {/* 2. Unified Bento Hero: Today's Workout (Left) + Weekly Goal & Momentum Widget (Right) */}
      <Section delay={0.05}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Main Hero Card: Today's Workout */}
          <div className="lg:col-span-7 xl:col-span-8 flex">
            <TodayWorkoutCard today={data.today} className="w-full flex flex-col justify-between" />
          </div>

          {/* Context Card: Active Goal & Weekly Plan Momentum */}
          <div className="lg:col-span-5 xl:col-span-4 flex">
            <div className="clay-card p-6 w-full flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-surface via-surface to-sky-500/5 border border-sky-500/20">
              {/* Soft Ambient Light Bevel */}
              <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-sky-400/15 blur-2xl" />

              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-black/[0.04] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.14em] text-sky-700 dark:text-sky-400">
                    <ClayTileIcon icon={Sparkles} color="sky" size="xs" />
                    <span>Mục tiêu tuần</span>
                  </div>
                  <span className="text-[11px] font-bold text-sky-600 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                    Tuần 3/8
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Trọng tâm rèn luyện</div>
                  <div className="mt-1 text-lg font-black tracking-tight text-text-primary flex items-center gap-2">
                    <ClayTileIcon icon={Target} color="sky" size="xs" />
                    <span>{data.primaryGoal.name}</span>
                  </div>
                </div>

                {/* Progress Visual Indicator */}
                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-text-secondary">Tiến độ kế hoạch</span>
                    <span className="text-sky-600 dark:text-sky-400 font-extrabold">{completionRate}%</span>
                  </div>
                  <Progress
                    percent={completionRate}
                    showInfo={false}
                    strokeColor={{ "0%": "#38bdf8", "100%": "#0284c7" }}
                    strokeWidth={8}
                    trailColor="rgba(0,0,0,0.05)"
                  />
                  <div className="flex items-center justify-between text-[11px] text-text-secondary font-medium pt-1">
                    <span>Hoàn thành: <strong className="text-text-primary">{data.weeklySummary.completedWorkouts}/{data.weeklySummary.plannedWorkouts}</strong> buổi</span>
                    <span>~{Math.round(data.weeklySummary.totalMinutes / 60)}h tập</span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium">Giáo án cá nhân hóa</span>
                <Link
                  to="/progress"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors group"
                >
                  <span>Xem tiến độ</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Overall Fitness Section (3D Dial + Metrics) */}
      <Section delay={0.1}>
        <div className="clay-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.06] pb-4 mb-6">
            <div className="flex items-center gap-3 font-display text-base font-extrabold text-text-primary">
              <ClayTileIcon icon={Trophy} color="amber" size="sm" />
              <span>Thể lực tổng thể</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-500/15 px-3 py-1 rounded-full border border-sky-500/20">
                Chuẩn Calisthenics Level 3
              </span>
              <Link
                to="/fitness-profile"
                className="text-xs font-black text-[#547EFF] hover:text-[#3864e0] dark:text-[#8CA9FF] inline-flex items-center gap-1 transition-transform hover:translate-x-0.5"
              >
                Hồ sơ thể chất <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center gap-8 md:flex-row md:items-center">
            <FitnessScoreRadial score={data.fitness.overallScore} />
            <div className="w-full flex-1">
              <FitnessStatusGrid fitness={data.fitness} />
            </div>
          </div>
        </div>
      </Section>

      {/* 4. Weekly Summary (4 Clay tactile mini-cards) */}
      <Section delay={0.15}>
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-4">
          <div className="clay-card-interactive p-5">
            <div className="flex items-center justify-between text-text-secondary text-xs font-semibold">
              <span>Buổi tập tuần</span>
              <ClayTileIcon icon={Calendar} color="sky" size="xs" />
            </div>
            <div className="mt-3 text-2xl font-black tracking-tight text-text-primary">
              {data.weeklySummary.completedWorkouts}
              <span className="text-sm font-bold text-text-secondary">/{data.weeklySummary.plannedWorkouts}</span>
            </div>
            <div className="mt-2 text-[11px] font-medium text-sky-600">
              Đạt kế hoạch {data.weeklySummary.completedWorkouts >= data.weeklySummary.plannedWorkouts ? "100%" : "đang tập"}
            </div>
          </div>

          <div className="clay-card-interactive p-5">
            <div className="flex items-center justify-between text-text-secondary text-xs font-semibold">
              <span>Thời gian tập</span>
              <ClayTileIcon icon={Clock} color="indigo" size="xs" />
            </div>
            <div className="mt-3 text-2xl font-black tracking-tight text-text-primary">
              {data.weeklySummary.totalMinutes}
              <span className="ml-1 text-xs font-bold text-text-secondary">phút</span>
            </div>
            <div className="mt-2 text-[11px] font-medium text-indigo-600">
              ~{Math.round(data.weeklySummary.totalMinutes / 60)}h chất lượng
            </div>
          </div>

          <Link to="/progress?tab=streak" className="clay-card-interactive p-5 block group">
            <div className="flex items-center justify-between text-text-secondary text-xs font-semibold">
              <span className="group-hover:text-amber-600 transition-colors">Streak hiện tại</span>
              <ClayTileIcon icon={Flame} color="amber" size="xs" />
            </div>
            <div className="mt-3 text-2xl font-black tracking-tight text-text-primary flex items-baseline gap-1">
              <span>{data.weeklySummary.streak}</span>
              <span className="text-xs font-bold text-text-secondary">ngày liên tiếp</span>
            </div>
            <div className="mt-2 text-[11px] font-bold text-amber-600 flex items-center justify-between">
              <span>Giữ vững phong độ! 🔥</span>
              <span className="text-[10px] text-[#547EFF] group-hover:underline">Chi tiết mốc →</span>
            </div>
          </Link>

          <div className="clay-card-interactive p-5">
            <div className="flex items-center justify-between text-text-secondary text-xs font-semibold">
              <span>Tỷ lệ hoàn thành</span>
              <ClayTileIcon icon={Sparkles} color="emerald" size="xs" />
            </div>
            <div className="mt-3 text-2xl font-black tracking-tight text-text-primary">
              {completionRate}%
            </div>
            <div className="mt-2">
              <Progress
                percent={completionRate}
                showInfo={false}
                strokeColor={{ "0%": "#38bdf8", "100%": "#0284c7" }}
                strokeWidth={5}
                trailColor="rgba(0,0,0,0.04)"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* 5. Readiness Card */}
      <Section delay={0.2}>
        <div className="clay-card p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
            <div className="font-display text-base font-extrabold text-text-primary flex items-center gap-3">
              <ClayTileIcon icon={Activity} color="rose" size="xs" />
              <span>Sự sẵn sàng hôm nay</span>
            </div>
            <span className="text-xs font-bold text-text-secondary">Cập nhật lúc 06:30</span>
          </div>

          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex items-baseline gap-2 rounded-2xl bg-sky-500/10 border border-sky-500/20 px-5 py-3 shadow-inner">
              <span className="font-display text-4xl font-black text-sky-700 dark:text-sky-400">
                {data.readiness.score}
              </span>
              <span className="text-xs font-bold text-sky-700/60 dark:text-sky-400/60 uppercase">/ 100</span>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary font-medium">{readinessMessage}</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <div className="clay-well p-3.5 flex items-center gap-3">
              <ClayTileIcon icon={Battery} color="emerald" size="sm" />
              <div>
                <div className="text-[11px] font-semibold text-text-secondary">Năng lượng</div>
                <div className="text-sm font-extrabold text-text-primary">{data.readiness.energy}/10</div>
              </div>
            </div>

            <div className="clay-well p-3.5 flex items-center gap-3">
              <ClayTileIcon icon={Moon} color="indigo" size="sm" />
              <div>
                <div className="text-[11px] font-semibold text-text-secondary">Giấc ngủ</div>
                <div className="text-sm font-extrabold text-text-primary">{data.readiness.sleepHours}h</div>
              </div>
            </div>

            <div className="clay-well p-3.5 flex items-center gap-3">
              <ClayTileIcon icon={Frown} color="amber" size="sm" />
              <div>
                <div className="text-[11px] font-semibold text-text-secondary">Đau nhức</div>
                <div className="text-sm font-extrabold text-text-primary">{data.readiness.soreness}/10</div>
              </div>
            </div>

            <div className="clay-well p-3.5 flex items-center gap-3">
              <ClayTileIcon icon={Activity} color="sky" size="sm" />
              <div>
                <div className="text-[11px] font-semibold text-text-secondary">Căng thẳng</div>
                <div className="text-sm font-extrabold text-text-primary">{data.readiness.stress}/10</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 6. AI Coach Insight */}
      <Section delay={0.25}>
        <AICoachCard coach={data.coach} onCtaClick={() => navigate("/progress")} />
      </Section>

      {/* 7. Personal Records */}
      <Section delay={0.3}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-extrabold text-text-primary flex items-center gap-3">
              <ClayTileIcon icon={Trophy} color="amber" size="sm" />
              <span>Kỷ lục cá nhân (PRs)</span>
            </h2>
            <Link to="/progress" className="text-xs font-bold text-sky-600 hover:underline">
              Xem chi tiết →
            </Link>
          </div>

          {data.personalRecords.length > 0 ? (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
              {data.personalRecords.map((record) => (
                <PersonalRecordCard key={record.exercise} record={record} />
              ))}
            </div>
          ) : (
            <div className="clay-card p-8 text-center text-sm text-text-secondary font-medium">
              Hoàn thành buổi tập đầu tiên để bắt đầu theo dõi kỷ lục cá nhân của bạn.
            </div>
          )}
        </div>
      </Section>

      {/* 8. Recommended Exercises with 3D tactile card lifts */}
      <Section delay={0.35}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-extrabold text-text-primary flex items-center gap-3">
              <ClayTileIcon icon={Dumbbell} color="sky" size="sm" />
              <span>Bài tập đề xuất theo thể lực</span>
            </h2>
            <Link to="/exercises" className="text-xs font-bold text-sky-600 hover:underline">
              Thư viện bài tập ({EXERCISES.length}) →
            </Link>
          </div>

          {recommendedExercises.length > 0 ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
              {recommendedExercises.map((exercise) => (
                <Link
                  key={exercise.id}
                  to={`/exercises/${exercise.id}`}
                  className="clay-card-interactive group overflow-hidden flex flex-col"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-black/5">
                    <img
                      src={exercise.imageUrl}
                      alt={exercise.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-xs">
                        {exercise.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-sm font-bold text-text-primary group-hover:text-sky-600 transition-colors line-clamp-1">
                        {exercise.name}
                      </div>
                      <div className="mt-1 text-[11px] font-medium text-text-secondary line-clamp-1">
                        {exercise.primaryMuscles.join(", ")}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs font-bold text-sky-600">
                      <span>Xem hướng dẫn</span>
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="clay-card p-6 text-center text-sm text-text-secondary">
              Chưa có bài tập đề xuất nào lúc này.
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
