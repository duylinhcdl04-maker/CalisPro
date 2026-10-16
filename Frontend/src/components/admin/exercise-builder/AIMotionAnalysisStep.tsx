import { useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  Search,
  SlidersHorizontal,
  Compass,
  Zap,
  Activity,
  ShieldAlert,
} from "lucide-react";
import {
  ExerciseFormData,
  AIJointRule,
  AIROMRule,
  AIErrorDetectionRule,
  MediaPipeLandmark,
} from "../../../types/exerciseBuilder";

interface AIMotionAnalysisStepProps {
  formData: ExerciseFormData;
  onChange: (updated: Partial<ExerciseFormData>) => void;
}

export function AIMotionAnalysisStep({ formData, onChange }: AIMotionAnalysisStepProps) {
  const [landmarkSearch, setLandmarkSearch] = useState("");
  const [landmarkPartFilter, setLandmarkPartFilter] = useState<string>("ALL");

  const aiRules = formData.aiRules;

  function handleToggleAiEnabled(enabled: boolean) {
    onChange({ aiRules: { ...aiRules, enabled } });
  }

  // Landmark toggle
  function handleToggleLandmark(id: number) {
    const updated = aiRules.landmarks.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l));
    onChange({ aiRules: { ...aiRules, landmarks: updated } });
  }

  // Joint Rule Handlers
  function handleAddJointRule() {
    const newRule: AIJointRule = {
      id: `jr-${Date.now()}`,
      measurement: "Elbow Angle (Góc khuỷu tay)",
      condition: "LESS_THAN",
      targetValue: 90,
      tolerance: 5,
      action: "REP_COUNT_TRIGGER",
      message: "Đạt chuẩn độ sâu tối thiểu.",
    };
    onChange({ aiRules: { ...aiRules, jointRules: [...aiRules.jointRules, newRule] } });
  }

  function handleUpdateJointRule(id: string, updated: Partial<AIJointRule>) {
    const rules = aiRules.jointRules.map((r) => (r.id === id ? { ...r, ...updated } : r));
    onChange({ aiRules: { ...aiRules, jointRules: rules } });
  }

  function handleDeleteJointRule(id: string) {
    onChange({ aiRules: { ...aiRules, jointRules: aiRules.jointRules.filter((r) => r.id !== id) } });
  }

  // ROM Rule Handlers
  function handleAddROMRule() {
    const newRom: AIROMRule = {
      id: `rom-${Date.now()}`,
      movementName: "Chest Depth to Floor",
      metricType: "depth_cm",
      minROM: 3,
      maxROM: 8,
      tolerance: 2,
      unit: "cm",
      description: "Khoảng cách ngực hạ xuống gần mặt sàn để tính 1 rep.",
    };
    onChange({ aiRules: { ...aiRules, romRules: [...aiRules.romRules, newRom] } });
  }

  function handleUpdateROMRule(id: string, updated: Partial<AIROMRule>) {
    const rules = aiRules.romRules.map((r) => (r.id === id ? { ...r, ...updated } : r));
    onChange({ aiRules: { ...aiRules, romRules: rules } });
  }

  function handleDeleteROMRule(id: string) {
    onChange({ aiRules: { ...aiRules, romRules: aiRules.romRules.filter((r) => r.id !== id) } });
  }

  // Error Detection Rule Handlers
  function handleAddErrorRule() {
    const newError: AIErrorDetectionRule = {
      id: `er-${Date.now()}`,
      ruleName: "Phát hiện lỗi sai mới",
      category: "Alignment",
      conditionDescription: "Góc cơ thể lệch chuẩn...",
      severity: "Warning",
      feedbackMessage: "Cơ thể chưa thẳng hàng.",
      correctionCue: "Gồng chặt cơ bụng và siết mông.",
    };
    onChange({ aiRules: { ...aiRules, errorDetectionRules: [...aiRules.errorDetectionRules, newError] } });
  }

  function handleUpdateErrorRule(id: string, updated: Partial<AIErrorDetectionRule>) {
    const rules = aiRules.errorDetectionRules.map((r) => (r.id === id ? { ...r, ...updated } : r));
    onChange({ aiRules: { ...aiRules, errorDetectionRules: rules } });
  }

  function handleDeleteErrorRule(id: string) {
    onChange({ aiRules: { ...aiRules, errorDetectionRules: aiRules.errorDetectionRules.filter((r) => r.id !== id) } });
  }

  const filteredLandmarks = aiRules.landmarks.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(landmarkSearch.toLowerCase()) ||
      l.vietnameseName.toLowerCase().includes(landmarkSearch.toLowerCase());
    const matchesPart = landmarkPartFilter === "ALL" || l.bodyPart === landmarkPartFilter;
    return matchesSearch && matchesPart;
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Step Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles size={18} />
              <span className="text-xs font-black uppercase tracking-wider">Bước 05 / 06</span>
            </div>
            <h2 className="text-xl font-black text-text-primary mt-1">Cấu hình AI Motion Analysis</h2>
            <p className="text-xs text-text-secondary">
              Thiết lập bộ quy tắc toán học (MediaPipe Pose Landmarks, Góc khớp, ROM, Tempo) để AI chấm điểm và sửa form tự động theo thời gian thực.
            </p>
          </div>

          {/* Master Enable Toggle */}
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-xs">
            <span className="text-xs font-bold text-text-primary">Kích hoạt AI:</span>
            <button
              type="button"
              onClick={() => handleToggleAiEnabled(!aiRules.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                aiRules.enabled ? "bg-accent" : "bg-border"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  aiRules.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 1. MEDIAPIPE 33 LANDMARKS SELECTION */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
              A
            </span>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
              1. Điểm mốc MediaPipe (33 Pose Landmarks)
            </h3>
          </div>
          <span className="text-xs font-bold text-accent">
            Đang kích hoạt: {aiRules.landmarks.filter((l) => l.enabled).length} / 33 điểm
          </span>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={landmarkSearch}
              onChange={(e) => setLandmarkSearch(e.target.value)}
              placeholder="Tìm kiếm điểm mốc (Khớp vai, khuỷu tay, cổ chân...)"
              className="w-full rounded-2xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <select
            value={landmarkPartFilter}
            onChange={(e) => setLandmarkPartFilter(e.target.value)}
            className="rounded-2xl border border-border bg-background p-2 text-xs font-bold text-text-primary focus:outline-none"
          >
            <option value="ALL">Tất cả bộ phận</option>
            <option value="upper_body">Thân trên (Upper Body)</option>
            <option value="lower_body">Thân dưới (Lower Body)</option>
            <option value="core">Cơ lõi / Hông (Core)</option>
            <option value="face">Đầu & Mặt (Face)</option>
          </select>
        </div>

        {/* Landmarks Matrix Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
          {filteredLandmarks.map((lm) => (
            <label
              key={lm.id}
              className={`flex items-center gap-2 rounded-xl border p-2 text-xs cursor-pointer transition-colors ${
                lm.enabled
                  ? "border-accent/40 bg-accent/5 text-text-primary font-bold"
                  : "border-border bg-background text-text-secondary opacity-70 hover:opacity-100"
              }`}
            >
              <input
                type="checkbox"
                checked={lm.enabled}
                onChange={() => handleToggleLandmark(lm.id)}
                className="rounded text-accent focus:ring-accent"
              />
              <div className="truncate">
                <span className="font-mono text-[10px] text-text-secondary mr-1">#{lm.id}</span>
                <span>{lm.vietnameseName}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 2. VISUAL JOINT ANGLE RULES (WHEN ... THEN ...) */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
              B
            </span>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
              2. Bộ quy tắc góc khớp (Joint Angle Rules Builder)
            </h3>
          </div>
          <button
            type="button"
            onClick={handleAddJointRule}
            className="flex items-center gap-1.5 rounded-2xl bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-strong cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>Thêm quy tắc góc</span>
          </button>
        </div>

        <p className="text-xs text-text-secondary">
          Xây dựng logic kiểm tra chuyển động dựa trên cú pháp trực quan (WHEN [Khớp] [Điều kiện] [Giá trị] THEN [Hành động]).
        </p>

        <div className="space-y-4">
          {aiRules.jointRules.map((rule, idx) => (
            <div
              key={rule.id}
              className="rounded-2xl border border-border bg-background p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs font-black text-accent uppercase tracking-wider">
                  Quy tắc góc #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteJointRule(rule.id)}
                  className="rounded-lg p-1 text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Visual WHEN THEN Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-xs items-center">
                <div className="md:col-span-1 font-mono font-black text-accent text-xs">WHEN</div>
                
                <div className="md:col-span-4">
                  <input
                    type="text"
                    value={rule.measurement}
                    onChange={(e) => handleUpdateJointRule(rule.id, { measurement: e.target.value })}
                    placeholder="e.g. Elbow Angle, Hip Angle"
                    className="w-full rounded-xl border border-border bg-surface p-2 text-xs font-bold text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="md:col-span-3">
                  <select
                    value={rule.condition}
                    onChange={(e) => handleUpdateJointRule(rule.id, { condition: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-surface p-2 text-xs font-bold text-text-primary focus:outline-none"
                  >
                    <option value="LESS_THAN">Nhỏ hơn (&lt;=)</option>
                    <option value="GREATER_THAN">Lớn hơn (&gt;=)</option>
                    <option value="BETWEEN">Trong khoảng (Between)</option>
                    <option value="OUTSIDE_RANGE">Ngoài khoảng (Outside)</option>
                    <option value="STABLE">Ổn định cố định (Stable)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={rule.targetValue}
                      onChange={(e) => handleUpdateJointRule(rule.id, { targetValue: Number(e.target.value) })}
                      className="w-full rounded-xl border border-border bg-surface p-2 text-xs font-bold text-text-primary text-center focus:outline-none"
                    />
                    <span className="text-text-secondary text-xs">độ</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <select
                    value={rule.action}
                    onChange={(e) => handleUpdateJointRule(rule.id, { action: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-surface p-2 text-xs font-bold text-text-primary focus:outline-none"
                  >
                    <option value="REP_COUNT_TRIGGER">Tính 1 Rep</option>
                    <option value="WARNING">Cảnh báo</option>
                    <option value="CRITICAL_STOP">Dừng khẩn cấp</option>
                    <option value="FORM_CUE">Nhắc form</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-secondary">Thông báo âm thanh / hiển thị tới học viên:</label>
                <input
                  type="text"
                  value={rule.message}
                  onChange={(e) => handleUpdateJointRule(rule.id, { message: e.target.value })}
                  placeholder="e.g. Đạt chuẩn độ sâu tối thiểu!"
                  className="w-full rounded-xl border border-border bg-surface p-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. ERROR DETECTION RULES & AI PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Detection rules list */}
        <div className="lg:col-span-7 rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
                C
              </span>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                3. Quy tắc bắt lỗi form (AI Error Rules)
              </h3>
            </div>
            <button
              type="button"
              onClick={handleAddErrorRule}
              className="flex items-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-text-primary hover:bg-surface-elevated cursor-pointer"
            >
              <Plus size={13} />
              <span>Thêm lỗi AI</span>
            </button>
          </div>

          <div className="space-y-3">
            {aiRules.errorDetectionRules.map((err) => (
              <div
                key={err.id}
                className="rounded-2xl border border-border bg-background p-3 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase ${
                        err.severity === "Critical"
                          ? "bg-rose-500/15 text-rose-600"
                          : err.severity === "Warning"
                          ? "bg-amber-500/15 text-amber-600"
                          : "bg-sky-500/15 text-sky-600"
                      }`}
                    >
                      {err.severity}
                    </span>
                    <input
                      type="text"
                      value={err.ruleName}
                      onChange={(e) => handleUpdateErrorRule(err.id, { ruleName: e.target.value })}
                      placeholder="Tên lỗi AI"
                      className="font-bold text-xs text-text-primary bg-transparent focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteErrorRule(err.id)}
                    className="text-text-secondary hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <input
                  type="text"
                  value={err.feedbackMessage}
                  onChange={(e) => handleUpdateErrorRule(err.id, { feedbackMessage: e.target.value })}
                  placeholder="Thông báo AI (e.g. Cơ thể bị võng lưng)"
                  className="w-full rounded-xl border border-border bg-surface p-2 text-xs text-text-primary focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Live AI Feedback Preview box */}
        <div className="lg:col-span-5 rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/70 pb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
              D
            </span>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
              4. Mô phỏng Phản hồi AI (AI Feedback Preview)
            </h3>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-bold">
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={15} />
                <span>Cảnh báo tư thế Real-time</span>
              </span>
              <span className="font-mono text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full">
                Độ tin cậy: 94.8%
              </span>
            </div>
            <p className="text-xs text-text-primary font-bold">
              "Khuỷu tay xòe quá rộng! Hãy khép nách góc 45 độ để bảo vệ khớp vai."
            </p>
            <div className="pt-2 border-t border-amber-500/20 text-[11px] text-text-secondary">
              💡 Khẩu lệnh: Gồng chặt cơ bụng và siết cơ mông liên tục.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
