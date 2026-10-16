import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../../features/auth/AuthContext";
import { onboardingApi } from "../../features/onboarding/api";
import {
  useOnboardingQuestionnaireQuery,
  useOnboardingStatusQuery,
  useSkipOnboardingMutation,
  useSubmitOnboardingMutation,
} from "../../features/onboarding/hooks";
import { OnboardingProgress } from "../../components/assessment/OnboardingProgress";
import { QuestionRenderer } from "../../components/assessment/QuestionRenderer";
import { Button } from "../../components/ui/Button";
import { CardSkeleton } from "../../components/ui/Skeleton";
import type { AnswerValue } from "../../types";

function isAnswered(value: AnswerValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function errorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) return (err.response?.data as { message?: string } | undefined)?.message || fallback;
  return fallback;
}

/** Bài test đầu vào do admin cấu hình: câu hỏi, chia bước và chấm điểm đều đến từ backend. */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { setOnboardingStatus, refreshOnboarding } = useAuth();
  const statusQuery = useOnboardingStatusQuery();
  const status = statusQuery.data?.status;
  const canTake = status === "PENDING" || status === "SKIPPED";   // SKIPPED: đã bỏ qua trước đó, nay quay lại làm
  const questionnaireQuery = useOnboardingQuestionnaireQuery(canTake);
  const questionnaire = questionnaireQuery.data;
  const submit = useSubmitOnboardingMutation();
  const skip = useSkipOnboardingMutation();

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  // Đã hoàn thành / bỏ qua / không cần làm -> cập nhật trạng thái và vào ứng dụng
  useEffect(() => {
    if (status && status !== "PENDING" && status !== "SKIPPED" && status !== "BLOCKED") {
      refreshOnboarding().then(() => navigate("/home", { replace: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Khôi phục câu trả lời đang làm dở của đúng phiên bản bài
  useEffect(() => {
    if (!questionnaire) return;
    const key = `${questionnaire.templateId}-${questionnaire.version}`;
    if (hydratedFor !== key) {
      setAnswers(onboardingApi.loadDraft(questionnaire.templateId, questionnaire.version));
      setStep(1);
      setHydratedFor(key);
    }
  }, [questionnaire, hydratedFor]);

  const steps = questionnaire?.steps ?? [];
  const totalSteps = Math.max(1, steps.length);
  const current = useMemo(() => steps.find((s) => s.step === step) ?? steps[0], [steps, step]);

  if (statusQuery.isLoading || (canTake && questionnaireQuery.isLoading)) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (statusQuery.isError || questionnaireQuery.isError) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-sm font-semibold text-text-primary">Không tải được bài đánh giá đầu vào.</p>
        <p className="text-xs text-text-secondary">
          {errorMessage(statusQuery.error ?? questionnaireQuery.error, "Vui lòng kiểm tra kết nối và thử lại.")}
        </p>
        <Button onClick={() => { statusQuery.refetch(); questionnaireQuery.refetch(); }}>Thử lại</Button>
      </div>
    );
  }

  if (status === "BLOCKED") {
    return (
      <div className="py-16 text-center space-y-3">
        <h1 className="font-display text-2xl font-bold text-text-primary">Hệ thống đang chuẩn bị bài đánh giá đầu vào</h1>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          Huấn luyện viên đang hoàn thiện bài đánh giá giúp xác định trình độ của bạn. Vui lòng quay lại sau ít phút.
        </p>
        <Button onClick={() => statusQuery.refetch()}>Kiểm tra lại</Button>
      </div>
    );
  }

  if (!questionnaire || !current) {
    return <CardSkeleton />;
  }

  const missingRequired = current.questions.filter((q) => q.required && !isAnswered(answers[q.id]));
  const canContinue = missingRequired.length === 0;
  const isLastStep = step >= totalSteps;

  function handleChange(questionId: string, value: AnswerValue | undefined) {
    setAnswers((prev) => {
      const next = { ...prev };
      if (value === undefined) delete next[questionId];
      else next[questionId] = value;
      onboardingApi.saveDraft(questionnaire!.templateId, questionnaire!.version, next);
      return next;
    });
  }

  function handleBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleContinue() {
    if (!canContinue) return;
    if (!isLastStep) {
      setOnboardingStatus({ status: "IN_PROGRESS", currentStep: step + 1 });
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    try {
      const result = await submit.mutateAsync({ templateId: questionnaire!.templateId, answers });
      onboardingApi.clearDraft(questionnaire!.templateId, questionnaire!.version);
      navigate("/onboarding/complete", { state: { result } });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        // Bài vừa được admin cập nhật, hoặc đã hoàn thành ở thiết bị khác
        toast.warning(errorMessage(err, "Bài đánh giá vừa được cập nhật."));
        statusQuery.refetch();
        questionnaireQuery.refetch();
        return;
      }
      toast.error(errorMessage(err, "Không thể nộp bài. Vui lòng thử lại."), { duration: 8000 });
    }
  }

  async function handleSkip() {
    if (!window.confirm("Bỏ qua bài đánh giá đầu vào? Lộ trình gợi ý sẽ kém chính xác hơn; bạn có thể làm bài sau.")) return;
    try {
      await skip.mutateAsync();
      await refreshOnboarding();
      navigate("/home", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Không thể bỏ qua bài đánh giá."));
    }
  }

  return (
    <div>
      {step === 1 && (
        <div className="mb-6 rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm font-bold text-text-primary">{questionnaire.title}</p>
          {questionnaire.description && <p className="mt-1 text-xs text-text-secondary">{questionnaire.description}</p>}
          <p className="mt-2 text-[11px] text-text-secondary">
            Khoảng {questionnaire.estimatedDuration} phút · Trả lời trung thực để hệ thống gợi ý lộ trình phù hợp với bạn.
          </p>
        </div>
      )}

      <OnboardingProgress step={step} totalSteps={totalSteps} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
        >
          <h1 className="mt-8 font-display text-2xl font-bold text-text-primary">{current.title}</h1>

          <div className="mt-6 space-y-8">
            {current.questions.map((question) => (
              <div key={question.id}>
                <div className="text-sm font-semibold text-text-primary">
                  {question.prompt}
                  {question.required && <span className="text-danger"> *</span>}
                </div>
                {question.helperText && <div className="mt-1 text-xs text-text-secondary">{question.helperText}</div>}
                <div className="mt-3">
                  <QuestionRenderer
                    question={question}
                    value={answers[question.id]}
                    onChange={(value) => handleChange(question.id, value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {!canContinue && (
        <p className="mt-6 text-xs font-medium text-danger">Vui lòng trả lời các câu hỏi bắt buộc (*) trước khi tiếp tục.</p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={handleBack} disabled={step === 1}>
          Quay lại
        </Button>
        <div className="flex items-center gap-2">
          {status === "SKIPPED" ? (
            <Button variant="ghost" onClick={() => navigate("/home")} disabled={submit.isPending}>
              Để sau
            </Button>
          ) : questionnaire.canSkip && (
            <Button variant="ghost" onClick={handleSkip} disabled={skip.isPending || submit.isPending}>
              Bỏ qua
            </Button>
          )}
          <Button onClick={handleContinue} disabled={!canContinue || submit.isPending}>
            {isLastStep ? (submit.isPending ? "Đang chấm điểm..." : "Hoàn tất") : "Tiếp tục"}
          </Button>
        </div>
      </div>
    </div>
  );
}
