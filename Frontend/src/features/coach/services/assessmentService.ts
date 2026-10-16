import { MockApiError } from "../../../services/mock/latency";
import type {
  AssessmentDetail,
  AssessmentListParams,
  AssessmentReviewInput,
  AssessmentStatus,
  AssessmentStatusCount,
  AssessmentSummary,
} from "../types";
import { ASSESSMENTS } from "../mock/assessments.mock";
import { COACH_ENDPOINTS, USE_MOCK_API, api, includesText, mockResponse } from "./http";

const STATUSES: AssessmentStatus[] = ["UPCOMING", "DUE", "OVERDUE", "COMPLETED", "NEEDS_REVIEW"];

function toSummary(a: AssessmentDetail): AssessmentSummary {
  const { id, studentId, studentName, studentAvatar, title, type, dueDate, completedAt, overallScore, status } = a;
  return { id, studentId, studentName, studentAvatar, title, type, dueDate, completedAt, overallScore, status };
}

export const assessmentService = {
  async getAssessments(params: AssessmentListParams = {}): Promise<AssessmentSummary[]> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.assessments, params);
    const list = ASSESSMENTS.filter(
      (a) =>
        (!params.status || a.status === params.status) &&
        (!params.studentId || a.studentId === params.studentId) &&
        includesText([a.studentName, a.title], params.search)
    ).sort((a, b) => {
      // Open items: soonest due first. Completed: most recent first.
      const aOpen = !a.completedAt;
      const bOpen = !b.completedAt;
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      return aOpen ? a.dueDate.localeCompare(b.dueDate) : (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
    });
    return mockResponse(list.map(toSummary));
  },

  async getStatusCounts(): Promise<AssessmentStatusCount[]> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.assessmentCounts);
    return mockResponse(STATUSES.map((status) => ({ status, count: ASSESSMENTS.filter((a) => a.status === status).length })), 250);
  },

  async getAssessment(id: string): Promise<AssessmentDetail> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.assessment(id));
    const found = ASSESSMENTS.find((a) => a.id === id);
    if (!found) throw new MockApiError("Không tìm thấy bài đánh giá.", 404);
    return mockResponse(found);
  },

  async submitReview(input: AssessmentReviewInput): Promise<AssessmentDetail> {
    if (!USE_MOCK_API) return api.post(COACH_ENDPOINTS.assessmentReview(input.assessmentId), input);
    const found = ASSESSMENTS.find((a) => a.id === input.assessmentId);
    if (!found) throw new MockApiError("Không tìm thấy bài đánh giá.", 404);
    if (!found.completedAt) throw new MockApiError("Học viên chưa hoàn thành bài đánh giá.", 409);
    found.coachComment = input.coachComment;
    found.recommendations = input.recommendations;
    found.reviewedAt = new Date().toISOString();
    found.status = "COMPLETED";
    return mockResponse(found, 500);
  },
};
