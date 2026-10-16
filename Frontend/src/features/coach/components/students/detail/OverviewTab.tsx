import type { StudentDetail } from "../../../types";
import { AIInsightsCard, LatestNotesCard } from "./OverviewNotesInsights";
import { CurrentPlanCard, RecentPerformanceCard } from "./OverviewPlanPerformance";
import { FitnessScoreCard, ProfileCard } from "./OverviewProfileFitness";
import { stagger } from "./detailConfig";

export function OverviewTab({ student }: { student: StudentDetail }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="animate-rise" style={stagger(0)}>
          <ProfileCard student={student} />
        </div>
        <div className="animate-rise lg:col-span-2" style={stagger(1)}>
          <FitnessScoreCard student={student} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="animate-rise" style={stagger(2)}>
          <CurrentPlanCard student={student} />
        </div>
        <div className="animate-rise lg:col-span-2" style={stagger(3)}>
          <RecentPerformanceCard student={student} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-rise" style={stagger(4)}>
          <LatestNotesCard studentId={student.id} />
        </div>
        <div className="animate-rise" style={stagger(5)}>
          <AIInsightsCard insights={student.aiInsights} />
        </div>
      </div>
    </div>
  );
}
