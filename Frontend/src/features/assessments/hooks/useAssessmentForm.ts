import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assessmentFormSchema, AssessmentFormData } from '../schemas/assessmentSchema';
import { INITIAL_ASSESSMENT_FORM_VALUES } from '../constants/defaultValues';
import { Assessment } from '../types';

export function useAssessmentForm(initialData?: Partial<Assessment>): UseFormReturn<AssessmentFormData> {
  const mergedDefaults: any = {
    ...INITIAL_ASSESSMENT_FORM_VALUES,
    ...initialData,
  };

  return useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentFormSchema) as any,
    defaultValues: mergedDefaults,
    mode: 'onChange',
  });
}
