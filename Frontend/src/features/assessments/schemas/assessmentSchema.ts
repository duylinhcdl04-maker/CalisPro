import { z } from 'zod';

export const questionOptionSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Nhãn lựa chọn không được để trống'),
  value: z.union([z.string(), z.number()]),
  score: z.number().min(0).max(100),
  isRecommended: z.boolean().optional(),
});

export const performanceConfigSchema = z.object({
  exerciseId: z.string().optional(),
  exerciseName: z.string().min(1, 'Tên bài tập không được để trống'),
  measurementType: z.enum(['REPETITIONS', 'HOLD_DURATION_SECONDS', 'DISTANCE_CM', 'WEIGHT_KG']),
  unit: z.string().min(1, 'Đơn vị đo là bắt buộc'),
  minValue: z.number().min(0),
  maxValue: z.number().min(1),
  instructionText: z.string().min(1, 'Hướng dẫn thực hiện bài test là bắt buộc'),
  videoUrl: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const scoringRuleSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  operator: z.enum(['GT', 'GTE', 'LT', 'LTE', 'BETWEEN', 'EQ']),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  exactValue: z.union([z.number(), z.string()]).optional(),
  score: z.number().min(0).max(100),
  label: z.string().optional(),
});

export const assessmentQuestionRefSchema = z.object({
  questionId: z.string().min(1, 'ID câu hỏi không hợp lệ'),
  order: z.number().min(1),
  // 0 = câu chỉ thu thập thông tin (không tính điểm)
  weight: z.number().min(0, 'Trọng số không được âm').max(100, 'Trọng số không vượt quá 100%'),
  required: z.boolean(),
  // Phần / bước hiển thị cho học viên (vd. "Thông tin cơ bản")
  section: z.string().optional(),
  // Định nghĩa đầy đủ của câu hỏi (gửi kèm khi lưu để backend tạo/cập nhật câu hỏi riêng của bài)
  question: z.any().optional(),
});

export const fitnessLevelSchema = z.object({
  id: z.string(),
  code: z.string().min(1),
  name: z.string().min(1, 'Tên cấp độ không được để trống'),
  minScore: z.number().min(0).max(100),
  maxScore: z.number().min(0).max(100),
  description: z.string().min(1, 'Mô tả cấp độ là bắt buộc'),
  recommendation: z.string().min(1, 'Lời khuyên lộ trình là bắt buộc'),
  colorScheme: z.enum(['green', 'blue', 'purple', 'amber', 'emerald']),
  badgeLabel: z.string(),
});

export const reminderRuleSchema = z.object({
  id: z.string(),
  timing: z.enum(['7_DAYS_BEFORE', '3_DAYS_BEFORE', 'ON_DUE_DATE', '3_DAYS_AFTER']),
  timingLabel: z.string(),
  enabled: z.boolean(),
  channels: z.array(z.enum(['IN_APP', 'EMAIL', 'PUSH'])).min(1, 'Cần chọn ít nhất 1 kênh thông báo'),
  customMessage: z.string().optional(),
});

export const assessmentScheduleSchema = z.object({
  enabled: z.boolean(),
  triggerTypes: z.array(z.enum(['TIME_BASED', 'WORKOUT_BASED', 'DYNAMIC_LEVEL', 'MANUAL'])).min(1, 'Chọn ít nhất 1 điều kiện kích hoạt'),
  triggerLogic: z.enum(['OR', 'AND']),
  timeFrequency: z.object({
    value: z.number().min(1, 'Tần suất thời gian phải >= 1'),
    unit: z.enum(['DAYS', 'WEEKS', 'MONTHS']),
  }),
  dynamicRules: z.array(z.object({
    levelCode: z.string(),
    levelName: z.string(),
    intervalValue: z.number().min(1),
    intervalUnit: z.enum(['DAYS', 'WEEKS', 'MONTHS']),
  })),
  workoutTrigger: z.object({
    enabled: z.boolean(),
    requiredWorkoutsCount: z.number().min(1, 'Số buổi tập phải >= 1'),
  }),
  gracePeriodDays: z.number().min(0, 'Thời gian gia hạn >= 0 ngày').max(30),
  reminders: z.array(reminderRuleSchema),
});

export const assessmentFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Tên hệ thống bài đánh giá cần ít nhất 3 ký tự'),
  displayName: z.string().min(3, 'Tên hiển thị học viên cần ít nhất 3 ký tự'),
  description: z.string().min(10, 'Mô tả chi tiết mục đích bài đánh giá ít nhất 10 ký tự'),
  type: z.enum(['INITIAL', 'PERIODIC', 'STRENGTH', 'ENDURANCE', 'MOBILITY', 'SKILL', 'CUSTOM']),
  estimatedDuration: z.number().min(1, 'Thời lượng ước tính phải ít nhất 1 phút').max(120),
  tags: z.array(z.string()),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  targetAudience: z.object({
    fitnessLevels: z.array(z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE'])).min(1, 'Chọn ít nhất 1 cấp độ phù hợp'),
    goals: z.array(z.enum(['GENERAL_FITNESS', 'STRENGTH', 'MUSCLE_BUILDING', 'SKILL', 'MOBILITY', 'ENDURANCE'])).min(1, 'Chọn ít nhất 1 mục tiêu'),
    ageRange: z.tuple([z.number(), z.number()]).optional(),
  }),
  questions: z.array(assessmentQuestionRefSchema).min(1, 'Bài đánh giá cần ít nhất 1 câu hỏi'),
  scoringConfig: z.object({
    maxTotalScore: z.number().default(100),
    questionScoring: z.array(z.any()).default([]),
    passScore: z.number().optional(),
  }),
  fitnessLevels: z.array(fitnessLevelSchema).min(1, 'Cần cấu hình ít nhất 1 cấp độ phân loại'),
  schedule: assessmentScheduleSchema,
});

export type AssessmentFormData = z.infer<typeof assessmentFormSchema>;
