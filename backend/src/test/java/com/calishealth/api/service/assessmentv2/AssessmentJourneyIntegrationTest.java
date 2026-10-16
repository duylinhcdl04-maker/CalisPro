package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import tools.jackson.databind.json.JsonMapper;

import java.sql.Connection;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/** Hành trình đánh giá (§42) trên MySQL thật: bước nào xong, bước nào làm tiếp, và chỉ nhắc chứ không ghi gì. */
class AssessmentJourneyIntegrationTest {
    private static JdbcTemplate jdbc;
    private static AssessmentSessionStore store;
    private static SafetyScreeningService screening;
    private static SafetyClearanceService clearance;
    private static LevelStateV2Service levelState;
    private static AssessmentJourneyService journey;
    private static RuleSetV2Loader loader;
    private final List<Long> users = new ArrayList<>();

    @BeforeAll
    static void connect() {
        String db = System.getProperty("V2_TEST_DB", "calishealth_le_test");
        SingleConnectionDataSource ds = new SingleConnectionDataSource("jdbc:mysql://localhost:3306/" + db
                + "?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true", "root", "123456", true);
        try (Connection c = ds.getConnection()) { c.isValid(2); } catch (Exception e) { Assumptions.abort("Không có MySQL test: " + e.getMessage()); }
        jdbc = new JdbcTemplate(ds);
        Integer ready = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'user_level_state_v2'", Integer.class);
        Assumptions.assumeTrue(ready != null && ready > 0, "Chưa chạy migration_assessment_v2_08 trên " + db);

        var json = JsonMapper.builder().build();
        AssessmentV2Settings settings = new AssessmentV2Settings(true, "LEVEL_ENGINE_V2", "CALISHEALTH_INITIAL_FW2", "CALISHEALTH_SAFETY_V1", 30, "1", "CALISHEALTH_PERIODIC_FW2");
        store = new AssessmentSessionStore(jdbc, json, settings);
        loader = new RuleSetV2Loader(jdbc, settings, json);
        SafetyStatusService status = new SafetyStatusService(jdbc, json, settings);
        screening = new SafetyScreeningService(store, new AnswerSupport(store), status, loader, settings, jdbc, json);
        clearance = new SafetyClearanceService(jdbc, json, status, new SafetyConfigLoader(jdbc, json), loader, settings);
        levelState = new LevelStateV2Service(jdbc);
        journey = new AssessmentJourneyService(jdbc, status, levelState, loader);
    }

    @AfterEach
    void cleanup() {
        for (Long u : users) {
            jdbc.update("DELETE FROM user_safety_flags WHERE user_id = ?", u);
            jdbc.update("DELETE FROM safety_acknowledgements WHERE user_id = ?", u);
            jdbc.update("DELETE FROM safety_clearances WHERE user_id = ?", u);
            jdbc.update("UPDATE user_safety_status SET supersedes_id = NULL WHERE user_id = ?", u);
            jdbc.update("DELETE FROM user_safety_status WHERE user_id = ?", u);
            jdbc.update("DELETE FROM level_decisions_v2 WHERE user_id = ?", u);
            jdbc.update("DELETE FROM user_level_state_v2 WHERE user_id = ?", u);
            jdbc.update("DELETE FROM assessment_sessions WHERE user_id = ?", u);
            jdbc.update("DELETE FROM users WHERE id = ?", u);
        }
        users.clear();
    }

    private long newUser() {
        String email = "v2journey+" + UUID.randomUUID() + "@example.test";
        jdbc.update("INSERT INTO users (email, password_hash, status, role, email_verified) VALUES (?, 'x', 'ACTIVE', 'USER', TRUE)", email);
        long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
        users.add(id);
        return id;
    }

    private void screen(long user, String... yes) {
        Map<String, Object> a = new LinkedHashMap<>();
        for (String q : List.of("SF_Q1_SUPERVISED", "SF_Q2_CHEST_ACTIVE", "SF_Q3_CHEST_REST", "SF_Q4_DIZZY", "SF_Q5_JOINT_BONE", "SF_Q6_MEDICATION", "SF_Q7_OTHER"))
            a.put(q, Arrays.asList(yes).contains(q) ? "YES" : "NO");
        a.put("SF_INJURY_REGIONS", List.of("NONE"));
        StartResponse s = screening.start(user);
        List<AnswerDto> list = new ArrayList<>();
        a.forEach((k, v) -> list.add(new AnswerDto(k, v)));
        screening.saveAnswers(user, s.sessionId(), list);
        screening.complete(user, s.sessionId());
    }

    private static Map<String, String> statuses(JourneyDto j) {
        Map<String, String> m = new LinkedHashMap<>();
        j.steps().forEach(s -> m.put(s.key(), s.status()));
        return m;
    }

    private static JourneyStepDto step(JourneyDto j, String key) { return j.steps().stream().filter(s -> s.key().equals(key)).findFirst().orElseThrow(); }

