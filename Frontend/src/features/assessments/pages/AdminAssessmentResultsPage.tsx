import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssessmentScope } from '../useAssessmentScope';
import {
  ArrowLeft,
  BarChart3,
  Users,
  Award,
  Clock,
  CheckCircle2,
  TrendingUp,
  Activity,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { assessmentsApi } from '../api/assessmentsApi';
import { FitnessRadarChart } from '../components/fitness/FitnessRadarChart';
import { Assessment } from '../types';
import { toast } from 'sonner';

export const AdminAssessmentResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { base, isCoach } = useAssessmentScope();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      assessmentsApi.getAssessmentById(id),
      assessmentsApi.getResultsAnalytics(id),
    ])
      .then(([asm, stats]) => {
        setAssessment(asm);
        setAnalytics(stats);
      })
      .catch(() => toast.error('Không thể tải dữ liệu phân tích.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !analytics) {
    return (
      <div className="py-20 text-center text-xs text-text-secondary">
        Đang tải báo cáo kết quả & phân tích...
      </div>
    );
  }

  const { overview, scoreDistribution, levelBreakdown, dimensionPerformance, cohortComparison, completionOverTime } = analytics;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(base)}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">
                Báo cáo Kết quả & Phân tích Thể lực
              </h1>
              <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold border border-accent/20">
                {assessment?.displayName || 'Initial Assessment'}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Phân tích phổ điểm, tốc độ tăng trưởng thể chất và tỷ lệ phân bố cấp độ của học viên.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`${base}/${id}/edit`)}
          className="px-4 py-2.5 text-xs font-bold text-text-primary bg-surface hover:bg-surface-elevated border border-border rounded-xl transition-all shadow-xs cursor-pointer"
        >
          Chỉnh sửa cấu hình bài test
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs">
          <span className="text-xs font-bold text-text-secondary uppercase">Tổng lượt làm bài</span>
          <div className="text-3xl font-bold text-text-primary mt-1">
            {overview.totalAttempts.toLocaleString('vi-VN')}
          </div>
          <span className="text-xs text-emerald-400 font-semibold mt-1 block">
            Tỷ lệ hoàn thành: {overview.completionRate}%
          </span>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs">
          <span className="text-xs font-bold text-text-secondary uppercase">Điểm trung bình toàn hệ thống</span>
          <div className="text-3xl font-bold text-text-primary mt-1">
            {overview.averageScore} <span className="text-sm font-normal text-text-secondary">/ 100</span>
          </div>
          <span className="text-xs text-accent font-semibold mt-1 block">
            Cấp độ chủ đạo: Intermediate
          </span>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs">
          <span className="text-xs font-bold text-text-secondary uppercase">Thời gian làm trung bình</span>
          <div className="text-3xl font-bold text-text-primary mt-1">
            {overview.averageDurationMinutes} <span className="text-sm font-normal text-text-secondary">phút</span>
          </div>
          <span className="text-xs text-text-secondary mt-1 block">Độ tập trung cao</span>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs">
          <span className="text-xs font-bold text-text-secondary uppercase">Mức tăng trưởng trung bình</span>
          <div className="text-3xl font-bold text-emerald-400 mt-1 flex items-center gap-1">
            +16.4 pts <ArrowUpRight className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="text-xs text-text-secondary mt-1 block">Sau mỗi chu kỳ Re-Test</span>
        </div>
      </div>

      {/* Main Charts: 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Score Distribution */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">Phổ điểm Học viên (Score Distribution)</h3>
            <span className="text-xs text-text-secondary">100% học viên</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    backgroundColor: '#131B2E',
                    borderColor: '#1E293B',
                    color: '#F8FAFC',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" fill="#38BDF8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Fitness Level Breakdown */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">Phân bố Cấp độ (Fitness Level Breakdown)</h3>
            <span className="text-xs text-text-secondary">4 Cấp độ</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={levelBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {levelBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Tỷ lệ']}
                  contentStyle={{
                    borderRadius: '12px',
                    backgroundColor: '#131B2E',
                    borderColor: '#1E293B',
                    color: '#F8FAFC',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            {levelBreakdown.map((entry: any) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-text-primary font-medium">{entry.name}:</span>
                <strong className="text-text-primary">{entry.value}%</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: 6 Dimensions Radar */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">
              Hiệu suất 6 Chiều đo Thể chất (Dimension Performance)
            </h3>
            <span className="text-xs text-emerald-400 font-bold">vs Tiêu chuẩn</span>
          </div>
          <div className="bg-surface-elevated/40 rounded-xl p-2 border border-border">
            <FitnessRadarChart data={dimensionPerformance} height={260} showBenchmark={true} />
          </div>
        </div>

        {/* Chart 4: Completion Over Time */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">
              Xu hướng Hoàn thành theo Thời gian (Trend Over Time)
            </h3>
            <span className="text-xs text-text-secondary">6 tháng gần nhất</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={completionOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    backgroundColor: '#131B2E',
                    borderColor: '#1E293B',
                    color: '#F8FAFC',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Hoàn thành"
                  stroke="#38BDF8"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cohort Comparison Table (Initial vs Latest) */}
      <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              So sánh Tiến bộ Học viên (Initial Assessment vs Reassessment)
            </h3>
            <p className="text-[11px] text-text-secondary">
              Đo lường mức tăng điểm trung bình của nhóm học viên sau khi hoàn thành chu kỳ giáo án CalisHealth.
            </p>
          </div>
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated/50 border-b border-border text-text-secondary font-bold">
              <tr>
                <th className="p-3">Chiều đo thể chất</th>
                <th className="p-3 text-center">Điểm đầu vào (Initial)</th>
                <th className="p-3 text-center">Điểm kiểm tra lại (Re-Test)</th>
                <th className="p-3 text-center">Mức tăng trưởng (Delta)</th>
                <th className="p-3 text-right">Đánh giá tiến bộ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cohortComparison.map((row: any) => (
                <tr key={row.dimension} className="hover:bg-surface-elevated/40">
                  <td className="p-3 font-bold text-text-primary">{row.dimension}</td>
                  <td className="p-3 text-center text-text-secondary">{row.initial} pts</td>
                  <td className="p-3 text-center font-bold text-text-primary">{row.latest} pts</td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs">
                      +{row.delta} pts
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-xs font-semibold text-emerald-400">
                      Tăng trưởng vượt bậc
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
