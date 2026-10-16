import { useEffect, useRef, useState, useCallback } from 'react';
import { UseFormWatch } from 'react-hook-form';
import { AssessmentFormData } from '../schemas/assessmentSchema';
import { assessmentsApi } from '../api/assessmentsApi';
import type { Assessment } from '../types';

export type AutosaveStatus = 'SAVED' | 'SAVING' | 'UNSAVED' | 'ERROR' | 'IDLE';

interface UseAssessmentAutosaveOptions {
  watch: UseFormWatch<AssessmentFormData>;
  assessmentId?: string;
  enabled?: boolean;
  debounceMs?: number;
  onSaveSuccess?: (saved: Assessment) => void;
}

export function useAssessmentAutosave({
  watch,
  assessmentId,
  enabled = true,
  debounceMs = 2000,
  onSaveSuccess,
}: UseAssessmentAutosaveOptions) {
  const [status, setStatus] = useState<AutosaveStatus>('IDLE');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const timeoutRef = useRef<any>(null);
  const isInitialMount = useRef(true);
  const savingRef = useRef(false);

  const saveDraft = useCallback(
    async (formData: AssessmentFormData) => {
      // Lần lưu trước chưa xong (vd. bài mới chưa có id) -> thử lại sau, tránh tạo trùng bài
      if (savingRef.current) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => saveDraft(formData), 1000);
        return;
      }
      savingRef.current = true;
      try {
        setStatus('SAVING');
        const res = await assessmentsApi.saveDraft({
          ...formData,
          id: assessmentId || formData.id,
        } as any);
        setLastSavedTime(new Date());
        setStatus('SAVED');
        if (onSaveSuccess && res.id) {
          onSaveSuccess(res);
        }
      } catch (err) {
        console.error('Autosave failed:', err);
        setStatus('ERROR');
      } finally {
        savingRef.current = false;
      }
    },
    [assessmentId, onSaveSuccess]
  );

  useEffect(() => {
    if (!enabled) return;

    const subscription = watch((value) => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      setStatus('UNSAVED');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        saveDraft(value as AssessmentFormData);
      }, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [watch, enabled, debounceMs, saveDraft]);

  const forceSave = async (formData: AssessmentFormData) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    await saveDraft(formData);
  };

  return {
    status,
    lastSavedTime,
    forceSave,
  };
}
