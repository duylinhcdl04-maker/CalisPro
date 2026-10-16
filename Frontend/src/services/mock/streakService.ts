import { StreakData, StreakMilestoneBadge } from "../../types/streak";

const MOCK_MILESTONES: StreakMilestoneBadge[] = [
  {
    id: "streak-3",
    daysRequired: 3,
    title: "Tia Lửa Khởi Đầu",
    subtitle: "3 Ngày Liên Tiếp",
    description: "Khởi động hành trình Calisthenics với 3 ngày tập luyện không ngắt quãng.",
    iconName: "Flame",
    tier: "bronze",
    status: "unlocked",
    unlockedAt: "18/09/2026",
    progressPercentage: 100,
    currentDays: 3,
    rewardXp: 150,
    rewardTitle: "Tân Binh Bền Bỉ",
    specialPerk: "Mở khóa avatar khung đồng cơ bản",
    lore: "Ngọn lửa nhỏ đầu tiên thắp sáng ý chí thép của bạn.",
    gradient: "from-amber-700/20 via-orange-600/15 to-amber-900/10",
    borderColor: "border-amber-600/40",
    badgeColor: "#D97706",
  },
  {
    id: "streak-7",
    daysRequired: 7,
    title: "Chiến Binh 1 Tuần",
    subtitle: "7 Ngày Trọn Vẹn",
    description: "Hoàn thành tuần lễ tập luyện đầu tiên, vượt qua thử thách trì hoãn.",
    iconName: "Zap",
    tier: "silver",
    status: "unlocked",
    unlockedAt: "22/09/2026",
    progressPercentage: 100,
    currentDays: 7,
    rewardXp: 350,
    rewardTitle: "Kỷ Luật 1 Tuần",
    specialPerk: "+5% XP cho các buổi tập tiếp theo",
    lore: "7 ngày không chỉ là thời gian, đó là lời hứa bạn đã giữ với bản thân.",
    gradient: "from-slate-400/20 via-sky-400/15 to-slate-600/10",
    borderColor: "border-sky-400/40",
    badgeColor: "#60A5FA",
  },
  {
    id: "streak-14",
    daysRequired: 14,
    title: "Kỷ Luật Thép",
    subtitle: "14 Ngày Liên Tiếp",
    description: "2 tuần liên tục kiên trì. Cơ bắp và hệ thần kinh đã thích nghi với Calisthenics.",
    iconName: "Shield",
    tier: "gold",
    status: "unlocked",
    unlockedAt: "29/09/2026",
    progressPercentage: 100,
    currentDays: 14,
    rewardXp: 700,
    rewardTitle: "Chiến Binh Kỷ Luật",
    specialPerk: "+1 Khiên Đóng Băng Chuỗi (Streak Freeze)",
    lore: "Sự kiên trì bắt đầu biến thành sức mạnh không thể lay chuyển.",
    gradient: "from-amber-400/25 via-yellow-500/15 to-amber-600/10",
    borderColor: "border-amber-400/50",
    badgeColor: "#F59E0B",
  },
  {
    id: "streak-21",
    daysRequired: 21,
    title: "Phản Xạ Thói Quen",
    subtitle: "21 Ngày Vàng",
    description: "21 ngày để bộ não hình thành thói quen rèn luyện tự nhiên như hơi thở.",
    iconName: "Sparkles",
    tier: "diamond",
    status: "in_progress",
    progressPercentage: 76, // 16 / 21
    currentDays: 16,
    rewardXp: 1200,
    rewardTitle: "Bậc Thầy Thói Quen",
    specialPerk: "Mở khóa hiệu ứng ánh lửa hồ sơ & 1.5x XP",
    lore: "Khoa học chứng minh sau 21 ngày, thói quen sẽ gắn chặt vào tiềm thức.",
    gradient: "from-[#8CA9FF]/30 via-[#547EFF]/20 to-[#AAC4F5]/15",
    borderColor: "border-[#8CA9FF]",
    badgeColor: "#547EFF",
  },
  {
    id: "streak-30",
    daysRequired: 30,
    title: "Bậc Thầy 1 Tháng",
    subtitle: "30 Ngày Bất Bại",
    description: "Tròn 1 tháng tập luyện không một ngày lơ là. Thành tựu đáng ngưỡng mộ.",
    iconName: "Crown",
    tier: "diamond",
    status: "locked",
    progressPercentage: 53, // 16 / 30
    currentDays: 16,
    rewardXp: 2000,
    rewardTitle: "Chúa Tể Tháng Vàng",
    specialPerk: "Nhận vé đánh giá AI Motion không giới hạn",
    lore: "1 tháng biến đổi cả vóc dáng lẫn tư duy của một vận động viên đường phố.",
    gradient: "from-blue-500/15 via-indigo-600/10 to-violet-700/5",
    borderColor: "border-blue-300/30",
    badgeColor: "#3B82F6",
  },
  {
    id: "streak-60",
    daysRequired: 60,
    title: "Quái Vật Thể Hình",
    subtitle: "60 Ngày Kỷ Luật",
    description: "2 tháng khổ luyện đưa thể lực vượt xa người bình thường.",
    iconName: "Trophy",
    tier: "legendary",
    status: "locked",
    progressPercentage: 26, // 16 / 60
    currentDays: 16,
    rewardXp: 4500,
    rewardTitle: "Chiến Thần Calisthenics",
    specialPerk: "Huy hiệu Vàng 3D sáng lấp lánh trong Bảng xếp hạng",
    lore: "Khi người khác bỏ cuộc ở tuần thứ 3, bạn đã tiến bước đến tháng thứ 2.",
    gradient: "from-purple-500/15 via-fuchsia-600/10 to-pink-600/5",
    borderColor: "border-purple-300/30",
    badgeColor: "#A855F7",
  },
  {
    id: "streak-100",
    daysRequired: 100,
    title: "Bách Chiến Huyền Thoại",
    subtitle: "100 Ngày Đỉnh Cao",
    description: "Cột mốc 100 ngày vĩ đại mà chưa đến 1% người tập đạt được.",
    iconName: "Award",
    tier: "legendary",
    status: "locked",
    progressPercentage: 16, // 16 / 100
    currentDays: 16,
    rewardXp: 10000,
    rewardTitle: "Huyền Thoại 100 Ngày",
    specialPerk: "Vinh danh bảng vàng trang chủ & Bộ giáo án Master độc quyền",
    lore: "100 ngày đúc kết nên một cơ thể bằng đồng, một ý chí bằng sắt.",
    gradient: "from-rose-500/15 via-amber-500/10 to-orange-600/5",
    borderColor: "border-rose-300/30",
    badgeColor: "#F43F5E",
  },
  {
    id: "streak-365",
    daysRequired: 365,
    title: "Bất Tử 365 Ngày",
    subtitle: "1 Năm Huyền Thoại",
    description: "365 ngày trọn vẹn sống cùng Calisthenics. Đỉnh cao của sự bất hoại.",
    iconName: "Star",
    tier: "mythic",
    status: "locked",
    progressPercentage: 4.4, // 16 / 365
    currentDays: 16,
    rewardXp: 50000,
    rewardTitle: "Thần Thoại Calisthenics",
    specialPerk: "Danh hiệu Thần Thoại Vĩnh Cửu & Quà tặng thực tế từ CalisPro",
    lore: "Bạn không chỉ tập luyện — bạn đã trở thành biểu tượng của sự kiên trì.",
    gradient: "from-amber-400/20 via-emerald-400/15 to-sky-400/15",
    borderColor: "border-amber-400/30",
    badgeColor: "#F59E0B",
  },
];

