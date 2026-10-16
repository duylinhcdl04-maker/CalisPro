import { Gauge, UserRound } from "lucide-react";
import { FITNESS_METRIC_LABEL, GOAL_LABEL, LEVEL_LABEL } from "../../../constants/labels";
import type { StudentDetail } from "../../../types";
import { FitnessRadarChart } from "../../charts/FitnessRadarChart";
import { Panel, ScoreBar, ScoreRing } from "../../ui";
import { METRIC_KEYS, formatExperience } from "./detailConfig";

const GENDER_LABEL: Record<StudentDetail["gender"], string> = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };

export function ProfileCard({ student: s }: { student: StudentDetail }) {
  const rows: { label: string; value: string }[] = [
    { label: "Tuổi", value: `${s.age} (${GENDER_LABEL[s.gender]})` },
    { label: "Chiều cao", value: `${s.heightCm} cm` },
    { label: "Cân nặng", value: `${s.weightKg} kg` },
    { label: "Kinh nghiệm tập", value: formatExperience(s.trainingExperienceMonths) },
    { label: "Mục tiêu", value: GOAL_LABEL[s.goal] },
    { label: "Trình độ", value: LEVEL_LABEL[s.level] },
  ];
  return (
    <Panel title="Hồ sơ" description="Thông tin thể chất và mục tiêu" icon={UserRound} className="h-full">
      <dl className="divide-y divide-border/70">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
            <dt className="text-sm text-text-secondary">{r.label}</dt>
            <dd className="text-right text-sm font-bold tabular-nums text-text-primary">{r.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

export function FitnessScoreCard({ student: s }: { student: StudentDetail }) {
  // Compare against the point 4 weeks back to give the radar a reference layer.
  const previous = s.fitnessHistory.length > 4 ? s.fitnessHistory[s.fitnessHistory.length - 5] : null;
  return (
    <Panel title="Fitness score" description="5 chỉ số thể lực, so với 4 tuần trước" icon={Gauge} className="h-full">
      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <FitnessRadarChart current={s.fitness} previous={previous} previousLabel="4 tuần trước" height={250} />
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <ScoreRing value={s.fitness.overall} size={96} label="Tổng thể" />
            <div>
              <p className="text-sm font-bold text-text-primary">Điểm tổng thể</p>
              <p className="text-xs text-text-secondary">Tổng hợp từ 5 chỉ số thể lực.</p>
            </div>
          </div>
          <div className="space-y-3">
            {METRIC_KEYS.map((k) => (
              <ScoreBar key={k} label={FITNESS_METRIC_LABEL[k]} value={s.fitness[k]} />
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
