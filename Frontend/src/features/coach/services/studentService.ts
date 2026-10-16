import { MockApiError } from "../../../services/mock/latency";
import type {
  AttentionAlert,
  CoachNote,
  CoachNoteInput,
  Paginated,
  Student,
  StudentAIInsight,
  StudentDetail,
  StudentLevel,
  StudentListParams,
} from "../types";
import { ATTENTION_ALERTS, COACH_NOTES, STUDENTS, buildStudentDetail } from "../mock/students.mock";
import { AI_ANALYSES } from "../mock/training.mock";
import { newId } from "../mock/helpers";
import { COACH_ENDPOINTS, USE_MOCK_API, api, includesText, mockResponse, paginate } from "./http";

const LEVEL_ORDER: Record<StudentLevel, number> = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2, ELITE: 3 };
const DAY = 86_400_000;

function daysSince(iso: string | null) {
  return iso ? (Date.now() - new Date(iso).getTime()) / DAY : Number.POSITIVE_INFINITY;
}

function matches(s: Student, p: StudentListParams) {
  if (!includesText([s.name, s.email, s.code], p.search)) return false;
  if (p.level && s.level !== p.level) return false;
  if (p.goal && s.goal !== p.goal) return false;
  if (p.status && s.status !== p.status) return false;
  if (p.needsAttention && !s.needsAttention) return false;
  if (p.performance && s.performanceTrend !== p.performance) return false;
  if (p.frequency) {
    const bucket = s.trainingFrequency < 2.5 ? "LOW" : s.trainingFrequency < 4 ? "MEDIUM" : "HIGH";
    if (bucket !== p.frequency) return false;
  }
  if (p.lastActive) {
    const d = daysSince(s.lastWorkoutAt);
    const ok = { "7D": d <= 7, "14D": d <= 14, "30D": d <= 30, "30D_PLUS": d > 30 }[p.lastActive];
    if (!ok) return false;
  }
  return true;
}

function sortStudents(list: Student[], p: StudentListParams) {
  const dir = p.sortDir === "asc" ? 1 : -1;
  const key = p.sortBy;
  if (!key) {
    // Default: students needing attention first, then most recently active.
    return [...list].sort((a, b) => Number(b.needsAttention) - Number(a.needsAttention) || daysSince(a.lastWorkoutAt) - daysSince(b.lastWorkoutAt));
  }
  return [...list].sort((a, b) => {
    switch (key) {
      case "name": return a.name.localeCompare(b.name, "vi") * dir;
      case "level": return (LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]) * dir;
      case "lastWorkoutAt": return (daysSince(b.lastWorkoutAt) - daysSince(a.lastWorkoutAt)) * dir;
      default: return (a[key] - b[key]) * dir;
    }
  });
}

function insightsFor(studentId: string): StudentAIInsight[] {
  const recent = AI_ANALYSES.filter((a) => a.studentId === studentId).slice(0, 2);
  return recent.flatMap((a) =>
    a.errors.length
      ? a.errors.map((e) => ({
          id: `${a.id}-${e.id}`,
          exerciseName: a.exerciseName,
          label: e.label,
          detail: `${e.affectedReps.length}/${a.totalReps} rep. ${e.description}`,
          severity: e.severity === "HIGH" ? ("critical" as const) : e.severity === "MEDIUM" ? ("warning" as const) : ("info" as const),
          analysisId: a.id,
          detectedAt: a.analyzedAt,
        }))
      : [{ id: `${a.id}-ok`, exerciseName: a.exerciseName, label: "Form ổn định", detail: `Form score ${a.formScore}/100, không phát hiện lỗi đáng kể.`, severity: "info" as const, analysisId: a.id, detectedAt: a.analyzedAt }]
  );
}

export const studentService = {
  async getStudents(params: StudentListParams = {}): Promise<Paginated<Student>> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.students, params);
    const filtered = sortStudents(STUDENTS.filter((s) => matches(s, params)), params);
    return mockResponse(paginate(filtered, params.page, params.pageSize ?? 10));
  },

  /** Unpaginated lightweight list for pickers (assign plan, calendar event, filters). */
  async getStudentOptions(): Promise<Pick<Student, "id" | "name" | "avatarUrl" | "level">[]> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.students, { view: "options" });
    return mockResponse(STUDENTS.map(({ id, name, avatarUrl, level }) => ({ id, name, avatarUrl, level })), 250);
  },

  async getStudent(id: string): Promise<StudentDetail> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.student(id));
    const student = STUDENTS.find((s) => s.id === id);
    if (!student) throw new MockApiError("Không tìm thấy học viên.", 404);
    return mockResponse(buildStudentDetail(student, insightsFor(id)));
  },

  async getNotes(studentId: string): Promise<CoachNote[]> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.studentNotes(studentId));
    const notes = COACH_NOTES.filter((n) => n.studentId === studentId).sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)
    );
    return mockResponse(notes, 300);
  },

  async createNote(input: CoachNoteInput): Promise<CoachNote> {
    if (!USE_MOCK_API) return api.post(COACH_ENDPOINTS.studentNotes(input.studentId), input);
    const note: CoachNote = { ...input, id: newId("note"), authorName: "Hoàng Việt", createdAt: new Date().toISOString() };
    COACH_NOTES.unshift(note);
    return mockResponse(note, 400);
  },

  async getAttentionAlerts(): Promise<AttentionAlert[]> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.attention);
    return mockResponse(ATTENTION_ALERTS);
  },
};
