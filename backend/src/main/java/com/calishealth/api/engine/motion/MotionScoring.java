package com.calishealth.api.engine.motion;

import com.calishealth.api.engine.motion.MotionTypes.Severity;

import java.util.Collection;

/**
 * Chất lượng động tác (Movement Quality) - KHÁC với đạt/không của Motion Rule (ruleEniges §53).
 * quality = 100 − Σ phạt theo mức cao nhất của mỗi rule bị vi phạm (PRODUCT_RULE, cần coach duyệt).
 */
public final class MotionScoring {
    private MotionScoring() {}

    public static final int PENALTY_INFO = 0, PENALTY_WARNING = 5, PENALTY_ERROR = 15, PENALTY_CRITICAL = 30, PENALTY_INCOMPLETE = 40;

    public static int quality(Collection<Severity> worstPerRule, boolean complete) {
        int score = 100 - (complete ? 0 : PENALTY_INCOMPLETE);
        for (Severity s : worstPerRule) {
            score -= switch (s) { case INFO -> PENALTY_INFO; case WARNING -> PENALTY_WARNING; case ERROR -> PENALTY_ERROR; case CRITICAL -> PENALTY_CRITICAL; };
        }
        return Math.max(0, score);
    }
}
