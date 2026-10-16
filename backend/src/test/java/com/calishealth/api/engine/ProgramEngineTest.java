package com.calishealth.api.engine;

import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.program.ProgramEngine;
import com.calishealth.api.engine.program.ProgramModels.*;
import com.calishealth.api.engine.skill.SkillEngine;
import com.calishealth.api.engine.skill.SkillEngine.NodeProgress;
import com.calishealth.api.engine.skill.SkillGraph;
import org.junit.jupiter.api.Test;

import java.util.*;

import static com.calishealth.api.engine.TestRuleSets.id;
import static org.junit.jupiter.api.Assertions.*;

class ProgramEngineTest {
    private final RuleSetConfig rs = TestRuleSets.defaults();
    private final SkillGraph graph = TestRuleSets.graph();

    /** Chọn mẫu chỉ theo level và điểm năng lực từ đánh giá: mục tiêu, số buổi, thời lượng, dụng cụ không tham gia. */
    @Test
    void example1_templateMatching() {
        TemplateCandidate pull = new TemplateCandidate(1L, "L1_FULLBODY_3D_PULL_FOUNDATION", 1, "Pull foundation", 0, 1, 1,
                List.of("FIRST_PULL_UP", "GENERAL_FITNESS"), 3, 3, 45, Set.of("PULL_UP_BAR"),
                Map.of("PUSH", 0.25, "PULL", 0.40, "LEGS", 0.10, "CORE", 0.20, "SKILL", 0.05), 0);
        TemplateCandidate general = new TemplateCandidate(2L, "L1_FULLBODY_3D_GENERAL", 1, "General", 1, 1, 1,
                List.of("GENERAL_FITNESS"), 3, 3, 45, Set.of(),
                Map.of("PUSH", 0.2, "PULL", 0.2, "LEGS", 0.2, "CORE", 0.2, "MOBILITY", 0.1, "SKILL", 0.1), 0);
        TemplateCandidate tooLong = new TemplateCandidate(3L, "L1_LONG", 1, "Long", 1, 1, 1, List.of("FIRST_PULL_UP"), 3, 3, 90,
                Set.of(), Map.of("PULL", 1.0), 0);
        MatchProfile u = new MatchProfile(1, "FIRST_PULL_UP", "SKILL", List.of(), 3, 45, Set.of("PULL_UP_BAR"),
                Map.of("PUSH", 35.0, "PULL", 27.5, "LEGS", 35.0, "CORE", 25.0, "MOBILITY", 50.0, "SKILL", 0.0), List.of());

        MatchResult r = ProgramEngine.match(rs, List.of(general, pull, tooLong), u);
        assertEquals("L1_FULLBODY_3D_GENERAL", r.best().orElseThrow().template().code());   // WeaknessFit cao hơn; GoalFit không còn tác dụng
        assertEquals(0.536, r.ranked().get(0).score());
        assertEquals(0.931, r.ranked().get(0).breakdown().get("weaknessFit"));
        assertFalse(r.ranked().get(0).breakdown().containsKey("goalFit"));
        assertEquals(3, r.ranked().size());
        assertTrue(r.rejected().isEmpty());
    }

    @Test
    void equipmentDaysAndMinutes_doNotRejectTemplates() {
        TemplateCandidate t = new TemplateCandidate(1L, "BAR", 1, "Bar", 0, 4, 1, List.of(), 2, 6, 45, Set.of("PULL_UP_BAR"), Map.of(), 0);
        MatchProfile u = new MatchProfile(1, null, null, List.of(), 3, 45, Set.of(), Map.of(), List.of());
        assertEquals(1, ProgramEngine.match(rs, List.of(t), u).ranked().size());
        TemplateCandidate otherLevel = new TemplateCandidate(2L, "L3", 1, "L3", 3, 4, 3, List.of(), 2, 6, 45, Set.of(), Map.of(), 0);
        assertTrue(ProgramEngine.match(rs, List.of(otherLevel), u).ranked().isEmpty(), "level vẫn là điều kiện duy nhất");
    }

