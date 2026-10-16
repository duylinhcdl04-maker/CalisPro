import { MockApiError } from "../../../services/mock/latency";
import type {
  ExerciseFilterParams,
  ExerciseLibraryItem,
  Paginated,
  PlanListParams,
  PlanStatus,
  SessionFeedback,
  SessionFeedbackInput,
  SessionListParams,
  WorkoutPlan,
  WorkoutPlanInput,
  WorkoutPlanSummary,
  WorkoutSessionDetail,
  WorkoutSessionSummary,
} from "../types";
import { EXERCISE_LIBRARY } from "../mock/exercises.mock";
import { PLANS, planProgress } from "../mock/plans.mock";
import { SESSIONS } from "../mock/training.mock";
import { studentRef } from "../mock/students.mock";
import { newId } from "../mock/helpers";
import { COACH_ENDPOINTS, USE_MOCK_API, api, includesText, mockResponse, paginate } from "./http";

function toPlanSummary(p: WorkoutPlan): WorkoutPlanSummary {
  const { currentWeek, progressPercent } = planProgress(p);
  return {
    id: p.id,
    name: p.name,
    studentId: p.studentId,
    studentName: p.studentName,
    studentAvatar: p.studentAvatar,
    goal: p.goal,
    level: p.level,
    durationWeeks: p.durationWeeks,
    frequencyPerWeek: p.frequencyPerWeek,
    status: p.status,
    progressPercent,
    currentWeek,
    updatedAt: p.updatedAt,
  };
}

function toSessionSummary(s: WorkoutSessionDetail): WorkoutSessionSummary {
  const { rpe: _rpe, avgHeartRate: _hr, studentNote: _note, exercises: _ex, feedback: _fb, ...summary } = s;
  return summary;
}

function findPlan(id: string) {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new MockApiError("Không tìm thấy giáo án.", 404);
  return plan;
}

function findSession(id: string) {
  const session = SESSIONS.find((s) => s.id === id);
  if (!session) throw new MockApiError("Không tìm thấy phiên tập.", 404);
  return session;
}

/** Server-side normalisation: fill missing ids so the builder can send "new" nodes without ids. */
function withIds(planId: string, input: WorkoutPlanInput): WorkoutPlan["weeks"] {
  return input.weeks.map((w) => ({
    ...w,
    id: w.id || newId(`${planId}-w`),
    days: w.days.map((d) => ({
      ...d,
      id: d.id || newId(`${planId}-d`),
      session: d.session
        ? { ...d.session, id: d.session.id || newId(`${planId}-s`), exercises: d.session.exercises.map((e) => ({ ...e, id: e.id || newId(`${planId}-e`) })) }
        : null,
    })),
  }));
}

