import { useState } from "react";
import {
  Calendar,
  Clock,
  Dumbbell,
  Flame,
  Trophy,
  Filter,
  Search,
  CheckCircle2,
  Sparkles,
  PlusCircle,
  Activity,
  Award,
} from "lucide-react";
import { MOCK_WORKOUT_HISTORY, type WorkoutHistoryItem } from "../../services/mock/workoutHistoryData";
import { WorkoutHistoryCard } from "./WorkoutHistoryCard";
import { Button } from "../ui/Button";

type CategoryFilter = "all" | WorkoutHistoryItem["category"];

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "Tất cả buổi tập" },
  { value: "Pull", label: "Pull (Lưng xô & Kéo)" },
  { value: "Push", label: "Push (Ngực & Tay sau)" },
  { value: "Skills", label: "Skills (Planche / Lever)" },
  { value: "Legs & Core", label: "Chân & Bụng (Legs & Core)" },
  { value: "Full Body", label: "Toàn thân (Full Body)" },
];

export function WorkoutHistoryView() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = MOCK_WORKOUT_HISTORY.filter((item) => {
    const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
    const matchesQuery =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.muscleGroups.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.exercises.some((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  // Aggregated Stats
  const totalWorkouts = MOCK_WORKOUT_HISTORY.length;
  const totalMinutes = MOCK_WORKOUT_HISTORY.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalReps = MOCK_WORKOUT_HISTORY.reduce((acc, curr) => acc + curr.totalReps, 0);
  const totalPRs = MOCK_WORKOUT_HISTORY.filter((i) => Boolean(i.prBadge)).length;

  return (
    <div className="space-y-6">
      {/* 4 Calisthenics Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-elevated flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent-strong shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-text-secondary">Đã hoàn thành</div>
            <div className="text-xl font-extrabold text-text-primary">28 Buổi</div>
            <div className="text-[10px] text-emerald-600 font-bold mt-0.5">+4 buổi tuần này</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-elevated flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-text-secondary">Tổng thời gian</div>
            <div className="text-xl font-extrabold text-text-primary">1,420 Phút</div>
            <div className="text-[10px] text-text-secondary font-medium mt-0.5">Trung bình 48p/buổi</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-elevated flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
            <Dumbbell size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-text-secondary">Tổng Volume Reps</div>
            <div className="text-xl font-extrabold text-text-primary">4,850+ Reps</div>
            <div className="text-[10px] text-amber-600 font-bold mt-0.5">Bodyweight & Weighted</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-elevated flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 shrink-0">
            <Trophy size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-text-secondary">Kỷ lục mở khóa</div>
            <div className="text-xl font-extrabold text-text-primary">{totalPRs} Kỷ lục PR</div>
            <div className="text-[10px] text-purple-600 font-bold mt-0.5">Tiến bộ vượt bậc 🔥</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                selectedCategory === cat.value
                  ? "bg-accent text-white shadow-xs"
                  : "bg-surface text-text-secondary border border-border hover:bg-surface-elevated hover:text-text-primary"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Tìm theo tên bài, nhóm cơ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-secondary/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* List of Workout Cards */}
      <div className="space-y-4">
        {filteredHistory.map((workout) => (
          <WorkoutHistoryCard key={workout.id} workout={workout} />
        ))}

        {filteredHistory.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-border bg-surface">
            <Calendar size={32} className="mx-auto text-text-secondary/50 mb-2" />
            <p className="text-sm font-semibold text-text-primary">Không tìm thấy buổi tập nào phù hợp</p>
            <p className="text-xs text-text-secondary mt-1">Thử thay đổi bộ lọc hoặc xóa từ khóa tìm kiếm.</p>
          </div>
        )}
      </div>
    </div>
  );
}
