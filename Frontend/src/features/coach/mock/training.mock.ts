/**
 * Workout sessions + AI Motion analyses. They are generated together because every
 * analysis belongs to a session exercise. Shapes follow the planned Spring Boot DTOs.
 */
import type {
  AIAnalysis,
  AIRecommendation,
  MotionError,
  MotionErrorSeverity,
  MotionMetric,
  RepResult,
  SessionExerciseResult,
  TrainingGoal,
  WorkoutSessionDetail,
} from "../types";
import { exerciseById } from "./exercises.mock";
import { STUDENTS, studentRef } from "./students.mock";
import { clamp, createRng, daysAgo } from "./helpers";

type TemplateKey = "push" | "pull" | "legs" | "skill" | "full";

interface Template {
  name: string;
  duration: number;
  exercises: [exerciseId: string, sets: number, reps: number][];
}

const TEMPLATES: Record<TemplateKey, Template> = {
  push: { name: "Push Strength", duration: 48, exercises: [["push-up", 4, 10], ["dips", 3, 8], ["pike-push-up", 3, 8], ["hanging-leg-raise", 3, 10]] },
  pull: { name: "Pull Strength", duration: 52, exercises: [["pull-up", 4, 8], ["chin-up", 3, 8], ["australian-row", 3, 12], ["hanging-leg-raise", 3, 10]] },
  legs: { name: "Legs & Core", duration: 45, exercises: [["squat", 4, 15], ["pistol-squat", 3, 5], ["bulgarian-split-squat", 3, 10], ["hollow-body-hold", 3, 8]] },
  skill: { name: "Skill Practice: Handstand Prep", duration: 40, exercises: [["pike-push-up", 4, 8], ["push-up", 3, 10], ["hollow-body-hold", 3, 8]] },
  full: { name: "Full Body Conditioning", duration: 38, exercises: [["push-up", 3, 12], ["squat", 3, 20], ["australian-row", 3, 12], ["knee-push-up", 2, 15]] },
};

const ROTATION: Record<TrainingGoal, TemplateKey[]> = {
  STRENGTH: ["push", "pull", "legs"],
  SKILL: ["skill", "pull", "push"],
  MUSCLE: ["push", "pull", "legs"],
  FAT_LOSS: ["full", "legs", "full"],
  MOBILITY: ["full", "legs"],
  ENDURANCE: ["full", "push", "pull"],
};

const PLAN_NAME: Record<string, string> = {
  "stu-001": "Skill Foundation: Handstand & L-sit",
  "stu-002": "Fat Loss Conditioning 6W",
  "stu-003": "8 Week Strength Program",
  "stu-004": "Skill Foundation: Handstand & L-sit",
  "stu-012": "Push/Pull Hypertrophy 10W",
  "stu-006": "Mobility Reset 4W",
};

/* ------------------------------- Motion metric catalogue ------------------------------- */

interface MetricDef {
  key: string;
  label: string;
  description: string;
  error: { code: string; label: string; bodyPart: string; issue: string; recommendation: string; rationale: string };
}

