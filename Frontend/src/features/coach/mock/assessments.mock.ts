import type {
  AssessmentDetail,
  AssessmentMetricComparison,
  AssessmentStatus,
  AssessmentTestResult,
  AssessmentType,
  FitnessScores,
} from "../types";
import { STUDENTS, studentRef } from "./students.mock";
import { atDay, clamp, createRng } from "./helpers";

interface CurrentSeed {
  status: AssessmentStatus;
  type: AssessmentType;
  /** Day offset of due date relative to today. */
  due: number;
  /** Day offset of completion (only for completed / needs-review). */
  completed?: number;
}

const CURRENT: Record<string, CurrentSeed> = {
  "stu-001": { status: "NEEDS_REVIEW", type: "MONTHLY", due: -1, completed: -1 },
  "stu-003": { status: "OVERDUE", type: "MONTHLY", due: -3 },
  "stu-004": { status: "NEEDS_REVIEW", type: "SKILL_TEST", due: 0, completed: 0 },
  "stu-005": { status: "COMPLETED", type: "QUARTERLY", due: -2, completed: -2 },
  "stu-006": { status: "DUE", type: "INITIAL", due: 0 },
  "stu-007": { status: "DUE", type: "MONTHLY", due: 0 },
  "stu-010": { status: "DUE", type: "MONTHLY", due: 1 },
  "stu-011": { status: "OVERDUE", type: "MONTHLY", due: -8 },
  "stu-012": { status: "NEEDS_REVIEW", type: "MONTHLY", due: -2, completed: -2 },
  "stu-015": { status: "DUE", type: "MONTHLY", due: 1 },
  "stu-016": { status: "DUE", type: "MONTHLY", due: 2 },
  "stu-022": { status: "DUE", type: "INITIAL", due: 0 },
  "stu-009": { status: "COMPLETED", type: "MONTHLY", due: -6, completed: -6 },
  "stu-017": { status: "COMPLETED", type: "SKILL_TEST", due: -9, completed: -10 },
};

const TYPE_TITLE: Record<AssessmentType, string> = {
  INITIAL: "Initial Fitness Assessment",
  MONTHLY: "Monthly Fitness Assessment",
  QUARTERLY: "Quarterly Performance Review",
  SKILL_TEST: "Skill Benchmark Test",
};

const METRIC_LABEL: Record<AssessmentMetricComparison["key"], string> = {
  strength: "Strength",
  endurance: "Endurance",
  mobility: "Mobility",
  core: "Core",
  balance: "Balance",
  overall: "Overall",
};

function scoresFor(base: number, seed: number): FitnessScores {
  const rng = createRng(seed);
  const s = {
    strength: clamp(base + rng.int(-6, 8)),
    endurance: clamp(base + rng.int(-8, 6)),
    mobility: clamp(base + rng.int(-10, 5)),
    core: clamp(base + rng.int(-4, 7)),
    balance: clamp(base + rng.int(-9, 6)),
    overall: 0,
  };
  s.overall = Math.round((s.strength + s.endurance + s.mobility + s.core + s.balance) / 5);
  return s;
}

function tests(current: FitnessScores | null, previous: FitnessScores | null): AssessmentTestResult[] {
  if (!current) return [];
  const scale = (score: number, max: number) => Math.max(1, Math.round((score / 100) * max));
  const row = (id: string, name: string, metric: AssessmentTestResult["metric"], max: number, unit: string): AssessmentTestResult => ({
    id,
    name,
    metric,
    unit,
    value: scale(current[metric], max),
    previousValue: previous ? scale(previous[metric], max) : null,
  });
  return [
    row("t-push", "Max Push-ups", "strength", 40, "reps"),
    row("t-pull", "Max Pull-ups", "strength", 16, "reps"),
    row("t-burpee", "Burpees (3 phút)", "endurance", 60, "reps"),
    row("t-plank", "Plank Hold", "core", 240, "giây"),
    row("t-squat", "Deep Squat Hold", "mobility", 120, "giây"),
    row("t-balance", "Single-leg Balance", "balance", 60, "giây"),
  ];
}

