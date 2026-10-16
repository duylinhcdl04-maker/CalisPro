import React from 'react';
import { ClipboardCheck, Users, Award, Clock } from 'lucide-react';

interface AssessmentStatsProps {
  stats: {
    totalAssessments: number;
    publishedAssessments: number;
    draftAssessments: number;
    archivedAssessments: number;
    totalAttempts: number;
    attemptsGrowthMonthPercent: number;
    averageScore: number;
    levelDistribution: {
      beginner: number;
      intermediate: number;
      advanced: number;
    };
    reassessmentDueCount: number;
  };
}

export const AssessmentStats: React.FC<AssessmentStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Assessments */}
      <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs hover:border-accent/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Tổng bài đánh giá
          </span>
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <ClipboardCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-text-primary tracking-tight">
            {stats.totalAssessments}
          </span>
          <span className="text-xs text-text-secondary">bài test</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            {stats.publishedAssessments} Published
          </span>
          <span className="text-text-secondary/50">•</span>
          <span className="text-text-secondary font-medium">{stats.draftAssessments} Nháp</span>
          <span className="text-text-secondary/50">•</span>
          <span className="text-text-secondary/60">{stats.archivedAssessments} Lưu trữ</span>
        </div>
      </div>

      {/* Card 2: Attempts */}
      <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs hover:border-accent/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Lượt thực hiện test
          </span>
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-text-primary tracking-tight">
            {stats.totalAttempts.toLocaleString('vi-VN')}
          </span>
          <span className="text-xs text-text-secondary">lượt</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            +{stats.attemptsGrowthMonthPercent}%
          </span>
          <span className="text-text-secondary font-normal">so với tháng trước</span>
        </div>
      </div>

      {/* Card 3: Average Score & Distribution */}
      <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs hover:border-accent/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Điểm trung bình
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Award className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-text-primary tracking-tight">
            {stats.averageScore}
          </span>
          <span className="text-sm font-semibold text-text-secondary">/ 100</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
          <span className="font-medium text-emerald-400">Beg: {stats.levelDistribution.beginner}%</span>
          <span className="text-text-secondary/50">|</span>
          <span className="font-medium text-cyan-400">Int: {stats.levelDistribution.intermediate}%</span>
          <span className="text-text-secondary/50">|</span>
          <span className="font-medium text-purple-400">Adv: {stats.levelDistribution.advanced}%</span>
        </div>
      </div>

      {/* Card 4: Reassessment Due */}
      <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs hover:border-accent/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Đang đến hạn đánh giá
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-text-primary tracking-tight">
            {stats.reassessmentDueCount.toLocaleString('vi-VN')}
          </span>
          <span className="text-xs text-text-secondary">học viên</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>Cần thực hiện trong tuần này</span>
        </div>
      </div>
    </div>
  );
};
