import type {
  AttentionAlert,
  CoachNote,
  FitnessScorePoint,
  FitnessScores,
  Student,
  StudentDetail,
  StudentLevel,
  StudentStatus,
  TrainingGoal,
  TrendDirection,
} from "../types";
import { atDay, avatar, clamp, createRng, daysAgo, isoDate } from "./helpers";

interface StudentSeed {
  name: string;
  email: string;
  avatarImg: number | null;
  level: StudentLevel;
  goal: TrainingGoal;
  status: StudentStatus;
  score: number;
  trend: TrendDirection;
  streak: number;
  adherence: number;
  frequency: number;
  lastWorkoutDaysAgo: number | null;
  joinedDaysAgo: number;
  tags: string[];
  gender: StudentDetail["gender"];
  limitations?: string[];
}

const SEEDS: StudentSeed[] = [
  { name: "Nguyễn Minh Anh", email: "minhanh.nguyen@gmail.com", avatarImg: 47, level: "INTERMEDIATE", goal: "SKILL", status: "NEEDS_ATTENTION", score: 72, trend: "down", streak: 4, adherence: 78, frequency: 3.5, lastWorkoutDaysAgo: 1, joinedDaysAgo: 210, tags: ["Handstand"], gender: "FEMALE" },
  { name: "Trần Quốc Bảo", email: "quocbao.tran@gmail.com", avatarImg: 12, level: "BEGINNER", goal: "FAT_LOSS", status: "NEEDS_ATTENTION", score: 54, trend: "down", streak: 0, adherence: 42, frequency: 1.5, lastWorkoutDaysAgo: 6, joinedDaysAgo: 75, tags: ["Giảm mỡ"], gender: "MALE" },
  { name: "Lê Hoàng Châu", email: "hoangchau.le@outlook.com", avatarImg: 33, level: "INTERMEDIATE", goal: "STRENGTH", status: "NEEDS_ATTENTION", score: 68, trend: "flat", streak: 9, adherence: 81, frequency: 3.8, lastWorkoutDaysAgo: 0, joinedDaysAgo: 160, tags: ["Pull-up"], gender: "MALE" },
  { name: "Phạm Thu Hà", email: "thuha.pham@gmail.com", avatarImg: 45, level: "ADVANCED", goal: "SKILL", status: "ACTIVE", score: 86, trend: "up", streak: 21, adherence: 96, frequency: 5, lastWorkoutDaysAgo: 0, joinedDaysAgo: 420, tags: ["Handstand", "L-sit"], gender: "FEMALE" },
  { name: "Võ Đức Huy", email: "duchuy.vo@gmail.com", avatarImg: 13, level: "ELITE", goal: "STRENGTH", status: "ACTIVE", score: 92, trend: "up", streak: 34, adherence: 98, frequency: 5.5, lastWorkoutDaysAgo: 0, joinedDaysAgo: 610, tags: ["Muscle-up", "Thi đấu"], gender: "MALE" },
  { name: "Đặng Khánh Linh", email: "khanhlinh.dang@gmail.com", avatarImg: 44, level: "BEGINNER", goal: "MOBILITY", status: "NEW", score: 48, trend: "flat", streak: 3, adherence: 100, frequency: 3, lastWorkoutDaysAgo: 1, joinedDaysAgo: 9, tags: ["Mới"], gender: "FEMALE" },
  { name: "Bùi Tuấn Kiệt", email: "tuankiet.bui@gmail.com", avatarImg: 15, level: "INTERMEDIATE", goal: "MUSCLE", status: "ACTIVE", score: 74, trend: "up", streak: 12, adherence: 88, frequency: 4.2, lastWorkoutDaysAgo: 1, joinedDaysAgo: 190, tags: [], gender: "MALE" },
  { name: "Hoàng Gia Hân", email: "giahan.hoang@yahoo.com", avatarImg: 49, level: "INTERMEDIATE", goal: "ENDURANCE", status: "NEEDS_ATTENTION", score: 63, trend: "down", streak: 1, adherence: 45, frequency: 1.8, lastWorkoutDaysAgo: 3, joinedDaysAgo: 140, tags: [], gender: "FEMALE" },
  { name: "Ngô Thanh Tùng", email: "thanhtung.ngo@gmail.com", avatarImg: 51, level: "ADVANCED", goal: "STRENGTH", status: "NEEDS_ATTENTION", score: 81, trend: "flat", streak: 7, adherence: 84, frequency: 4, lastWorkoutDaysAgo: 2, joinedDaysAgo: 330, tags: ["Chấn thương vai"], gender: "MALE", limitations: ["Đau vai phải khi làm dips sâu (đã báo 5 ngày trước)"] },
  { name: "Đỗ Mai Phương", email: "maiphuong.do@gmail.com", avatarImg: 20, level: "BEGINNER", goal: "FAT_LOSS", status: "ACTIVE", score: 58, trend: "up", streak: 8, adherence: 90, frequency: 3.6, lastWorkoutDaysAgo: 0, joinedDaysAgo: 60, tags: [], gender: "FEMALE" },
  { name: "Huỳnh Nhật Nam", email: "nhatnam.huynh@gmail.com", avatarImg: 53, level: "INTERMEDIATE", goal: "SKILL", status: "INACTIVE", score: 66, trend: "down", streak: 0, adherence: 20, frequency: 0.5, lastWorkoutDaysAgo: 19, joinedDaysAgo: 280, tags: [], gender: "MALE" },
  { name: "Trịnh Bảo Ngọc", email: "baongoc.trinh@gmail.com", avatarImg: 38, level: "ADVANCED", goal: "MUSCLE", status: "ACTIVE", score: 83, trend: "up", streak: 16, adherence: 93, frequency: 4.8, lastWorkoutDaysAgo: 1, joinedDaysAgo: 365, tags: [], gender: "FEMALE" },
  { name: "Phan Minh Khôi", email: "minhkhoi.phan@gmail.com", avatarImg: null, level: "BEGINNER", goal: "STRENGTH", status: "PAUSED", score: 51, trend: "flat", streak: 0, adherence: 60, frequency: 0, lastWorkoutDaysAgo: 12, joinedDaysAgo: 100, tags: ["Tạm dừng - công tác"], gender: "MALE" },
  { name: "Lý Thảo Vy", email: "thaovy.ly@gmail.com", avatarImg: 41, level: "INTERMEDIATE", goal: "MOBILITY", status: "NEEDS_ATTENTION", score: 69, trend: "down", streak: 2, adherence: 70, frequency: 2.8, lastWorkoutDaysAgo: 2, joinedDaysAgo: 175, tags: [], gender: "FEMALE" },
  { name: "Mai Quang Vinh", email: "quangvinh.mai@gmail.com", avatarImg: 57, level: "INTERMEDIATE", goal: "STRENGTH", status: "ACTIVE", score: 76, trend: "up", streak: 10, adherence: 86, frequency: 4, lastWorkoutDaysAgo: 0, joinedDaysAgo: 230, tags: [], gender: "MALE" },
  { name: "Tạ Hồng Nhung", email: "hongnhung.ta@gmail.com", avatarImg: 26, level: "BEGINNER", goal: "FAT_LOSS", status: "ACTIVE", score: 55, trend: "up", streak: 6, adherence: 82, frequency: 3.2, lastWorkoutDaysAgo: 1, joinedDaysAgo: 48, tags: [], gender: "FEMALE" },
  { name: "Dương Hải Đăng", email: "haidang.duong@gmail.com", avatarImg: 59, level: "ADVANCED", goal: "SKILL", status: "ACTIVE", score: 84, trend: "flat", streak: 14, adherence: 91, frequency: 4.5, lastWorkoutDaysAgo: 0, joinedDaysAgo: 400, tags: ["Front lever"], gender: "MALE" },
  { name: "Cao Thùy Dung", email: "thuydung.cao@gmail.com", avatarImg: 32, level: "INTERMEDIATE", goal: "ENDURANCE", status: "ACTIVE", score: 71, trend: "up", streak: 11, adherence: 87, frequency: 3.9, lastWorkoutDaysAgo: 1, joinedDaysAgo: 205, tags: [], gender: "FEMALE" },
  { name: "Lâm Chí Thanh", email: "chithanh.lam@gmail.com", avatarImg: 60, level: "BEGINNER", goal: "MUSCLE", status: "ACTIVE", score: 57, trend: "up", streak: 5, adherence: 80, frequency: 3, lastWorkoutDaysAgo: 2, joinedDaysAgo: 70, tags: [], gender: "MALE" },
  { name: "Kiều Ngọc Ánh", email: "ngocanh.kieu@gmail.com", avatarImg: 29, level: "INTERMEDIATE", goal: "MOBILITY", status: "ACTIVE", score: 70, trend: "flat", streak: 7, adherence: 85, frequency: 3.4, lastWorkoutDaysAgo: 1, joinedDaysAgo: 250, tags: [], gender: "FEMALE" },
  { name: "Vũ Hoàng Long", email: "hoanglong.vu@gmail.com", avatarImg: 68, level: "ELITE", goal: "SKILL", status: "ACTIVE", score: 90, trend: "up", streak: 28, adherence: 97, frequency: 5.2, lastWorkoutDaysAgo: 0, joinedDaysAgo: 540, tags: ["Planche"], gender: "MALE" },
  { name: "Tôn Nữ Minh Thư", email: "minhthu.ton@gmail.com", avatarImg: 5, level: "BEGINNER", goal: "MOBILITY", status: "NEW", score: 46, trend: "flat", streak: 2, adherence: 100, frequency: 2, lastWorkoutDaysAgo: 2, joinedDaysAgo: 6, tags: ["Mới"], gender: "FEMALE" },
  { name: "Quách Tuấn Anh", email: "tuananh.quach@gmail.com", avatarImg: 65, level: "INTERMEDIATE", goal: "MUSCLE", status: "ACTIVE", score: 73, trend: "up", streak: 9, adherence: 84, frequency: 3.8, lastWorkoutDaysAgo: 1, joinedDaysAgo: 150, tags: [], gender: "MALE" },
  { name: "La Bích Trâm", email: "bichtram.la@gmail.com", avatarImg: 9, level: "INTERMEDIATE", goal: "FAT_LOSS", status: "ACTIVE", score: 64, trend: "up", streak: 6, adherence: 79, frequency: 3.1, lastWorkoutDaysAgo: 1, joinedDaysAgo: 120, tags: [], gender: "FEMALE" },
];