const PUSH_METRICS: MetricDef[] = [
  { key: "alignment", label: "Body Alignment", description: "Đầu, hông và gót chân nằm trên một đường thẳng.", error: { code: "HIP_SAG", label: "Hông bị võng", bodyPart: "Hông / lưng dưới", issue: "Core chưa đủ siết ở cuối set.", recommendation: "Siết mông và bụng trước mỗi rep, giảm 2 rep mỗi set nếu cần.", rationale: "Hông võng xuất hiện chủ yếu ở set cuối, dấu hiệu mỏi core." } },
  { key: "elbowPosition", label: "Elbow Position", description: "Góc khuỷu tay so với thân người (mục tiêu 30-45°).", error: { code: "ELBOW_FLARE", label: "Khuỷu tay mở rộng quá mức", bodyPart: "Khuỷu tay / vai", issue: "Vị trí vai chưa ổn định.", recommendation: "Giữ khuỷu tay gần thân hơn, hướng khuỷu về phía hông.", rationale: "Góc khuỷu > 60° làm tăng áp lực lên khớp vai." } },
  { key: "depth", label: "Depth", description: "Độ sâu của pha hạ người so với mục tiêu.", error: { code: "REDUCED_DEPTH", label: "Biên độ chưa đủ sâu", bodyPart: "Ngực / vai", issue: "Sức mạnh ở đáy chuyển động còn yếu.", recommendation: "Thêm 2 set negative push-up 3 giây để làm quen biên độ đầy đủ.", rationale: "Độ sâu giảm dần qua các set." } },
  { key: "tempo", label: "Tempo", description: "Độ ổn định của nhịp độ so với tempo mục tiêu.", error: { code: "TEMPO_INCONSISTENT", label: "Nhịp độ không đều", bodyPart: "Toàn thân", issue: "Học viên vội ở pha hạ người.", recommendation: "Đếm 2 giây khi hạ, 1 giây khi đẩy lên.", rationale: "Pha hạ nhanh hơn mục tiêu ở nhiều rep." } },
  { key: "scapularControl", label: "Scapular Control", description: "Kiểm soát chuyển động của xương bả vai.", error: { code: "SCAPULAR_WINGING", label: "Bả vai chưa ổn định", bodyPart: "Bả vai", issue: "Cơ răng trước còn yếu.", recommendation: "Thêm scapular push-up 2×12 vào phần khởi động.", rationale: "Bả vai nhô ra ở đỉnh chuyển động." } },
];

const PULL_METRICS: MetricDef[] = [
  { key: "rangeOfMotion", label: "Range of Motion", description: "Cằm qua xà và duỗi tay hoàn toàn ở điểm thấp.", error: { code: "INCOMPLETE_ROM", label: "Biên độ chưa đầy đủ", bodyPart: "Lưng / tay", issue: "Chưa đủ lực ở đỉnh chuyển động.", recommendation: "Giữ 1 giây ở đỉnh, dùng dây kháng lực cho các rep cuối.", rationale: "Cằm chưa qua xà ở các rep cuối." } },
  { key: "scapularEngagement", label: "Scapular Engagement", description: "Hạ và khép bả vai trước khi kéo.", error: { code: "SHRUGGING", label: "Nhún vai khi kéo", bodyPart: "Vai / cổ", issue: "Chưa kích hoạt lưng xô trước khi kéo.", recommendation: "Thêm scapular pull-up 2×8 trước set chính.", rationale: "Vai nhô lên tai ở pha đầu." } },
  { key: "bodyControl", label: "Body Control", description: "Giữ thân ổn định, không đung đưa.", error: { code: "KIPPING", label: "Đung đưa thân (kipping)", bodyPart: "Core / hông", issue: "Dùng quán tính thay vì sức mạnh.", recommendation: "Siết hollow body trong suốt rep.", rationale: "Hông dao động mạnh ở các rep cuối." } },
  { key: "tempo", label: "Tempo", description: "Pha hạ có kiểm soát (mục tiêu 2-3 giây).", error: { code: "FAST_ECCENTRIC", label: "Hạ người quá nhanh", bodyPart: "Toàn thân", issue: "Bỏ qua pha eccentric.", recommendation: "Hạ chậm 3 giây ở mọi rep.", rationale: "Thời gian pha hạ < 1 giây." } },
  { key: "gripSymmetry", label: "Grip Symmetry", description: "Hai tay kéo đều, không lệch bên.", error: { code: "ASYMMETRIC_PULL", label: "Kéo lệch một bên", bodyPart: "Vai / lưng", issue: "Mất cân bằng sức mạnh hai bên.", recommendation: "Thêm bài kéo một tay hỗ trợ cho bên yếu.", rationale: "Vai trái cao hơn vai phải ở đỉnh." } },
];

