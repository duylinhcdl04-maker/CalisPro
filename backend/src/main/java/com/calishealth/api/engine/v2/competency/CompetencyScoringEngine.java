package com.calishealth.api.engine.v2.competency;

import com.calishealth.api.engine.v2.EvidenceRole;
import com.calishealth.api.engine.v2.RuleParams;

import java.util.*;

/**
 * Điểm năng lực theo NHÓM bằng chứng độc lập (ASSESSMENT_FRAMEWORK_V2 §4):
 *   Score_c = Σ_g (S_g · w_g · r_g) / Σ_g (w_g · r_g)   chỉ trên nhóm CÓ dữ liệu.
 * Trọng số nhóm lấy từ rule set (không có số mặc định trong code). Nhóm vắng bị loại khỏi mẫu số (không phải 0 điểm).
 * Hàm thuần; KHÔNG nhận Safety (I3) và KHÔNG nhận kinh nghiệm/hồ sơ (I4) - chỉ nhận GroupEvidence dựng từ role chấm điểm.
 */
public final class CompetencyScoringEngine {

    public enum Group {
        LADDER(EvidenceRole.PERFORMANCE_LADDER), CHOICE(EvidenceRole.SELF_RATING_CHOICE),
        QUALITY(EvidenceRole.QUALITY_MEASURED), SUPPORT(EvidenceRole.PERFORMANCE_SUPPORT);

        private final EvidenceRole role;
        Group(EvidenceRole role) { this.role = role; }
        public EvidenceRole role() { return role; }
    }

    /** Bằng chứng đã chuẩn hoá của một nhóm. Chỉ dựng được từ role chấm điểm tương ứng (kiểu dữ liệu chặn CONTEXT/SAFETY...). */
    public static final class GroupEvidence {
        private final Group group;
        private final double score;
        private final double reliability;

        private GroupEvidence(Group group, double score, double reliability) {
            this.group = group; this.score = score; this.reliability = reliability;
        }

        public static GroupEvidence of(EvidenceRole role, Group group, double score, double reliability) {
            if (!role.contributesToScore()) throw new IllegalArgumentException("Role " + role + " không được vào điểm năng lực");
            if (role != group.role()) throw new IllegalArgumentException("Role " + role + " không thuộc nhóm " + group);
            if (score < 0 || score > 100) throw new IllegalArgumentException("Điểm nhóm phải trong 0..100: " + score);
            if (reliability <= 0 || reliability > 1) throw new IllegalArgumentException("Độ tin cậy phải trong (0,1]: " + reliability);
            return new GroupEvidence(group, score, reliability);
        }

        public Group group() { return group; }
        public double score() { return score; }
        public double reliability() { return reliability; }
    }

    /** score = null và answerConfidence = 0 khi không có nhóm nào (KHÔNG phải 0 điểm). */
    public record CompetencyScore(String competency, Double score, double coverage, double answerConfidence) {}

    /**
     * @param displayed các nhóm được hiển thị/đo cho năng lực này (mẫu số của coverage); nhóm có dữ liệu luôn được coi là hiển thị
     * @param dataQualityFactor q_c (HIGH/MEDIUM/LOW/CONFLICTED) - chỉ ảnh hưởng độ chắc chắn, không ảnh hưởng điểm
     */
    public CompetencyScore score(String assessmentType, String competency, List<GroupEvidence> present, Set<Group> displayed,
                                 double dataQualityFactor, RuleParams params) {
        if (present.isEmpty()) return new CompetencyScore(competency, null, 0, 0);
        Set<Group> all = EnumSet.noneOf(Group.class);
        all.addAll(displayed);
        present.forEach(e -> all.add(e.group()));

        double num = 0, den = 0, wPresent = 0, wAll = 0, wrSum = 0;
        for (GroupEvidence e : present) {
            double w = params.groupWeight(assessmentType, competency, e.group().name());
            num += e.score() * w * e.reliability();
            den += w * e.reliability();
            wPresent += w;
            wrSum += w * e.reliability();
        }
        for (Group g : all) wAll += params.groupWeight(assessmentType, competency, g.name());
        if (den <= 0) throw new IllegalStateException("Tổng trọng số nhóm của " + competency + " bằng 0 - rule set không hợp lệ");

        double coverage = wAll <= 0 ? 0 : wPresent / wAll;
        double avgReliability = wrSum / wPresent;
        double confidence = clamp01(coverage * avgReliability * dataQualityFactor);
        return new CompetencyScore(competency, num / den, coverage, confidence);
    }

    /**
     * Điểm tổng = Σ W_c·S_c trên năng lực CÓ điểm, chia lại trọng số cho phần có dữ liệu ([LAR] §4.1, §6.3).
     * Trả null khi không có năng lực nào có điểm.
     */
    public Double overall(Map<String, Double> competencyScores, Collection<String> primaryCompetencies, RuleParams params) {
        double num = 0, den = 0;
        for (String c : primaryCompetencies) {
            Double s = competencyScores.get(c);
            if (s == null) continue;
            double w = params.require("overall.weight." + c);
            num += w * s;
            den += w;
        }
        return den == 0 ? null : num / den;
    }

    /**
     * r_i = reliability_class × form_factor × recency (mỗi hệ số ≤ 1; không bao giờ thưởng). Câu tuỳ chọn bị bỏ qua dùng hệ số
     * THẤP NHẤT đã cấu hình: chỉ hạ độ chắc chắn, KHÔNG đụng tới điểm (I19).
     */
    public double itemReliability(RuleParams p, String reliabilityClass, String formOption, String recencyOption) {
        double cls = Math.min(1, p.require("reliability_class." + reliabilityClass));
        double form = formOption == null ? p.minWithPrefix("form_factor.") : p.require("form_factor." + formOption);
        double rec = recencyOption == null ? p.minWithPrefix("recency.") : p.require("recency." + recencyOption);
        return clamp01(cls * Math.min(1, form) * Math.min(1, rec));
    }

    /** Độ tin cậy chỉ theo lớp câu hỏi (vd. mobility tự đánh giá = LOW), khi không có câu hình thức/thời gian đi kèm. */
    public double classReliability(RuleParams p, String reliabilityClass) {
        return clamp01(Math.min(1, p.require("reliability_class." + (reliabilityClass == null ? "LOW" : reliabilityClass))));
    }

    private static double clamp01(double v) { return Math.max(0, Math.min(1, v)); }
}
