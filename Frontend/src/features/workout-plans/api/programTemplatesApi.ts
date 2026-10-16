import axios from "axios";
import { apiClient } from "../../../lib/api/client";
import type { FitnessGoal, FitnessLevel, ProgramStatus, WorkoutPlan } from "../../../types/workoutPlan";

/**
 * Giáo án mẫu ở backend (/admin/program-templates) - Level Engine chọn giáo án theo level, mục tiêu,
 * số buổi/tuần, thời lượng, dụng cụ rồi điều chỉnh từng bài theo nấc tiến trình của học viên.
 */

export interface ProgramTemplateDto {
  id: string;
  code: string;
  version: number;
  name: string;
  description?: string;
  status: ProgramStatus;
  levelMin: string;
  levelMax: string;
  primaryLevel: string;
  goalCodes: string[];
  daysPerWeekMin: number;
  daysPerWeekMax: number;
  sessionMinutes: number;
  durationWeeks: number;
  deloadWeek?: number | null;
  requiredEquipment: string[];
  emphasis: Record<string, number>;
  requiresCoachReview: boolean;
  priority: number;
  structure?: { weeks?: WorkoutPlan["weeks"]; meta?: Partial<WorkoutPlan> } | null;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  assignedUsersCount: number;
  activeUsersCount: number;
}

export interface CoverageCell {
  level: string;
  goal: string;
  daysPerWeek: number;
  templateCount: number;
  templates: string[];
}

export interface CoverageDto {
  levels: string[];
  goals: string[];
  days: number[];
  cells: CoverageCell[];
}

// ---------------------------------------------------------------- Ánh xạ level / mục tiêu / dụng cụ

export const LEVEL_TO_CODE: Record<FitnessLevel, string> = {
  Foundation: "L0",
  Beginner: "L1",
  Intermediate: "L2",
  Advanced: "L3",
  Elite: "L4",
};

export const CODE_TO_LEVEL: Record<string, FitnessLevel> = Object.fromEntries(
  Object.entries(LEVEL_TO_CODE).map(([k, v]) => [v, k as FitnessLevel])
);

export const GOAL_TO_CODE: Record<FitnessGoal, string> = {
  Strength: "STRENGTH",
  "Muscle Gain": "MUSCLE_GAIN",
  Endurance: "ENDURANCE",
  Mobility: "FLEXIBILITY",
  "Weight Management": "WEIGHT_LOSS",
  "Calisthenics Skills": "SKILL",
  "General Fitness": "GENERAL_FITNESS",
};

const CODE_TO_GOAL: Record<string, FitnessGoal> = Object.fromEntries(
  Object.entries(GOAL_TO_CODE).map(([k, v]) => [v, k as FitnessGoal])
);

/** Mục tiêu kỹ năng cụ thể (có bài đích trong Skill Tree). */
export const SKILL_GOALS: { code: string; label: string }[] = [
  { code: "FIRST_PULL_UP", label: "Pull-up đầu tiên" },
  { code: "MUSCLE_UP", label: "Muscle-up" },
  { code: "HANDSTAND", label: "Handstand" },
];

export const EQUIPMENT_OPTIONS: { code: string; label: string }[] = [
  { code: "PULL_UP_BAR", label: "Xà đơn" },
  { code: "PARALLEL_BARS", label: "Xà kép" },
  { code: "LOW_BAR", label: "Xà thấp" },
  { code: "RINGS", label: "Vòng treo" },
  { code: "RESISTANCE_BAND", label: "Dây kháng lực" },
];

function equipmentFromLabels(labels: string[] = []): string[] {
  const out = new Set<string>();
  for (const raw of labels) {
    const l = raw.toLowerCase();
    if (l.includes("xà đơn") || l.includes("pull-up bar") || l.includes("pull up bar")) out.add("PULL_UP_BAR");
    if (l.includes("xà kép") || l.includes("parallel") || l.includes("dip")) out.add("PARALLEL_BARS");
    if (l.includes("vòng") || l.includes("ring")) out.add("RINGS");
    if (l.includes("dây") || l.includes("band")) out.add("RESISTANCE_BAND");
    if (l.includes("xà thấp") || l.includes("low bar")) out.add("LOW_BAR");
  }
  return [...out];
}