const LEG_METRICS: MetricDef[] = [
  { key: "kneeTracking", label: "Knee Tracking", description: "Gối đi theo hướng mũi chân.", error: { code: "KNEE_VALGUS", label: "Gối đổ vào trong", bodyPart: "Gối", issue: "Cơ mông giữa còn yếu.", recommendation: "Thêm banded glute bridge và nhắc đẩy gối ra ngoài.", rationale: "Gối đổ vào trong ở pha đứng lên." } },
  { key: "depth", label: "Depth", description: "Đùi song song hoặc thấp hơn mặt sàn.", error: { code: "SHALLOW_DEPTH", label: "Squat chưa đủ sâu", bodyPart: "Hông / cổ chân", issue: "Độ linh hoạt cổ chân hạn chế.", recommendation: "Thêm deep squat hold 3×30s vào phần giãn cơ.", rationale: "Hông chưa xuống ngang gối." } },
  { key: "torsoAngle", label: "Torso Angle", description: "Thân trên giữ thẳng, không đổ về trước.", error: { code: "FORWARD_LEAN", label: "Thân đổ về trước", bodyPart: "Lưng", issue: "Core và cổ chân chưa ổn định.", recommendation: "Giữ ngực mở, nhìn thẳng phía trước.", rationale: "Góc thân > 45° ở đáy." } },
  { key: "tempo", label: "Tempo", description: "Nhịp độ đều giữa các rep.", error: { code: "TEMPO_INCONSISTENT", label: "Nhịp độ không đều", bodyPart: "Toàn thân", issue: "Mỏi dần qua các set.", recommendation: "Giữ tempo 3-1-1-0.", rationale: "Tốc độ dao động giữa các rep." } },
  { key: "balance", label: "Balance", description: "Phân bổ trọng lượng đều hai chân.", error: { code: "WEIGHT_SHIFT", label: "Dồn trọng lượng lệch", bodyPart: "Hông", issue: "Chân thuận làm việc nhiều hơn.", recommendation: "Thêm bài một chân cho bên yếu.", rationale: "Trọng tâm lệch sang phải." } },
];

const HOLD_METRICS: MetricDef[] = [
  { key: "alignment", label: "Body Alignment", description: "Cơ thể thẳng hàng trong suốt chuyển động.", error: { code: "LOWER_BACK_ARCH", label: "Cong lưng dưới", bodyPart: "Lưng dưới", issue: "Core chưa siết.", recommendation: "Ép lưng dưới xuống sàn, giảm đòn bẩy nếu cần.", rationale: "Lưng dưới cong ở nửa sau set." } },
  { key: "hipPosition", label: "Hip Position", description: "Hông ở đúng vị trí mục tiêu.", error: { code: "HIP_PIKE", label: "Hông nâng quá cao", bodyPart: "Hông", issue: "Bù trừ bằng gập hông.", recommendation: "Hạ hông ngang vai, siết mông.", rationale: "Hông cao hơn vai 8-12cm." } },
  { key: "stability", label: "Stability", description: "Dao động cơ thể trong khi giữ.", error: { code: "UNSTABLE_HOLD", label: "Giữ tư thế không ổn định", bodyPart: "Vai / core", issue: "Sức bền tĩnh còn hạn chế.", recommendation: "Chia thành nhiều set ngắn chất lượng cao.", rationale: "Dao động tăng sau 15 giây." } },
  { key: "tempo", label: "Tempo", description: "Nhịp độ chuyển động có kiểm soát.", error: { code: "TEMPO_INCONSISTENT", label: "Nhịp độ không đều", bodyPart: "Toàn thân", issue: "Vội ở các rep cuối.", recommendation: "Đếm nhịp rõ ràng cho từng rep.", rationale: "Tốc độ không đều." } },
];

function metricDefsFor(exerciseId: string): MetricDef[] {
  const pattern = exerciseById(exerciseId).movementPattern;
  if (exerciseId === "muscle-up") return PULL_METRICS;
  if (pattern === "PUSH" || exerciseId === "pike-push-up") return PUSH_METRICS;
  if (pattern === "PULL") return PULL_METRICS;
  if (pattern === "LEGS") return LEG_METRICS;
  return HOLD_METRICS;
}

