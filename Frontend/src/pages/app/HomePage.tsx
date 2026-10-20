import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Flame } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { useHomeQuery } from "../../features/home/hooks";
import { HomeCycleCard, HomeFitnessCard, HomeInsightCard, HomeReadinessCard, HomeRecords, HomeTodayCard, HomeWeekTiles } from "../../features/home/HomeSections";
import { levelName } from "../../features/level/levelLabels";
import { WorkoutSkeleton, CardSkeleton } from "../../components/ui/Skeleton";
import { ClayTileIcon } from "../../components/ui/ClayTileIcon";
import { JourneyCard } from "../../features/assessment-v2/journey";
import { LevelPendingBanner } from "../../features/level/LevelPendingBanner";
import { PlanChoiceBanner } from "../../features/plan-choice/PlanChoiceBanner";
import { RecommendedExercises } from "../../features/plan-choice/RecommendedExercises";
import { DailyCheckinCard } from "../../features/exp/DailyCheckinCard";

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

/**
 * Trang Tổng quan của học viên. Mọi số liệu lấy từ /me/home (dữ liệu thật của chính người dùng); mục nào chưa có dữ liệu thì hiện trạng thái
 * trống kèm hướng dẫn, không có số liệu mẫu.
 */
export default function HomePage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch, isFetching } = useHomeQuery();

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
          <p className="font-medium text-text-secondary">Không tải được dữ liệu tổng quan. Vui lòng thử lại.</p>
          <button type="button" className="clay-btn clay-btn-emerald mt-4 text-sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Đang thử lại..." : "Thử lại"}
          </button>
        </div>
      </div>
    );
  }

  const name = user?.name?.trim() ?? "";
  const firstName = name.split(/\s+/)[0] || name || "bạn";

  return (
    <div className="mx-auto max-w-5xl space-y-7 p-5 sm:p-8 md:p-10">
      {/* Nhắc việc theo trạng thái thật của người dùng (tự ẩn khi không cần) */}
      <JourneyCard />
      <LevelPendingBanner />
      <PlanChoiceBanner />
      <RecommendedExercises />
      <DailyCheckinCard />

      {/* Lời chào và level thật */}
      <Section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight text-text-primary sm:text-3xl">Chào {firstName}</h1>
            <p className="mt-1 text-sm font-medium text-text-secondary">Sẵn sàng cho buổi tập calisthenics hôm nay chưa?</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {data.level ? (
              <Link to="/roadmap" className="inline-flex items-center gap-1.5 rounded-2xl border border-white/90 bg-surface px-3.5 py-1.5 text-xs font-bold text-sky-700 shadow-[0_4px_14px_rgba(0,0,0,0.03),inset_0_1.5px_2px_rgba(255,255,255,0.9)] transition hover:scale-105 dark:border-white/10 dark:text-sky-300">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                <span>Level {data.level.code}{levelName(data.level.code) ? ` · ${levelName(data.level.code)}` : ""}{data.level.status === "PROVISIONAL" ? " (tạm thời)" : ""}</span>
              </Link>
            ) : (
              <Link to="/assessment" className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-3.5 py-1.5 text-xs font-bold text-text-secondary transition hover:text-text-primary">Chưa có level · Làm bài đánh giá</Link>
            )}
            {data.streakDays > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-extrabold text-amber-600 shadow-2xs">
                <ClayTileIcon icon={Flame} color="amber" size="xs" />
                <span>{data.streakDays} ngày điểm danh liên tiếp</span>
              </span>
            )}
          </div>
        </div>
      </Section>

      {/* Buổi tập hôm nay và chu kỳ */}
      <Section delay={0.05}>
        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
          <div className="flex lg:col-span-7 xl:col-span-8"><HomeTodayCard today={data.today} className="flex w-full flex-col justify-between" /></div>
          <div className="flex lg:col-span-5 xl:col-span-4"><HomeCycleCard cycle={data.cycle} week={data.week} goal={data.primaryGoal} /></div>
        </div>
      </Section>

      <Section delay={0.1}><HomeFitnessCard data={data} /></Section>

      <Section delay={0.15}><HomeWeekTiles week={data.week} streakDays={data.streakDays} /></Section>

      <Section delay={0.2}><HomeReadinessCard readiness={data.readiness} /></Section>

      {data.insight && <Section delay={0.25}><HomeInsightCard insight={data.insight} /></Section>}

      <Section delay={0.3}><HomeRecords records={data.records} /></Section>

      <div className="flex justify-end">
        <Link to="/progress" className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:underline">Xem tiến độ chi tiết <ArrowRight size={13} aria-hidden /></Link>
      </div>
    </div>
  );
}
