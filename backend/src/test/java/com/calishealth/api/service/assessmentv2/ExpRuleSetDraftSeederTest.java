package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.RuleSetGovernanceDtos.*;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

import java.sql.Connection;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tham số EXP chuyên cần đi vào một BẢN NHÁP của rule set (đúng quy trình Coach soạn, Admin duyệt), không sửa rule set đang áp dụng.
 * Validator giữ điểm cộng chuyên cần dưới trần để EXP không thay được bài test và form.
 */
class ExpRuleSetDraftSeederTest {
    private static JdbcTemplate jdbc;
    private static TransactionTemplate tx;
    private static CoachRuleSetService service;
    private static ExpRuleSetDraftSeeder seeder;
    private static long seedId;
    private final List<Long> users = new ArrayList<>();

    @BeforeAll
    static void connect() {
        String db = System.getProperty("V2_TEST_DB", "calishealth_le_test");
        SingleConnectionDataSource ds = new SingleConnectionDataSource("jdbc:mysql://localhost:3306/" + db
                + "?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true", "root", "123456", true);
        try (Connection c = ds.getConnection()) { c.isValid(2); } catch (Exception e) { Assumptions.abort("Không có MySQL test: " + e.getMessage()); }
        jdbc = new JdbcTemplate(ds);
        Integer ready = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'rule_set_changes'", Integer.class);
        Assumptions.assumeTrue(ready != null && ready > 0, "Chưa chạy migration_assessment_v2_07 trên " + db);
        tx = new TransactionTemplate(new DataSourceTransactionManager(ds));
        service = new CoachRuleSetService(jdbc);
        var json = JsonMapper.builder().build();
        RuleSetV2Loader loader = new RuleSetV2Loader(jdbc, new AssessmentV2Settings(true, "LEVEL_ENGINE_V2", "CALISHEALTH_INITIAL_FW2", "CALISHEALTH_SAFETY_V1", 30, "1", "CALISHEALTH_PERIODIC_FW2"), json);
        seeder = new ExpRuleSetDraftSeeder(jdbc, service, loader);
        seedId = jdbc.queryForObject("SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND version = 1", Long.class);
    }

    @AfterEach
    void cleanup() {
        for (Long id : jdbc.queryForList("SELECT id FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND version > 1", Long.class)) {
            jdbc.update("DELETE FROM rule_set_changes WHERE rule_set_id = ?", id);
            jdbc.update("DELETE FROM rule_set_reviews WHERE rule_set_id = ?", id);
            jdbc.update("DELETE r FROM level_requirements r JOIN fitness_levels f ON f.id = r.level_id WHERE f.rule_set_id = ?", id);
            jdbc.update("DELETE FROM fitness_levels WHERE rule_set_id = ?", id);
            jdbc.update("DELETE p FROM progression_stage_prerequisites p JOIN progression_stages s ON s.id = p.stage_id JOIN progression_ladders l ON l.id = s.ladder_id WHERE l.rule_set_id = ?", id);
            jdbc.update("DELETE s FROM progression_stages s JOIN progression_ladders l ON l.id = s.ladder_id WHERE l.rule_set_id = ?", id);
            for (String t : List.of("progression_ladders", "engine_parameters", "consistency_rules", "safety_flag_constraints", "safety_clearance_rules", "safety_policies", "safety_rules", "safety_flag_defs"))
                jdbc.update("DELETE FROM " + t + " WHERE rule_set_id = ?", id);
            jdbc.update("DELETE FROM rule_sets WHERE id = ?", id);
        }
        for (Long u : users) jdbc.update("DELETE FROM users WHERE id = ?", u);
        users.clear();
    }

    private long coach() {
        String email = "v2coach+" + UUID.randomUUID() + "@example.test";
        jdbc.update("INSERT INTO users (email, password_hash, status, role, email_verified) VALUES (?, 'x', 'ACTIVE', 'COACH', TRUE)", email);
        long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
        users.add(id);
        return id;
    }

    private static UpdateRuleSetRequest params(ParamUpdate... p) { return new UpdateRuleSetRequest(null, List.of(p), null, null); }

    @Test
    void provisionCreatesADraftWithExpParams_andLeavesTheCurrentRuleSetUntouched() {
        coach();
        long before = jdbc.queryForObject("SELECT COUNT(*) FROM engine_parameters WHERE rule_set_id = ?", Long.class, seedId);
        Long id = tx.execute(st -> seeder.provision());
        assertNotNull(id);

        assertEquals("DRAFT", jdbc.queryForObject("SELECT status FROM rule_sets WHERE id = ?", String.class, id));
        assertNull(jdbc.queryForObject("SELECT author_id FROM rule_sets WHERE id = ?", Long.class, id), "chưa có tác giả: Coach đầu tiên sửa sẽ nhận bản nháp");
        for (var e : ExpRuleSetDraftSeeder.defaults().entrySet())
            assertEquals(e.getValue(), jdbc.queryForObject("SELECT param_value FROM engine_parameters WHERE rule_set_id = ? AND param_key = ?", Double.class, id, e.getKey()), e.getKey());
        assertEquals(ExpRuleSetDraftSeeder.defaults().size(),
                jdbc.queryForObject("SELECT COUNT(*) FROM rule_set_changes WHERE rule_set_id = ? AND target_type = 'PARAM'", Integer.class, id), "mỗi tham số thêm đều có nhật ký để Admin xem");
        assertTrue(service.validate(id).isEmpty(), "bản nháp hợp lệ: " + service.validate(id));
        assertEquals(before, jdbc.queryForObject("SELECT COUNT(*) FROM engine_parameters WHERE rule_set_id = ?", Long.class, seedId));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM engine_parameters WHERE rule_set_id = ? AND param_key LIKE 'exp.%'", Integer.class, seedId), "rule set nguồn không bị sửa");
    }

    @Test
    void provisionIsIdempotent() {
        coach();
        assertNotNull(tx.execute(st -> seeder.provision()));
        assertNull(tx.execute(st -> seeder.provision()), "đã có bản nháp chứa exp.enabled thì không tạo thêm");
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM rule_sets WHERE code = 'LEVEL_ENGINE_V2' AND version > 1", Integer.class));
    }

    @Test
    void coachCanTuneTheParamsButNotLetAttendanceOverrideTheTests() {
        long coach = coach();
        long id = tx.execute(st -> seeder.provision());
        tx.execute(st -> service.update(coach, id, params(new ParamUpdate("exp.session", 45.0, null, null, null))));
        assertEquals(45.0, jdbc.queryForObject("SELECT param_value FROM engine_parameters WHERE rule_set_id = ? AND param_key = 'exp.session'", Double.class, id));

        var ex = assertThrows(IllegalArgumentException.class, () -> tx.execute(st -> service.update(coach, id, params(new ParamUpdate("attendance.bonusMax", 6.0, null, null, null)))));
        assertTrue(ex.getMessage().contains("attendance.bonusMax"), ex.getMessage());
        assertEquals(3.0, jdbc.queryForObject("SELECT param_value FROM engine_parameters WHERE rule_set_id = ? AND param_key = 'attendance.bonusMax'", Double.class, id), "yêu cầu sai bị hoàn tác");
        assertThrows(IllegalArgumentException.class, () -> tx.execute(st -> service.update(coach, id, params(new ParamUpdate("attendance.minScore", 120.0, null, null, null)))));
    }
}