export const STUDENTS: Student[] = SEEDS.map((s, i) => ({
  id: `stu-${String(i + 1).padStart(3, "0")}`,
  code: `CH-${1024 + i * 7}`,
  name: s.name,
  email: s.email,
  avatarUrl: s.avatarImg ? avatar(s.avatarImg) : null,
  level: s.level,
  goal: s.goal,
  status: s.status,
  fitnessScore: s.score,
  performanceTrend: s.trend,
  streak: s.streak,
  adherence: s.adherence,
  trainingFrequency: s.frequency,
  lastWorkoutAt: s.lastWorkoutDaysAgo === null ? null : daysAgo(s.lastWorkoutDaysAgo, 18, 30),
  joinedAt: daysAgo(s.joinedDaysAgo),
  needsAttention: s.status === "NEEDS_ATTENTION",
  tags: s.tags,
}));

export function studentRef(studentId: string) {
  const s = STUDENTS.find((x) => x.id === studentId);
  return { studentId, studentName: s?.name ?? "Học viên", studentAvatar: s?.avatarUrl ?? null };
}

function buildFitness(score: number, seed: number): FitnessScores {
  const rng = createRng(seed);
  const strength = clamp(score + rng.int(-6, 8));
  const endurance = clamp(score + rng.int(-8, 6));
  const mobility = clamp(score + rng.int(-10, 5));
  const core = clamp(score + rng.int(-4, 7));
  const balance = clamp(score + rng.int(-9, 6));
  return { strength, endurance, mobility, core, balance, overall: score };
}

