export interface AdminKPI {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  comparisonPeriod: string;
  iconName: string;
  category: "users" | "workouts" | "ai" | "business";
}

export interface UserGrowthPoint {
  date: string;
  newUsers: number;
  totalUsers: number;
  activeUsers: number;
}

export interface WorkoutCompletionStats {
  completed: number;
  partial: number;
  abandoned: number;
  avgDurationMinutes: number;
  avgCompletionRate: number;
  avgExercisesPerSession: number;
}

export interface AISystemHealthItem {
  id: string;
  name: string;
  description: string;
  status: "OPERATIONAL" | "DEGRADED" | "OFFLINE";
  uptime: string;
  latencyMs: number;
  accuracyRate: number;
  dailyRequests: number;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  relativeTime: string;
  type: "user" | "workout" | "assessment" | "exercise" | "ai" | "subscription" | "system";
  actor: {
    name: string;
    avatarUrl?: string;
    role?: string;
  };
  badge?: string;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  fitnessLevel: "Beginner" | "Intermediate" | "Advanced";
  primaryGoal: string;
  subscriptionPlan: "Free" | "Trial" | "Premium" | "Pro";
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  joinedDate: string;
  completedWorkouts: number;
  streakDays: number;
  lastActive: string;
}

export interface AdminCoachItem {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  title: string;
  specialization: string[];
  assignedUsersCount: number;
  activeUsersCount: number;
  plansCreatedCount: number;
  rating: number;
  reviewsCount: number;
  hourlyRate: string;
  status: "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";
  joinedDate: string;
}

export interface AdminExerciseItem {
  id: string;
  name: string;
  imageUrl: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  category: "Push" | "Pull" | "Core" | "Legs" | "Skill";
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  viewsCount: number;
  completionCount: number;
  updatedAt: string;
}

export const ADMIN_KPIS: AdminKPI[] = [
  {
    id: "total_users",
    label: "Tổng người dùng",
    value: "12,482",
    change: "+12.4%",
    trend: "up",
    comparisonPeriod: "so với tháng trước",
    iconName: "Users",
    category: "users",
  },
  {
    id: "active_users",
    label: "Người dùng hoạt động (MAU)",
    value: "3,842",
    change: "+8.2%",
    trend: "up",
    comparisonPeriod: "so với tuần trước",
    iconName: "Activity",
    category: "users",
  },
  {
    id: "workout_sessions",
    label: "Phiên tập hoàn thành",
    value: "8,291",
    change: "+15.1%",
    trend: "up",
    comparisonPeriod: "so với tháng trước",
    iconName: "Dumbbell",
    category: "workouts",
  },
  {
    id: "assessment_rate",
    label: "Tỉ lệ hoàn thành đánh giá",
    value: "75.6%",
    change: "+6.2%",
    trend: "up",
    comparisonPeriod: "từ bài test đầu vào",
    iconName: "CheckCircle2",
    category: "workouts",
  },
  {
    id: "active_subscriptions",
    label: "Hội viên trả phí",
    value: "4,281",
    change: "+9.4%",
    trend: "up",
    comparisonPeriod: "Gói Premium & Pro",
    iconName: "CreditCard",
    category: "business",
  },
  {
    id: "ai_recommendations",
    label: "Đề xuất AI tạo ra",
    value: "24,821",
    change: "+18.2%",
    trend: "up",
    comparisonPeriod: "Độ chuẩn xác 94.8%",
    iconName: "Bot",
    category: "ai",
  },
];

export const USER_GROWTH_DATA: UserGrowthPoint[] = [
  { date: "T1", newUsers: 820, totalUsers: 8400, activeUsers: 2450 },
  { date: "T2", newUsers: 940, totalUsers: 9340, activeUsers: 2890 },
  { date: "T3", newUsers: 1100, totalUsers: 10440, activeUsers: 3120 },
  { date: "T4", newUsers: 1250, totalUsers: 11690, activeUsers: 3500 },
  { date: "T5", newUsers: 1420, totalUsers: 13110, activeUsers: 3842 },
  { date: "T6", newUsers: 1680, totalUsers: 14790, activeUsers: 4210 },
];

export const WORKOUT_COMPLETION_STATS: WorkoutCompletionStats = {
  completed: 78,
  partial: 14,
  abandoned: 8,
  avgDurationMinutes: 42,
  avgCompletionRate: 86.4,
  avgExercisesPerSession: 5.4,
};

