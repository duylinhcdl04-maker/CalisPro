import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Database,
  Server,
  Target,
  Award,
  AlertTriangle,
  Activity,
  Zap,
  Plus,
} from "lucide-react";
import { AdminPageHeader } from "../../components/admin/layout/AdminPageHeader";
import { Button } from "../../components/ui/Button";
import { AIAssessmentGeneratorModal } from "../../features/assessments/components/AIAssessmentGeneratorModal";
import { GenerateAssessmentResult } from "../../features/ai-motion/api/aiGeneratorApi";

interface ModuleConfig {
  title: string;
  desc: string;
  badge: string;
  summaryMetrics: { label: string; value: string; hint: string }[];
}

const MODULE_DICTIONARY: Record<string, ModuleConfig> = {
  "/admin/workout-plans": {
    title: "Quản lý Giáo án & Lộ trình (Workout Plan Builder)",
    desc: "Thiết kế giáo án tuần tự 4-12 tuần, kéo thả bài tập theo ngày và chỉ định cấp độ mục tiêu cho học viên.",
    badge: "24 Giáo án Active",
    summaryMetrics: [
      { label: "Tổng giáo án hệ thống", value: "24 giáo án", hint: "Được xây dựng bởi Master Coach" },
      { label: "Học viên đang theo học", value: "8,940 học viên", hint: "Tỉ lệ hoàn thành trung bình 82%" },
      { label: "Lộ trình phổ biến nhất", value: "12 Tuần Foundation", hint: "Beginner Push/Pull/Core" },
    ],
  },
  "/admin/workout-sessions": {
    title: "Quản lý Phiên tập luyện (Workout Sessions)",
    desc: "Giám sát lịch sử và chi tiết từng buổi tập: Thời gian thực hiện, số hiệp/reps đạt được và chỉ số RPE.",
    badge: "8,291 buổi tập",
    summaryMetrics: [
      { label: "Tổng phiên tập tháng này", value: "8,291 buổi", hint: "+15.1% so với tháng trước" },
      { label: "Thời lượng trung bình", value: "42 phút", hint: "Nghỉ trung bình 45s/hiệp" },
      { label: "Tỉ lệ hoàn thành 100%", value: "78.4%", hint: "Chất lượng tập luyện tốt" },
    ],
  },
  "/admin/assessments": {
    title: "Quản trị Bài test Đánh giá Thể lực (Assessments)",
    desc: "Cấu hình ngân hàng câu hỏi, thang đo điểm số thể lực và thuật toán phân loại Beginner / Intermediate / Advanced.",
    badge: "Dynamic Questionnaire",
    summaryMetrics: [
      { label: "Lượt thực hiện test", value: "12,482 lượt", hint: "75.6% hoàn thành đủ các bước" },
      { label: "Điểm trung bình", value: "68 / 100", hint: "Cấp độ phân bổ chủ yếu Beginner" },
      { label: "Số câu hỏi đầu vào", value: "12 câu hỏi", hint: "Đo lường 6 chỉ số thể chất" },
    ],
  },
  "/admin/fitness-profiles": {
    title: "Hồ sơ Thể chất Học viên (Fitness Profiles)",
    desc: "Giám sát 6 chỉ số thể lực toàn diện: Sức mạnh (Strength), Sức bền (Endurance), Linh hoạt (Mobility), Core, Thăng bằng (Balance).",
    badge: "6 Chỉ số Thể chất",
    summaryMetrics: [
      { label: "Hồ sơ đã đồng bộ", value: "12,482 hồ sơ", hint: "Cập nhật sau mỗi bài test định kỳ" },
      { label: "Chỉ số trung bình", value: "64.2 pts", hint: "Thang điểm 100" },
      { label: "Chu kỳ cập nhật", value: "30 ngày / lần", hint: "Tự động gửi thông báo test lại" },
    ],
  },
  "/admin/progress": {
    title: "Tiến độ & Thành tích Kỷ lục (Progress & Performance)",
    desc: "Thống kê biểu đồ phát triển thể lực theo thời gian, kỷ lục cá nhân (PR) hít đất, kéo xà và chuỗi ngày tập.",
    badge: "Performance Analytics",
    summaryMetrics: [
      { label: "Kỷ lục cá nhân (PR)", value: "34,890 PRs", hint: "Được ghi nhận từ các buổi tập" },
      { label: "Mức tăng sức mạnh TB", value: "+24.5%", hint: "Sau 8 tuần kiên trì" },
      { label: "Tỉ lệ duy trì chuỗi (Streak)", value: "68.2%", hint: "Học viên tập > 3 buổi/tuần" },
    ],
  },
  "/admin/subscriptions": {
    title: "Quản lý Gói Hội viên & Doanh thu (Subscriptions)",
    desc: "Theo dõi các gói cước Free, Premium, Pro, doanh thu thanh toán trực tuyến và tỉ lệ gia hạn dịch vụ.",
    badge: "MRR: 480.000.000đ",
    summaryMetrics: [
      { label: "Hội viên đang hoạt động", value: "4,281 học viên", hint: "Gói Pro chiếm 48%" },
      { label: "Doanh thu tháng hiện tại", value: "480.000.000đ", hint: "+9.4% tăng trưởng" },
      { label: "Tỉ lệ gia hạn tự động", value: "84.2%", hint: "Mức độ hài lòng cao" },
    ],
  },
  "/admin/analytics": {
    title: "Phân tích Nâng cao & Báo cáo (Analytics & Reports)",
    desc: "Báo cáo phân tích chuyên sâu về chỉ số giữ chân người dùng (Retention Cohorts), tần suất tập luyện và hiệu quả động cơ AI.",
    badge: "BI & Data Engine",
    summaryMetrics: [
      { label: "Tỉ lệ giữ chân Day 30", value: "54.8%", hint: "Thuộc nhóm top đầu Health-Tech" },
      { label: "Thời gian trên app TB", value: "32 phút/ngày", hint: "Tập trung trong buổi tập" },
      { label: "Độ chuẩn xác AI", value: "96.4%", hint: "24.8k lần phân tích chuyển động" },
    ],
  },
  "/admin/content": {
    title: "Quản lý Nội dung & Bài viết (Content Management)",
    desc: "Biên tập và xuất bản cẩm nang dinh dưỡng Calisthenics, hướng dẫn phục hồi cơ bắp và mẹo tập luyện.",
    badge: "48 Bài viết",
    summaryMetrics: [
      { label: "Bài viết đã xuất bản", value: "48 bài", hint: "Danh mục Dinh dưỡng & Kỹ thuật" },
      { label: "Lượt đọc hàng tháng", value: "145,000 views", hint: "Tăng trưởng tìm kiếm tự nhiên" },
    ],
  },
};

