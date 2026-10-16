import type { AnswerValue, FitnessProfile } from "../../types";
import { ASSESSMENT_QUESTIONS } from "./assessmentQuestions";
import { withLatency } from "./latency";

const SESSION_KEY = "calis_mock_assessment_session";

interface AssessmentSession {
  id: string;
  answers: Record<string, AnswerValue>;
}

function readSession(): AssessmentSession {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to a fresh session
  }
  const fresh = { id: `session-${Date.now()}`, answers: {} };
  localStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
  return fresh;
}

function writeSession(session: AssessmentSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Deterministic, explainable scoring from real answers - never a random number. */
function computeFitnessProfile(answers: Record<string, AnswerValue>): FitnessProfile {
  const pushUps = Number(answers.maxPushUps ?? 0);
  const pullUps = Number(answers.maxPullUps ?? 0);
  const squats = Number(answers.maxSquats ?? 0);
  const plank = Number(answers.plankDuration ?? 0);
  const experience = String(answers.experienceLevel ?? "BEGINNER");

  const experienceBonus = experience === "ADVANCED" ? 12 : experience === "INTERMEDIATE" ? 6 : 0;

  const strength = clamp(Math.round(pullUps * 4 + pushUps * 0.6 + experienceBonus), 5, 98);
  const endurance = clamp(Math.round(pushUps * 0.9 + squats * 0.4 + experienceBonus), 5, 98);
  const core = clamp(Math.round(plank / 3 + squats * 0.2 + experienceBonus), 5, 98);
  const mobility = clamp(Math.round(45 + experienceBonus - Math.abs(30 - plank / 4)), 5, 95);
  const balance = clamp(Math.round(40 + experienceBonus + pullUps * 1.2), 5, 95);

  return { strength, endurance, mobility, core, balance, overallScore: Math.round((strength + endurance + mobility + core + balance) / 5) };
}

export const assessmentService = {
  async getQuestions() {
    await withLatency(null, 400);
    return ASSESSMENT_QUESTIONS;
  },

  async createSession(): Promise<{ sessionId: string }> {
    await withLatency(null, 300);
    const session = { id: `session-${Date.now()}`, answers: {} };
    writeSession(session);
    return { sessionId: session.id };
  },

  async saveAnswer(questionId: string, value: AnswerValue): Promise<void> {
    await withLatency(null, 150);
    const session = readSession();
    session.answers[questionId] = value;
    writeSession(session);
  },

  async getSavedAnswers(): Promise<Record<string, AnswerValue>> {
    await withLatency(null, 150);
    return readSession().answers;
  },

  async complete(): Promise<{ fitness: FitnessProfile }> {
    await withLatency(null, 1400);
    const session = readSession();
    return { fitness: computeFitnessProfile(session.answers) };
  },
};
