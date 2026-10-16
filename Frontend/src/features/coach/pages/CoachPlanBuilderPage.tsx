import { Link, useParams, useSearchParams } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button3D, EmptyState, ErrorState, PageHeader, PageSkeleton, Panel } from "../components/ui";
import { PlanBuilder } from "../components/workouts/builder/PlanBuilder";
import { errorStatus } from "../components/workouts/workoutUi";
import { usePlan } from "../hooks";

/** /coach/plans/new (optional ?studentId=) and /coach/plans/:planId */
export default function CoachPlanBuilderPage() {
  const { planId } = useParams<{ planId: string }>();
  const [params] = useSearchParams();
  const plan = usePlan(planId);

  if (!planId) return <PlanBuilder key="new" plan={null} prefillStudentId={params.get("studentId")} />;

  if (plan.isLoading) return <PageSkeleton kpis={0} />;

  if (plan.isError || !plan.data) {
    const notFound = errorStatus(plan.error) === 404;
    return (
      <>
        <PageHeader back={{ to: "/coach/plans", label: "Giáo án" }} title={notFound ? "Không tìm thấy giáo án" : "Không thể tải giáo án"} />
        <Panel>
          {notFound ? (
            <EmptyState
              icon={FileQuestion}
              title="Giáo án không tồn tại hoặc đã bị xoá"
              description="Kiểm tra lại đường dẫn, hoặc quay về danh sách giáo án."
              action={
                <Button3D asChild variant="primary">
                  <Link to="/coach/plans">Về danh sách giáo án</Link>
                </Button3D>
              }
            />
          ) : (
            <ErrorState onRetry={() => plan.refetch()} retrying={plan.isFetching} />
          )}
        </Panel>
      </>
    );
  }

  return <PlanBuilder key={planId} plan={plan.data} prefillStudentId={null} />;
}
