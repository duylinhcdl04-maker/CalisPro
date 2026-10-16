package com.calishealth.api.safety;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Miền Safety (ASSESSMENT_FRAMEWORK_V2 §3): độc lập với năng lực và level. Package này KHÔNG được import engine.v2
 * và engine.v2 KHÔNG được import package này (kiểm tra bằng V2ArchitectureTest).
 */
public final class SafetyModels {
    private SafetyModels() {}

    public enum Status {
        CLEARED, REVIEW_REQUIRED, RESTRICTED;
        public boolean atLeast(Status other) { return ordinal() >= other.ordinal(); }
        public static Status max(Status a, Status b) { return a.ordinal() >= b.ordinal() ? a : b; }
    }

    public enum Severity { REVIEW, RESTRICT }

    public enum ClearanceMethod { NONE, SELF_ATTESTED, COACH_VERIFIED }

    public record FlagDef(String code, boolean sticky) {}

    /** op: EQ | CONTAINS. Đáp án tập hợp (đơn lựa chọn cũng là tập một phần tử). */
    public record SafetyRule(String questionCode, String op, String value, String flag, Severity severity) {}

    public record ActiveFlag(String code, boolean sticky, Severity severity) {}

    public record FlagEvent(String flag, String event, boolean sticky) {}

    public record PreviousSafety(Status status, List<ActiveFlag> activeFlags, Set<String> retainedConstraints) {}

    /** Chính sách theo status (rule set). requiresClearanceToLeave: sàng lọc lại không thể hạ status dưới mức hiện tại. */
    public record Policy(Status status, boolean requiresClearanceToLeave) {}

    public record Evaluation(Status status, List<ActiveFlag> activeFlags, Set<String> constraints, List<FlagEvent> events) {}

    // ---- Clearance ----
    public enum ScopeMode { ALL, ALL_NON_STICKY, FLAGS }

    public record ClearanceRule(long id, Status fromStatus, ScopeMode mode, Set<String> flags, ClearanceMethod method,
                                Status resultingStatus, boolean allowRetainedConstraints) {}

    public record ClearanceDecision(boolean granted, String reasonCode, Long ruleId, Set<String> removedFlags, Status resultingStatus) {}

    public static Map<String, FlagDef> byCode(List<FlagDef> defs) {
        Map<String, FlagDef> m = new java.util.HashMap<>();
        defs.forEach(d -> m.put(d.code(), d));
        return m;
    }
}