// ---------------------------------------------------------------- Chuyển đổi

export function toTemplateRequest(plan: Partial<WorkoutPlan>) {
  const primaryLevel = LEVEL_TO_CODE[plan.fitnessLevel ?? "Beginner"];
  const goals = new Set<string>();
  if (plan.primaryGoal) goals.add(GOAL_TO_CODE[plan.primaryGoal]);
  (plan.secondaryGoals ?? []).forEach((g) => goals.add(GOAL_TO_CODE[g]));
  (plan.targetGoalCodes ?? []).forEach((g) => goals.add(g));
  const days = plan.frequencyDaysPerWeek ?? 3;
  const {
    weeks,
    id: _id,
    assignedUsersCount: _a,
    activeUsersCount: _b,
    completionRate: _c,
    averageRating: _d,
    emphasis: _e,
    ...meta
  } = plan as WorkoutPlan;
  return {
    name: plan.name,
    description: plan.description,
    status: plan.status,
    primaryLevel,
    levelMin: LEVEL_TO_CODE[plan.levelMin ?? plan.fitnessLevel ?? "Beginner"],
    levelMax: LEVEL_TO_CODE[plan.levelMax ?? plan.fitnessLevel ?? "Beginner"],
    goalCodes: [...goals].filter(Boolean),
    daysPerWeekMin: days,
    daysPerWeekMax: Math.max(days, plan.frequencyDaysMax ?? days),
    sessionMinutes: plan.sessionDurationMinutes ?? 45,
    durationWeeks: weeks?.length || plan.durationWeeks || 4,
    deloadWeek: plan.deloadWeek ?? 0,
    requiredEquipment: plan.requiredEquipmentCodes ?? equipmentFromLabels(plan.equipmentRequired),
    // Giữ nguyên toàn bộ dữ liệu builder để chỉnh sửa lại không mất thông tin
    structure: { weeks: weeks ?? [], meta },
  };
}

export function fromTemplateDto(dto: ProgramTemplateDto): WorkoutPlan {
  const meta = (dto.structure?.meta ?? {}) as Partial<WorkoutPlan>;
  const primaryGoal = meta.primaryGoal ?? CODE_TO_GOAL[dto.goalCodes.find((g) => CODE_TO_GOAL[g]) ?? ""] ?? "General Fitness";
  return {
    ...meta,
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description ?? "",
    primaryGoal,
    secondaryGoals: meta.secondaryGoals ?? [],
    targetGoalCodes: dto.goalCodes.filter((g) => !CODE_TO_GOAL[g]),
    fitnessLevel: CODE_TO_LEVEL[dto.primaryLevel] ?? "Beginner",
    levelMin: CODE_TO_LEVEL[dto.levelMin],
    levelMax: CODE_TO_LEVEL[dto.levelMax],
    durationWeeks: dto.durationWeeks,
    frequencyDaysPerWeek: dto.daysPerWeekMin,
    frequencyDaysMax: dto.daysPerWeekMax,
    sessionDurationMinutes: dto.sessionMinutes,
    deloadWeek: dto.deloadWeek ?? null,
    requiredEquipmentCodes: dto.requiredEquipment,
    equipmentRequired: meta.equipmentRequired ?? (dto.requiredEquipment.length
      ? dto.requiredEquipment.map((c) => EQUIPMENT_OPTIONS.find((o) => o.code === c)?.label ?? c)
      : ["Không dụng cụ (Bodyweight)"]),
    programType: meta.programType ?? "Structured Program",
    status: dto.status,
    version: String(dto.version),
    assignedUsersCount: dto.assignedUsersCount,
    activeUsersCount: dto.activeUsersCount,
    completionRate: meta.completionRate ?? 0,
    averageRating: meta.averageRating ?? 0,
    updatedAt: dto.updatedAt ?? new Date().toISOString(),
    createdAt: dto.createdAt ?? new Date().toISOString(),
    createdBy: dto.createdBy ?? "Admin",
    emphasis: dto.emphasis,
    weeks: dto.structure?.weeks ?? [],
  };
}

