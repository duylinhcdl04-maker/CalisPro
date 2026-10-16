import type { RuleSetDetail, RuleSetUpdateInput } from "../../types";

/** Giá trị người dùng đang gõ (chuỗi) chưa lưu. Khoá chỉ tồn tại khi khác giá trị đã lưu. */
export interface RuleSetEdits {
  params: Record<string, string>;
  levels: Record<string, Partial<Record<"promoteMin" | "regressBelow" | "minCompetencyConfidence", string>>>;
  requirements: Record<number, string>;
}

export const EMPTY_EDITS: RuleSetEdits = { params: {}, levels: {}, requirements: {} };

export function countEdits(e: RuleSetEdits): number {
  return Object.keys(e.params).length + Object.values(e.levels).reduce((n, l) => n + Object.keys(l).length, 0) + Object.keys(e.requirements).length;
}

function toNumber(text: string): number | null {
  if (text.trim() === "") return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

/** Giá trị gõ vào không phải số hợp lệ => danh sách mô tả để chặn lưu ngay tại giao diện (backend vẫn kiểm tra lại). */
export function invalidEdits(detail: RuleSetDetail, e: RuleSetEdits): string[] {
  const bad: string[] = [];
  for (const [key, text] of Object.entries(e.params)) {
    const param = detail.params.find((p) => p.key === key);
    if (param?.value != null && toNumber(text) === null) bad.push(key);
  }
  for (const [code, fields] of Object.entries(e.levels)) for (const [f, text] of Object.entries(fields)) if (toNumber(text ?? "") === null) bad.push(`${code}.${f}`);
  for (const [id, text] of Object.entries(e.requirements)) if (toNumber(text) === null) bad.push(`yêu cầu #${id}`);
  return bad;
}

/** Chuyển các chỉnh sửa thành yêu cầu PUT. Chỉ gửi phần thật sự khác giá trị đã lưu. */
export function buildUpdate(detail: RuleSetDetail, e: RuleSetEdits): RuleSetUpdateInput {
  const params: NonNullable<RuleSetUpdateInput["params"]> = [];
  for (const [key, text] of Object.entries(e.params)) {
    const param = detail.params.find((p) => p.key === key);
    if (!param) continue;
    if (param.value != null) {
      const n = toNumber(text);
      if (n !== null && n !== param.value) params.push({ key, value: n });
    } else if (text !== (param.text ?? "")) params.push({ key, text });
  }
  const levels: NonNullable<RuleSetUpdateInput["levels"]> = [];
  for (const [code, fields] of Object.entries(e.levels)) {
    const level = detail.levels.find((l) => l.code === code);
    if (!level) continue;
    const u: { code: string; promoteMin?: number; regressBelow?: number; minCompetencyConfidence?: number } = { code };
    for (const f of ["promoteMin", "regressBelow", "minCompetencyConfidence"] as const) {
      const n = toNumber(fields[f] ?? "");
      if (n !== null && n !== level[f]) u[f] = n;
    }
    if (Object.keys(u).length > 1) levels.push(u);
  }
  const requirements: NonNullable<RuleSetUpdateInput["requirements"]> = [];
  for (const [id, text] of Object.entries(e.requirements)) {
    const n = toNumber(text);
    const original = detail.levels.flatMap((l) => l.requirements).find((r) => r.id === Number(id));
    if (n !== null && original && n !== original.value) requirements.push({ id: Number(id), value: n });
  }
  return { params, levels, requirements };
}

export function hasChanges(u: RuleSetUpdateInput): boolean {
  return (u.params?.length ?? 0) + (u.levels?.length ?? 0) + (u.requirements?.length ?? 0) > 0;
}

/** Nhóm tham số theo tiền tố đầu tiên để dễ tìm. */
export function groupOfParam(key: string): string {
  const head = key.split(".")[0];
  return head === key ? "Chung" : head;
}

export const REVIEW_SCOPE_LABEL: Record<string, string> = {
  LADDER: "Thang tiến triển",
  WEIGHTS: "Trọng số",
  LEVEL_REQUIREMENTS: "Ngưỡng & yêu cầu level",
  STICKY_FLAGS: "Cờ an toàn dai dẳng",
  CLEARANCE_RULES: "Quy tắc gỡ ràng buộc",
  SAFETY_POLICIES: "Chính sách an toàn",
  OTHER: "Tham số khác",
};
