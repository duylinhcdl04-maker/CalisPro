package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.service.assessmentv2.BaselineEvidenceBuilder.TestItem;

import java.util.*;

/**
 * Bộ bài của MỘT lần Periodic thường kỳ (hàm thuần, ASSESSMENT_FRAMEWORK_V2 §34.2). Mỗi bài đo MỘT attempt (Stability lấy từ lịch sử, không từ attempt lặp).
 * Level đích T = min(current + 1, 4). Một bài thuộc bộ khi liên quan tới level hiện tại hoặc level đích VÀ thuộc một trong:
 *  - bài bắt buộc của template;
 *  - bài mang yêu cầu Performance/Skill của level hiện tại hoặc level đích;
 *  - bài đo góc của năng lực chỉ đo được bằng góc (MOBILITY) khi level hiện tại hoặc đích yêu cầu năng lực đó.
 */
public final class PeriodicTestPlan {
    private PeriodicTestPlan() {}

    public static int targetRank(int currentRank) { return Math.min(currentRank + 1, 4); }

    public static List<TestItem> select(RuleSetV2 rs, List<TestItem> items, int currentRank) {
        int target = targetRank(currentRank);
        Set<String> required = new HashSet<>();
        required.addAll(BaselineEvidenceBuilder.requirementTests(rs, currentRank));
        required.addAll(BaselineEvidenceBuilder.requirementTests(rs, target));
        Set<String> requiredCompetencies = new HashSet<>();
        for (int rank : new int[]{currentRank, target}) rs.level(rank).competencyReqs().forEach(c -> requiredCompetencies.add(c.competency()));

        List<TestItem> out = new ArrayList<>();
        for (TestItem it : items) {
            boolean relevant = it.levelMin() <= target && it.levelMax() >= currentRank;
            boolean needed = it.mandatory() || required.contains(it.exercise())
                    || (BaselineEvidenceBuilder.isAngleCompetency(rs, it) && requiredCompetencies.contains(it.competency()));
            if (relevant && needed) out.add(it);
        }
        // Bài NỀN: stage thấp nhất đo được của mỗi ladder mà năng lực level hiện tại yêu cầu. Ladder chỉ cho điểm 0 khi nấc thấp nhất có bằng chứng "không đạt" tường minh;
        // thiếu bài nền thì người yếu đi chỉ nhận điểm null (chưa kết luận được) và hệ thống không bao giờ phát hiện được suy giảm.
        Set<String> currentCompetencies = new HashSet<>();
        rs.level(currentRank).competencyReqs().forEach(c -> currentCompetencies.add(c.competency()));
        for (var ladder : rs.ladders()) {
            if (!currentCompetencies.contains(ladder.competency())) continue;
            ladder.stages().stream().sorted(Comparator.comparingInt(s -> s.rank()))
                    .map(s -> items.stream().filter(i -> i.exercise().equals(s.code())).findFirst()).flatMap(Optional::stream).findFirst()
                    .ifPresent(floor -> { if (out.stream().noneMatch(i -> i.exercise().equals(floor.exercise()))) out.add(floor); });
        }
        out.sort(Comparator.comparingInt(TestItem::sortOrder));
        return out;
    }
}