function rethrow(err: unknown, action: string): never {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const msg = (err.response?.data as { message?: string } | undefined)?.message;
    const reason = !err.response ? "không kết nối được máy chủ"
      : status === 401 ? "phiên đăng nhập đã hết hạn"
      : status === 403 ? "tài khoản không có quyền ADMIN"
      : msg || `lỗi máy chủ (${status})`;
    throw new Error(`${action}: ${reason}.`);
  }
  throw err instanceof Error ? err : new Error(action);
}

// ---------------------------------------------------------------- API

export const programTemplatesApi = {
  async list(includeArchived = false): Promise<WorkoutPlan[]> {
    try {
      const res = await apiClient.get<ProgramTemplateDto[]>("/admin/program-templates", { params: { includeArchived } });
      return res.data.map(fromTemplateDto);
    } catch (e) { rethrow(e, "Không tải được danh sách giáo án"); }
  },
  async get(id: string): Promise<WorkoutPlan | null> {
    try {
      const res = await apiClient.get<ProgramTemplateDto>(`/admin/program-templates/${id}`);
      return fromTemplateDto(res.data);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 400) return null;
      rethrow(e, "Không tải được giáo án");
    }
  },
  async create(plan: Partial<WorkoutPlan>): Promise<WorkoutPlan> {
    try {
      const res = await apiClient.post<ProgramTemplateDto>("/admin/program-templates", toTemplateRequest(plan));
      return fromTemplateDto(res.data);
    } catch (e) { rethrow(e, "Không tạo được giáo án"); }
  },
  /** Sửa giáo án đã xuất bản và đang có học viên dùng -> backend tạo phiên bản mới (id mới). */
  async update(id: string, plan: Partial<WorkoutPlan>): Promise<WorkoutPlan> {
    try {
      const res = await apiClient.put<ProgramTemplateDto>(`/admin/program-templates/${id}`, toTemplateRequest(plan));
      return fromTemplateDto(res.data);
    } catch (e) { rethrow(e, "Không lưu được giáo án"); }
  },
  async setStatus(id: string, status: ProgramStatus): Promise<WorkoutPlan> {
    try {
      const res = await apiClient.patch<ProgramTemplateDto>(`/admin/program-templates/${id}/status`, { status });
      return fromTemplateDto(res.data);
    } catch (e) { rethrow(e, "Không đổi được trạng thái giáo án"); }
  },
  /** Coach gửi giáo án nháp cho Admin duyệt; Admin nhận thông báo realtime. */
  async submitReview(id: string): Promise<void> {
    try {
      await apiClient.post(`/admin/program-templates/${id}/submit-review`);
    } catch (e) { rethrow(e, "Không gửi duyệt được giáo án"); }
  },
  async duplicate(id: string): Promise<WorkoutPlan> {
    try {
      const res = await apiClient.post<ProgramTemplateDto>(`/admin/program-templates/${id}/duplicate`);
      return fromTemplateDto(res.data);
    } catch (e) { rethrow(e, "Không nhân bản được giáo án"); }
  },
  async remove(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/program-templates/${id}`);
    } catch (e) { rethrow(e, "Không xoá được giáo án"); }
  },
  async coverage(): Promise<CoverageDto> {
    try {
      const res = await apiClient.get<CoverageDto>("/admin/program-templates/coverage");
      return res.data;
    } catch (e) { rethrow(e, "Không tải được ma trận độ phủ"); }
  },
};
