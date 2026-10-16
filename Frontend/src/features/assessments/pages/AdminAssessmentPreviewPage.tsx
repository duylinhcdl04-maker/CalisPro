import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssessmentScope } from '../useAssessmentScope';
import { assessmentsApi } from '../api/assessmentsApi';
import { AssessmentUserPreviewModal } from '../components/preview/AssessmentUserPreviewModal';
import { Assessment } from '../types';

export default function AdminAssessmentPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { base, isCoach } = useAssessmentScope();
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    if (id) {
      assessmentsApi.getAssessmentById(id).then((data) => {
        if (data) setAssessment(data);
      });
    }
  }, [id]);

  if (!assessment) {
    return <div className="p-8 text-center text-xs text-[#687068]">Đang tải xem trước...</div>;
  }

  return (
    <AssessmentUserPreviewModal
      isOpen={true}
      onClose={() => navigate(base)}
      assessment={assessment}
    />
  );
}
