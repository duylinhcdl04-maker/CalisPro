package com.calishealth.api.service.level;

import com.calishealth.api.repository.ProgramTemplateRepository;
import com.calishealth.api.service.level.ProgramTemplateSpecs.ExInfo;
import com.calishealth.api.service.level.ProgramTemplateSpecs.Spec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Nạp bộ giáo án mẫu theo level (ProgramTemplateSpecs) ở trạng thái NHÁP. Chỉ chạy khi bật rõ ràng app.seed.program-templates=true
 * (ghi dữ liệu, tách khỏi app.seed.enabled). Idempotent: giáo án đã có cùng tên (kể cả đã xuất bản hay lưu trữ) thì bỏ qua, không ghi đè.
 * Giáo án là bản nháp: Coach rà soát và chỉnh, Admin duyệt và xuất bản mới có hiệu lực với học viên.
 */
@Component
@ConditionalOnProperty(name = "app.seed.program-templates", havingValue = "true")
@Order(50)
public class ProgramTemplateSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(ProgramTemplateSeeder.class);
    static final String ACTOR = "Coach (giáo án mẫu theo level)";
    private static final Map<String, String> LEVEL_LABEL = Map.of("L0", "Foundation", "L1", "Beginner", "L2", "Intermediate", "L3", "Advanced", "L4", "Elite");
    private static final Map<String, String> CATEGORY = Map.of("PUSH", "Push", "PULL", "Pull", "CORE", "Core", "LEGS", "Legs", "SKILL", "Skill", "MOBILITY", "Mobility");

    private final AdminProgramTemplateService service;
    private final ProgramTemplateRepository templates;
    private final JdbcTemplate jdbc;

    public ProgramTemplateSeeder(AdminProgramTemplateService service, ProgramTemplateRepository templates, JdbcTemplate jdbc) {
        this.service = service; this.templates = templates; this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        Set<String> existing = new HashSet<>();
        templates.findAll().forEach(t -> existing.add(t.getName()));
        int created = 0, skipped = 0;
        for (Spec spec : ProgramTemplateSpecs.all()) {
            if (existing.contains(spec.name())) { skipped++; continue; }
            service.create(ProgramTemplateSpecs.toRequest(spec, this::info, LEVEL_LABEL), ACTOR);
            created++;
        }
        log.info("Giáo án mẫu: tạo {} bản nháp, bỏ qua {} bản đã có.", created, skipped);
    }

    /** Đọc bằng SQL để không phụ thuộc phiên Hibernate (seeder chạy ngoài giao dịch). */
    private ExInfo info(String code) {
        var rows = jdbc.queryForList("""
                SELECT e.id, e.name, c.code AS cat, e.difficulty_level, e.thumbnail_url FROM exercises e
                LEFT JOIN exercise_categories c ON c.id = e.category_id WHERE e.code = ?""", code);
        if (rows.isEmpty()) throw new IllegalStateException("Thư viện không có bài mã " + code);
        var r = rows.get(0);
        String cat = r.get("cat") == null ? "" : r.get("cat").toString();
        return new ExInfo(((Number) r.get("id")).longValue(), String.valueOf(r.get("name")), CATEGORY.getOrDefault(cat, "Skill"),
                r.get("difficulty_level") == null ? "Beginner" : r.get("difficulty_level").toString(), r.get("thumbnail_url") == null ? null : r.get("thumbnail_url").toString());
    }
}
