import { useState } from "react";
import {
  Layers,
  Activity,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Wind,
  Clock,
} from "lucide-react";
import type { ExerciseGuideDetail } from "../../services/mock/workoutTrainingData";

type TabKey = "phases" | "muscles" | "technique" | "mistakes";

export function ExerciseInstructionTabs({ exercise }: { exercise: ExerciseGuideDetail }) {
  const [activeTab, setActiveTab] = useState<TabKey>("phases");

  const details = exercise.details;
  const phases = details?.phases || [];
  const muscleTargets = details?.muscleTargets || [];
  const commonMistakes = details?.commonMistakes || [];
  const coachingCues = details?.coachingCues || [];
  const safety = details?.safety;

  const hasPhases = phases.length > 0;
  const hasMuscleTargets = muscleTargets.length > 0;
  const hasMistakes = commonMistakes.length > 0;
  const hasCues = coachingCues.length > 0;

  // Filter muscle targets by role
  const primaryMuscles = muscleTargets.filter((m) => m.role?.toUpperCase() === "PRIMARY");
  const secondaryMuscles = muscleTargets.filter((m) => m.role?.toUpperCase() === "SECONDARY");
  const stabilizerMuscles = muscleTargets.filter((m) => m.role?.toUpperCase() === "STABILIZER");

  return (
    <div className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-6 shadow-elevated space-y-5">
      {/* 🧭 4 TABS SELECTOR */}
      <div className="flex items-center gap-1.5 border-b border-border/70 pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("phases")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "phases"
              ? "bg-accent-soft text-accent-strong shadow-xs border border-accent/40"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
          }`}
        >
          <Layers size={14} />
          Pha chuyển động ({hasPhases ? phases.length : exercise.instructions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("muscles")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "muscles"
              ? "bg-accent-soft text-accent-strong shadow-xs border border-accent/40"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
          }`}
        >
          <Activity size={14} />
          Giải phẫu nhóm cơ ({hasMuscleTargets ? muscleTargets.length : exercise.primaryMuscles.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("technique")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "technique"
              ? "bg-accent-soft text-accent-strong shadow-xs border border-accent/40"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
          }`}
        >
          <Flame size={14} />
          Kỹ thuật & Tempo
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mistakes")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "mistakes"
              ? "bg-accent-soft text-accent-strong shadow-xs border border-accent/40"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
          }`}
        >
          <AlertTriangle size={14} />
          Lỗi sai thường gặp ({hasMistakes ? commonMistakes.length : exercise.commonMistakes.length})
        </button>
      </div>

      {/* 🚀 TAB 1: MOVEMENT PHASES (PHA CHUYỂN ĐỘNG) */}
      {activeTab === "phases" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {hasPhases ? (
            <div className="space-y-3.5">
              {phases.map((phase, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/80 bg-background/50 p-4 transition-all hover:border-accent/40 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white font-black text-xs shadow-xs">
                        {phase.order || idx + 1}
                      </div>
                      <span className="font-display text-sm font-extrabold text-text-primary">
                        {phase.vietnameseName || phase.name}
                      </span>
                      {phase.name && phase.vietnameseName && (
                        <span className="text-[11px] text-text-secondary hidden sm:inline">
                          ({phase.name})
                        </span>
                      )}
                    </div>

                    {phase.breathing && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2.5 py-0.5 text-[11px] font-bold">
                        <Wind size={12} />
                        {phase.breathing}
                      </span>
                    )}
                  </div>

                  {phase.description && (
                    <p className="text-xs text-text-secondary leading-relaxed pl-8">
                      {phase.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1 pl-8">
                    {phase.coachingCue && (
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-1 text-[11px] font-semibold border border-amber-500/20">
                        <Sparkles size={12} className="shrink-0" />
                        <span>Mẹo: {phase.coachingCue}</span>
                      </div>
                    )}

                    {phase.muscleFocus && (
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-surface-elevated border border-border px-2.5 py-1 text-[11px] font-medium text-text-secondary">
                        <Activity size={12} className="text-accent" />
                        <span>Kích hoạt: {phase.muscleFocus}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {exercise.instructions.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs leading-relaxed">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white font-extrabold text-[11px] shadow-xs">
                    {idx + 1}
                  </div>
                  <p className="text-text-primary pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          )}

          {/* Visual Position Cards Gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="group/pos relative overflow-hidden rounded-xl border border-border/80 bg-background/50 p-2.5 space-y-2">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-black/10">
                <img
                  src={exercise.startPositionImage}
                  alt="Tư thế bắt đầu"
                  className="h-full w-full object-cover group-hover/pos:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Tư thế chuẩn bị (Start Position)
                </span>
              </div>
            </div>

            <div className="group/pos relative overflow-hidden rounded-xl border border-border/80 bg-background/50 p-2.5 space-y-2">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-black/10">
                <img
                  src={exercise.bottomPositionImage}
                  alt="Tư thế hạ sâu"
                  className="h-full w-full object-cover group-hover/pos:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  Tư thế hạ sâu (Bottom Position)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🧬 TAB 2: ANATOMY & TARGET MUSCLES (GIẢI PHẪU NHÓM CƠ) */}
      {activeTab === "muscles" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {hasMuscleTargets ? (
            <div className="space-y-4">
              {/* Primary Muscles */}
              {primaryMuscles.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Cơ tác động chính (Primary Targets)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {primaryMuscles.map((muscle) => (
                      <div
                        key={muscle.muscleCode}
                        className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-text-primary">
                            {muscle.muscleNameVi || muscle.muscleName || muscle.muscleCode}
                          </span>
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                            {muscle.activationLevel || "HIGH"}
                          </span>
                        </div>
                        {muscle.userGuidance && (
                          <p className="text-[11px] text-text-secondary leading-relaxed">
                            {muscle.userGuidance}
                          </p>
                        )}
                        {muscle.expectedSensations && muscle.expectedSensations.length > 0 && (
                          <div className="text-[10px] text-accent-strong flex items-center gap-1 pt-0.5">
                            <Flame size={11} />
                            <span>Cảm giác chuẩn: {muscle.expectedSensations.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Secondary Muscles */}
              {secondaryMuscles.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Cơ hỗ trợ chuyển động (Secondary Targets)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {secondaryMuscles.map((muscle) => (
                      <div
                        key={muscle.muscleCode}
                        className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-text-primary">
                            {muscle.muscleNameVi || muscle.muscleName || muscle.muscleCode}
                          </span>
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            {muscle.activationLevel || "MODERATE"}
                          </span>
                        </div>
                        {muscle.userGuidance && (
                          <p className="text-[11px] text-text-secondary leading-relaxed">
                            {muscle.userGuidance}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stabilizer Muscles */}
              {stabilizerMuscles.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Cơ ổn định & Giữ thăng bằng (Stabilizers)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {stabilizerMuscles.map((muscle) => (
                      <div
                        key={muscle.muscleCode}
                        className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-text-primary">
                            {muscle.muscleNameVi || muscle.muscleName || muscle.muscleCode}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            STABILIZER
                          </span>
                        </div>
                        {muscle.userGuidance && (
                          <p className="text-[11px] text-text-secondary leading-relaxed">
                            {muscle.userGuidance}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-accent-soft/20 border border-accent/20 p-4 space-y-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent-strong block mb-1.5">
                  Nhóm cơ tác động chính (Primary Target):
                </span>
                <div className="flex flex-wrap gap-2">
                  {exercise.primaryMuscles.map((muscle) => (
                    <span key={muscle} className="rounded-lg bg-accent text-white px-3 py-1 text-xs font-bold shadow-xs">
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-accent/15">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-1.5">
                  Nhóm cơ hỗ trợ / Giữ thăng bằng (Secondary Target):
                </span>
                <div className="flex flex-wrap gap-2">
                  {exercise.secondaryMuscles.map((muscle) => (
                    <span key={muscle} className="rounded-lg bg-surface border border-border px-3 py-1 text-xs font-medium text-text-secondary">
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ⚡ TAB 3: TECHNIQUE, TEMPO & CUES (KỸ THUẬT & TEMPO) */}
      {activeTab === "technique" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Tempo & Breathing Control Box */}
          <div className="rounded-2xl border border-border/80 bg-background/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary uppercase flex items-center gap-1.5">
                <Clock size={14} className="text-accent" />
                Kiểm soát Nhịp độ chuyển động (Tempo & Breathing)
              </span>
              <span className="text-xs font-mono font-black text-accent-strong bg-accent-soft px-2.5 py-0.5 rounded-lg border border-accent/30">
                {details?.tempo || "3-0-1-0"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className="rounded-xl bg-surface p-2.5 border border-border/60">
                <div className="text-[10px] text-text-secondary font-medium">Hạ thân (Eccentric)</div>
                <div className="text-base font-black text-text-primary mt-0.5">3 giây</div>
              </div>
              <div className="rounded-xl bg-surface p-2.5 border border-border/60">
                <div className="text-[10px] text-text-secondary font-medium">Dừng đáy (Bottom)</div>
                <div className="text-base font-black text-text-primary mt-0.5">0 giây</div>
              </div>
              <div className="rounded-xl bg-surface p-2.5 border border-border/60">
                <div className="text-[10px] text-text-secondary font-medium">Đẩy lên (Concentric)</div>
                <div className="text-base font-black text-accent-strong mt-0.5">1 giây</div>
              </div>
              <div className="rounded-xl bg-surface p-2.5 border border-border/60">
                <div className="text-[10px] text-text-secondary font-medium">Khóa đỉnh (Lockout)</div>
                <div className="text-base font-black text-text-primary mt-0.5">0 giây</div>
              </div>
            </div>

            {(details?.inhaleTiming || details?.exhaleTiming) && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/50 text-xs">
                {details.inhaleTiming && (
                  <div className="flex-1 flex items-center gap-2 text-sky-600 dark:text-sky-400">
                    <Wind size={14} />
                    <span>Hít vào: {details.inhaleTiming}</span>
                  </div>
                )}
                {details.exhaleTiming && (
                  <div className="flex-1 flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <Wind size={14} />
                    <span>Thở ra: {details.exhaleTiming}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Coaching Cues List */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Khẩu lệnh kỹ thuật then chốt (Mechanical Cues):
            </span>

            {hasCues ? (
              <div className="space-y-2">
                {coachingCues.map((cue, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl bg-surface p-3 border border-border/80 text-xs"
                  >
                    <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-text-primary font-medium leading-relaxed">{cue.text}</p>
                      {cue.priority && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-accent-strong uppercase">
                          Ưu tiên: {cue.priority}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {exercise.tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl bg-surface p-3 border border-border/80 text-xs"
                  >
                    <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                    <p className="text-text-primary font-medium leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ⚠️ TAB 4: COMMON MISTAKES & CORRECTIONS (LỖI THƯỜNG GẶP) */}
      {activeTab === "mistakes" && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {hasMistakes ? (
            commonMistakes.map((mistake, idx) => {
              const isHigh = mistake.severity === "CRITICAL" || mistake.severity === "HIGH";
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border p-4 space-y-2.5 ${
                    isHigh
                      ? "border-rose-500/30 bg-rose-500/5"
                      : "border-amber-500/30 bg-amber-500/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        size={16}
                        className={isHigh ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"}
                      />
                      <span className="font-display text-sm font-extrabold text-text-primary">
                        {mistake.name}
                      </span>
                    </div>
                    {mistake.severity && (
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isHigh
                            ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                            : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {mistake.severity}
                      </span>
                    )}
                  </div>

                  {mistake.problem && (
                    <div className="text-xs text-text-secondary leading-relaxed">
                      <strong className="text-text-primary font-bold">Vấn đề: </strong>
                      {mistake.problem}
                    </div>
                  )}

                  {mistake.whyItHappens && (
                    <div className="text-xs text-text-secondary leading-relaxed">
                      <strong className="text-text-primary font-bold">Nguyên nhân: </strong>
                      {mistake.whyItHappens}
                    </div>
                  )}

                  {mistake.correction && (
                    <div className="rounded-xl bg-background/80 p-2.5 border border-border/60 text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                      <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-bold">Cách khắc phục: </strong>
                        {mistake.correction}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            exercise.commonMistakes.map((mistake, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs"
              >
                <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <p className="text-text-primary leading-relaxed font-medium">{mistake}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* 🛡️ SAFETY & INJURY PREVENTION ALERT FOOTER */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 sm:p-4">
        <ShieldAlert size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <span className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
            Lưu ý an toàn & Phòng tránh chấn thương:
          </span>
          <p className="text-text-primary leading-relaxed">
            {safety?.generalConsiderations ||
              safety?.safetyCues?.join(". ") ||
              "Khóa chặt khớp vai, gồng cứng cơ bụng suốt động tác. Dừng lại ngay nếu có cảm giác đau nhói tại khớp cùi chỏ hoặc cổ tay."}
          </p>
          {safety?.stopConditions && safety.stopConditions.length > 0 && (
            <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold pt-1">
              Dừng hiệp ngay khi: {safety.stopConditions.join(", ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