export default function AdminGenericModulePage() {
  const location = useLocation();
  const isAssessmentModule = location.pathname === "/admin/assessments";
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);

  // Assessment tests list with AI generated support (starts empty without mock data)
  const [assessmentProtocols, setAssessmentProtocols] = useState<GenerateAssessmentResult[]>([]);

  const [selectedAssessmentIndex, setSelectedAssessmentIndex] = useState(0);
  const activeAssessment = assessmentProtocols[selectedAssessmentIndex];

  const config = MODULE_DICTIONARY[location.pathname] || {
    title: "Phân hệ Quản trị CalisHealth",
    desc: "Hệ thống quản lý vận hành chuyên sâu cho nền tảng Calisthenics & Health-Tech.",
    badge: "Admin Module",
    summaryMetrics: [
      { label: "Trạng thái phân hệ", value: "Đang hoạt động", hint: "Dữ liệu được đồng bộ liên tục" },
      { label: "Quyền truy cập", value: "Admin & Super Admin", hint: "Bảo mật theo chuẩn RBAC" },
      { label: "Backend API", value: "REST Spring Boot", hint: "Endpoint sẵn sàng kết nối" },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title={config.title}
        description={config.desc}
        badge={config.badge}
        actions={
          <div className="flex items-center gap-2">
            {isAssessmentModule && (
              <button
                type="button"
                onClick={() => setIsAssessmentModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3.5 py-2 text-xs font-bold text-accent hover:bg-accent/20 transition-all cursor-pointer shadow-xs"
              >
                <Sparkles size={14} />
                <span>✨ AI Thiết Lập Đánh Giá</span>
              </button>
            )}
            <Link to="/admin/dashboard">
              <Button variant="outline" size="sm" className="text-xs font-bold border-border">
                ← Về Dashboard
              </Button>
            </Link>
          </div>
        }
      />

      {/* SUMMARY METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {config.summaryMetrics.map((m, idx) => (
          <div key={idx} className="rounded-2xl border border-border/80 bg-surface p-5 shadow-elevated space-y-1">
            <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">{m.label}</div>
            <div className="text-2xl font-black text-text-primary tracking-tight">{m.value}</div>
            <div className="text-[11px] text-accent-strong font-medium">{m.hint}</div>
          </div>
        ))}
      </div>

      {/* ASSESSMENT MODULE SPECIALIZED WORKSPACE */}
      {isAssessmentModule ? (
        <div className="space-y-6">
          {/* Assessment Protocol Selector Header */}
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Target size={18} />
                </span>
                <div>
                  <h3 className="text-base font-black text-text-primary">
                    Ngân hàng Bài Test & Bộ Tiêu Chí Thể Lực (Physical Assessments)
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Thang điểm phân tầng 4 cấp độ, thuật toán chấm điểm form chuẩn xác kết hợp AI MediaPipe.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  Redis Caching &lt;15ms
                </span>
              </div>
            </div>

            {/* Assessment Protocols Content */}
            {assessmentProtocols.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-background/50 p-12 text-center space-y-4">
                <Target size={40} className="mx-auto text-accent/60" />
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-text-primary">Chưa có bài test đánh giá nào</h4>
                  <p className="text-xs text-text-secondary max-w-md mx-auto">
                    Hệ thống chưa có bộ bài test thể lực nào. Hãy sử dụng công cụ AI để tự động tạo bài test với thang điểm chuẩn 4 cấp độ và bộ rubric chấm điểm.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAssessmentModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-white hover:bg-accent-strong cursor-pointer shadow-xs transition-all"
                >
                  <Sparkles size={14} />
                  <span>✨ AI Thiết Lập Đánh Giá Ngay</span>
                </button>
              </div>
            ) : (
              <>
                {/* Test Protocols Tabs */}
                <div className="flex flex-wrap gap-2">
                  {assessmentProtocols.map((proto, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAssessmentIndex(idx)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedAssessmentIndex === idx
                          ? "bg-accent text-white shadow-xs"
                          : "bg-surface-elevated text-text-secondary hover:text-text-primary border border-border"
                      }`}
                    >
                      {proto.assessmentTitle}
                    </button>
                  ))}
                </div>

                {/* Active Assessment Details View */}
                {activeAssessment && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                {/* Column 1: Test Protocols & Target Category */}
                <div className="space-y-4 p-5 rounded-2xl bg-surface-elevated/40 border border-border">
                  <div className="flex items-center gap-2 text-accent">
                    <Activity size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Quy trình thực hiện bài test</span>
                  </div>
                  <h4 className="text-sm font-black text-text-primary">{activeAssessment.assessmentTitle}</h4>
                  <div className="text-[11px] text-text-secondary font-medium">
                    Phân loại: <span className="text-text-primary font-bold">{activeAssessment.targetCategory}</span>
                  </div>
                  {activeAssessment.description && (
                    <p className="text-xs text-text-secondary leading-relaxed">{activeAssessment.description}</p>
                  )}

                  <div className="space-y-2 pt-2">
                    {activeAssessment.tests?.map((test, sIdx) => (
                      <div key={sIdx} className="p-2.5 rounded-xl bg-background border border-border text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-text-primary">
                          <span>{sIdx + 1}. {test.testExerciseName}</span>
                          <span className="text-[10px] text-accent font-mono">{test.timeLimitSec}</span>
                        </div>
                        <p className="text-[11px] text-text-secondary">{test.testProtocol}</p>
                        {test.keyFormRequirements && (
                          <div className="text-[10px] text-emerald-400">✓ Form: {test.keyFormRequirements}</div>
                        )}
                        {test.failureStopConditions && (
                          <div className="text-[10px] text-rose-400">✗ Dừng: {test.failureStopConditions}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Benchmark Scoring Tiers */}
                <div className="space-y-4 p-5 rounded-2xl bg-surface-elevated/40 border border-border">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Award size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Thang điểm chuẩn (Benchmark Tiers)</span>
                  </div>

                  <div className="space-y-2.5">
                    {activeAssessment.benchmarkTiers?.map((b, bIdx) => {
                      const upper = b.tierName.toUpperCase();
                      const tierColor = upper.includes("ELITE")
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                        : upper.includes("ADVANCED")
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : upper.includes("INTERMEDIATE")
                        ? "border-sky-500/40 bg-sky-500/10 text-sky-400"
                        : "border-purple-500/40 bg-purple-500/10 text-purple-400";
                      return (
                        <div key={bIdx} className={`p-3 rounded-xl border ${tierColor} space-y-1`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider">{b.tierName}</span>
                            <span className="text-xs font-bold font-mono">{b.minScore} - {b.maxScore} pts</span>
                          </div>
                          <p className="text-[11px] text-text-primary/90 font-medium">{b.criteriaDescription}</p>
                          {b.recommendedPlanAction && (
                            <div className="text-[10px] text-text-secondary">Khuyến nghị: {b.recommendedPlanAction}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: Deductions & AI Note */}
                <div className="space-y-4 p-5 rounded-2xl bg-surface-elevated/40 border border-border">
                  <div className="flex items-center gap-2 text-rose-400">
                    <AlertTriangle size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Trừ điểm & Lỗi sai (Deductions)</span>
                  </div>

                  <div className="space-y-2">
                    {activeAssessment.penaltyDeductions?.map((deduction, dIdx) => (
                      <div key={dIdx} className="p-2.5 rounded-xl bg-background border border-border/80 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold">•</span>
                          <span className="text-text-primary font-medium">{deduction}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {activeAssessment.deduplicationNote && (
                    <div className="pt-2 border-t border-border/60">
                      <span className="text-[11px] font-bold text-text-secondary block mb-1">Chống trùng lặp & AI Note:</span>
                      <p className="text-[11px] text-emerald-400 leading-relaxed">{activeAssessment.deduplicationNote}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* GENERIC MODULE WORKSPACE CONTAINER */
        <div className="rounded-3xl border border-border/80 bg-surface p-8 shadow-elevated text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-2xs">
            <Layers size={28} />
          </div>

          <div className="space-y-1 max-w-lg mx-auto">
            <h3 className="font-display text-lg font-bold text-text-primary">
              Dữ liệu phân hệ đang được đồng bộ
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Phân hệ này đã được thiết kế sẵn cấu trúc bảng dữ liệu, chuẩn REST API và liên kết phân quyền bảo mật với hệ thống quản trị CalisHealth.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link to="/admin/dashboard">
              <Button className="bg-accent hover:bg-accent-strong text-white text-xs px-5 font-bold">
                Xem Bảng điều khiển Tổng quan
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* AI Assessment Generator Modal */}
      <AIAssessmentGeneratorModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        existingProtocols={assessmentProtocols.map((p) => p.assessmentTitle)}
        onApplyAssessment={(newAssessment) => {
          setAssessmentProtocols((prev) => [newAssessment, ...prev]);
          setSelectedAssessmentIndex(0);
        }}
      />
    </div>
  );
}
