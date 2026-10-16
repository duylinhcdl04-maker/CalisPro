package com.calishealth.api.service.level;

import com.calishealth.api.dto.LevelEngineDtos.CoverageDto;
import com.calishealth.api.entity.ProgramTemplate;
import com.calishealth.api.repository.ProgramTemplateRepository;
import com.calishealth.api.service.EmailService;
import com.calishealth.api.entity.UserTrainingConstraints;
import com.calishealth.api.entity.WorkoutPlan;
import com.calishealth.api.entity.User;
import com.calishealth.api.entity.Role;
import com.calishealth.api.entity.UserStatus;
import com.calishealth.api.repository.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Bộ giáo án mẫu theo level, chạy trên DB test thật (seeder bật bằng app.seed.program-templates=true): đủ số bản nháp, mọi bản qua kiểm tra xuất bản
 * (bài tồn tại trong thư viện, cấu trúc đọc được), độ phủ có ở mọi level, và dọn sạch sau test.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/${V2_TEST_DB:calishealth_le_test}?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root", "spring.datasource.password=123456", "app.seed.enabled=false", "app.mail.log-only=true",
        "app.seed.program-templates=true"})
class ProgramTemplateSeedTest {
    @Autowired AdminProgramTemplateService service;
    @Autowired ProgramTemplateRepository repo;
    @Autowired ProgramTemplateSeeder seeder;
    @Autowired TrainingCycleService cycles;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;
    private final List<Long> testUsers = new java.util.ArrayList<>();
    @MockitoBean EmailService emailService;

    private List<ProgramTemplate> mine() {
        return repo.findAll().stream().filter(t -> ProgramTemplateSeeder.ACTOR.equals(t.getCreatedBy())).toList();
    }

    @AfterEach
    void cleanup() {
        for (Long u : testUsers) {
            jdbc.update("DELETE e FROM workout_plan_exercises e JOIN workout_plan_days d ON d.id = e.workout_plan_day_id JOIN workout_plans p ON p.id = d.workout_plan_id WHERE p.user_id = ?", u);
            jdbc.update("DELETE d FROM workout_plan_days d JOIN workout_plans p ON p.id = d.workout_plan_id WHERE p.user_id = ?", u);
            jdbc.update("DELETE FROM workout_plans WHERE user_id = ?", u);
            jdbc.update("DELETE FROM user_training_constraints WHERE user_id = ?", u);
            jdbc.update("DELETE FROM users WHERE id = ?", u);
        }
        testUsers.clear();
        repo.deleteAll(mine());
    }

    private long student(int days, int minutes, String equipmentJson) {
        User u = new User();
        u.setEmail("e2e-tpl+" + java.util.UUID.randomUUID() + "@example.test");
        u.setPasswordHash("x"); u.setRole(Role.USER); u.setStatus(UserStatus.ACTIVE); u.setEmailVerified(true);
        long id = users.save(u).getId();
        testUsers.add(id);
        UserTrainingConstraints c = new UserTrainingConstraints();
        c.setUserId(id); c.setDaysPerWeek(days); c.setSessionMinutes(minutes); c.setEquipmentJson(equipmentJson); c.setLimitationsJson("[]");
        cycles.saveConstraints(c);
        return id;
    }

    @Test
    void seededTemplatesArePublishable_coverEveryLevel_andStayDraftUntilApproved() {
        seeder.run();   // seeder đã chạy lúc khởi động; chạy lại cho chắc vì test khác có thể đã dọn (idempotent)
        List<ProgramTemplate> list = mine();
        assertEquals(ProgramTemplateSpecs.all().size(), list.size(), "mỗi giáo án mẫu được tạo đúng một lần");
        assertTrue(list.stream().allMatch(t -> ProgramTemplate.DRAFT.equals(t.getStatus())), "chỉ là bản nháp, Admin duyệt mới xuất bản");

        for (ProgramTemplate t : list) {
            // xuất bản chạy kiểm tra: có bài, bài tồn tại trong thư viện, cấu trúc đọc được, mỗi buổi đủ 4 phần và bài chính có bài AI đo được
            assertDoesNotThrow(() -> service.setStatus(t.getId(), ProgramTemplate.PUBLISHED), t.getName());
        }

        CoverageDto cov = service.coverage();
        Map<String, Integer> byLevel = new TreeMap<>();
        cov.cells().forEach(c -> { if (c.templateCount() > 0) byLevel.merge(c.level(), 1, Integer::sum); });
        for (String level : List.of("L0", "L1", "L2", "L3", "L4")) assertTrue(byLevel.getOrDefault(level, 0) > 0, "level " + level + " phải có ô được phủ");
        System.out.println("COVERAGE cells per level: " + byLevel + " of " + cov.goals().size() * cov.days().size() + " per level");
        list.forEach(t -> System.out.println("TEMPLATE " + t.getName() + " | " + t.getLevelMin() + "-" + t.getLevelMax() + " | days " + t.getDaysPerWeekMin() + "-" + t.getDaysPerWeekMax()
                + " | " + t.getSessionMinutes() + " min | " + t.getDurationWeeks() + " wk | deload " + t.getDeloadWeek() + " | eq " + t.getRequiredEquipment() + " | emphasis " + t.getEmphasisJson()));
    }

    @Test
    void engineUsesTheTemplatesForARealStudent_insteadOfTheFallbackSkeleton() {
        seeder.run();
        for (ProgramTemplate t : mine()) service.setStatus(t.getId(), ProgramTemplate.PUBLISHED);

        // Giáo án chỉ theo level: học viên L0 nhận một giáo án mẫu L0 (số buổi, thời lượng, dụng cụ khai báo không tham gia chọn)
        WorkoutPlan floor = cycles.generate(student(3, 30, "[]"), "TEST", null, null).plan();
        assertNotNull(floor.getProgramTemplateId(), "phải dùng giáo án mẫu, không phải khung dự phòng");
        assertNotEquals("FALLBACK_SKELETON", floor.getGenerationReason());
        assertEquals("L0", repo.findById(floor.getProgramTemplateId()).orElseThrow().getPrimaryLevel());
        assertEquals(4, floor.getDurationWeeks());
        assertTrue(jdbc.queryForObject("SELECT COUNT(*) FROM workout_plan_days WHERE workout_plan_id = ? AND week_number = 1 AND rest_day = 0", Integer.class, floor.getId()) >= 2, "dùng nguyên cấu trúc buổi của giáo án mẫu");

        // Khai báo khác (4 buổi, 40 phút, có xà đơn): vẫn chọn theo level L0, không bị loại mẫu nào
        WorkoutPlan bar = cycles.generate(student(4, 40, "[\"PULL_UP_BAR\"]"), "TEST", null, null).plan();
        assertNotNull(bar.getProgramTemplateId());
        int exercises = jdbc.queryForObject("SELECT COUNT(*) FROM workout_plan_exercises e JOIN workout_plan_days d ON d.id = e.workout_plan_day_id WHERE d.workout_plan_id = ?", Integer.class, bar.getId());
        assertTrue(exercises > 20, "chu kỳ 4 tuần phải có nhiều bài, thực tế " + exercises);
        System.out.println("CYCLE floor=" + floor.getName() + " | bar=" + bar.getName() + " | exercises(bar)=" + exercises);
    }

    @Test
    void seederIsIdempotent() {
        seeder.run();   // lần đầu: bổ sung nếu test trước đã dọn
        long before = mine().size();
        assertEquals(ProgramTemplateSpecs.all().size(), before);
        seeder.run();   // lần hai: đã có cùng tên thì bỏ qua, không tạo thêm
        assertEquals(before, mine().size());
    }
}
