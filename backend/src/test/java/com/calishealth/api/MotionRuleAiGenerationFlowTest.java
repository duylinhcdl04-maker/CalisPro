package com.calishealth.api;

import com.calishealth.api.dto.MotionDtos.*;
import com.calishealth.api.service.EmailService;
import com.calishealth.api.service.ai.GeminiClient;
import com.calishealth.api.service.motion.MotionRuleAiGeneratorService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tools.jackson.databind.ObjectMapper;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * AI soạn rule chấm form cho một động tác (Gemini được giả lập): rule hợp lệ và không trùng thành bản NHÁP nguồn AI_SUGGESTED;
 * rule trùng hoặc sai bị loại kèm lý do; AI không gửi duyệt, không bật dừng bài tập; chạy lại cùng đề xuất không tạo thêm.
 * Dọn dữ liệu: rule, mẫu phản hồi và nhật ký tạo ra đều bị xóa.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/${V2_TEST_DB:calishealth_le_test}?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root", "spring.datasource.password=123456", "app.seed.enabled=false", "app.mail.log-only=true"})
class MotionRuleAiGenerationFlowTest {
    private static final String ACTOR = "ai-gen-test@example.test";
    private static final String PREFIX = "AIGENTEST_";

    @Autowired MotionRuleAiGeneratorService service;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean GeminiClient gemini;
    @MockitoBean EmailService emailService;

    private long profileId;

