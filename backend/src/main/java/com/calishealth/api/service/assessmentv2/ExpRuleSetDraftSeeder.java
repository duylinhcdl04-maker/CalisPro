package com.calishealth.api.service.assessmentv2;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Đưa tham số EXP chuyên cần (exp.*, attendance.*) vào một BẢN NHÁP của rule set V2, để đi đúng quy trình: Coach rà soát và chỉnh, gửi duyệt, Admin kích hoạt.
 * Rule set đang áp dụng KHÔNG bị sửa. Chỉ chạy khi bật rõ ràng app.seed.exp-rule-set-draft=true. Idempotent: đã có bản đang áp dụng hoặc bản nháp/chờ duyệt
 * chứa exp.enabled thì bỏ qua. Bản nháp không có tác giả (Coach đầu tiên sửa sẽ nhận bản này), nhật ký thay đổi ghi từng tham số thêm vào để Admin thấy.
 */
@Component
@ConditionalOnProperty(name = "app.seed.exp-rule-set-draft", havingValue = "true")
@Order(60)
public class ExpRuleSetDraftSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(ExpRuleSetDraftSeeder.class);
    static final String ACTOR = "Hệ thống (EXP chuyên cần)";
    static final String SOURCE_TYPE = "PRODUCT_RULE";
    static final String SOURCE_REF = "Quyết định sản phẩm: EXP chỉ là chuyên cần, không thay bài test và form; điểm cộng tối đa 3 và chỉ khi mọi cổng đã đạt.";

    /** Giá trị khởi điểm đã được chốt với chủ sản phẩm; Coach chỉnh được trong bản nháp. */
    static Map<String, Double> defaults() {
        Map<String, Double> p = new LinkedHashMap<>();
        p.put("exp.enabled", 1.0);
        p.put("exp.checkin", 10.0);
        p.put("exp.session", 40.0);
        p.put("exp.goodForm", 10.0);
        p.put("exp.goodForm.minAiShare", 0.6);
        p.put("exp.streak7", 30.0);
        p.put("exp.assessment", 50.0);
        p.put("attendance.windowDays", 28.0);
        p.put("attendance.targetExp", 500.0);
        p.put("attendance.minScore", 60.0);
        p.put("attendance.bonusMax", 3.0);
        return p;
    }

    private final JdbcTemplate jdbc;
    private final CoachRuleSetService ruleSets;
    private final RuleSetV2Loader loader;

    public ExpRuleSetDraftSeeder(JdbcTemplate jdbc, CoachRuleSetService ruleSets, RuleSetV2Loader loader) {
        this.jdbc = jdbc; this.ruleSets = ruleSets; this.loader = loader;
    }

    @Override
    public void run(String... args) {
        Long id = provision();
        if (id == null) log.info("Rule set EXP chuyên cần: bỏ qua (đã có tham số EXP hoặc chưa có rule set V2 đang áp dụng).");
        else log.info("Rule set EXP chuyên cần: đã tạo bản nháp #{} chứa tham số exp.*/attendance.*; chờ Coach rà soát, gửi duyệt và Admin kích hoạt.", id);
    }

    /** Trả về id bản nháp vừa tạo, hoặc null nếu không cần tạo. */
    Long provision() {
        long sourceId;
        try {
            sourceId = loader.configuredId();
        } catch (IllegalStateException e) {
            return null;
        }
        Integer has = jdbc.queryForObject("""
                SELECT COUNT(*) FROM engine_parameters ep JOIN rule_sets rs ON rs.id = ep.rule_set_id
                WHERE rs.code = ? AND ep.param_key = 'exp.enabled' AND rs.status IN ('ACTIVE', 'DRAFT', 'PENDING_REVIEW')""", Integer.class, CoachRuleSetService.CODE);
        if (has != null && has > 0) return null;
        List<Long> actors = jdbc.queryForList("SELECT id FROM users WHERE role IN ('COACH', 'ADMIN') AND status = 'ACTIVE' ORDER BY (role = 'COACH') DESC, id LIMIT 1", Long.class);
        if (actors.isEmpty()) return null;
        long actor = actors.get(0);

        long id = ruleSets.clone(actor, sourceId).summary().id();
        jdbc.update("UPDATE rule_sets SET author_id = NULL, created_by = ?, notes = ? WHERE id = ?", ACTOR,
                "Bản nháp thêm EXP chuyên cần (cổng chuyên cần và điểm cộng nhỏ). Coach xem lại tham số rồi gửi duyệt.", id);
        Timestamp now = Timestamp.from(Instant.now());
        defaults().forEach((k, v) -> {
            jdbc.update("INSERT INTO engine_parameters (rule_set_id, param_key, param_value, source_type, source_reference) VALUES (?, ?, ?, ?, ?)", id, k, v, SOURCE_TYPE, SOURCE_REF);
            jdbc.update("INSERT INTO rule_set_changes (rule_set_id, actor_id, target_type, target_key, old_value, new_value, created_at) VALUES (?, ?, 'PARAM', ?, NULL, ?, ?)", id, actor, k, String.valueOf(v), now);
        });
        return id;
    }
}
