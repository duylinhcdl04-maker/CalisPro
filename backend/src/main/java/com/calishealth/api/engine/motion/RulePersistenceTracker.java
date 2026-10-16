package com.calishealth.api.engine.motion;

import com.calishealth.api.engine.motion.MotionTypes.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Persistence theo TỪNG MỨC: count[s] = số khung (hoặc thời gian) liên tiếp có mức ≥ s.
 * Mức được báo = mức cao nhất đã duy trì đủ. Vì vậy "E, E, PASS, E" không tạo lỗi duy trì,
 * còn "W, E, E, E, E" (persistence 5 khung) báo WARNING rồi ERROR khi ERROR đủ 5 khung.
 * Khung không tin cậy được BỎ QUA (không đếm, không reset) - dữ liệu kém không được coi là form tốt hay xấu.
 */
public final class RulePersistenceTracker {
    private static final int LEVELS = Severity.values().length;

    private static final class State {
        final int[] count = new int[LEVELS];
        final long[] since = new long[LEVELS];
        State() { java.util.Arrays.fill(since, -1); }
    }

    private final Map<Long, State> states = new HashMap<>();

    /** @return mức vi phạm đã duy trì đủ, hoặc null */
    public Severity update(RuleDef rule, Status status, long timestampMs) {
        if (status == Status.UNRELIABLE || status == Status.SKIPPED) return current(rule, timestampMs);
        State st = states.computeIfAbsent(rule.id(), k -> new State());
        Severity sev = status.severity();
        for (int s = 0; s < LEVELS; s++) {
            boolean atLeast = sev != null && sev.ordinal() >= s;
            if (atLeast) {
                st.count[s]++;
                if (st.since[s] < 0) st.since[s] = timestampMs;
            } else {
                st.count[s] = 0;
                st.since[s] = -1;
            }
        }
        return current(rule, timestampMs);
    }

    private Severity current(RuleDef rule, long now) {
        State st = states.get(rule.id());
        if (st == null) return null;
        for (int s = LEVELS - 1; s >= 0; s--) {
            boolean ok = rule.persistenceType() == PersistenceType.TIME
                    ? st.since[s] >= 0 && now - st.since[s] >= rule.persistenceValue()
                    : st.count[s] >= rule.persistenceValue();
            if (ok) return Severity.values()[s];
        }
        return null;
    }
}