function recommendationsFor(metrics: AssessmentMetricComparison[]): string[] {
  const recs: string[] = [];
  const delta = (key: AssessmentMetricComparison["key"]) => {
    const m = metrics.find((x) => x.key === key);
    return m && m.previous !== null && m.current !== null ? m.current - m.previous : 0;
  };
  if (delta("mobility") < 0) recs.push("Cải thiện độ linh hoạt vai và hông, thêm 10 phút mobility sau mỗi buổi.");
  if (delta("strength") > 0) recs.push("Duy trì volume sức mạnh hiện tại, chưa cần tăng tải.");
  if (delta("strength") < 0) recs.push("Tăng dần volume các bài kéo/đẩy chính thêm 1 set mỗi tuần.");
  if (delta("endurance") < 0) recs.push("Bổ sung 1 buổi conditioning ngắn (EMOM 12 phút) mỗi tuần.");
  if (delta("balance") < 0) recs.push("Thêm bài giữ thăng bằng một chân vào phần khởi động.");
  if (delta("overall") < 0) recs.push("Giảm độ khó progression trong 2 tuần để củng cố kỹ thuật.");
  if (recs.length === 0) recs.push("Tiến bộ đồng đều, có thể chuyển sang progression tiếp theo.");
  return recs.slice(0, 4);
}

function build(): AssessmentDetail[] {
  const list: AssessmentDetail[] = [];
  STUDENTS.forEach((student, i) => {
    const previous = scoresFor(student.fitnessScore - (student.performanceTrend === "up" ? 5 : student.performanceTrend === "down" ? -4 : 1), i + 101);
    const prevDate = atDay(-34 - (i % 5), 9);
    const seed = CURRENT[student.id] ?? { status: "UPCOMING" as const, type: "MONTHLY" as const, due: 3 + (i % 12) };
    const done = seed.status === "COMPLETED" || seed.status === "NEEDS_REVIEW";
    let current: FitnessScores | null = done ? scoresFor(student.fitnessScore, i + 501) : null;
    if (student.id === "stu-001" && current) {
      // Reference example from the product spec: strength 72 → 81, mobility 69 → 64.
      previous.strength = 72;
      previous.mobility = 69;
      current = { ...current, strength: 81, mobility: 64 };
      current.overall = Math.round((current.strength + current.endurance + current.mobility + current.core + current.balance) / 5);
    }
    const metrics: AssessmentMetricComparison[] = (["strength", "endurance", "mobility", "core", "balance", "overall"] as const).map((key) => ({
      key,
      label: METRIC_LABEL[key],
      previous: previous[key],
      current: current ? current[key] : null,
    }));
    const hasPrevious = seed.type !== "INITIAL";
    if (!hasPrevious) metrics.forEach((m) => (m.previous = null));

    list.push({
      id: `asm-${String(i + 1).padStart(3, "0")}`,
      ...studentRef(student.id),
      title: TYPE_TITLE[seed.type],
      type: seed.type,
      dueDate: atDay(seed.due, 9),
      completedAt: done ? atDay(seed.completed ?? seed.due, 10, 30) : null,
      overallScore: current?.overall ?? null,
      status: seed.status,
      studentLevel: student.level,
      previousAssessmentDate: hasPrevious ? prevDate : null,
      metrics,
      tests: tests(current, hasPrevious ? previous : null),
      recommendations: done ? recommendationsFor(metrics) : [],
      coachComment: seed.status === "COMPLETED" ? "Kết quả ổn định. Tiếp tục giáo án hiện tại, tái đánh giá sau 4 tuần." : null,
      reviewedAt: seed.status === "COMPLETED" ? atDay((seed.completed ?? 0) + 1, 20) : null,
    });

    if (hasPrevious) {
      list.push({
        id: `asm-${String(i + 1).padStart(3, "0")}-p`,
        ...studentRef(student.id),
        title: TYPE_TITLE.MONTHLY,
        type: "MONTHLY",
        dueDate: prevDate,
        completedAt: prevDate,
        overallScore: previous.overall,
        status: "COMPLETED",
        studentLevel: student.level,
        previousAssessmentDate: null,
        metrics: metrics.map((m) => ({ ...m, previous: null, current: m.previous })),
        tests: tests(previous, null),
        recommendations: ["Duy trì tần suất tập hiện tại."],
        coachComment: "Đã review cùng học viên.",
        reviewedAt: prevDate,
      });
    }
  });
  return list;
}

export const ASSESSMENTS: AssessmentDetail[] = build();