const MOCK_WEEKLY_DAYS = [
  {
    dayName: "T2",
    fullDate: "2026-09-24",
    displayDate: "24/09",
    isCompleted: true,
    isToday: false,
    isRestDay: false,
    isFrozen: false,
    workoutTitle: "Upper Body Hypertrophy",
    durationMinutes: 45,
    caloriesBurned: 320,
  },
  {
    dayName: "T3",
    fullDate: "2026-09-25",
    displayDate: "25/09",
    isCompleted: true,
    isToday: false,
    isRestDay: false,
    isFrozen: false,
    workoutTitle: "Handstand & Core Balance",
    durationMinutes: 40,
    caloriesBurned: 280,
  },
  {
    dayName: "T4",
    fullDate: "2026-09-26",
    displayDate: "26/09",
    isCompleted: true,
    isToday: false,
    isRestDay: false,
    isFrozen: false,
    workoutTitle: "Pull-up & Front Lever Progression",
    durationMinutes: 50,
    caloriesBurned: 360,
  },
  {
    dayName: "T5",
    fullDate: "2026-09-27",
    displayDate: "27/09",
    isCompleted: true,
    isToday: false,
    isRestDay: true,
    isFrozen: false,
    workoutTitle: "Mobility & Active Recovery",
    durationMinutes: 25,
    caloriesBurned: 140,
  },
  {
    dayName: "T6",
    fullDate: "2026-09-28",
    displayDate: "28/09",
    isCompleted: true,
    isToday: false,
    isRestDay: false,
    isFrozen: false,
    workoutTitle: "Push-up & Dip Power Sets",
    durationMinutes: 45,
    caloriesBurned: 330,
  },
  {
    dayName: "T7",
    fullDate: "2026-09-29",
    displayDate: "29/09",
    isCompleted: true,
    isToday: false,
    isRestDay: false,
    isFrozen: false,
    workoutTitle: "Legs & Core Explosive",
    durationMinutes: 45,
    caloriesBurned: 340,
  },
  {
    dayName: "CN",
    fullDate: "2026-09-30",
    displayDate: "30/09",
    isCompleted: true,
    isToday: true,
    isRestDay: false,
    isFrozen: false,
    workoutTitle: "Full Body Calisthenics Flow",
    durationMinutes: 50,
    caloriesBurned: 380,
  },
];

// Generate last 60 days heatmap
const generateRecentHistory = () => {
  const history = [];
  const today = new Date("2026-09-30");
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    
    // Consecutive last 16 days are completed with high intensity
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    let count = 0;
    let title = "Nghỉ ngơi";

    if (i < 16) {
      // In current streak
      level = (i % 3 === 0 ? 4 : i % 2 === 0 ? 3 : 2) as 0 | 1 | 2 | 3 | 4;
      count = 1;
      title = "Hoàn thành bài tập";
    } else if (i === 16) {
      // Day before streak was rest
      level = 0;
      count = 0;
      title = "Nghỉ ngơi";
    } else if (i < 35) {
      // Previous streak
      level = (i % 2 === 0 ? 3 : 2) as 0 | 1 | 2 | 3 | 4;
      count = 1;
      title = "Hoàn thành";
    }

    history.push({
      date: dateStr,
      level,
      count,
      title,
    });
  }
  return history;
};

export const streakService = {
  getStreakData: async (): Promise<StreakData> => {
    return {
      currentStreak: 16,
      longestStreak: 24,
      freezesRemaining: 2,
      freezesMax: 2,
      streakMultiplier: 1.5,
      todayCompleted: true,
      totalWorkouts: 48,
      startDate: "15/09/2026",
      weeklyDays: MOCK_WEEKLY_DAYS,
      recentHistory: generateRecentHistory(),
      nextMilestone: MOCK_MILESTONES[3], // 21 days
      milestones: MOCK_MILESTONES,
    };
  },
};
