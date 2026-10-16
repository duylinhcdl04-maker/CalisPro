import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  Search,
  Sparkles,
  ShieldCheck,
  Trophy,
  Award,
  Flame,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { useExercisesQuery } from "../../features/exercises/hooks";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/Tabs";
import { ExerciseCard } from "../../components/exercise/ExerciseCard";
import { CoachCard } from "../../components/coach/CoachCard";
import { MOCK_COACHES } from "../../services/mock/coachData";
import type { Exercise } from "../../types";
import { RecommendedBadge } from "../../features/plan-choice/RecommendedBadge";
import { useRecommendedSet } from "../../features/plan-choice/api";

type PageMode = "exercises" | "coaches";
type DifficultyFilter = "all" | Exercise["difficulty"];
type CoachSpecialtyFilter = "all" | "skills" | "bodybuilding" | "mobility" | "beginner";

const EXERCISE_FILTERS: { value: DifficultyFilter; label: string }[] = [
  { value: "all", label: "Tất cả bài tập" },
  { value: "Beginner", label: "Beginner (Cơ bản)" },
  { value: "Intermediate", label: "Intermediate (Trung cấp)" },
  { value: "Advanced", label: "Advanced (Nâng cao)" },
];

const COACH_FILTERS: { value: CoachSpecialtyFilter; label: string }[] = [
  { value: "all", label: "Tất cả Coach" },
  { value: "skills", label: "Chinh phục Kỹ năng (Planche/Lever)" },
  { value: "bodybuilding", label: "Tăng cơ - Weighted Calis" },
  { value: "mobility", label: "Handstand & Mobility" },
  { value: "beginner", label: "Dành cho người mới" },
];