    @BeforeEach
    void setUp() {
        List<Long> ids = jdbc.queryForList("""
                SELECT p.id FROM exercise_ai_profiles p JOIN exercises e ON e.id = p.exercise_id
                WHERE e.code = 'push-up' AND p.camera_view IS NOT NULL AND p.rep_metric_json IS NOT NULL LIMIT 1""", Long.class);
        Assumptions.assumeTrue(!ids.isEmpty(), "DB scratch chưa có profile push-up đã cấu hình");
        profileId = ids.get(0);
        when(gemini.isConfigured()).thenReturn(true);
        when(gemini.objectMapper()).thenReturn(new ObjectMapper());
    }

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE t FROM motion_rule_thresholds t JOIN ai_motion_rules r ON r.id = t.rule_id WHERE r.rule_code LIKE ?", PREFIX + "%");
        jdbc.update("DELETE FROM ai_motion_rules WHERE rule_code LIKE ?", PREFIX + "%");
        jdbc.update("DELETE FROM motion_feedback_templates WHERE feedback_code LIKE ?", PREFIX + "%");
        jdbc.update("DELETE FROM ai_configuration_audit_logs WHERE user_email = ?", ACTOR);
    }

    private static String rule(String code, String name, String metric, String points, String operator, String min, String max, String extra) {
        return """
                {"code":"%s","name":"%s","description":"mô tả","phase":"ALL","metricType":"%s",
                 "measurement":{"points":%s},"unit":"DEGREE","operator":"%s","normalMin":%s,"normalMax":%s,
                 "bands":[%s],
                 "severity":"WARNING","priority":6,"persistenceType":"FRAME","persistenceValue":5,"cooldownMs":4000,
                 "feedbackCode":"%sFB","feedback":{"uiText":"Giữ hông thẳng hàng","voiceText":"Siết bụng, giữ hông thẳng."},
                 "rationale":"vì sao"%s}
                """.formatted(code, name, metric, points, operator, min, max, band(min, max), code, extra == null ? "" : "," + extra);
    }

    /** Dải cảnh báo nằm ngoài vùng chuẩn: dưới Normal Min (rule "≥") hoặc trên Normal Max (rule "≤"). */
    private static String band(String min, String max) {
        if (!"null".equals(min)) return "{\"severity\":\"WARNING\",\"min\":null,\"max\":" + min + ",\"minInclusive\":true,\"maxInclusive\":false}";
        return "{\"severity\":\"WARNING\",\"min\":" + max + ",\"max\":null,\"minInclusive\":false,\"maxInclusive\":true}";
    }

    private void aiReturns(String... rules) {
        when(gemini.generateJson(anyString(), anyDouble(), anyInt())).thenReturn(Optional.of("{\"rules\":[" + String.join(",", rules) + "]}"));
    }

    private int count(String sql, Object... args) { return jdbc.queryForObject(sql, Integer.class, args); }

    @Test
    void validNewRulesAreSavedAsDraftsNeverSubmittedOrPublished_andSafetyLimitsAreForced() throws Exception {
        // AI đòi dừng bài tập và đặt cooldown quá lớn: hệ thống phải ép về giới hạn an toàn
        aiReturns(rule(PREFIX + "HIP", "Hông võng AI test", "ANGLE_3_POINT", "[24,26,28]", "MINIMUM_REQUIRED", "150", "null", "\"stopExercise\":true,\"cooldownMs\":999999"));
        GenerateRulesResponse r = service.generate(profileId, new GenerateRulesRequest(3, null), ACTOR);

        assertTrue(r.aiAvailable());
        assertEquals(1, r.created(), r.outcomes().toString());
        Map<String, Object> row = jdbc.queryForMap("SELECT status, source_type, stop_exercise, cooldown_ms, created_by, submitted_by FROM ai_motion_rules WHERE rule_code = ?", PREFIX + "HIP");
        assertEquals("DRAFT", row.get("status"), "AI chỉ tạo bản nháp");
        assertEquals("AI_SUGGESTED", row.get("source_type"));
        assertEquals(false, ((Boolean) row.get("stop_exercise")), "AI không được bật dừng bài tập");
        assertEquals(30000L, ((Number) row.get("cooldown_ms")).longValue(), "cooldown bị kẹp về tối đa");
        assertEquals(ACTOR, row.get("created_by"));
        assertNull(row.get("submitted_by"), "AI không gửi duyệt");
        assertEquals(1, count("SELECT COUNT(*) FROM motion_feedback_templates WHERE feedback_code = ?", PREFIX + "HIPFB"), "mã phản hồi mới được tạo kèm");
        assertEquals(1, count("SELECT COUNT(*) FROM ai_configuration_audit_logs WHERE user_email = ? AND action = 'AI_GENERATE'", ACTOR));
    }

    @Test
    void duplicatesAreSkippedWithAReason_withinTheBatchAndAgainstExistingRules() throws Exception {
        String first = rule(PREFIX + "A", "Hông A", "ANGLE_3_POINT", "[24,26,28]", "MINIMUM_REQUIRED", "150", "null", null);
        String sameCode = rule(PREFIX + "A", "Tên khác hẳn", "ANGLE_3_POINT", "[23,25,27]", "MINIMUM_REQUIRED", "150", "null", null);
        String sameName = rule(PREFIX + "B", "hong a", "ANGLE_3_POINT", "[23,25,27]", "MINIMUM_REQUIRED", "150", "null", null);
        String sameMeasurement = rule(PREFIX + "C", "Hông C", "ANGLE_3_POINT", "[28,26,24]", "MINIMUM_REQUIRED", "145", "null", null);    // đảo hai đầu, vùng ≥145 chồng ≥150
        String otherRange = rule(PREFIX + "D", "Hông D", "ANGLE_3_POINT", "[24,26,28]", "MAXIMUM_ALLOWED", "null", "100", null);          // cùng góc nhưng vùng ≤100 khác hẳn
        aiReturns(first, sameCode, sameName, sameMeasurement, otherRange);
        GenerateRulesResponse r = service.generate(profileId, new GenerateRulesRequest(8, null), ACTOR);

        Map<String, String> status = new LinkedHashMap<>();
        r.outcomes().forEach(o -> status.put(o.code() + "|" + o.name(), o.status()));
        assertEquals(2, r.created(), status.toString());
        assertEquals(3, r.duplicates(), status.toString());
        assertEquals("CREATED", status.get(PREFIX + "A|Hông A"));
        assertEquals("CREATED", status.get(PREFIX + "D|Hông D"), "cùng điểm khớp nhưng vùng chuẩn không chồng: không trùng");
        assertEquals("DUPLICATE", status.get(PREFIX + "A|Tên khác hẳn"));
        assertEquals("DUPLICATE", status.get(PREFIX + "B|hong a"));
        assertEquals("DUPLICATE", status.get(PREFIX + "C|Hông C"));
        r.outcomes().stream().filter(o -> "DUPLICATE".equals(o.status())).forEach(o -> assertFalse(o.reason() == null || o.reason().isBlank()));

        // Lần sau AI đề xuất lại đúng các rule đó: không tạo thêm gì
        GenerateRulesResponse again = service.generate(profileId, new GenerateRulesRequest(8, null), ACTOR);
        assertEquals(0, again.created(), again.outcomes().toString());
        assertEquals(5, again.duplicates());
        assertEquals(2, count("SELECT COUNT(*) FROM ai_motion_rules WHERE rule_code LIKE ?", PREFIX + "%"));
    }

    @Test
    void invalidRulesAreRejectedWithTheEngineValidationMessages() throws Exception {
        String badLandmark = rule(PREFIX + "X", "Điểm khớp sai", "ANGLE_3_POINT", "[11,13,99]", "MINIMUM_REQUIRED", "150", "null", null);
        String badOperator = rule(PREFIX + "Y", "Toán tử sai", "ANGLE_3_POINT", "[24,26,28]", "EQUAL", "null", "null", null);
        String badMetric = rule(PREFIX + "Z", "Chỉ số lạ", "MAGIC_METRIC", "[24,26,28]", "MINIMUM_REQUIRED", "150", "null", null);
        aiReturns(badLandmark, badOperator, badMetric);
        GenerateRulesResponse r = service.generate(profileId, new GenerateRulesRequest(8, null), ACTOR);

        assertEquals(0, r.created());
        assertEquals(3, r.invalid(), r.outcomes().toString());
        r.outcomes().forEach(o -> assertFalse(o.errors().isEmpty(), o.name()));
        assertTrue(r.outcomes().get(0).errors().stream().anyMatch(e -> e.contains("99")), "báo điểm khớp ngoài 0-32");
        assertEquals(0, count("SELECT COUNT(*) FROM ai_motion_rules WHERE rule_code LIKE ?", PREFIX + "%"), "rule sai không được lưu");
        assertEquals(0, count("SELECT COUNT(*) FROM motion_feedback_templates WHERE feedback_code LIKE ?", PREFIX + "%"), "rule sai không để lại mẫu phản hồi");
    }

    @Test
    void theRequestedCountIsAnUpperBound() throws Exception {
        aiReturns(rule(PREFIX + "P1", "Rule P1", "ANGLE_3_POINT", "[24,26,28]", "MINIMUM_REQUIRED", "150", "null", null),
                rule(PREFIX + "P2", "Rule P2", "ANGLE_3_POINT", "[23,25,27]", "MINIMUM_REQUIRED", "150", "null", null),
                rule(PREFIX + "P3", "Rule P3", "ANGLE_3_POINT", "[12,24,26]", "MINIMUM_REQUIRED", "150", "null", null));
        assertEquals(2, service.generate(profileId, new GenerateRulesRequest(2, null), ACTOR).created(), "AI trả thừa thì chỉ nhận đúng số yêu cầu");
    }

    @Test
    void aiUnavailableCreatesNothingAndSaysSo() throws Exception {
        when(gemini.generateJson(anyString(), anyDouble(), anyInt())).thenReturn(Optional.empty());
        GenerateRulesResponse r = service.generate(profileId, new GenerateRulesRequest(3, null), ACTOR);
        assertFalse(r.aiAvailable());
        assertEquals(0, r.created());
        assertFalse(r.message().isBlank());

        when(gemini.isConfigured()).thenReturn(false);
        GenerateRulesResponse noKey = service.generate(profileId, null, ACTOR);
        assertFalse(noKey.aiAvailable());
        assertTrue(noKey.message().contains("GEMINI_API_KEY"));
    }

    @Test
    void promptIsFilledWithTheExerciseAndTheRulesItAlreadyHas() throws Exception {
        PromptPreviewDto p = service.preview(profileId, new GenerateRulesRequest(4, "an toàn khớp vai"));
        assertFalse(p.prompt().contains("{{"), "mọi chỗ trống phải được điền");
        assertTrue(p.prompt().contains("Push-Up") || p.prompt().toLowerCase().contains("push"), "có tên bài");
        assertTrue(p.prompt().contains("an toàn khớp vai"), "có trọng tâm người dùng nhập");
        assertTrue(p.prompt().contains("TỐI ĐA 4 rule"));
        assertTrue(p.prompt().contains("ANGLE_3_POINT") && p.prompt().contains("LEFT_SHOULDER"), "có danh mục chỉ số và điểm khớp");
        String existing = jdbc.queryForObject("SELECT rule_code FROM ai_motion_rules WHERE ai_profile_id = ? AND status <> 'ARCHIVED' LIMIT 1", String.class, profileId);
        assertTrue(p.prompt().contains(existing), "liệt kê rule đã có để AI không lặp lại");
    }
}