    /** Slot "pull-up" của giáo án mẫu được điều chỉnh về nấc người dùng đang luyện (negative pull-up). */
    @Test
    void slotFilling_adaptsExerciseToUserProgression() {
        Map<Long, NodeProgress> progress = new HashMap<>();
        for (String c : List.of("dead-hang", "scapular-pull-up", "australian-pull-up")) {
            progress.put(id(c), new NodeProgress(id(c), SkillEngine.ACHIEVED_SELF_REPORTED, 20.0, null, 0));
        }
        Map<Long, String> statuses = SkillEngine.statuses(graph, progress, Set.of());
        assertEquals(SkillEngine.READY, statuses.get(id("negative-pull-up")));
        assertEquals(SkillEngine.LOCKED, statuses.get(id("pull-up")));

        var ctx = new ProgramEngine.SlotContext(graph, statuses, x -> true, Set.of(), Set.of(id("negative-pull-up"), id("pull-up")),
                Map.of(id("negative-pull-up"), 1.0), Map.of("PULL", 27.5), x -> rs.ladderNode(x).map(ladderNode -> ladderNode.competency()).orElse(null));
        var sel = ProgramEngine.pick(rs, ctx, id("pull-up"), "MAIN", false);
        assertEquals(id("negative-pull-up"), sel.exerciseId(), sel.reason());

        var locked = ProgramEngine.pick(rs, ctx, id("pull-up"), "MAIN", true);
        assertEquals(id("pull-up"), locked.exerciseId());
    }

    /** 15 push-up mở dips/pike (ngưỡng 15) nhưng CHƯA mở pseudo-planche (ngưỡng riêng 25 rep). */
    @Test
    void edgeSpecificThreshold_keepsHarderBranchLocked() {
        Map<Long, NodeProgress> progress = new HashMap<>();
        progress.put(id("incline-push-up"), new NodeProgress(id("incline-push-up"), SkillEngine.ACHIEVED_SELF_REPORTED, null, null, 0));
        progress.put(id("push-up"), new NodeProgress(id("push-up"), SkillEngine.ACHIEVED_SELF_REPORTED, 15.0, null, 0));
        Map<Long, String> s = SkillEngine.statuses(graph, progress, Set.of());
        assertEquals(SkillEngine.READY, s.get(id("dips")));
        assertEquals(SkillEngine.READY, s.get(id("pike-push-up")));
        assertEquals(SkillEngine.LOCKED, s.get(id("pseudo-planche-push-up")));
        assertEquals(SkillEngine.LOCKED, s.get(id("archer-push-up")));
    }

    @Test
    void skillPerformance_requiresQualifyingSessionsWithGoodForm() {
        var c = SkillEngine.criteria(rs, graph, id("pull-up"));
        assertEquals(5, c.value());  // làm chủ pull-up = đủ mở chest-to-bar (5 rep)
        var first = SkillEngine.recordPerformance(null, c, 6, 80.0, "AI_MEASURED");
        assertEquals(SkillEngine.LOCKED, first.status());
        var second = SkillEngine.recordPerformance(new NodeProgress(id("pull-up"), first.status(), first.bestValue(), first.bestFormScore(),
                first.qualifyingSessions()), c, 5, 77.0, "AI_MEASURED");
        assertEquals(SkillEngine.ACHIEVED, second.status());
        var badForm = SkillEngine.recordPerformance(null, c, 12, 60.0, "AI_MEASURED");
        assertEquals(0, badForm.qualifyingSessions());
        assertEquals(SkillEngine.ACHIEVED_SELF_REPORTED, SkillEngine.recordPerformance(null, c, 10, null, "SELF_REPORTED").status());
    }

    @Test
    void volumeGuard_capsWeeklySetsAndSessionDuration() {
        List<PlannedDay> days = new ArrayList<>();
        for (int d = 1; d <= 3; d++) {
            PlannedDay day = new PlannedDay();
            day.weekNumber = 1; day.dayIndex = d; day.name = "Ngày " + d;
            day.exercises.add(ex("PULL", "MAIN", 5));
            day.exercises.add(ex("PULL", "ACCESSORY", 4));
            day.exercises.add(ex("PUSH", "MAIN", 3));
            days.add(day);
        }
        ProgramEngine.enforceVolume(rs, days, "L1", "PULL", 45, 1, 0.6);
        int pullSets = days.stream().flatMap(d -> d.exercises.stream()).filter(e -> "PULL".equals(e.competency)).mapToInt(e -> e.sets).sum();
        assertTrue(pullSets <= 10, "PULL sets/tuần phải ≤ trần L1 (10), thực tế " + pullSets);
        for (PlannedDay d : days) assertTrue(d.estimatedMinutes <= 45 || d.exercises.size() <= 2, "Buổi " + d.name + " = " + d.estimatedMinutes);
    }

    private PlannedExercise ex(String comp, String section, int sets) {
        PlannedExercise e = new PlannedExercise();
        e.exerciseId = 1L; e.competency = comp; e.section = section; e.sets = sets; e.repMin = 6; e.repMax = 10; e.restSec = 90;
        return e;
    }
}
