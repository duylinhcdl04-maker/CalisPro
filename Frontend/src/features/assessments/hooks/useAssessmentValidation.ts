import { useMemo } from 'react';
import { AssessmentFormData } from '../schemas/assessmentSchema';
import { isV2Category } from '../constants/fitnessDimensions';

export interface StepValidationResult {
  step: number;
  title: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function useAssessmentValidation(formData: AssessmentFormData) {
  return useMemo(() => {
    const results: StepValidationResult[] = [];

    // Step 1: Info
    const step1Errors: string[] = [];
    if (!formData.name || formData.name.trim().length < 3) step1Errors.push('Tên hệ thống bài test phải có ít nhất 3 ký tự');
    if (!formData.displayName || formData.displayName.trim().length < 3) step1Errors.push('Tên hiển thị học viên phải có ít nhất 3 ký tự');
    if (!formData.description || formData.description.trim().length < 10) step1Errors.push('Mô tả mục đích bài test phải có ít nhất 10 ký tự');
    if (!formData.type) step1Errors.push('Chưa chọn loại bài đánh giá');
    if (!formData.estimatedDuration || formData.estimatedDuration <= 0) step1Errors.push('Thời lượng dự kiến phải lớn hơn 0');

    results.push({
      step: 1,
      title: 'Thông tin cơ bản',
      isValid: step1Errors.length === 0,
      errors: step1Errors,
      warnings: [],
    });

    // Step 2: Questions
    const step2Errors: string[] = [];
    const step2Warnings: string[] = [];
    const questionsCount = formData.questions?.length || 0;
    if (questionsCount === 0) {
      step2Errors.push('Bài đánh giá cần ít nhất 1 câu hỏi');
    }

    // Câu V2 (hồ sơ, bối cảnh, thang tiến triển) không có trọng số %, không tính vào tổng
    const scoredQuestions = (formData.questions || []).filter((q) => !isV2Category(q.question?.category));
    const totalWeight = scoredQuestions.reduce((sum, q) => sum + (Number(q.weight) || 0), 0);
    if (scoredQuestions.length > 0 && Math.round(totalWeight) !== 100) {
      step2Errors.push(`Tổng trọng số câu hỏi hiện tại là ${totalWeight}%, cần đạt chính xác 100%`);
    }

    results.push({
      step: 2,
      title: 'Ngân hàng câu hỏi',
      isValid: step2Errors.length === 0,
      errors: step2Errors,
      warnings: step2Warnings,
    });

    // Step 3: Scoring
    const step3Errors: string[] = [];
    results.push({
      step: 3,
      title: 'Thang điểm',
      isValid: step3Errors.length === 0,
      errors: step3Errors,
      warnings: [],
    });

    // Step 4: Fitness Level
    const step4Errors: string[] = [];
    const levelsCount = formData.fitnessLevels?.length || 0;
    // Bài đánh giá ban đầu: level do Level Engine quyết định, không cần cấu hình mức trình độ trong bài
    if (levelsCount === 0 && formData.type !== 'INITIAL') {
      step4Errors.push('Cần ít nhất 1 cấp độ phân loại thể lực');
    }
    results.push({
      step: 4,
      title: 'Phân loại thể lực',
      isValid: step4Errors.length === 0,
      errors: step4Errors,
      warnings: [],
    });

    // Step 5: Schedule
    const step5Errors: string[] = [];
    if (formData.schedule?.enabled) {
      if (!formData.schedule.triggerTypes || formData.schedule.triggerTypes.length === 0) {
        step5Errors.push('Cần chọn ít nhất 1 điều kiện kích hoạt khi bật tự động');
      }
    }
    results.push({
      step: 5,
      title: 'Chu kỳ đánh giá',
      isValid: step5Errors.length === 0,
      errors: step5Errors,
      warnings: [],
    });

    // Step 6: Review & ready to publish
    const allValid = results.every((r) => r.isValid);

    return {
      stepValidations: results,
      totalWeight,
      questionsCount,
      isReadyToPublish: allValid,
    };
  }, [formData]);
}