export const FITNESS_DISTRIBUTION_DATA = [
  { name: "Beginner (Cơ bản)", value: 52, color: "#4F7F61" },
  { name: "Intermediate (Trung cấp)", value: 34, color: "#C28A35" },
  { name: "Advanced (Nâng cao)", value: 14, color: "#547A9A" },
];

export const USER_GOALS_DATA = [
  { goal: "Tăng sức mạnh (Strength)", count: 4820, percentage: 38 },
  { goal: "Tăng cơ bắp (Hypertrophy)", count: 3420, percentage: 27 },
  { goal: "Giảm mỡ & Săn chắc", count: 2150, percentage: 17 },
  { goal: "Chinh phục kỹ năng Calis", count: 1840, percentage: 15 },
  { goal: "Sức bền & Linh hoạt", count: 1252, percentage: 10 },
];

export const AI_SYSTEM_HEALTH: AISystemHealthItem[] = [
  {
    id: "mod-1",
    name: "Movement & Pose Detection",
    description: "Nhận diện 33 điểm khớp xương & toạ độ chuyển động 3D",
    status: "OPERATIONAL",
    uptime: "99.98%",
    latencyMs: 18,
    accuracyRate: 96.4,
    dailyRequests: 14280,
  },
  {
    id: "mod-2",
    name: "Form Analysis & Angle Checker",
    description: "Đo góc cùi chỏ, độ cong cột sống và cảnh báo sai form",
    status: "OPERATIONAL",
    uptime: "99.95%",
    latencyMs: 24,
    accuracyRate: 94.8,
    dailyRequests: 18940,
  },
  {
    id: "mod-3",
    name: "Automated Reps Counter",
    description: "Đếm số lần lặp đạt chuẩn biên độ (Full Range of Motion)",
    status: "OPERATIONAL",
    uptime: "99.99%",
    latencyMs: 12,
    accuracyRate: 98.2,
    dailyRequests: 22400,
  },
  {
    id: "mod-4",
    name: "AI Workout Recommendation Engine",
    description: "Tự động điều chỉnh khối lượng và độ khó giáo án theo thể trạng",
    status: "OPERATIONAL",
    uptime: "99.92%",
    latencyMs: 65,
    accuracyRate: 92.6,
    dailyRequests: 8450,
  },
];