function buildHistory(current: FitnessScores, trend: TrendDirection, seed: number): FitnessScorePoint[] {
  const rng = createRng(seed * 31);
  const points: FitnessScorePoint[] = [];
  const weeks = 52;
  const slope = trend === "up" ? 0.55 : trend === "down" ? -0.45 : 0.05;
  for (let w = weeks - 1; w >= 0; w -= 1) {
    const drift = (v: number) => clamp(v - slope * w + rng.int(-2, 2));
    const point = {
      date: isoDate(-w * 7),
      strength: drift(current.strength),
      endurance: drift(current.endurance),
      mobility: drift(current.mobility),
      core: drift(current.core),
      balance: drift(current.balance),
      overall: 0,
    };
    point.overall = w === 0 ? current.overall : drift(current.overall);
    points.push(point);
  }
  // A declining student looks like they peaked a few weeks ago.
  if (trend === "down") {
    const peak = points.length - 5;
    for (let i = peak; i < points.length; i += 1) {
      const fall = (i - peak) * 2.2;
      points[i].overall = clamp(current.overall + 10 - fall);
    }
    points[points.length - 1].overall = current.overall;
  }
  return points;
}

const PLAN_BY_STUDENT: Record<string, StudentDetail["currentPlan"]> = {
  "stu-001": { planId: "plan-002", planName: "Skill Foundation: Handstand & L-sit", currentWeek: 5, totalWeeks: 8, progressPercent: 58, sessionsCompleted: 14, sessionsPlanned: 18, adherence: 78 },
  "stu-002": { planId: "plan-003", planName: "Fat Loss Conditioning 6W", currentWeek: 3, totalWeeks: 6, progressPercent: 31, sessionsCompleted: 5, sessionsPlanned: 12, adherence: 42 },
  "stu-003": { planId: "plan-001", planName: "8 Week Strength Program", currentWeek: 4, totalWeeks: 8, progressPercent: 47, sessionsCompleted: 13, sessionsPlanned: 16, adherence: 81 },
  "stu-004": { planId: "plan-002", planName: "Skill Foundation: Handstand & L-sit", currentWeek: 7, totalWeeks: 8, progressPercent: 86, sessionsCompleted: 27, sessionsPlanned: 28, adherence: 96 },
  "stu-012": { planId: "plan-004", planName: "Push/Pull Hypertrophy 10W", currentWeek: 6, totalWeeks: 10, progressPercent: 55, sessionsCompleted: 22, sessionsPlanned: 24, adherence: 93 },
  "stu-006": { planId: "plan-005", planName: "Mobility Reset 4W", currentWeek: 1, totalWeeks: 4, progressPercent: 18, sessionsCompleted: 3, sessionsPlanned: 3, adherence: 100 },
};

