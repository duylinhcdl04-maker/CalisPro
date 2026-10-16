import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AssessmentBuilder } from '../components/AssessmentBuilder';
import { assessmentsApi } from '../api/assessmentsApi';
import { Assessment } from '../types';
import { INITIAL_ASSESSMENT_FORM_VALUES } from '../constants/defaultValues';

export default function AdminAssessmentBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<Partial<Assessment> | null>(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      setLoading(true);
      assessmentsApi
        .getAssessmentById(id)
        .then((data) => {
          if (data) {
            setInitialData(data);
          } else {
            setInitialData(INITIAL_ASSESSMENT_FORM_VALUES);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setInitialData(INITIAL_ASSESSMENT_FORM_VALUES);
      setLoading(false);
    }
  }, [id]);

  if (loading || !initialData) {
    return (
      <div className="py-20 text-center text-xs text-[#687068]">
        Đang chuẩn bị trình tạo bài đánh giá thể lực...
      </div>
    );
  }

  return (
    <AssessmentBuilder
      key={id ?? 'new'}
      initialData={initialData}
      assessmentId={id}
      isEditMode={!!id}
    />
  );
}
