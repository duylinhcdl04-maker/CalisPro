import { createPortal } from "react-dom";
import { useState } from "react";
import {
  X,
  Check,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  ShieldAlert,
  Info,
} from "lucide-react";
import {
  MuscleTarget,
  CalisHealthMuscle,
  MuscleRole,
  MuscleActivation,
  MuscleLaterality,
  ExpectedSensationType,
  UnexpectedSensationType,
} from "../../types/exercise";

interface MuscleDetailsPanelProps {
  muscle: CalisHealthMuscle;
  initialTarget?: MuscleTarget;
  onSave: (target: MuscleTarget) => void;
  onClose: () => void;
}

const EXPECTED_SENSATIONS_LIST: { id: ExpectedSensationType; label: string; desc: string }[] = [
  { id: "MUSCLE_TENSION", label: "Căng cơ khi chịu tải (Muscle Tension)", desc: "Cảm giác cơ gồng cứng chống lại trọng lực" },
  { id: "STRETCH", label: "Căng dãn kiểm soát (Stretch)", desc: "Cơ duỗi dài ở cuối pha Eccentric" },
  { id: "FATIGUE", label: "Mỏi cơ lành mạnh (Fatigue)", desc: "Cảm giác mỏi cơ bình thường do tiêu hao năng lượng" },
  { id: "PUMP", label: "Bơm máu căng phồng (Pump)", desc: "Máu dồn vào cơ bắp tăng kích thước tạm thời" },
  { id: "BURNING", label: "Nóng rát chuyển hóa (Burning)", desc: "Tích tụ acid lactic ở những rep cuối" },
  { id: "STABILIZATION_EFFORT", label: "Gồng ổn định khớp (Stabilization)", desc: "Ổn định xương bả vai, hông hoặc cột sống" },
];

const UNEXPECTED_SENSATIONS_LIST: { id: UnexpectedSensationType; label: string; desc: string }[] = [
  { id: "SHARP_PAIN", label: "Đau nhói buốt đột ngột (Sharp Pain)", desc: "Cơn đau nhói như kim châm hoặc xé rách" },
  { id: "JOINT_PAIN", label: "Đau nhức trong ổ khớp (Joint Pain)", desc: "Đau bao khớp vai, cùi chỏ hoặc cổ tay" },
  { id: "NUMBNESS", label: "Tê liệt mất cảm giác (Numbness)", desc: "Dấu hiệu chèn ép rễ thần kinh" },
  { id: "TINGLING", label: "Châm chích râm ran (Tingling)", desc: "Tê buốt chạy dọc cánh tay hoặc chân" },
  { id: "UNUSUAL_DISCOMFORT", label: "Khó chịu bất thường (Unusual Discomfort)", desc: "Khớp kêu lạo xạo kèm cảm giác kẹt khớp" },
];

