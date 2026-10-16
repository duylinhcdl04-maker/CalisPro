/** 4 phần của một buổi tập. Giá trị trùng với sectionType của giáo án và session_roles của động tác ở backend. */
export type SessionRole = "WARMUP" | "MAIN" | "ACCESSORY" | "COOLDOWN";

export const SESSION_ROLES: { value: SessionRole; label: string; hint: string }[] = [
  { value: "WARMUP", label: "Khởi động", hint: "Làm ấm khớp và kích hoạt cơ, không tính điểm" },
  { value: "MAIN", label: "Bài chính", hint: "Bài trọng tâm của buổi, nên có bài AI đo được" },
  { value: "ACCESSORY", label: "Bài bổ trợ", hint: "Bài phụ, core hoặc giữ tĩnh bổ sung cho bài chính" },
  { value: "COOLDOWN", label: "Thả lỏng & đo linh hoạt", hint: "Giãn cơ và các bài đo độ linh hoạt" },
];

export const SESSION_ROLE_ORDER: SessionRole[] = SESSION_ROLES.map((r) => r.value);

export const sessionRoleLabel = (value: string): string => SESSION_ROLES.find((r) => r.value === value)?.label ?? value;

/** Phần "SKILL" cũ của giáo án mẫu được tính là Bài chính. */
export const canonicalSection = (type: string): SessionRole | null => {
  const t = type === "SKILL" ? "MAIN" : type;
  return SESSION_ROLE_ORDER.includes(t as SessionRole) ? (t as SessionRole) : null;
};
