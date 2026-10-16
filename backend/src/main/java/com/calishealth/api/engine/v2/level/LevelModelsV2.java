package com.calishealth.api.engine.v2.level;

import java.util.List;
import java.util.Map;
import java.util.Set;

/** Kiểu dữ liệu của Fitness Level Engine V2 (ASSESSMENT_FRAMEWORK_V2 §6, §8.1). */
public final class LevelModelsV2 {
    private LevelModelsV2() {}

    /** FAIL CHỈ khi bằng chứng đủ + tin cậy chưa đạt. INSUFFICIENT_EVIDENCE/UNRELIABLE chặn xác nhận nhưng không phải bằng chứng tiêu cực (I19). */
    public enum GateStatus {
        PASS, PASS_SELF_REPORTED, FAIL, NOT_EVALUATED, INSUFFICIENT_EVIDENCE, UNRELIABLE;
        public boolean passes() { return this == PASS || this == PASS_SELF_REPORTED; }
    }

    public enum SkillState { ACHIEVED, ACHIEVED_SELF_REPORTED, NOT_ACHIEVED, UNKNOWN }

    public record CompetencyReq(String competency, double min) {}

    /** stage = mã stage/bài tập. selfReportedAcceptable = cho phép ACHIEVED_SELF_REPORTED tính cho candidate (chỉ Initial). */
    public record SkillReq(String stage, boolean selfReportedAcceptable) {}

    public record LevelDef(String code, int rank, double promoteMin, List<CompetencyReq> competencyReqs, List<SkillReq> skillReqs) {}

    public record Reason(String code, String gate, String subject, Double required, Double actual, String message) {}

    public record InitialInput(Double overall, Map<String, Double> competencies, Map<String, SkillState> skills,
                               Set<String> conflictedCompetencies, double answerConfidence, List<LevelDef> levels) {}

    public record InitialResult(
            String candidateLevel, String gatedLevel, String adjustedLevel, String finalLevel, String levelCap, boolean capApplied,
            String levelStatus, String verificationStatus, String source, Double overall, double answerConfidence,
            Map<String, GateStatus> gates, List<Reason> reasons) {}

    // ---- Baseline (§8.1) ----

    public enum AttemptStatus { VALID, INVALID_MEASUREMENT, USER_ABORTED, NOT_DONE }

    /** meetsLevelRequirements = Performance ∧ Quality của level đích trên attempt này (chỉ có nghĩa khi VALID). */
    public record Attempt(AttemptStatus status, boolean meetsLevelRequirements) {}

    /** Bằng chứng của một level trên staircase. Các cổng tổng hợp do bên gọi tính trên dữ liệu đã tổng hợp bảo thủ các attempt. */
    public record LevelEvidence(int rank, List<Attempt> attempts, GateStatus overall, GateStatus competency, GateStatus skill, GateStatus reliability) {}

    public record BaselineInput(int provisionalRank, boolean firstBaseline, List<LevelEvidence> levels) {}

    public enum BaselineOutcome { VERIFIED, RETEST_REQUIRED, INCOMPLETE }

    public enum Decision { PROMOTED, MAINTAINED, REGRESSED }

    /** pendingCoachRank: level đã đủ mọi cổng đo bằng camera nhưng cần Coach xác nhận (L4) - finalRank vẫn là level camera xác minh được. */
    public record BaselineResult(BaselineOutcome outcome, Decision decision, Integer finalRank, boolean fastTrackConsumed,
                                 String reasonCode, Map<Integer, GateStatus> stabilityByLevel, Integer pendingCoachRank) {
        public BaselineResult(BaselineOutcome outcome, Decision decision, Integer finalRank, boolean fastTrackConsumed,
                              String reasonCode, Map<Integer, GateStatus> stabilityByLevel) {
            this(outcome, decision, finalRank, fastTrackConsumed, reasonCode, stabilityByLevel, null);
        }
    }
}