/* --------------------------------------- Generation --------------------------------------- */

interface ForcedSession {
  template: TemplateKey;
  formScore: number;
  metrics?: number[];
  actual?: number[];
  invalid?: number;
  reviewed?: boolean;
}

/** Hand-authored sessions that drive dashboard alerts and the reference AI example. */
const FORCED: Record<string, Record<number, ForcedSession>> = {
  "stu-001": {
    0: { template: "push", formScore: 71, metrics: [80, 62, 68, 76, 72], reviewed: false },
    1: { template: "push", formScore: 87, reviewed: true },
  },
  "stu-007": { 0: { template: "push", formScore: 84, metrics: [91, 86, 78, 89, 76], actual: [10, 10, 9, 8], invalid: 6, reviewed: false } },
  "stu-004": { 0: { template: "skill", formScore: 93, reviewed: false } },
  "stu-003": { 0: { template: "pull", formScore: 79, reviewed: false } },
  "stu-012": { 0: { template: "push", formScore: 88, reviewed: false } },
};

function severityFor(score: number): MotionErrorSeverity {
  if (score < 70) return "HIGH";
  if (score < 78) return "MEDIUM";
  return "LOW";
}

interface Generated {
  sessions: WorkoutSessionDetail[];
  analyses: AIAnalysis[];
}