    @Test
    void aNewUser_mustScreenFirst_andEverythingElseIsLocked() {
        JourneyDto j = journey.journey(newUser());
        assertEquals(Map.of("SAFETY", "TODO", "INITIAL", "LOCKED", "BASELINE", "LOCKED", "PERIODIC", "LOCKED"), statuses(j));
        assertEquals("SAFETY", j.nextKey());
        assertEquals("/safety-screening", j.nextPath());
        assertEquals("SCREEN", step(j, "SAFETY").detail());
        assertFalse(j.complete());
    }

    @Test
    void afterAClearedScreening_theQuestionnaireIsNext() {
        long u = newUser();
        screen(u);
        JourneyDto j = journey.journey(u);
        assertEquals("DONE", step(j, "SAFETY").status());
        assertEquals("TODO", step(j, "INITIAL").status());
        assertEquals("LOCKED", step(j, "BASELINE").status());
        assertEquals("/assessment/initial", j.nextPath());
    }

    @Test
    void aRestrictedOrReviewStatus_needsAcknowledgementBeforeItCountsAsDone() {
        long u = newUser();
        screen(u, "SF_Q2_CHEST_ACTIVE");                       // REVIEW_REQUIRED
        JourneyDto before = journey.journey(u);
        assertEquals("TODO", step(before, "SAFETY").status());
        assertEquals("ACKNOWLEDGE", step(before, "SAFETY").detail());
        assertEquals("SAFETY", before.nextKey());

        clearance.acknowledge(u, null);
        JourneyDto after = journey.journey(u);
        assertEquals("DONE", step(after, "SAFETY").status(), "đã xác nhận đọc thì bước sàng lọc coi như xong (giới hạn vẫn giữ nguyên)");
        assertEquals("INITIAL", after.nextKey());
    }

    @Test
    void aCompletedQuestionnaire_unlocksTheBaseline() {
        long u = newUser();
        screen(u);
        long tpl = jdbc.queryForObject("SELECT id FROM assessment_templates WHERE code = 'CALISHEALTH_INITIAL_FW2'", Long.class);
        long type = jdbc.queryForObject("SELECT id FROM assessment_types WHERE code = 'INITIAL'", Long.class);
        jdbc.update("""
                INSERT INTO assessment_sessions (user_id, assessment_type_id, template_id, template_version, started_at, completed_at, status, version, created_at, purpose, source, execution_mode)
                VALUES (?, ?, ?, 1, NOW(6), NOW(6), 'COMPLETED', '1', NOW(6), 'INITIAL_V2', 'SELF_REPORTED', 'QUESTIONNAIRE')""", u, type, tpl);
        JourneyDto j = journey.journey(u);
        assertEquals("DONE", step(j, "INITIAL").status());
        assertEquals("TODO", step(j, "BASELINE").status());
        assertEquals("BASELINE", j.nextKey());
        assertEquals("LOCKED", step(j, "PERIODIC").status());
        assertFalse(j.complete());
    }

    @Test
    void aVerifiedLevel_completesTheJourney_andPeriodicWaitsUntilItIsDue() {
        long soon = newUser();
        screen(soon);
        levelState.upsert(soon, "L2", 2, "VERIFIED", "AI_MEASURED", 55.0, 0, null, Instant.now().minus(Duration.ofDays(2)));
        JourneyDto j = journey.journey(soon);
        assertEquals(Map.of("SAFETY", "DONE", "INITIAL", "DONE", "BASELINE", "DONE", "PERIODIC", "WAIT"), statuses(j));
        assertTrue(step(j, "PERIODIC").detail().startsWith("UNTIL:"));
        assertTrue(j.complete());
        assertNull(j.nextKey(), "chưa tới hạn đo định kỳ thì không có bước nào cần nhắc");

        long due = newUser();
        screen(due);
        levelState.upsert(due, "L2", 2, "VERIFIED", "AI_MEASURED", 55.0, 0, null, Instant.now().minus(Duration.ofDays(60)));
        JourneyDto d = journey.journey(due);
        assertEquals("TODO", step(d, "PERIODIC").status());
        assertEquals("PERIODIC", d.nextKey());
        assertEquals("/assessment/periodic", d.nextPath());
    }

    @Test
    void returningUsers_canMeasureAgainWithoutWaiting_andTheJourneyOnlyReads() {
        long u = newUser();
        screen(u);
        levelState.upsert(u, "L2", 2, "RETURNING", "AI_MEASURED", 55.0, 0, null, Instant.now().minus(Duration.ofDays(1)));
        assertEquals("TODO", step(journey.journey(u), "PERIODIC").status());
        int before = jdbc.queryForObject("SELECT COUNT(*) FROM level_decisions_v2 WHERE user_id = ?", Integer.class, u);
        journey.journey(u);
        assertEquals(before, jdbc.queryForObject("SELECT COUNT(*) FROM level_decisions_v2 WHERE user_id = ?", Integer.class, u));
    }
}
