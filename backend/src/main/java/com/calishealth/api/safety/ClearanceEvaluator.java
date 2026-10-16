package com.calishealth.api.safety;

import com.calishealth.api.safety.SafetyModels.*;

import java.util.*;

/**
 * Quyết định một yêu cầu clearance (hàm thuần). Acknowledgement KHÔNG phải clearance và không đi qua lớp này (I12).
 * Chỉ một ClearanceRule đã publish mới cho phép đổi status (I13); không có rule khớp => CLEARANCE_METHOD_NOT_ALLOWED.
 * Cờ sticky chỉ gỡ được bằng COACH_VERIFIED (I14), kể cả khi một rule cấu hình sai phủ cờ đó.
 */
public final class ClearanceEvaluator {

    public ClearanceDecision evaluate(Status current, List<ActiveFlag> activeFlags, ClearanceMethod method, List<ClearanceRule> rules) {
        if (method == ClearanceMethod.NONE) return denied("CLEARANCE_METHOD_NOT_ALLOWED");
        for (ClearanceRule r : rules) {
            if (r.fromStatus() != current || r.method() != method) continue;

            Set<String> removable = new TreeSet<>();
            for (ActiveFlag f : activeFlags) {
                boolean covered = switch (r.mode()) {
                    case ALL -> true;
                    case ALL_NON_STICKY -> !f.sticky();
                    case FLAGS -> r.flags().contains(f.code());
                };
                boolean allowedForMethod = !f.sticky() || method == ClearanceMethod.COACH_VERIFIED;
                if (covered && allowedForMethod) removable.add(f.code());
            }
            if (removable.isEmpty()) continue;

            List<ActiveFlag> remaining = activeFlags.stream().filter(f -> !removable.contains(f.code())).toList();
            Status remainingStatus = SafetyEvaluator.statusOf(remaining);
            // Cờ còn lại (vd. sticky chưa được phủ) vẫn giữ status tương ứng: không bao giờ thấp hơn mức do cờ còn lại quy định
            Status resulting = Status.max(r.resultingStatus(), remainingStatus);
            return new ClearanceDecision(true, null, r.id(), removable, resulting);
        }
        return denied("CLEARANCE_METHOD_NOT_ALLOWED");
    }

    /** Kiểm tra rule lúc publish: SELF_ATTESTED phải chỉ rõ cờ cụ thể, không phủ cờ sticky/ALL (F3, I14). Trả về danh sách lỗi. */
    public List<String> validateRules(List<ClearanceRule> rules, List<FlagDef> flagDefs) {
        Map<String, FlagDef> defs = SafetyModels.byCode(flagDefs);
        List<String> errors = new ArrayList<>();
        for (ClearanceRule r : rules) {
            if (r.method() == ClearanceMethod.NONE) errors.add("Rule " + r.id() + ": NONE không phải phương thức clearance");
            if (r.method() == ClearanceMethod.SELF_ATTESTED) {
                if (r.mode() != ScopeMode.FLAGS) errors.add("Rule " + r.id() + ": SELF_ATTESTED phải khai báo cờ cụ thể (mode FLAGS)");
                else for (String f : r.flags()) {
                    FlagDef d = defs.get(f);
                    if (d == null) errors.add("Rule " + r.id() + ": cờ không tồn tại " + f);
                    else if (d.sticky()) errors.add("Rule " + r.id() + ": SELF_ATTESTED không được gỡ cờ sticky " + f);
                }
            }
        }
        return errors;
    }

    private ClearanceDecision denied(String reason) { return new ClearanceDecision(false, reason, null, Set.of(), null); }
}
