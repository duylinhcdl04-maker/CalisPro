import { z } from "zod";
import { MAX_WEEKS } from "./planModel";

const GOALS = ["STRENGTH", "MUSCLE", "FAT_LOSS", "SKILL", "MOBILITY", "ENDURANCE"] as const;
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ELITE"] as const;

export const planHeaderSchema = z.object({
  name: z.string().trim().min(3, "Tên giáo án cần ít nhất 3 ký tự.").max(80, "Tên giáo án tối đa 80 ký tự."),
  studentId: z.string(),
  goal: z.enum(GOALS, { error: "Chọn mục tiêu." }),
  level: z.enum(LEVELS, { error: "Chọn trình độ." }),
  durationWeeks: z
    .number({ error: "Nhập số tuần." })
    .int("Số tuần phải là số nguyên.")
    .min(1, "Tối thiểu 1 tuần.")
    .max(MAX_WEEKS, `Tối đa ${MAX_WEEKS} tuần.`),
  frequencyPerWeek: z
    .number({ error: "Nhập số buổi mỗi tuần." })
    .int("Số buổi phải là số nguyên.")
    .min(1, "Tối thiểu 1 buổi.")
    .max(7, "Tối đa 7 buổi."),
  description: z.string().max(500, "Mô tả tối đa 500 ký tự."),
});

export type PlanHeaderValues = z.infer<typeof planHeaderSchema>;

const TEMPO = /^(\d-\d-\d-\d|-)$/;
const REPS = /^(\d{1,3}(-\d{1,3})?|\d{1,3}s)$/;

export const exerciseEditSchema = z.object({
  sets: z.number({ error: "Nhập số hiệp." }).int("Số hiệp phải là số nguyên.").min(1, "Tối thiểu 1 hiệp.").max(10, "Tối đa 10 hiệp."),
  reps: z.string().trim().min(1, "Nhập số lần hoặc thời gian.").regex(REPS, 'Dạng hợp lệ: "10", "8-12" hoặc "30s".'),
  restSeconds: z.number({ error: "Nhập thời gian nghỉ." }).int("Nhập số nguyên.").min(0, "Không được âm.").max(600, "Tối đa 600 giây."),
  tempo: z.string().trim().regex(TEMPO, 'Dạng hợp lệ: "2-0-1-0" hoặc "-".'),
  intensity: z.enum(["LOW", "MODERATE", "HIGH", "MAX"]),
  notes: z.string().max(300, "Ghi chú tối đa 300 ký tự."),
});

export type ExerciseEditValues = z.infer<typeof exerciseEditSchema>;