function generate(): Generated {
  const drafts: { detail: Omit<WorkoutSessionDetail, "id">; ai: Omit<AIAnalysis, "id" | "sessionId"> | null; aiExerciseIndex: number }[] = [];

  STUDENTS.forEach((student, sIndex) => {
    if (!student.lastWorkoutAt) return;
    const rng = createRng(sIndex * 97 + 13);
    const lastDaysAgo = Math.round((Date.now() - new Date(student.lastWorkoutAt).getTime()) / 86_400_000);
    const frequency = Math.max(student.trainingFrequency, 1);
    const spacing = Math.max(1, Math.round(7 / frequency));
    const count = Math.min(9, Math.max(2, Math.round(frequency * 2.2)));
    const rotation = ROTATION[student.goal];

    for (let n = 0, day = lastDaysAgo; n < count && day <= 24; n += 1, day += spacing) {
      const forced = FORCED[student.id]?.[n];
      const templateKey = forced?.template ?? rotation[n % rotation.length];
      const template = TEMPLATES[templateKey];
      const missed = student.adherence < 60 && n === 1;
      const partial = !missed && rng.next() < (100 - student.adherence) / 180;
      const quality = student.fitnessScore / 100;

      let aiExerciseIndex = -1;
      const exercises: SessionExerciseResult[] = template.exercises.map(([exerciseId, sets, reps], eIndex) => {
        const ex = exerciseById(exerciseId);
        const skipped = missed || (partial && eIndex === template.exercises.length - 1);
        const actualReps = skipped
          ? []
          : forced?.actual && eIndex === 0
            ? forced.actual
            : Array.from({ length: sets }, (_, k) => Math.max(1, reps - rng.int(0, k) - (quality < 0.6 ? rng.int(0, 2) : 0)));
        const total = actualReps.reduce((a, b) => a + b, 0);
        const formScore = skipped || !ex.aiAnalysisAvailable
          ? null
          : aiExerciseIndex === -1 && forced
            ? forced.formScore
            : clamp(student.fitnessScore + rng.int(-4, 12), 40, 98);
        if (formScore !== null && aiExerciseIndex === -1) aiExerciseIndex = eIndex;
        const invalidReps = formScore === null
          ? 0
          : forced?.invalid !== undefined && eIndex === aiExerciseIndex
            ? forced.invalid
            : Math.round(total * ((100 - formScore) / 100) * 0.9);
        return {
          id: `sx-${student.id}-${n}-${eIndex}`,
          exerciseId,
          exerciseName: ex.name,
          imageUrl: ex.imageUrl,
          targetSets: sets,
          targetReps: reps,
          actualReps,
          formScore,
          validReps: total - invalidReps,
          invalidReps,
          restSeconds: exerciseId.includes("squat") ? 75 : 90,
          aiAnalysisId: null,
        };
      });

      const targetTotal = template.exercises.reduce((sum, [, sets, reps]) => sum + sets * reps, 0);
      const actualTotal = exercises.reduce((sum, e) => sum + e.actualReps.reduce((a, b) => a + b, 0), 0);
      const validTotal = exercises.reduce((sum, e) => sum + e.validReps, 0);
      const scored = exercises.filter((e) => e.formScore !== null);
      const sessionForm = scored.length
        ? Math.round(scored.reduce((sum, e) => sum + (e.formScore ?? 0), 0) / scored.length)
        : null;
      const reviewed = forced?.reviewed ?? (day > 2 || rng.next() > 0.5);

      const detail: Omit<WorkoutSessionDetail, "id"> = {
        ...studentRef(student.id),
        workoutName: template.name,
        planName: PLAN_NAME[student.id] ?? null,
        durationMinutes: missed ? 0 : template.duration + rng.int(-6, 9),
        completionPercent: missed ? 0 : clamp((actualTotal / targetTotal) * 100),
        formScore: missed ? null : sessionForm,
        validReps: validTotal,
        totalReps: actualTotal,
        date: daysAgo(day, 17 + rng.int(0, 3), rng.pick([0, 15, 30, 45])),
        status: missed ? "MISSED" : partial ? "PARTIAL" : "COMPLETED",
        reviewStatus: missed ? "REVIEWED" : reviewed ? "REVIEWED" : "PENDING",
        rpe: missed ? null : rng.int(6, 9),
        avgHeartRate: missed ? null : rng.int(118, 146),
        studentNote: missed
          ? null
          : n === 0 && student.id === "stu-001"
            ? "Set cuối push-up vai hơi mỏi, cảm giác khuỷu tay bị bung ra."
            : rng.next() > 0.7
              ? rng.pick(["Hôm nay khá mệt vì ngủ ít.", "Cảm thấy khỏe hơn tuần trước!", "Tay sau mỏi nhiều ở set cuối.", "Nhịp tim ổn, phục hồi nhanh."])
              : null,
        exercises,
        feedback: reviewed && !missed
          ? [{ id: `fb-${student.id}-${n}`, authorName: "Hoàng Việt", type: sessionForm !== null && sessionForm >= 80 ? "PRAISE" : "CORRECTION", content: sessionForm !== null && sessionForm >= 80 ? "Form rất tốt, giữ nhịp này cho tuần tới!" : "Chú ý giữ tempo chậm ở pha hạ người nhé.", createdAt: daysAgo(Math.max(0, day - 1), 21) }]
          : [],
      };

      let ai: Omit<AIAnalysis, "id" | "sessionId"> | null = null;
      if (aiExerciseIndex >= 0) {
        const ex = exercises[aiExerciseIndex];
        const defs = metricDefsFor(ex.exerciseId);
        const score = ex.formScore ?? 0;
        const metrics: MotionMetric[] = defs.map((d, i) => ({
          key: d.key,
          label: d.label,
          description: d.description,
          score: forced?.metrics?.[i] ?? clamp(score + rng.int(-9, 9), 45, 99),
        }));
        const totalReps = ex.actualReps.reduce((a, b) => a + b, 0);
        const invalidIdx = new Set<number>();
        while (invalidIdx.size < Math.min(ex.invalidReps, totalReps)) invalidIdx.add(rng.int(Math.floor(totalReps / 3), totalReps));
        const invalidList = [...invalidIdx].sort((a, b) => a - b);

        const errors: MotionError[] = metrics
          .map((m, i) => ({ m, def: defs[i] }))
          .filter(({ m }) => m.score < 82)
          .sort((a, b) => a.m.score - b.m.score)
          .slice(0, 3)
          .map(({ m, def }, i) => ({
            id: `err-${student.id}-${n}-${i}`,
            code: def.error.code,
            label: def.error.label,
            severity: severityFor(m.score),
            affectedReps: invalidList.filter((_, k) => k % (i + 1) === 0),
            bodyPart: def.error.bodyPart,
            description: def.error.rationale,
          }));
        const topError = errors[0];
        const topDef = topError ? defs.find((d) => d.error.code === topError.code) : undefined;
        const recommendations: AIRecommendation[] = errors.map((e, i) => {
          const def = defs.find((d) => d.error.code === e.code)!;
          return { id: `rec-${student.id}-${n}-${i}`, text: def.error.recommendation, rationale: def.error.rationale, status: reviewed && i === 0 ? "ACCEPTED" : "PENDING" };
        });
        let cursor = 0;
        const reps: RepResult[] = Array.from({ length: totalReps }, (_, k) => {
          cursor += 1;
          const invalid = invalidIdx.has(k + 1);
          return { rep: cursor, valid: !invalid, score: invalid ? clamp(score - rng.int(15, 30), 30, 80) : clamp(score + rng.int(-4, 8), 60, 100), tempoSeconds: Math.round((2.4 + rng.next() * 1.4) * 10) / 10 };
        });

        ai = {
          ...studentRef(student.id),
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          analyzedAt: detail.date,
          totalReps,
          validReps: totalReps - ex.invalidReps,
          invalidReps: ex.invalidReps,
          formScore: score,
          previousFormScore: null,
          primaryError: topError?.label ?? null,
          reviewStatus: reviewed ? "REVIEWED" : "PENDING_REVIEW",
          modelVersion: "CalisVision Pose v2.4",
          metrics,
          errors,
          observations: errors.length
            ? errors.map((e) => `${e.affectedReps.length} rep có dấu hiệu "${e.label.toLowerCase()}".`)
            : ["Không phát hiện lỗi đáng kể. Form ổn định trong toàn bộ set."],
          potentialIssue: topDef?.error.issue ?? "Không có vấn đề nổi bật.",
          recommendations,
          reps,
          coachFeedback: reviewed ? "Đã xem. Đồng ý với đề xuất của AI." : null,
          reviewedAt: reviewed ? daysAgo(Math.max(0, day - 1), 21) : null,
        };
      }
      drafts.push({ detail, ai, aiExerciseIndex });
    }
  });

  // Newest first, then assign stable ids.
  drafts.sort((a, b) => new Date(b.detail.date).getTime() - new Date(a.detail.date).getTime());
  const sessions: WorkoutSessionDetail[] = [];
  const analyses: AIAnalysis[] = [];
  drafts.forEach((draft, i) => {
    const sessionId = `ses-${String(i + 1).padStart(3, "0")}`;
    const session: WorkoutSessionDetail = { ...draft.detail, id: sessionId };
    if (draft.ai) {
      const analysisId = `ai-${String(analyses.length + 1).padStart(3, "0")}`;
      analyses.push({ ...draft.ai, id: analysisId, sessionId });
      session.exercises = session.exercises.map((e, k) => (k === draft.aiExerciseIndex ? { ...e, aiAnalysisId: analysisId } : e));
    }
    sessions.push(session);
  });

  // previousFormScore = the same student's previous analysis of the same exercise.
  analyses.forEach((a, i) => {
    const prev = analyses.slice(i + 1).find((p) => p.studentId === a.studentId && p.exerciseId === a.exerciseId);
    a.previousFormScore = prev?.formScore ?? null;
  });

  return { sessions, analyses };
}

const generated = generate();

export const SESSIONS: WorkoutSessionDetail[] = generated.sessions;
export const AI_ANALYSES: AIAnalysis[] = generated.analyses;