/** aiInsights are derived from the student's real analyses by the service layer, so they are passed in. */
export function buildStudentDetail(student: Student, aiInsights: StudentDetail["aiInsights"]): StudentDetail {
  const index = STUDENTS.findIndex((s) => s.id === student.id);
  const seed = SEEDS[index];
  const rng = createRng(index + 7);
  const fitness = buildFitness(student.fitnessScore, index + 1);
  const isFemale = seed.gender === "FEMALE";
  return {
    ...student,
    age: rng.int(19, 36),
    gender: seed.gender,
    heightCm: isFemale ? rng.int(152, 168) : rng.int(165, 182),
    weightKg: isFemale ? rng.int(46, 62) : rng.int(60, 82),
    trainingExperienceMonths: Math.max(1, Math.round(seed.joinedDaysAgo / 30) + rng.int(0, 18)),
    fitness,
    limitations: seed.limitations ?? [],
    currentPlan: PLAN_BY_STUDENT[student.id] ?? null,
    fitnessHistory: buildHistory(fitness, student.performanceTrend, index + 1),
    aiInsights,
  };
}

export const COACH_NOTES: CoachNote[] = [
  { id: "note-001", studentId: "stu-001", authorName: "Hoàng Việt", category: "TECHNIQUE", content: "Nhắc Minh Anh giữ khuỷu tay ~45° khi push-up. Tuần này giảm volume push, thêm scapular push-up làm khởi động.", pinned: true, createdAt: daysAgo(1, 20) },
  { id: "note-002", studentId: "stu-001", authorName: "Hoàng Việt", category: "PROGRESS", content: "Wall handstand đã giữ được 45s ổn định. Có thể thử chest-to-wall từ tuần 6.", pinned: false, createdAt: daysAgo(8, 20) },
  { id: "note-003", studentId: "stu-002", authorName: "Hoàng Việt", category: "MOTIVATION", content: "Bảo chia sẻ lịch làm việc ca đêm, khó tập buổi sáng. Cân nhắc chuyển sang 3 buổi ngắn 25 phút.", pinned: true, createdAt: daysAgo(4, 21) },
  { id: "note-004", studentId: "stu-009", authorName: "Hoàng Việt", category: "INJURY", content: "Đau vai phải khi dips sâu. Tạm thay dips bằng push-up nâng chân, theo dõi 2 tuần.", pinned: true, createdAt: daysAgo(5, 19) },
  { id: "note-005", studentId: "stu-003", authorName: "Hoàng Việt", category: "GENERAL", content: "Châu muốn thi Street Workout tháng tới, ưu tiên max rep pull-up.", pinned: false, createdAt: daysAgo(10, 18) },
  { id: "note-006", studentId: "stu-004", authorName: "Hoàng Việt", category: "PROGRESS", content: "Freestanding handstand 22s. Sẵn sàng bắt đầu press handstand drill.", pinned: false, createdAt: daysAgo(2, 18) },
];

