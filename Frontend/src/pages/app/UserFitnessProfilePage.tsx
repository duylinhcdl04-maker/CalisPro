import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Award,
  Flame,
  TrendingUp,
  Sparkles,
  Dumbbell,
  ShieldCheck,
  ChevronRight,
  Download,
  Calendar,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Zap,
  HeartPulse,
  Scale,
  Compass,
  Layers,
  ArrowUpRight,
  BrainCircuit,
  MessageSquareQuote,
  Target,
  Clock,
  RotateCcw,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { Progress, Modal } from "antd";
import { toast } from "sonner";
import {
  userFitnessService,
  type UserFitnessProfileData,
  type UserFitnessDimension,
} from "../../services/mock/userFitnessService";
import { GlowingAvatar } from "../../components/ui/GlowingAvatar";

type ActiveTab = "dimensions" | "motion" | "balance" | "history" | "coach";

export default function UserFitnessProfilePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dimensions");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string>("Sức mạnh kéo (Pull-up Power)");
  const [exportFormat, setExportFormat] = useState<"pdf" | "image">("pdf");

  const { data: profile, isLoading, isError, refetch } = useQuery<UserFitnessProfileData>({
    queryKey: ["user-fitness-profile"],
    queryFn: () => userFitnessService.getUserFitnessProfile(),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8 md:p-10 animate-pulse">
        <div className="h-40 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-4xl p-8 text-center">
        <div className="clay-card p-10">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <h2 className="mt-4 text-lg font-bold text-text-primary">Không tải được hồ sơ thể chất</h2>
          <p className="mt-1 text-sm text-text-secondary">Vui lòng kiểm tra kết nối và thử lại.</p>
          <button
            onClick={() => refetch()}
            className="btn-3d btn-3d-primary mt-6 inline-flex items-center gap-2"
          >
            <RotateCcw size={16} /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Format data for Recharts Radar Chart
  const radarData = [
    {
      subject: "Sức mạnh",
      user: profile.dimensions.strength.score,
      benchmark: profile.dimensions.strength.benchmarkScore,
      fullMark: 100,
    },
    {
      subject: "Sức bền",
      user: profile.dimensions.endurance.score,
      benchmark: profile.dimensions.endurance.benchmarkScore,
      fullMark: 100,
    },
    {
      subject: "Linh hoạt",
      user: profile.dimensions.mobility.score,
      benchmark: profile.dimensions.mobility.benchmarkScore,
      fullMark: 100,
    },
    {
      subject: "Cốt lõi (Core)",
      user: profile.dimensions.core.score,
      benchmark: profile.dimensions.core.benchmarkScore,
      fullMark: 100,
    },
    {
      subject: "Thăng bằng",
      user: profile.dimensions.balance.score,
      benchmark: profile.dimensions.balance.benchmarkScore,
      fullMark: 100,
    },
    {
      subject: "Kỹ năng",
      user: profile.dimensions.skill.score,
      benchmark: profile.dimensions.skill.benchmarkScore,
      fullMark: 100,
    },
  ];

  const dimensionList: UserFitnessDimension[] = Object.values(profile.dimensions);

  const handleExport = () => {
    toast.success(`Đang chuẩn bị tải xuống Báo cáo Thể chất (${exportFormat.toUpperCase()})...`);
    setTimeout(() => {
      setIsExportModalOpen(false);
      toast.success("Báo cáo thể chất đã sẵn sàng!", {
        description: `Đã xuất hồ sơ thể chất mã [${profile.user.code}] ngày ${profile.lastAssessmentDate}.`,
      });
    }, 1200);
  };

  const handleSaveGoal = () => {
    toast.success("Mục tiêu thể chất đã được cập nhật thành công!", {
      description: `Mục tiêu mới: ${selectedGoal}`,
    });
    setIsGoalModalOpen(false);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7 p-4 sm:p-7 md:p-10">
      {/* 1. Header Hero Card with Tactile 3D Styling & System Brand Accents */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#FFF8DE]/30 to-[#AAC4F5]/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 border border-white/80 dark:border-white/10 p-6 sm:p-8 shadow-[0_12px_40px_-10px_rgba(140,169,255,0.18)]">
        {/* Decorative background glow rings */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#8CA9FF]/15 blur-3xl dark:bg-[#8CA9FF]/10" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#FFF2C6]/40 blur-3xl dark:bg-amber-400/5" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* User Info & Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            <div className="relative">
              <GlowingAvatar
                size="lg"
                fallback={profile.user.name[0]}
                src={profile.user.avatarUrl}
              />
              <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.5)]">
                <Check size={13} strokeWidth={3} />
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-text-primary">
                  {profile.user.name}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#AAC4F5]/30 to-[#8CA9FF]/30 dark:from-[#8CA9FF]/20 dark:to-[#547EFF]/20 px-3 py-0.5 text-xs font-black text-[#1e3a8a] dark:text-[#8CA9FF] border border-[#8CA9FF]/40">
                  <Award size={13} />
                  Level {profile.user.level.tier} • {profile.user.level.title}
                </span>
                <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-bold text-text-secondary">
                  Mã HV: {profile.user.code}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-text-secondary font-medium">
                Hồ sơ thể lực Calisthenics toàn diện & phân tích chuyển động AI theo thời gian thực.
              </p>

              {/* Biological Quick Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold text-text-secondary">
                <span className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 border border-border">
                  <Scale size={13} className="text-palette-skyDeep dark:text-palette-sky" />
                  {profile.user.heightCm} cm • {profile.user.weightKg} kg (BMI: {profile.user.bmi})
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 border border-border">
                  <HeartPulse size={13} className="text-rose-500" />
                  Mỡ ước tính: ~{profile.user.bodyFatEstimatePercent}%
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 border border-border">
                  <Flame size={13} className="text-amber-500" />
                  BMR: {profile.user.bmrKcal.toLocaleString()} kcal/ngày
                </span>
              </div>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/assessment"
              className="btn-3d btn-3d-primary text-xs sm:text-sm inline-flex items-center gap-2"
            >
              <Target size={16} /> Làm bài test mới
            </Link>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="btn-3d btn-3d-secondary text-xs sm:text-sm inline-flex items-center gap-2"
            >
              <Download size={16} /> Xuất báo cáo
            </button>

            <button
              type="button"
              onClick={() => setIsGoalModalOpen(true)}
              className="btn-3d btn-3d-ghost text-xs sm:text-sm inline-flex items-center gap-2"
            >
              <Sparkles size={16} /> Đặt mục tiêu
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Fitness Score & Readiness KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Overall Score Radial Card */}
        <div className="clay-card relative overflow-hidden p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">
              Điểm thể lực tổng hợp
            </span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={12} /> +{profile.scoreTrend}đ
            </span>
          </div>

          <div className="my-4 flex items-center gap-5">
            <div className="relative grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br from-[#AAC4F5] via-[#8CA9FF] to-[#547EFF] text-white shadow-[0_8px_20px_rgba(140,169,255,0.4),inset_0_2px_3px_rgba(255,255,255,0.8)]">
              <div className="text-center">
                <span className="text-3xl font-black tracking-tight">{profile.overallScore}</span>
                <span className="block text-[10px] font-bold uppercase text-white/90">/ 100</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-extrabold text-text-primary">
                Top {profile.percentileRanking}% học viên
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Đánh giá gần nhất: <strong className="text-text-primary">{profile.lastAssessmentDate}</strong>
              </p>
              <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                ⏳ Re-test định kỳ: còn {profile.nextAssessmentDueDays} ngày
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex justify-between text-[11px] font-bold text-text-secondary">
              <span>Tiến trình Level 3</span>
              <span>74% hoàn thành</span>
            </div>
            <Progress
              percent={74}
              showInfo={false}
              strokeColor={{ "0%": "#AAC4F5", "100%": "#547EFF" }}
              strokeWidth={7}
              trailColor="rgba(0,0,0,0.06)"
            />
          </div>
        </div>

        {/* Readiness Daily Pulse Card */}
        <div className="clay-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">
              Chỉ số Sẵn sàng tập luyện (Readiness)
            </span>
            <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-extrabold text-sky-600 dark:text-sky-400">
              Hôm nay
            </span>
          </div>

          <div className="my-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
                <span className="text-2xl font-black text-text-primary">{profile.readiness.score}%</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                Thể trạng tối ưu ⚡
              </span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed bg-black/[0.02] dark:bg-white/[0.04] p-3 rounded-xl border border-border">
              "{profile.readiness.advice}"
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
            <div className="rounded-lg bg-surface p-2 border border-border">
              <span className="text-text-secondary block">Năng lượng</span>
              <span className="text-text-primary text-xs font-extrabold">{profile.readiness.energy}/10</span>
            </div>
            <div className="rounded-lg bg-surface p-2 border border-border">
              <span className="text-text-secondary block">Giấc ngủ</span>
              <span className="text-text-primary text-xs font-extrabold">{profile.readiness.sleepScore}%</span>
            </div>
            <div className="rounded-lg bg-surface p-2 border border-border">
              <span className="text-text-secondary block">Đau cơ DOMS</span>
              <span className="text-text-primary text-xs font-extrabold">{profile.readiness.muscleSoreness}/10 (Rất nhẹ)</span>
            </div>
          </div>
        </div>

        {/* AI Form & Motion Snapshot Card */}
        <div className="clay-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">
              Độ chuẩn kỹ thuật AI (Form Score)
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-extrabold text-violet-600 dark:text-violet-400">
              <BrainCircuit size={11} /> AI Vision
            </span>
          </div>

          <div className="my-3 flex items-center justify-between">
            <div>
              <div className="text-3xl font-black tracking-tight text-text-primary">
                {profile.aiMotionAnalysis.overallMotionScore}
                <span className="text-sm font-bold text-text-secondary">/100</span>
              </div>
              <div className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Đã phân tích {profile.aiMotionAnalysis.analyzedWorkoutsCount} buổi tập qua AI Camera
              </div>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <ShieldCheck size={28} />
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-text-secondary">
            <div className="flex justify-between font-semibold">
              <span>Độ hoàn thiện biên độ (ROM)</span>
              <span className="text-text-primary font-bold">96%</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Độ cân xứng trái/phải</span>
              <span className="text-text-primary font-bold">97%</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Kiểm soát tốc độ (Tempo)</span>
              <span className="text-text-primary font-bold">92%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Deep Analysis Navigation Tabs (Tactile Modern Segmented Bar) */}
      <div className="relative">
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-slate-100/90 p-1.5 border border-slate-200/80 shadow-xs backdrop-blur-md [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden dark:border-slate-800/90 dark:bg-[#0b1329]/95 dark:shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
          {/* Tab 1: 6 Dimensions */}
          <button
            type="button"
            onClick={() => setActiveTab("dimensions")}
            className={`group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 select-none ${
              activeTab === "dimensions"
                ? "bg-white text-[#1e3a8a] shadow-sm ring-1 ring-black/5 dark:bg-gradient-to-r dark:from-[#152347] dark:to-[#1a2c58] dark:text-[#8CA9FF] dark:ring-1 dark:ring-[#547EFF]/30 dark:shadow-[0_0_18px_rgba(84,126,255,0.18)]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.04]"
            }`}
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                activeTab === "dimensions"
                  ? "bg-[#547EFF]/15 text-[#547EFF] dark:bg-[#547EFF]/25 dark:text-[#8CA9FF]"
                  : "bg-slate-200/60 text-slate-500 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:text-slate-300"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
            </div>
            <span>6 Trục Thể Lực</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                activeTab === "dimensions"
                  ? "bg-[#547EFF]/15 text-[#547EFF] dark:bg-[#547EFF]/30 dark:text-[#AAC4F5]"
                  : "bg-slate-200/50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              Radar 6D
            </span>
          </button>

          {/* Tab 2: AI Motion Analysis */}
          <button
            type="button"
            onClick={() => setActiveTab("motion")}
            className={`group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 select-none ${
              activeTab === "motion"
                ? "bg-white text-[#1e3a8a] shadow-sm ring-1 ring-black/5 dark:bg-gradient-to-r dark:from-[#152347] dark:to-[#1a2c58] dark:text-[#8CA9FF] dark:ring-1 dark:ring-[#547EFF]/30 dark:shadow-[0_0_18px_rgba(84,126,255,0.18)]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.04]"
            }`}
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                activeTab === "motion"
                  ? "bg-purple-500/15 text-purple-600 dark:bg-purple-500/25 dark:text-purple-300"
                  : "bg-slate-200/60 text-slate-500 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:text-slate-300"
              }`}
            >
              <BrainCircuit className="h-3.5 w-3.5" />
            </div>
            <span>Phân Tích Chuyển Động AI</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                activeTab === "motion"
                  ? "bg-purple-500/15 text-purple-600 dark:bg-purple-500/30 dark:text-purple-300"
                  : "bg-slate-200/50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              Vision
            </span>
          </button>

          {/* Tab 3: Muscle Balance & Push/Pull */}
          <button
            type="button"
            onClick={() => setActiveTab("balance")}
            className={`group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 select-none ${
              activeTab === "balance"
                ? "bg-white text-[#1e3a8a] shadow-sm ring-1 ring-black/5 dark:bg-gradient-to-r dark:from-[#152347] dark:to-[#1a2c58] dark:text-[#8CA9FF] dark:ring-1 dark:ring-[#547EFF]/30 dark:shadow-[0_0_18px_rgba(84,126,255,0.18)]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.04]"
            }`}
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                activeTab === "balance"
                  ? "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-300"
                  : "bg-slate-200/60 text-slate-500 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:text-slate-300"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
            </div>
            <span>Cân Bằng Cơ & Đẩy/Kéo</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                activeTab === "balance"
                  ? "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-300"
                  : "bg-slate-200/50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              Push/Pull
            </span>
          </button>

          {/* Tab 4: Progression History */}
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 select-none ${
              activeTab === "history"
                ? "bg-white text-[#1e3a8a] shadow-sm ring-1 ring-black/5 dark:bg-gradient-to-r dark:from-[#152347] dark:to-[#1a2c58] dark:text-[#8CA9FF] dark:ring-1 dark:ring-[#547EFF]/30 dark:shadow-[0_0_18px_rgba(84,126,255,0.18)]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.04]"
            }`}
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                activeTab === "history"
                  ? "bg-amber-500/15 text-amber-600 dark:bg-amber-500/25 dark:text-amber-300"
                  : "bg-slate-200/60 text-slate-500 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:text-slate-300"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <span>Lịch Sử Tiến Trình</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                activeTab === "history"
                  ? "bg-amber-500/15 text-amber-600 dark:bg-amber-500/30 dark:text-amber-300"
                  : "bg-slate-200/50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              Timeline
            </span>
          </button>

          {/* Tab 5: Coach & Nutrition Advice */}
          <button
            type="button"
            onClick={() => setActiveTab("coach")}
            className={`group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 select-none ${
              activeTab === "coach"
                ? "bg-white text-[#1e3a8a] shadow-sm ring-1 ring-black/5 dark:bg-gradient-to-r dark:from-[#152347] dark:to-[#1a2c58] dark:text-[#8CA9FF] dark:ring-1 dark:ring-[#547EFF]/30 dark:shadow-[0_0_18px_rgba(84,126,255,0.18)]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.04]"
            }`}
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                activeTab === "coach"
                  ? "bg-blue-500/15 text-[#547EFF] dark:bg-blue-500/25 dark:text-[#8CA9FF]"
                  : "bg-slate-200/60 text-slate-500 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:text-slate-300"
              }`}
            >
              <MessageSquareQuote className="h-3.5 w-3.5" />
            </div>
            <span>Lời Khuyên HLV & Dinh Dưỡng</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                activeTab === "coach"
                  ? "bg-blue-500/15 text-[#547EFF] dark:bg-blue-500/30 dark:text-[#AAC4F5]"
                  : "bg-slate-200/50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              Coach 1-1
            </span>
          </button>
        </div>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: 6 Core Calisthenics Dimensions */}
      {activeTab === "dimensions" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Spider/Radar Chart Card */}
            <div className="clay-card lg:col-span-5 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-text-primary">
                    Biểu đồ Mạng Nhện Thể Lực
                  </h3>
                  <span className="text-[11px] font-bold text-text-secondary">
                    Vs. Chuẩn Level 3
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-secondary">
                  So sánh trực quan 6 khía cạnh thể chất trọng yếu của Calisthenics.
                </p>
              </div>

              <div className="my-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid stroke="rgba(140, 169, 255, 0.25)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Điểm của bạn"
                      dataKey="user"
                      stroke="#547EFF"
                      fill="#8CA9FF"
                      fillOpacity={0.35}
                      strokeWidth={2.5}
                    />
                    <Radar
                      name="Chuẩn Level 3"
                      dataKey="benchmark"
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      fill="transparent"
                      strokeWidth={1.5}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 10 }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "12px",
                        backgroundColor: "#1e293b",
                        border: "none",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl bg-palette-sky/15 dark:bg-palette-sky/10 p-3 text-xs text-palette-skyDeep dark:text-sky-200 border border-palette-sky/30">
                💡 <strong>Điểm mạnh vượt trội:</strong> Sức mạnh (82/100) & Cốt lõi (80/100). Cần bổ sung thêm các bài ép dẻo khớp vai (Mobility) để Handstand thẳng trục hơn.
              </div>
            </div>

            {/* Detailed 6 Dimension Breakdown Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dimensionList.map((dim) => (
                <div
                  key={dim.id}
                  className="clay-card-interactive p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-text-primary">{dim.name}</h4>
                        <span className="text-[10px] font-bold text-text-secondary block mt-0.5">
                          {dim.description}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-text-primary">{dim.score}</span>
                        <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          +{dim.trend}đ
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Progress
                        percent={dim.score}
                        showInfo={false}
                        strokeColor={{ "0%": "#AAC4F5", "100%": dim.color }}
                        strokeWidth={6}
                        trailColor="rgba(0,0,0,0.06)"
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 border-t border-border pt-3">
                    <span className="text-[10px] font-extrabold uppercase text-text-secondary tracking-wider">
                      Thành tích tiêu biểu
                    </span>
                    {dim.keyExercises.slice(0, 2).map((ex, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-text-secondary truncate max-w-[140px]">{ex.name}</span>
                        <span className="font-extrabold text-text-primary">{ex.record}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI Motion & Form Tracking */}
      {activeTab === "motion" && (
        <div className="space-y-6">
          {/* AI Alert & Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.aiMotionAnalysis.recentAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-4.5 border flex items-start gap-3.5 ${
                  alert.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                }`}
              >
                {alert.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h4 className="text-sm font-black">{alert.title}</h4>
                  <p className="text-xs leading-relaxed opacity-90">{alert.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Exercise Form Evaluation */}
          <div className="space-y-4">
            <h3 className="font-display text-base font-bold text-text-primary">
              Kỹ Thuật Động Tác Đã Phân Tích Qua Video AI
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {profile.aiMotionAnalysis.exercises.map((ex, idx) => (
                <div key={idx} className="clay-card p-5 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-text-primary">{ex.exerciseName}</h4>
                      <span className="rounded-full bg-gradient-to-r from-[#AAC4F5] to-[#547EFF] text-white px-2.5 py-0.5 text-xs font-black shadow-xs">
                        {ex.overallFormScore}/100
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                      <div className="rounded-lg bg-surface p-2 border border-border">
                        <span className="text-text-secondary block">Biên độ (ROM)</span>
                        <span className="text-text-primary text-xs font-extrabold">{ex.romPercentage}%</span>
                      </div>
                      <div className="rounded-lg bg-surface p-2 border border-border">
                        <span className="text-text-secondary block">Độ ổn định</span>
                        <span className="text-text-primary text-xs font-extrabold">{ex.stabilityScore}%</span>
                      </div>
                      <div className="rounded-lg bg-surface p-2 border border-border">
                        <span className="text-text-secondary block">Đối xứng</span>
                        <span className="text-text-primary text-xs font-extrabold">{ex.symmetryPercentage}%</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
                        Chỉ số sinh học then chốt
                      </span>
                      {ex.keyMetrics.map((km, kIdx) => (
                        <div key={kIdx} className="flex items-center justify-between text-xs">
                          <span className="text-text-secondary">{km.label}</span>
                          <span
                            className={`font-bold ${
                              km.status === "optimal"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : km.status === "warning"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-sky-600 dark:text-sky-400"
                            }`}
                          >
                            {km.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.04] p-3 text-[11px] text-text-secondary border border-border space-y-1">
                    <p>
                      <strong>Nhận xét AI:</strong> {ex.aiNotes}
                    </p>
                    <p className="text-palette-skyDeep dark:text-palette-sky font-semibold">
                      💡 <em>Gợi ý: {ex.recommendation}</em>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Muscle Balance & Push/Pull Ratio */}
      {activeTab === "balance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Push / Pull Ratio Gauge Card */}
            <div className="clay-card md:col-span-5 p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-text-primary">
                  Tỉ Lệ Sức Mạnh Đẩy / Kéo (Push / Pull Ratio)
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                  Tỉ lệ vàng giúp phòng chống chấn thương vai và giữ tư thế thẳng tự nhiên.
                </p>
              </div>

              <div className="my-6 text-center">
                <div className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-br from-[#FFF2C6] via-[#AAC4F5] to-[#8CA9FF] p-1 shadow-[0_8px_24px_rgba(140,169,255,0.3)]">
                  <div className="rounded-[22px] bg-surface px-8 py-5 text-center">
                    <span className="text-4xl font-black text-text-primary tracking-tight">
                      1 : {profile.muscleBalance.pushPullRatio}
                    </span>
                    <span className="mt-1 block rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {profile.muscleBalance.ratioStatus} ⭐
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-xs text-text-secondary px-4">
                  Sức mạnh cơ kéo (Lưng xô/Biceps) cân bằng lý tưởng với sức mạnh cơ đẩy (Ngực/Vai/Tay sau).
                </p>
              </div>

              <div className="rounded-xl bg-surface p-3.5 border border-border flex items-center justify-between text-xs">
                <span className="text-text-secondary font-semibold">Độ đối xứng cơ thể Trái/Phải:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  {profile.muscleBalance.bilateralSymmetryPercent}% (Rất chuẩn)
                </span>
              </div>
            </div>

            {/* Muscle Distribution Breakdown */}
            <div className="clay-card md:col-span-7 p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-text-primary">
                  Phân Bố Tải Trọng Các Nhóm Cơ Chính
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                  Mức độ phát triển và huy động cơ bắp qua các chu kỳ tập luyện vừa qua.
                </p>
              </div>

              <div className="my-4 space-y-4">
                {profile.muscleBalance.muscleDistribution.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-text-primary">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-text-secondary">{item.strengthTier}</span>
                        <span className="text-[#547EFF] font-black">{item.percentage}%</span>
                      </div>
                    </div>
                    <Progress
                      percent={item.percentage * 3.2}
                      showInfo={false}
                      strokeColor={{ "0%": "#AAC4F5", "100%": "#547EFF" }}
                      strokeWidth={8}
                      trailColor="rgba(0,0,0,0.06)"
                    />
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-700 dark:text-amber-300">
                  <AlertTriangle size={15} /> Khuyến nghị cân bằng cơ học:
                </div>
                <ul className="text-[11px] text-text-secondary space-y-1 pl-4 list-disc">
                  {profile.muscleBalance.weakPointRecommendations.map((rec, rIdx) => (
                    <li key={rIdx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Assessment History & Score Milestones */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Progress Chart */}
          <div className="clay-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-bold text-text-primary">
                  Quỹ Đạo Điểm Thể Lực Theo Thời Gian (6 Tháng)
                </h3>
                <p className="text-xs text-text-secondary">
                  Từ 58 điểm (Tháng 4) lên 78 điểm (Tháng 9) - Tăng trưởng vượt bậc +34.5%.
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profile.scoreHistory}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#547EFF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#AAC4F5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                  <YAxis domain={[40, 100]} stroke="#94a3b8" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      backgroundColor: "#1e293b",
                      border: "none",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="overall"
                    name="Điểm tổng hợp"
                    stroke="#547EFF"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#scoreColor)"
                  />
                  <Line
                    type="monotone"
                    dataKey="strength"
                    name="Sức mạnh"
                    stroke="#34D399"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="core"
                    name="Cốt lõi"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Milestones Grid */}
          <div className="space-y-3">
            <h3 className="font-display text-base font-bold text-text-primary">
              Cột Mốc & Thành Tựu Thể Chất
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {profile.milestones.map((ms) => (
                <div
                  key={ms.id}
                  className={`rounded-2xl p-4 border transition-all ${
                    ms.achieved
                      ? "bg-surface border-emerald-500/40 shadow-xs"
                      : "bg-surface/50 border-dashed border-border opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-xl ${
                        ms.achieved
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-black/[0.04] dark:bg-white/[0.05] text-slate-400"
                      }`}
                    >
                      {ms.achieved ? <CheckCircle2 size={18} /> : <Target size={18} />}
                    </span>
                    <span className="text-[10px] font-bold text-text-secondary">{ms.date}</span>
                  </div>

                  <h4 className="mt-3 font-extrabold text-sm text-text-primary">{ms.title}</h4>
                  <span className="mt-1 inline-block rounded-md bg-black/[0.03] dark:bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                    {ms.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Coach Directives & Nutrition/Recovery */}
      {activeTab === "coach" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coach Voice & Commentary Card */}
            <div className="clay-card lg:col-span-7 p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <GlowingAvatar size="md" fallback="HT" />
                  <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-sky-500 text-white shadow-xs">
                    <ShieldCheck size={12} />
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-text-primary">
                    HLV. {profile.coachDirective.coachName}
                  </h4>
                  <p className="text-xs text-text-secondary">{profile.coachDirective.coachTitle}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-[#FFF2C6]/30 via-surface to-palette-sky/15 p-5 border border-border">
                <MessageSquareQuote className="h-6 w-6 text-palette-skyDeep dark:text-palette-sky mb-2" />
                <p className="text-sm leading-relaxed text-text-primary italic">
                  "{profile.coachDirective.comment}"
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">
                  Trọng tâm luyện tập 3 tuần tới:
                </h5>
                <div className="space-y-2">
                  {profile.coachDirective.weeklyFocus.map((focus, fIdx) => (
                    <div
                      key={fIdx}
                      className="flex items-center gap-2.5 rounded-xl bg-surface p-3 text-xs font-bold text-text-primary border border-border"
                    >
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px]">
                        {fIdx + 1}
                      </span>
                      <span>{focus}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Nutrition & Sleep Plan */}
            <div className="clay-card lg:col-span-5 p-6 space-y-5 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-text-primary">
                  Dinh Dưỡng & Phục Hồi Thể Lực
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                  Được tính toán tự động dựa trên chỉ số BMI và cường độ vận động Calisthenics.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-surface p-4 border border-border space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-text-primary">
                    <HeartPulse size={16} className="text-rose-500" />
                    Khuyến nghị dinh dưỡng:
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {profile.coachDirective.nutritionAdvice}
                  </p>
                </div>

                <div className="rounded-2xl bg-surface p-4 border border-border space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-text-primary">
                    <Clock size={16} className="text-indigo-500" />
                    Thời lượng ngủ phục hồi:
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-text-primary">
                      {profile.coachDirective.recommendedSleepHours} giờ
                    </span>
                    <span className="text-xs text-text-secondary font-semibold">
                      (Nên đi ngủ trước 23:00)
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/coach/messages"
                className="btn-3d btn-3d-secondary text-xs sm:text-sm text-center block w-full"
              >
                Nhắn tin trực tiếp với HLV
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Export Physical Fitness Report */}
      <Modal
        open={isExportModalOpen}
        onCancel={() => setIsExportModalOpen(false)}
        footer={null}
        centered
        className="custom-modal"
      >
        <div className="p-4 space-y-5 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#8CA9FF] to-[#547EFF] text-white shadow-md">
            <Download size={26} />
          </div>

          <div>
            <h3 className="font-display text-lg font-black text-text-primary">
              Xuất Báo Cáo Thể Chất Cá Nhân
            </h3>
            <p className="mt-1 text-xs text-text-secondary">
              Tải về bản phân tích 6 trục thể lực, dữ liệu chuyển động AI và nhận xét của HLV.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div
              onClick={() => setExportFormat("pdf")}
              className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                exportFormat === "pdf"
                  ? "border-[#547EFF] bg-[#547EFF]/10 shadow-xs"
                  : "border-border bg-surface"
              }`}
            >
              <div className="font-extrabold text-sm text-text-primary">Định dạng PDF</div>
              <p className="text-[11px] text-text-secondary mt-1">Báo cáo đầy đủ 4 trang chuẩn quốc tế.</p>
            </div>

            <div
              onClick={() => setExportFormat("image")}
              className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                exportFormat === "image"
                  ? "border-[#547EFF] bg-[#547EFF]/10 shadow-xs"
                  : "border-border bg-surface"
              }`}
            >
              <div className="font-extrabold text-sm text-text-primary">Ảnh Card Thể Lực</div>
              <p className="text-[11px] text-text-secondary mt-1">Ảnh Story/Infographic để chia sẻ bạn bè.</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsExportModalOpen(false)}
              className="btn-3d btn-3d-ghost flex-1 text-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="btn-3d btn-3d-primary flex-1 text-sm inline-flex items-center justify-center gap-2"
            >
              <Download size={16} /> Tải báo cáo ngay
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Set New Fitness Goal */}
      <Modal
        open={isGoalModalOpen}
        onCancel={() => setIsGoalModalOpen(false)}
        footer={null}
        centered
        className="custom-modal"
      >
        <div className="p-4 space-y-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-display text-base font-black text-text-primary">
                Đặt Mục Tiêu Thể Chất Mới
              </h3>
              <p className="text-xs text-text-secondary">
                Hệ thống AI sẽ tinh chỉnh giáo án tập luyện theo mục tiêu này.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              "Sức mạnh kéo (Pull-up Power)",
              "Chinh phục Kỹ năng Muscle-up",
              "Thăng bằng Handstand tự do",
              "Tăng cơ bắp & Cải thiện vóc dáng",
              "Linh hoạt khớp vai & Khớp háng",
            ].map((goal) => (
              <div
                key={goal}
                onClick={() => setSelectedGoal(goal)}
                className={`cursor-pointer flex items-center justify-between rounded-xl p-3 text-xs font-bold transition-all border ${
                  selectedGoal === goal
                    ? "border-[#547EFF] bg-[#547EFF]/10 text-[#1e3a8a] dark:text-[#8CA9FF]"
                    : "border-border bg-surface text-text-secondary hover:text-text-primary"
                }`}
              >
                <span>{goal}</span>
                {selectedGoal === goal && <Check size={16} className="text-[#547EFF]" />}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsGoalModalOpen(false)}
              className="btn-3d btn-3d-ghost flex-1 text-sm"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSaveGoal}
              className="btn-3d btn-3d-primary flex-1 text-sm"
            >
              Lưu mục tiêu
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