export const RECENT_ACTIVITIES: RecentActivityItem[] = [
  {
    id: "act-1",
    title: "Người dùng mới hoàn thành Đánh giá Thể lực",
    description: "Nguyễn Văn Minh đã hoàn thành bài kiểm tra đầu vào và đạt cấp độ Intermediate.",
    timestamp: "2026-09-28T09:30:00Z",
    relativeTime: "5 phút trước",
    type: "assessment",
    actor: { name: "Nguyễn Văn Minh", avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80" },
    badge: "Đánh giá đạt 78đ",
  },
  {
    id: "act-2",
    title: "Kích hoạt gói thành viên CalisHealth Pro",
    description: "Trần Bảo Long đã gia hạn gói Pro 12 tháng qua thanh toán trực tuyến.",
    timestamp: "2026-09-28T09:12:00Z",
    relativeTime: "23 phút trước",
    type: "subscription",
    actor: { name: "Trần Bảo Long", avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80" },
    badge: "1.490.000đ",
  },
  {
    id: "act-3",
    title: "AI phát hiện lỗi sai form và cảnh báo thành công",
    description: "Hệ thống phát hiện lỗi xòe cùi chỏ 88° trong bài Push Up và gửi voice prompt sửa kịp thời.",
    timestamp: "2026-09-28T08:45:00Z",
    relativeTime: "45 phút trước",
    type: "ai",
    actor: { name: "AI Vision Engine", role: "AI Coach" },
    badge: "Form Correction",
  },
  {
    id: "act-4",
    title: "Coach Hoàng Nam phê duyệt Video Chấm Form",
    description: "Đã hoàn thành phân tích video động tác Knee Push Up cho học viên Lê Thảo.",
    timestamp: "2026-09-28T08:10:00Z",
    relativeTime: "1 giờ trước",
    type: "workout",
    actor: { name: "Coach Hoàng Nam", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" },
    badge: "Video Review",
  },
  {
    id: "act-5",
    title: "Cập nhật động tác mới trong Thư viện bài tập",
    description: "Admin đã xuất bản bài tập 'Archer Push Up' kèm phân tích nhóm cơ và AI rules.",
    timestamp: "2026-09-28T07:20:00Z",
    relativeTime: "2 giờ trước",
    type: "exercise",
    actor: { name: "Hệ thống Admin", role: "Super Admin" },
    badge: "Đã xuất bản",
  },
];

export const ADMIN_USERS_LIST: AdminUserItem[] = [
  {
    id: "usr-1",
    name: "Nguyễn Văn Minh",
    email: "minh.nguyen@calis.app",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    fitnessLevel: "Intermediate",
    primaryGoal: "Tăng sức mạnh thân trên",
    subscriptionPlan: "Pro",
    status: "ACTIVE",
    joinedDate: "12/08/2026",
    completedWorkouts: 28,
    streakDays: 7,
    lastActive: "10 phút trước",
  },
  {
    id: "usr-2",
    name: "Lê Minh Thảo",
    email: "thao.le@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
    fitnessLevel: "Beginner",
    primaryGoal: "Giảm mỡ & Calisthenics nữ",
    subscriptionPlan: "Premium",
    status: "ACTIVE",
    joinedDate: "05/09/2026",
    completedWorkouts: 14,
    streakDays: 4,
    lastActive: "1 giờ trước",
  },
  {
    id: "usr-3",
    name: "Phạm Quốc Hưng",
    email: "hung.pham@fpt.edu.vn",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    fitnessLevel: "Advanced",
    primaryGoal: "Chinh phục Muscle Up",
    subscriptionPlan: "Pro",
    status: "ACTIVE",
    joinedDate: "15/07/2026",
    completedWorkouts: 64,
    streakDays: 21,
    lastActive: "Hôm qua",
  },
  {
    id: "usr-4",
    name: "Đỗ Hoàng Long",
    email: "long.do@vng.com.vn",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    fitnessLevel: "Beginner",
    primaryGoal: "Tập luyện sức khỏe văn phòng",
    subscriptionPlan: "Free",
    status: "INACTIVE",
    joinedDate: "20/09/2026",
    completedWorkouts: 3,
    streakDays: 0,
    lastActive: "5 ngày trước",
  },
  {
    id: "usr-5",
    name: "Vũ Tuấn Kiệt",
    email: "kiet.vu@spam.xyz",
    fitnessLevel: "Intermediate",
    primaryGoal: "Chưa xác định",
    subscriptionPlan: "Free",
    status: "SUSPENDED",
    joinedDate: "01/09/2026",
    completedWorkouts: 0,
    streakDays: 0,
    lastActive: "15 ngày trước",
  },
];

export const ADMIN_COACHES_LIST: AdminCoachItem[] = [
  {
    id: "c-1",
    name: "Hoàng Nam (Nam Calis)",
    email: "nam.coach@calis.app",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    title: "Master Calisthenics Trainer",
    specialization: ["Push/Pull Foundation", "Chỉnh sửa Form", "Dinh dưỡng Calis"],
    assignedUsersCount: 42,
    activeUsersCount: 38,
    plansCreatedCount: 18,
    rating: 4.9,
    reviewsCount: 128,
    hourlyRate: "250.000đ / buổi",
    status: "ACTIVE",
    joinedDate: "01/03/2026",
  },
  {
    id: "c-2",
    name: "Trần Bảo Long",
    email: "long.streetworkout@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    title: "National Street Workout Athlete",
    specialization: ["Muscle Up Mastery", "Front Lever", "Sức mạnh bùng nổ"],
    assignedUsersCount: 35,
    activeUsersCount: 31,
    plansCreatedCount: 12,
    rating: 5.0,
    reviewsCount: 94,
    hourlyRate: "300.000đ / buổi",
    status: "ACTIVE",
    joinedDate: "15/04/2026",
  },
  {
    id: "c-3",
    name: "Lê Minh Thảo",
    email: "thao.movement@calis.app",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
    title: "Movement & Calisthenics Specialist",
    specialization: ["Calisthenics Nữ", "Linh hoạt khớp", "Giảm cân an toàn"],
    assignedUsersCount: 28,
    activeUsersCount: 26,
    plansCreatedCount: 9,
    rating: 4.8,
    reviewsCount: 67,
    hourlyRate: "220.000đ / buổi",
    status: "ACTIVE",
    joinedDate: "10/05/2026",
  },
];
