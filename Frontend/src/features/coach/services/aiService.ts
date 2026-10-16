import { MockApiError } from "../../../services/mock/latency";
import type {
  AIAnalysis,
  AIAnalysisListParams,
  AIAnalysisSummary,
  AIFeedbackInput,
  AIOverview,
  AISystemStatus,
  RecommendationStatus,
} from "../types";
import { AI_ANALYSES, SESSIONS } from "../mock/training.mock";
import { isoDate } from "../mock/helpers";
import { COACH_ENDPOINTS, USE_MOCK_API, api, includesText, mockResponse } from "./http";

/**
 * NOTE: the analysis itself is produced by the AI Motion backend. This service only
 * reads results and records the coach's decisions, there is no AI logic on the client.
 */

function toSummary(a: AIAnalysis): AIAnalysisSummary {
  const { modelVersion: _m, metrics: _me, errors: _e, observations: _o, potentialIssue: _p, recommendations: _r, reps: _re, coachFeedback: _c, reviewedAt: _rv, ...summary } = a;
  return summary;
}

function findAnalysis(id: string) {
  const found = AI_ANALYSES.find((a) => a.id === id);
  if (!found) throw new MockApiError("Không tìm thấy phân tích AI.", 404);
  return found;
}

function markReviewed(a: AIAnalysis) {
  a.reviewStatus = "REVIEWED";
  a.reviewedAt = new Date().toISOString();
  const session = SESSIONS.find((s) => s.id === a.sessionId);
  if (session) session.reviewStatus = "REVIEWED";
}

export const aiService = {
  async getSystemStatus(): Promise<AISystemStatus> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.aiStatus);
    const queued = AI_ANALYSES.filter((a) => a.reviewStatus === "PENDING_REVIEW").length;
    return mockResponse({ status: "OPERATIONAL", label: "AI Motion hoạt động", queuedAnalyses: queued }, 200);
  },

  async getOverview(): Promise<AIOverview> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.aiOverview);
    const cutoff = Date.now() - 14 * 86_400_000;
    const recent = AI_ANALYSES.filter((a) => new Date(a.analyzedAt).getTime() >= cutoff);
    const total = recent.reduce((s, a) => s + a.totalReps, 0);
    const invalid = recent.reduce((s, a) => s + a.invalidReps, 0);
    const errorCounts = new Map<string, { code: string; label: string; count: number }>();
    recent.forEach((a) =>
      a.errors.forEach((e) => {
        const cur = errorCounts.get(e.code) ?? { code: e.code, label: e.label, count: 0 };
        cur.count += 1;
        errorCounts.set(e.code, cur);
      })
    );
    const history = Array.from({ length: 14 }, (_, i) => {
      const date = isoDate(-(13 - i));
      const dayItems = AI_ANALYSES.filter((a) => a.analyzedAt.slice(0, 10) === date);
      return { date, score: dayItems.length ? Math.round(dayItems.reduce((s, a) => s + a.formScore, 0) / dayItems.length) : 0 };
    }).filter((p) => p.score > 0);
    return mockResponse({
      analyzedSessions: recent.length,
      analyzedSessionsChange: 12,
      avgFormScore: Math.round(recent.reduce((s, a) => s + a.formScore, 0) / Math.max(1, recent.length)),
      avgFormScoreChange: 2.1,
      invalidRepRate: Math.round((invalid / Math.max(1, total)) * 1000) / 10,
      invalidRepRateChange: -1.4,
      studentsNeedingReview: new Set(AI_ANALYSES.filter((a) => a.reviewStatus === "PENDING_REVIEW").map((a) => a.studentId)).size,
      commonErrors: [...errorCounts.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map((e) => ({ ...e, percent: Math.round((e.count / Math.max(1, recent.length)) * 100) })),
      formScoreHistory: history,
    });
  },

  async getAnalyses(params: AIAnalysisListParams = {}): Promise<AIAnalysisSummary[]> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.aiAnalyses, params);
    const list = AI_ANALYSES.filter(
      (a) =>
        (!params.reviewStatus || a.reviewStatus === params.reviewStatus) &&
        (!params.studentId || a.studentId === params.studentId) &&
        includesText([a.studentName, a.exerciseName], params.search)
    ).map(toSummary);
    return mockResponse(list);
  },

  async getAnalysis(id: string): Promise<AIAnalysis> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.aiAnalysis(id));
    return mockResponse(findAnalysis(id));
  },

  async updateRecommendation(analysisId: string, recommendationId: string, status: RecommendationStatus): Promise<AIAnalysis> {
    if (!USE_MOCK_API) return api.patch(COACH_ENDPOINTS.aiRecommendation(analysisId, recommendationId), { status });
    const a = findAnalysis(analysisId);
    const rec = a.recommendations.find((r) => r.id === recommendationId);
    if (!rec) throw new MockApiError("Không tìm thấy đề xuất.", 404);
    rec.status = status;
    return mockResponse(a, 350);
  },

  async submitFeedback(input: AIFeedbackInput): Promise<AIAnalysis> {
    if (!USE_MOCK_API) return api.post(COACH_ENDPOINTS.aiFeedback(input.analysisId), input);
    const a = findAnalysis(input.analysisId);
    a.coachFeedback = input.feedback;
    return mockResponse(a, 450);
  },

  async markReviewed(id: string): Promise<AIAnalysis> {
    if (!USE_MOCK_API) return api.post(COACH_ENDPOINTS.aiReview(id));
    const a = findAnalysis(id);
    markReviewed(a);
    return mockResponse(a, 350);
  },
};