export default function ExerciseLibraryPage() {
  const [mode, setMode] = useState<PageMode>("exercises");
  const [exerciseFilter, setExerciseFilter] = useState<DifficultyFilter>("all");
  const [coachFilter, setCoachFilter] = useState<CoachSpecialtyFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: exercises, isLoading, isError, refetch, isFetching } = useExercisesQuery();
  const recommended = useRecommendedSet();

  // Filter exercises
  const filteredExercises = exercises?.filter((ex) => {
    const matchesDifficulty = exerciseFilter === "all" || ex.difficulty === exerciseFilter;
    const matchesSearch =
      searchQuery === "" ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.primaryMuscles.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDifficulty && matchesSearch;
  });

  // Filter coaches
  const filteredCoaches = MOCK_COACHES.filter((coach) => {
    let matchesCategory = true;
    if (coachFilter === "skills") {
      matchesCategory = coach.specialties.some((s) => s.toLowerCase().includes("planche") || s.toLowerCase().includes("static") || s.toLowerCase().includes("skill"));
    } else if (coachFilter === "bodybuilding") {
      matchesCategory = coach.specialties.some((s) => s.toLowerCase().includes("weighted") || s.toLowerCase().includes("tăng cơ"));
    } else if (coachFilter === "mobility") {
      matchesCategory = coach.specialties.some((s) => s.toLowerCase().includes("handstand") || s.toLowerCase().includes("mobility") || s.toLowerCase().includes("khớp"));
    } else if (coachFilter === "beginner") {
      matchesCategory = coach.specialties.some((s) => s.toLowerCase().includes("người mới") || s.toLowerCase().includes("nền tảng"));
    }

    const matchesSearch =
      searchQuery === "" ||
      coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      coach.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
      {/* 🌟 TOP HEADER WITH MAIN SELECTION MODES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
            {mode === "exercises" ? "Thư viện bài tập" : "Huấn luyện viên Calisthenics"}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {mode === "exercises"
              ? "Tìm bài tập phù hợp và xem lộ trình nâng cấp độ khó."
              : "Đội ngũ Master Coach giàu kinh nghiệm với thành tích thi đấu & chứng chỉ quốc tế được kiểm duyệt minh bạch 100%."}
          </p>
        </div>

        {/* PRIMARY MODE SELECTION TOGGLE */}
        <div className="flex items-center rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] p-1 border border-border shadow-xs shrink-0">
          <button
            type="button"
            onClick={() => {
              setMode("exercises");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
              mode === "exercises"
                ? "bg-white dark:bg-slate-800 text-[#1e3a8a] dark:text-[#8CA9FF] font-extrabold shadow-xs border border-[#8CA9FF]/30"
                : "text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-white/5"
            }`}
          >
            <BookOpen size={15} />
            Thư viện bài tập
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("coaches");
              setSearchQuery("");
            }}
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
              mode === "coaches"
                ? "bg-white dark:bg-slate-800 text-[#1e3a8a] dark:text-[#8CA9FF] font-extrabold shadow-xs border border-[#8CA9FF]/30"
                : "text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-white/5"
            }`}
          >
            <Users size={15} />
            Tập với Coach
            <span className="rounded-full bg-amber-400 text-amber-950 px-1.5 py-0.2 text-[9px] font-extrabold uppercase shadow-2xs">
              1:1
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📚 MODE 1: EXERCISES LIBRARY */}
      {/* ========================================================= */}
      {mode === "exercises" && (
        <div className="space-y-6">
          {/* Sub Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Tabs
              value={exerciseFilter}
              onValueChange={(value) => setExerciseFilter(value as DifficultyFilter)}
              className="w-full sm:w-auto"
            >
              <TabsList className="bg-surface-elevated border border-border">
                {EXERCISE_FILTERS.map((f) => (
                  <TabsTrigger key={f.value} value={f.value} className="text-xs">
                    {f.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Tìm bài tập, nhóm cơ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-secondary/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Exercise Grid */}
          {isError ? (
            <div className="mt-10 text-center py-12 rounded-2xl border border-border bg-surface">
              <p className="text-sm text-text-secondary">Không tải được thư viện bài tập.</p>
              <Button variant="outline" className="mt-3" onClick={() => refetch()} disabled={isFetching}>
                Thử lại
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                  : filteredExercises?.map((ex) => (
                      <Link key={ex.id} to={`/exercises/${ex.id}`} className="relative block">
                        {recommended.has(ex.id) && <RecommendedBadge className="absolute right-3 top-3 z-10 backdrop-blur" />}
                        <ExerciseCard exercise={ex} />
                      </Link>
                    ))}
              </div>

              {!isLoading && filteredExercises?.length === 0 && (
                <div className="text-center py-16 rounded-2xl border border-border bg-surface">
                  <BookOpen size={32} className="mx-auto text-text-secondary/50 mb-2" />
                  <p className="text-sm font-semibold text-text-primary">Không tìm thấy bài tập nào phù hợp</p>
                  <p className="text-xs text-text-secondary mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 🏋️‍♂️ MODE 2: TRAIN WITH COACH (TẬP VỚI COACH) */}
      {/* ========================================================= */}
      {mode === "coaches" && (
        <div className="space-y-6">
          {/* Trust & Transparency Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent-soft/40 via-surface to-emerald-500/10 p-5 md:p-6 shadow-elevated">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-strong">
                  <ShieldCheck size={16} />
                  <span>Cam kết trình độ minh bạch 100%</span>
                </div>
                <h2 className="text-lg md:text-xl font-bold text-text-primary">
                  Huấn Luyện Viên Đẳng Cấp • Đồng Hành 1:1 Cùng Bạn
                </h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Tất cả Coach tại Calis đều sở hữu bằng cấp quốc tế (WSWCF, NASM, FRC, ACE) và có thành tích thi đấu công khai, được thẩm định hồ sơ nghiêm ngặt trước khi tham gia giảng dạy.
                </p>
              </div>

              {/* Verified Trust Stats */}
              <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-border/80 pt-3 md:pt-0 md:pl-6 shrink-0">
                <div className="text-center">
                  <div className="text-base font-extrabold text-accent-strong">500+</div>
                  <div className="text-[10px] text-text-secondary font-medium">Học viên tiến bộ</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-extrabold text-amber-600">4.95 ⭐</div>
                  <div className="text-[10px] text-text-secondary font-medium">Đánh giá trung bình</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-extrabold text-emerald-600">100%</div>
                  <div className="text-[10px] text-text-secondary font-medium">Đã kiểm định</div>
                </div>
              </div>
            </div>
          </div>

          {/* Coach Specialty Filter Tabs & Search */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {COACH_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setCoachFilter(f.value)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    coachFilter === f.value
                      ? "bg-accent-soft text-accent-strong border border-accent/40 shadow-xs"
                      : "bg-surface text-text-secondary border border-border hover:bg-surface-elevated hover:text-text-primary"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Coach Search Box */}
            <div className="relative min-w-[240px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Tìm tên Coach, kỹ năng (Planche, Lever)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-secondary/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Coach Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {filteredCoaches.map((coach) => (
              <CoachCard key={coach.id} coach={coach} />
            ))}
          </div>

          {filteredCoaches.length === 0 && (
            <div className="text-center py-16 rounded-2xl border border-border bg-surface">
              <Users size={32} className="mx-auto text-text-secondary/50 mb-2" />
              <p className="text-sm font-semibold text-text-primary">Không tìm thấy Huấn luyện viên phù hợp</p>
              <p className="text-xs text-text-secondary mt-1">Vui lòng thử chọn chuyên môn khác hoặc tìm kiếm bằng từ khóa khác.</p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