export const ATTENTION_ALERTS: AttentionAlert[] = [
  { id: "alert-001", ...studentRef("stu-001"), type: "FORM_DROP", severity: "critical", title: "Form score giảm mạnh", detail: "Push Up: điểm form giảm từ 87 → 71 trong 2 buổi gần nhất.", metric: { from: 87, to: 71 }, createdAt: daysAgo(1, 19, 20) },
  { id: "alert-002", ...studentRef("stu-002"), type: "INACTIVE", severity: "critical", title: "Không tập 6 ngày", detail: "Buổi tập gần nhất: 6 ngày trước. Đã bỏ lỡ 3 buổi theo giáo án.", metric: null, createdAt: daysAgo(0, 7) },
  { id: "alert-003", ...studentRef("stu-003"), type: "ASSESSMENT_OVERDUE", severity: "warning", title: "Đánh giá quá hạn 3 ngày", detail: "Monthly Fitness Assessment tháng này chưa được thực hiện.", metric: null, createdAt: daysAgo(3, 9) },
  { id: "alert-004", ...studentRef("stu-008"), type: "LOW_ADHERENCE", severity: "warning", title: "Tỷ lệ tuân thủ thấp", detail: "Chỉ hoàn thành 45% số buổi trong 4 tuần gần đây.", metric: { from: 76, to: 45, unit: "%" }, createdAt: daysAgo(1, 8) },
  { id: "alert-005", ...studentRef("stu-009"), type: "INJURY", severity: "warning", title: "Ghi chú chấn thương vai", detail: "Học viên báo đau vai phải khi dips. Cần điều chỉnh giáo án.", metric: null, createdAt: daysAgo(5, 19) },
  { id: "alert-006", ...studentRef("stu-014"), type: "PERFORMANCE_DROP", severity: "info", title: "Hiệu suất giảm", detail: "Fitness score giảm 6 điểm so với 4 tuần trước.", metric: { from: 75, to: 69 }, createdAt: daysAgo(2, 9) },
];

export const TODAY = atDay(0);
