import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import AuthenticatedLayout from "../components/layout/AuthenticatedLayout";
import OnboardingLayout from "../components/layout/OnboardingLayout";
import AdminLayout from "../components/admin/layout/AdminLayout";
import CoachLayout from "../features/coach/components/layout/CoachLayout";
import {
  RequireAuth,
  RequireAdmin,
  RequireCoach,
  RequireCompletedOnboarding,
  RequirePasswordChange,
  RequireIncompleteOnboarding,
  RedirectIfAuthenticated,
} from "./guards";

const PublicHomePage = lazy(() => import("../pages/public/PublicHomePage"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const ChangePasswordPage = lazy(() => import("../pages/auth/ChangePasswordPage"));
const OnboardingPage = lazy(() => import("../pages/onboarding/OnboardingPage"));
const OnboardingCompletePage = lazy(() => import("../pages/onboarding/OnboardingCompletePage"));
const HomePage = lazy(() => import("../pages/app/HomePage"));
const WorkoutPage = lazy(() => import("../pages/app/WorkoutPage"));
const ActiveWorkoutPage = lazy(() => import("../pages/app/ActiveWorkoutPage"));
const ExerciseLibraryPage = lazy(() => import("../pages/app/ExerciseLibraryPage"));
const ExerciseDetailPage = lazy(() => import("../pages/app/ExerciseDetailPage"));
const ProgressPage = lazy(() => import("../pages/app/ProgressPage"));
const AssessmentHistoryPage = lazy(() => import("../pages/app/AssessmentHistoryPage"));
const UserSubscriptionPage = lazy(() => import("../pages/app/UserSubscriptionPage"));
const UserFitnessProfilePage = lazy(() => import("../pages/app/UserFitnessProfilePage"));
const PeriodicAssessmentPage = lazy(() => import("../pages/app/PeriodicAssessmentPage"));
const SafetyScreeningPage = lazy(() => import("../pages/app/SafetyScreeningPage"));
const InitialAssessmentV2Page = lazy(() => import("../pages/app/InitialAssessmentV2Page"));
const BaselineAssessmentPage = lazy(() => import("../pages/app/BaselineAssessmentPage"));
const MyRoadmapPage = lazy(() => import("../pages/app/MyRoadmapPage"));
const PlanChoicePage = lazy(() => import("../pages/app/PlanChoicePage"));
const MyExerciseListPage = lazy(() => import("../pages/app/MyExerciseListPage"));
const ProfilePage = lazy(() => import("../pages/app/ProfilePage"));
const NotFoundPage = lazy(() => import("../pages/public/NotFoundPage"));

// Admin Module Pages
const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
const AdminCoachesPage = lazy(() => import("../pages/admin/AdminCoachesPage"));
const AdminExercisesManagerPage = lazy(() => import("../pages/admin/AdminExercisesManagerPage"));
const AdminAICoachingPage = lazy(() => import("../pages/admin/AdminAICoachingPage"));
const AdminSettingsPage = lazy(() => import("../pages/admin/AdminSettingsPage"));
const AdminGenericModulePage = lazy(() => import("../pages/admin/AdminGenericModulePage"));

// Workout Plans & Builder Pages
const AdminWorkoutPlansListPage = lazy(() => import("../pages/admin/AdminWorkoutPlansListPage"));
const AdminLevelEnginePage = lazy(() => import("../pages/admin/AdminLevelEnginePage"));
const AdminRuleSetsV2Page = lazy(() => import("../pages/admin/AdminRuleSetsV2Page"));
const AdminRuleSetV2DetailPage = lazy(() => import("../pages/admin/AdminRuleSetV2DetailPage"));
const AdminWorkoutPlanBuilderPage = lazy(() => import("../pages/admin/AdminWorkoutPlanBuilderPage"));
const AdminWorkoutPlanDetailPage = lazy(() => import("../pages/admin/AdminWorkoutPlanDetailPage"));
const AdminWorkoutPlanPreviewPage = lazy(() => import("../pages/admin/AdminWorkoutPlanPreviewPage"));
const AdminExerciseBuilderPage = lazy(() => import("../pages/admin/AdminExerciseBuilderPage"));

// Assessment Module Pages
const AdminAssessmentLibraryPage = lazy(() => import("../features/assessments/pages/AdminAssessmentLibraryPage"));
const AdminAssessmentBuilderPage = lazy(() => import("../features/assessments/pages/AdminAssessmentBuilderPage"));
const AdminQuestionBankPage = lazy(() => import("../features/assessments/pages/AdminQuestionBankPage").then(m => ({ default: m.AdminQuestionBankPage })));
const AdminAssessmentResultsPage = lazy(() => import("../features/assessments/pages/AdminAssessmentResultsPage").then(m => ({ default: m.AdminAssessmentResultsPage })));
const AdminAssessmentPreviewPage = lazy(() => import("../features/assessments/pages/AdminAssessmentPreviewPage"));

// Fitness Intelligence & Profiles Pages
const AdminFitnessProfilesDashboardPage = lazy(() =>
  import("../features/fitnessProfiles/pages/AdminFitnessProfilesDashboardPage").then((m) => ({
    default: m.AdminFitnessProfilesDashboardPage,
  }))
);
const AdminStudentFitnessProfileDetailPage = lazy(() =>
  import("../features/fitnessProfiles/pages/AdminStudentFitnessProfileDetailPage").then((m) => ({
    default: m.AdminStudentFitnessProfileDetailPage,
  }))
);

// Progress & Performance Pages
const AdminProgressPerformancePage = lazy(() =>
  import("../features/progressPerformance/pages/AdminProgressPerformancePage").then((m) => ({
    default: m.AdminProgressPerformancePage,
  }))
);
const AdminStudentPerformanceDetailPage = lazy(() =>
  import("../features/progressPerformance/pages/AdminStudentPerformanceDetailPage").then((m) => ({
    default: m.AdminStudentPerformanceDetailPage,
  }))
);

// Subscription & Revenue Management Pages
const AdminSubscriptionsPage = lazy(() =>
  import("../features/subscriptions/pages/AdminSubscriptionsPage").then((m) => ({
    default: m.AdminSubscriptionsPage,
  }))
);
const AdminBusinessAnalyticsPage = lazy(() =>
  import("../features/subscriptions/pages/AdminBusinessAnalyticsPage").then((m) => ({
    default: m.AdminBusinessAnalyticsPage,
  }))
);

// Content & Communications Pages
const AdminContentManagementPage = lazy(() =>
  import("../features/content/pages/AdminContentManagementPage").then((m) => ({
    default: m.AdminContentManagementPage,
  }))
);
const AdminNotificationsPage = lazy(() =>
  import("../features/notifications/pages/AdminNotificationsPage").then((m) => ({
    default: m.AdminNotificationsPage,
  }))
);


// Coach Area Pages (each route is its own chunk)
const CoachDashboardPage = lazy(() => import("../features/coach/pages/CoachDashboardPage"));
const CoachStudentsPage = lazy(() => import("../features/coach/pages/CoachStudentsPage"));
const CoachStudentDetailPage = lazy(() => import("../features/coach/pages/CoachStudentDetailPage"));
const CoachAssessmentsPage = lazy(() => import("../features/coach/pages/CoachAssessmentsPage"));
const CoachAssessmentDetailPage = lazy(() => import("../features/coach/pages/CoachAssessmentDetailPage"));
const CoachSessionsPage = lazy(() => import("../features/coach/pages/CoachSessionsPage"));
const CoachSessionDetailPage = lazy(() => import("../features/coach/pages/CoachSessionDetailPage"));
const CoachAIAnalysisPage = lazy(() => import("../features/coach/pages/CoachAIAnalysisPage"));
const CoachAIAnalysisDetailPage = lazy(() => import("../features/coach/pages/CoachAIAnalysisDetailPage"));
const CoachPerformancePage = lazy(() => import("../features/coach/pages/CoachPerformancePage"));
const CoachMessagesPage = lazy(() => import("../features/coach/pages/CoachMessagesPage"));
const CoachNotificationsPage = lazy(() => import("../features/coach/pages/CoachNotificationsPage"));
const CoachCalendarPage = lazy(() => import("../features/coach/pages/CoachCalendarPage"));
const CoachProfilePage = lazy(() => import("../features/coach/pages/CoachProfilePage"));
const CoachL4ReviewsPage = lazy(() => import("../features/coach/pages/CoachL4ReviewsPage"));
const CoachMotionRulesPage = lazy(() => import("../features/coach/pages/CoachMotionRulesPage"));
const CoachSafetyClearancesPage = lazy(() => import("../features/coach/pages/CoachSafetyClearancesPage"));
const CoachSafetyClearanceDetailPage = lazy(() => import("../features/coach/pages/CoachSafetyClearanceDetailPage"));
const CoachL4ReviewDetailPage = lazy(() => import("../features/coach/pages/CoachL4ReviewDetailPage"));
const CoachRuleSetsPage = lazy(() => import("../features/coach/pages/CoachRuleSetsPage"));
const CoachRuleSetDetailPage = lazy(() => import("../features/coach/pages/CoachRuleSetDetailPage"));
const AdminLevelEnginePageLazy = AdminLevelEnginePage;

function Loading() {
  return <div className="grid min-h-screen place-items-center text-sm text-text-secondary">Đang tải...</div>;
}

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<Loading />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [{ path: "/", element: withSuspense(<PublicHomePage />) }],
  },
  {
    // Lần đăng nhập đầu của tài khoản Coach do Admin cấp: bắt buộc đổi mật khẩu tạm
    path: "/change-password",
    element: <RequirePasswordChange>{withSuspense(<ChangePasswordPage />)}</RequirePasswordChange>,
  },
  {
    element: (
      <RedirectIfAuthenticated>
        <PublicLayout />
      </RedirectIfAuthenticated>
    ),
    children: [
      { path: "/login", element: withSuspense(<LoginPage />) },
      { path: "/register", element: withSuspense(<RegisterPage />) },
    ],
  },
  {
    element: (
      <RequireAuth>
        <RequireIncompleteOnboarding>
          <OnboardingLayout />
        </RequireIncompleteOnboarding>
      </RequireAuth>
    ),
    children: [
      { path: "/onboarding", element: withSuspense(<OnboardingPage />) },
      { path: "/onboarding/complete", element: withSuspense(<OnboardingCompletePage />) },
    ],
  },
  {
    element: (
      <RequireAuth>
        <RequireCompletedOnboarding>
          <AuthenticatedLayout />
        </RequireCompletedOnboarding>
      </RequireAuth>
    ),
    children: [
      { path: "/home", element: withSuspense(<HomePage />) },
      { path: "/workout/:id", element: withSuspense(<WorkoutPage />) },
      { path: "/workout/:id/active", element: withSuspense(<ActiveWorkoutPage />) },
      { path: "/exercises", element: withSuspense(<ExerciseLibraryPage />) },
      { path: "/exercises/:id", element: withSuspense(<ExerciseDetailPage />) },
      { path: "/progress", element: withSuspense(<ProgressPage />) },
      { path: "/assessment", element: withSuspense(<AssessmentHistoryPage />) },
      { path: "/assessment/baseline", element: withSuspense(<BaselineAssessmentPage />) },
      { path: "/assessment/initial", element: withSuspense(<InitialAssessmentV2Page />) },
      { path: "/safety-screening", element: withSuspense(<SafetyScreeningPage />) },
      { path: "/assessment/periodic", element: withSuspense(<PeriodicAssessmentPage />) },
      { path: "/fitness-profile", element: withSuspense(<UserFitnessProfilePage />) },
      { path: "/roadmap", element: withSuspense(<MyRoadmapPage />) },
      { path: "/plan-choice", element: withSuspense(<PlanChoicePage />) },
      { path: "/plans/mine", element: withSuspense(<MyExerciseListPage />) },
      { path: "/subscription", element: withSuspense(<UserSubscriptionPage />) },
      { path: "/profile", element: withSuspense(<ProfilePage />) },
    ],
  },
  {
    path: "/admin",
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: "dashboard", element: withSuspense(<AdminDashboardPage />) },
      { path: "users", element: withSuspense(<AdminUsersPage />) },
      { path: "coaches", element: withSuspense(<AdminCoachesPage />) },
      { path: "exercises", element: withSuspense(<AdminExercisesManagerPage />) },
      { path: "exercises/new", element: withSuspense(<AdminExerciseBuilderPage />) },
      { path: "exercises/:id/edit", element: withSuspense(<AdminExerciseBuilderPage />) },
      { path: "workout-plans", element: withSuspense(<AdminWorkoutPlansListPage />) },
      { path: "level-engine", element: withSuspense(<AdminLevelEnginePage mode="admin" />) },
      { path: "assessment-rule-sets", element: withSuspense(<AdminRuleSetsV2Page />) },
      { path: "assessment-rule-sets/:ruleSetId", element: withSuspense(<AdminRuleSetV2DetailPage />) },
      { path: "workout-plans/new", element: withSuspense(<AdminWorkoutPlanBuilderPage />) },
      { path: "workout-plans/:id", element: withSuspense(<AdminWorkoutPlanDetailPage />) },
      { path: "workout-plans/:id/edit", element: withSuspense(<AdminWorkoutPlanBuilderPage />) },
      { path: "workout-plans/:id/preview", element: withSuspense(<AdminWorkoutPlanPreviewPage />) },
      { path: "ai", element: withSuspense(<AdminAICoachingPage />) },
      { path: "settings", element: withSuspense(<AdminSettingsPage />) },
      { path: "workout-sessions", element: withSuspense(<AdminGenericModulePage />) },
      { path: "assessments", element: withSuspense(<AdminAssessmentLibraryPage />) },
      { path: "assessments/new", element: withSuspense(<AdminAssessmentBuilderPage />) },
      { path: "assessments/:id/edit", element: withSuspense(<AdminAssessmentBuilderPage />) },
      { path: "assessments/questions", element: withSuspense(<AdminQuestionBankPage />) },
      { path: "assessments/:id/results", element: withSuspense(<AdminAssessmentResultsPage />) },
      { path: "assessments/:id/preview", element: withSuspense(<AdminAssessmentPreviewPage />) },
      { path: "fitness-profiles", element: <Navigate to="/coach/fitness-profiles" replace /> },
      { path: "fitness-profiles/:studentId", element: <Navigate to="/coach/fitness-profiles" replace /> },
      { path: "progress", element: <Navigate to="/coach/performance" replace /> },
      { path: "progress/:studentId", element: <Navigate to="/coach/performance" replace /> },
      { path: "subscriptions", element: withSuspense(<AdminSubscriptionsPage />) },
      { path: "analytics", element: withSuspense(<AdminBusinessAnalyticsPage />) },
      { path: "content", element: withSuspense(<AdminContentManagementPage />) },
      { path: "notifications", element: withSuspense(<AdminNotificationsPage />) },
    ],
  },
  {
    path: "/coach",
    element: (
      <RequireCoach>
        <CoachLayout />
      </RequireCoach>
    ),
    children: [
      { index: true, element: <Navigate to="/coach/dashboard" replace /> },
      { path: "dashboard", element: <CoachDashboardPage /> },
      { path: "students", element: <CoachStudentsPage /> },
      { path: "students/:studentId", element: <CoachStudentDetailPage /> },
      { path: "fitness-profiles", element: withSuspense(<AdminFitnessProfilesDashboardPage />) },
      { path: "fitness-profiles/:studentId", element: withSuspense(<AdminStudentFitnessProfileDetailPage />) },
      { path: "fitness-profile", element: <Navigate to="/coach/fitness-profiles" replace /> },
      { path: "fitness-profile/:studentId", element: withSuspense(<AdminStudentFitnessProfileDetailPage />) },
      { path: "fitness", element: <Navigate to="/coach/fitness-profiles" replace /> },
      { path: "fitness/:studentId", element: withSuspense(<AdminStudentFitnessProfileDetailPage />) },
      { path: "fitness profiles", element: <Navigate to="/coach/fitness-profiles" replace /> },
      { path: "fitness%20profiles", element: <Navigate to="/coach/fitness-profiles" replace /> },
      { path: "performance", element: withSuspense(<AdminProgressPerformancePage />) },
      { path: "performance/:studentId", element: withSuspense(<AdminStudentPerformanceDetailPage />) },
      { path: "progress", element: <Navigate to="/coach/performance" replace /> },
      { path: "progress/:studentId", element: withSuspense(<AdminStudentPerformanceDetailPage />) },
      { path: "assessments", element: <CoachAssessmentsPage /> },
      { path: "assessments/:assessmentId", element: <CoachAssessmentDetailPage /> },
      { path: "l4-reviews", element: <CoachL4ReviewsPage /> },
      { path: "l4-reviews/:reviewId", element: <CoachL4ReviewDetailPage /> },
      { path: "motion-rules", element: <CoachMotionRulesPage /> },
      { path: "safety-clearances", element: <CoachSafetyClearancesPage /> },
      { path: "safety-clearances/:clearanceId", element: <CoachSafetyClearanceDetailPage /> },
      { path: "level-engine", element: withSuspense(<AdminLevelEnginePageLazy mode="coach" />) },
      { path: "assessment-tests", element: withSuspense(<AdminAssessmentLibraryPage />) },
      { path: "assessment-tests/new", element: withSuspense(<AdminAssessmentBuilderPage />) },
      { path: "assessment-tests/:id/edit", element: withSuspense(<AdminAssessmentBuilderPage />) },
      { path: "assessment-tests/questions", element: withSuspense(<AdminQuestionBankPage />) },
      { path: "assessment-tests/:id/results", element: withSuspense(<AdminAssessmentResultsPage />) },
      { path: "assessment-tests/:id/preview", element: withSuspense(<AdminAssessmentPreviewPage />) },
      { path: "rule-sets", element: <CoachRuleSetsPage /> },
      { path: "rule-sets/:ruleSetId", element: <CoachRuleSetDetailPage /> },
      { path: "exercises", element: withSuspense(<AdminExercisesManagerPage />) },
      { path: "exercises/new", element: withSuspense(<AdminExerciseBuilderPage />) },
      { path: "exercises/:id/edit", element: withSuspense(<AdminExerciseBuilderPage />) },
      { path: "plans", element: withSuspense(<AdminWorkoutPlansListPage />) },
      { path: "plans/new", element: withSuspense(<AdminWorkoutPlanBuilderPage />) },
      { path: "plans/:id", element: withSuspense(<AdminWorkoutPlanDetailPage />) },
      { path: "plans/:id/edit", element: withSuspense(<AdminWorkoutPlanBuilderPage />) },
      { path: "plans/:id/preview", element: withSuspense(<AdminWorkoutPlanPreviewPage />) },
      { path: "sessions", element: <CoachSessionsPage /> },
      { path: "sessions/:sessionId", element: <CoachSessionDetailPage /> },
      { path: "ai-analysis", element: <CoachAIAnalysisPage /> },
      { path: "ai-analysis/:analysisId", element: <CoachAIAnalysisDetailPage /> },
      { path: "messages", element: <CoachMessagesPage /> },
      { path: "notifications", element: <CoachNotificationsPage /> },
      { path: "calendar", element: <CoachCalendarPage /> },
      { path: "profile", element: <CoachProfilePage /> },
    ],
  },
  { path: "*", element: withSuspense(<NotFoundPage />) },
]);

