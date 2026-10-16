import { z } from "zod";

export const COMMENT_MIN = 10;
export const COMMENT_MAX = 2000;

export const reviewSchema = z.object({
  coachComment: z
    .string()
    .trim()
    .min(COMMENT_MIN, `Nhận xét cần tối thiểu ${COMMENT_MIN} ký tự.`)
    .max(COMMENT_MAX, `Nhận xét tối đa ${COMMENT_MAX} ký tự.`),
  items: z
    .array(z.object({ text: z.string(), checked: z.boolean(), custom: z.boolean() }))
    .refine((items) => items.some((i) => i.checked && i.text.trim().length > 0), "Chọn hoặc thêm ít nhất một khuyến nghị."),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;

/** Existing recommendations start checked; the coach unchecks what they do not want to send. */
export function toFormValues(comment: string | null, recommendations: string[]): ReviewFormValues {
  return { coachComment: comment ?? "", items: recommendations.map((text) => ({ text, checked: true, custom: false })) };
}

export function selectedRecommendations(values: ReviewFormValues): string[] {
  return values.items.filter((i) => i.checked && i.text.trim()).map((i) => i.text.trim());
}
