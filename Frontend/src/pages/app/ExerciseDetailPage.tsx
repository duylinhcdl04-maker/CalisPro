import { Link, useParams } from "react-router-dom";
import { useExerciseQuery } from "../../features/exercises/hooks";
import { Button } from "../../components/ui/Button";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { MockApiError } from "../../services/mock/latency";
import { ExerciseDetailView } from "../../components/exercise/ExerciseDetailView";

export default function ExerciseDetailPage() {
  const { id } = useParams();
  const { data: exercise, isLoading, isError, error, refetch, isFetching } = useExerciseQuery(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-6 md:p-10">
        <CardSkeleton />
      </div>
    );
  }

  const notFound = isError && error instanceof MockApiError && error.status === 404;

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl p-10 text-center space-y-4">
        <p className="text-text-secondary">Không tìm thấy bài tập này.</p>
        <Link to="/exercises" className="inline-block text-sm font-semibold text-accent-strong">
          Quay lại thư viện bài tập
        </Link>
      </div>
    );
  }

  if (isError || !exercise) {
    return (
      <div className="mx-auto max-w-3xl p-10 text-center space-y-4">
        <p className="text-text-secondary">Không tải được dữ liệu bài tập.</p>
        <Button variant="ghost" onClick={() => refetch()} disabled={isFetching}>
          Thử lại
        </Button>
      </div>
    );
  }

  return <ExerciseDetailView exercise={exercise} />;
}