export function MuscleDetailsPanel({
  muscle,
  initialTarget,
  onSave,
  onClose,
}: MuscleDetailsPanelProps) {
  const [role, setRole] = useState<MuscleRole>(initialTarget?.role || "PRIMARY");
  const [activationLevel, setActivationLevel] = useState<MuscleActivation>(
    initialTarget?.activationLevel || "HIGH"
  );
  const [laterality, setLaterality] = useState<MuscleLaterality>(
    initialTarget?.laterality || "BILATERAL"
  );
  const [expectedSensations, setExpectedSensations] = useState<ExpectedSensationType[]>(
    initialTarget?.expectedSensations || ["MUSCLE_TENSION", "STRETCH"]
  );
  const [unexpectedSensations, setUnexpectedSensations] = useState<UnexpectedSensationType[]>(
    initialTarget?.unexpectedSensations || ["SHARP_PAIN", "JOINT_PAIN"]
  );
  const [userGuidance, setUserGuidance] = useState<string>(
    initialTarget?.userGuidance ||
      `Cảm nhận cơ ${muscle.nameVi.toLowerCase()} làm việc rõ ràng trong toàn bộ hành trình chuyển động.`
  );

  function toggleExpected(id: ExpectedSensationType) {
    if (expectedSensations.includes(id)) {
      setExpectedSensations(expectedSensations.filter((s) => s !== id));
    } else {
      setExpectedSensations([...expectedSensations, id]);
    }
  }

  function toggleUnexpected(id: UnexpectedSensationType) {
    if (unexpectedSensations.includes(id)) {
      setUnexpectedSensations(unexpectedSensations.filter((s) => s !== id));
    } else {
      setUnexpectedSensations([...unexpectedSensations, id]);
    }
  }

  function handleSave() {
    onSave({
      muscleId: muscle.id,
      role,
      activationLevel,
      laterality,
      expectedSensations,
      unexpectedSensations,
      userGuidance,
    });
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-hidden animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[88vh] rounded-3xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 overflow-hidden">
        {/* Sticky Modal Header (Always Visible) */}
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4 bg-surface-elevated/70 backdrop-blur-md flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/20">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-text-primary flex items-center gap-2">
                <span>Cấu hình Nhóm cơ: {muscle.nameVi}</span>
                <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-mono text-accent-strong uppercase">
                  {muscle.region}
                </span>
              </h3>
              <p className="text-xs text-text-secondary font-mono">
                {muscle.name} • Mã: {muscle.code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-text-secondary hover:bg-surface hover:text-text-primary transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. ROLE, ACTIVATION & LATERALITY MATRIX */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">Vai trò cơ bắp</label>
              <div className="flex flex-col gap-1">
                {(["PRIMARY", "SECONDARY", "STABILIZER"] as MuscleRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                      role === r
                        ? "bg-accent text-white shadow-xs"
                        : "border border-border bg-background text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                    }`}
                  >
                    <span>
                      {r === "PRIMARY" ? "Cơ chính (Primary)" : r === "SECONDARY" ? "Cơ phụ (Secondary)" : "Ổn định (Stabilizer)"}
                    </span>
                    {role === r && <Check size={13} strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Activation Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">Mức độ kích hoạt</label>
              <div className="flex flex-col gap-1">
                {(["VERY_HIGH", "HIGH", "MODERATE", "LOW"] as MuscleActivation[]).map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setActivationLevel(act)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                      activationLevel === act
                        ? "bg-surface-elevated text-accent-strong border-2 border-accent shadow-xs"
                        : "border border-border bg-background text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                    }`}
                  >
                    <span>
                      {act === "VERY_HIGH" ? "Rất cao (Very High)" : act === "HIGH" ? "Cao (High)" : act === "MODERATE" ? "Vừa (Moderate)" : "Nhẹ (Low)"}
                    </span>
                    {activationLevel === act && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Laterality */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">Bên tác động (Laterality)</label>
              <div className="flex flex-col gap-1">
                {(["BILATERAL", "LEFT", "RIGHT", "CENTRAL"] as MuscleLaterality[]).map((lat) => (
                  <button
                    key={lat}
                    type="button"
                    onClick={() => setLaterality(lat)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                      laterality === lat
                        ? "bg-surface-elevated text-accent-strong border-2 border-accent shadow-xs"
                        : "border border-border bg-background text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                    }`}
                  >
                    <span>
                      {lat === "BILATERAL" ? "Cả 2 bên (Bilateral)" : lat === "LEFT" ? "Bên trái (Left)" : lat === "RIGHT" ? "Bên phải (Right)" : "Chính giữa (Central)"}
                    </span>
                    {laterality === lat && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. EXPECTED SENSATIONS (WHAT USER SHOULD FEEL) */}
          <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
              <CheckCircle2 size={15} />
              <span>Cảm giác cơ chuẩn kỳ vọng (Normal Expected Sensations)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXPECTED_SENSATIONS_LIST.map((item) => {
                const isChecked = expectedSensations.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleExpected(item.id)}
                    className={`flex items-start gap-2 rounded-xl p-2.5 text-left text-xs transition-colors cursor-pointer ${
                      isChecked
                        ? "bg-surface border border-emerald-500/50 shadow-xs"
                        : "bg-surface/50 border border-border text-text-secondary opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-md border ${
                        isChecked
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "border-border bg-background"
                      }`}
                    >
                      {isChecked && <Check size={11} strokeWidth={3} />}
                    </div>
                    <div>
                      <span className="font-bold text-text-primary block text-[11px]">{item.label}</span>
                      <span className="text-[10px] text-text-secondary">{item.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. UNEXPECTED SENSATIONS (WARNING / SAFETY) */}
          <div className="space-y-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                <AlertTriangle size={15} />
                <span>Cảm giác bất thường cần dừng tập (Unexpected Sensations)</span>
              </div>
              <span className="text-[10px] text-text-secondary italic">Khuyến cáo an toàn chung</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {UNEXPECTED_SENSATIONS_LIST.map((item) => {
                const isChecked = unexpectedSensations.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleUnexpected(item.id)}
                    className={`flex items-start gap-2 rounded-xl p-2.5 text-left text-xs transition-colors cursor-pointer ${
                      isChecked
                        ? "bg-surface border border-rose-500/50 shadow-xs"
                        : "bg-surface/50 border border-border text-text-secondary opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-md border ${
                        isChecked
                          ? "bg-rose-600 text-white border-rose-600"
                          : "border-border bg-background"
                      }`}
                    >
                      {isChecked && <Check size={11} strokeWidth={3} />}
                    </div>
                    <div>
                      <span className="font-bold text-text-primary block text-[11px]">{item.label}</span>
                      <span className="text-[10px] text-text-secondary">{item.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. USER GUIDANCE INSTRUCTION */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-primary">
                Hướng dẫn cảm nhận tới Học viên (User Guidance Text)
              </label>
              <span className="text-[10px] font-mono text-text-secondary">
                {userGuidance.length} / 500 ký tự
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={userGuidance}
              onChange={(e) => setUserGuidance(e.target.value)}
              placeholder="Người tập nên cảm nhận cơ bắp hoạt động ra sao trong từng pha đẩy/hạ..."
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Sticky Modal Footer (Always Visible) */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/70 bg-surface-elevated/70 backdrop-blur-md flex-shrink-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-border bg-surface px-4 py-2.5 text-xs font-bold text-text-primary hover:bg-surface-elevated cursor-pointer transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-2xl bg-accent px-5 py-2.5 text-xs font-black text-white hover:bg-accent-strong cursor-pointer shadow-xs transition-colors"
          >
            Lưu cấu hình cơ
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
