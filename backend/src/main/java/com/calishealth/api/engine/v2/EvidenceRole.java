package com.calishealth.api.engine.v2;

/**
 * Vai trò bằng chứng của một câu hỏi/mục kiểm tra (ASSESSMENT_FRAMEWORK_V2 §2.2).
 * contributesToScore() là NƠI DUY NHẤT quyết định role nào được vào điểm năng lực (I3, I4):
 * kinh nghiệm, hồ sơ, mục tiêu, ràng buộc, độ tin cậy và an toàn KHÔNG bao giờ vào điểm.
 */
public enum EvidenceRole {
    UNCLASSIFIED(false), PERFORMANCE_LADDER(true), PERFORMANCE_SUPPORT(true), SELF_RATING_CHOICE(true), QUALITY_MEASURED(true),
    CONTEXT_EXPERIENCE(false), RELIABILITY_MODIFIER(false), PROFILE(false), GOAL(false), CONSTRAINT(false), SAFETY(false);

    private final boolean scoring;

    EvidenceRole(boolean scoring) { this.scoring = scoring; }

    public boolean contributesToScore() { return scoring; }
}