export const workoutService = {
  /* ------------------------------ Plans ------------------------------ */

  async getPlans(params: PlanListParams = {}): Promise<WorkoutPlanSummary[]> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.plans, params);
    const list = PLANS.filter((p) => (!params.status || p.status === params.status) && includesText([p.name, p.studentName], params.search))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(toPlanSummary);
    return mockResponse(list);
  },

  async getPlan(id: string): Promise<WorkoutPlan> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.plan(id));
    return mockResponse(findPlan(id));
  },

  async savePlan(input: WorkoutPlanInput): Promise<WorkoutPlan> {
    if (!USE_MOCK_API) return input.id ? api.put(COACH_ENDPOINTS.plan(input.id), input) : api.post(COACH_ENDPOINTS.plans, input);
    const now = new Date().toISOString();
    const ref = input.studentId ? studentRef(input.studentId) : null;
    if (input.id) {
      const existing = findPlan(input.id);
      Object.assign(existing, input, {
        weeks: withIds(existing.id, input),
        studentName: ref?.studentName ?? null,
        studentAvatar: ref?.studentAvatar ?? null,
        updatedAt: now,
      });
      return mockResponse(existing, 600);
    }
    const id = newId("plan");
    const created: WorkoutPlan = {
      ...input,
      id,
      weeks: withIds(id, input),
      studentName: ref?.studentName ?? null,
      studentAvatar: ref?.studentAvatar ?? null,
      createdAt: now,
      updatedAt: now,
    };
    PLANS.unshift(created);
    return mockResponse(created, 600);
  },

  async duplicatePlan(id: string): Promise<WorkoutPlan> {
    if (!USE_MOCK_API) return api.post(COACH_ENDPOINTS.planDuplicate(id));
    const source = findPlan(id);
    const copyId = newId("plan");
    const now = new Date().toISOString();
    const copy: WorkoutPlan = {
      ...structuredClone(source),
      id: copyId,
      name: `${source.name} (bản sao)`,
      status: "DRAFT",
      studentId: null,
      studentName: null,
      studentAvatar: null,
      createdAt: now,
      updatedAt: now,
    };
    copy.weeks = withIds(copyId, { ...copy, weeks: copy.weeks.map((w) => ({ ...w, id: "", days: w.days.map((d) => ({ ...d, id: "", session: d.session ? { ...d.session, id: "", exercises: d.session.exercises.map((e) => ({ ...e, id: "" })) } : null })) })) });
    PLANS.unshift(copy);
    return mockResponse(copy, 500);
  },

  async updatePlanStatus(id: string, status: PlanStatus): Promise<WorkoutPlan> {
    if (!USE_MOCK_API) return api.patch(COACH_ENDPOINTS.planStatus(id), { status });
    const plan = findPlan(id);
    if (status === "ACTIVE" && !plan.studentId) throw new MockApiError("Cần gán học viên trước khi kích hoạt giáo án.", 409);
    plan.status = status;
    plan.updatedAt = new Date().toISOString();
    return mockResponse(plan, 400);
  },

  async assignPlan(id: string, studentId: string): Promise<WorkoutPlan> {
    if (!USE_MOCK_API) return api.post(COACH_ENDPOINTS.planAssign(id), { studentId });
    const plan = findPlan(id);
    const ref = studentRef(studentId);
    plan.studentId = studentId;
    plan.studentName = ref.studentName;
    plan.studentAvatar = ref.studentAvatar;
    if (plan.status === "DRAFT") plan.status = "ACTIVE";
    plan.updatedAt = new Date().toISOString();
    return mockResponse(plan, 500);
  },

  /* ---------------------------- Exercise library ---------------------------- */

  async getExercises(params: ExerciseFilterParams = {}): Promise<ExerciseLibraryItem[]> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.exercises, params);
    const list = EXERCISE_LIBRARY.filter(
      (e) =>
        includesText([e.name, ...e.primaryMuscles], params.search) &&
        (!params.muscle || [...e.primaryMuscles, ...e.secondaryMuscles].includes(params.muscle)) &&
        (!params.equipment || e.equipment === params.equipment) &&
        (!params.difficulty || e.difficulty === params.difficulty) &&
        (!params.pattern || e.movementPattern === params.pattern)
    );
    return mockResponse(list, 300);
  },

  /* -------------------------------- Sessions -------------------------------- */

  async getSessions(params: SessionListParams = {}): Promise<Paginated<WorkoutSessionSummary>> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.sessions, params);
    const list = SESSIONS.filter(
      (s) =>
        includesText([s.studentName, s.workoutName], params.search) &&
        (!params.status || s.status === params.status) &&
        (!params.reviewStatus || s.reviewStatus === params.reviewStatus) &&
        (!params.studentId || s.studentId === params.studentId)
    ).map(toSessionSummary);
    return mockResponse(paginate(list, params.page, params.pageSize ?? 12));
  },

  async getSession(id: string): Promise<WorkoutSessionDetail> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.session(id));
    return mockResponse(findSession(id));
  },

  async addSessionFeedback(input: SessionFeedbackInput): Promise<SessionFeedback> {
    if (!USE_MOCK_API) return api.post(COACH_ENDPOINTS.sessionFeedback(input.sessionId), input);
    const session = findSession(input.sessionId);
    const feedback: SessionFeedback = { id: newId("fb"), authorName: "Hoàng Việt", type: input.type, content: input.content, createdAt: new Date().toISOString() };
    session.feedback.push(feedback);
    session.reviewStatus = "REVIEWED";
    return mockResponse(feedback, 450);
  },

  async markSessionReviewed(id: string): Promise<WorkoutSessionDetail> {
    if (!USE_MOCK_API) return api.post(COACH_ENDPOINTS.sessionReview(id));
    const session = findSession(id);
    session.reviewStatus = "REVIEWED";
    return mockResponse(session, 350);
  },
};
