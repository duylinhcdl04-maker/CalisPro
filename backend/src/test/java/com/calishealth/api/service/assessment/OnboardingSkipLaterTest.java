package com.calishealth.api.service.assessment;

import com.calishealth.api.dto.AssessmentTemplateDtos.SubmitOnboardingRequest;
import com.calishealth.api.dto.LevelEngineDtos.UpdateConstraintsRequest;
import com.calishealth.api.entity.Role;
import com.calishealth.api.entity.User;
import com.calishealth.api.entity.UserStatus;
import com.calishealth.api.repository.UserRepository;
import com.calishealth.api.service.EmailService;
import com.calishealth.api.service.level.FitnessStateService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * "Bỏ qua" bài test đầu vào chỉ là hoãn: người đã bỏ qua vẫn nộp bài được sau đó, chưa có level thì chưa tạo chu kỳ theo level,
 * nhưng vẫn lưu được ràng buộc lịch tập. Chạy trên DB test (tạm tắt "bắt buộc" rồi khôi phục).
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/${V2_TEST_DB:calishealth_le_test}?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root", "spring.datasource.password=123456", "app.seed.enabled=false", "app.mail.log-only=true"})
class OnboardingSkipLaterTest {
    @Autowired OnboardingAssessmentService onboarding;
    @Autowired FitnessStateService fitness;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean EmailService emailService;

    @Test
    void skippedUserCanStillTakeTheTestLater_andHasNoLevelUntilThen() {
        Integer mandatory = jdbc.queryForObject("SELECT mandatory FROM assessment_onboarding_settings WHERE id = 1", Integer.class);
        String templateId = String.valueOf(jdbc.queryForObject("SELECT active_template_id FROM assessment_onboarding_settings WHERE id = 1", Long.class));
        jdbc.update("UPDATE assessment_onboarding_settings SET mandatory = 0 WHERE id = 1");
        User u = new User();
        u.setEmail("e2e-skip+" + UUID.randomUUID() + "@example.test");
        u.setPasswordHash("x"); u.setRole(Role.USER); u.setStatus(UserStatus.ACTIVE); u.setEmailVerified(true);
        long id = users.save(u).getId();
        try {
            assertEquals("PENDING", onboarding.status(id).status());
            assertTrue(onboarding.status(id).canSkip(), "tắt bắt buộc thì được bỏ qua");
            assertEquals("SKIPPED", onboarding.skip(id).status());

            // Chưa có level: giao diện nhận level rỗng, và chưa tạo chu kỳ theo level
            assertNull(fitness.state(id).level());
            IllegalStateException e = assertThrows(IllegalStateException.class, () -> fitness.regenerate(id, "CONSTRAINT_CHANGED"));
            assertTrue(e.getMessage().startsWith("LEVEL_REQUIRED"), e.getMessage());
            // Lưu lịch tập vẫn được, kể cả khi yêu cầu tạo lại chu kỳ (chỉ lưu, không tạo)
            assertDoesNotThrow(() -> fitness.updateConstraints(id, new UpdateConstraintsRequest(3, 30, List.of(), List.of(), null, true)));

            // Quay lại làm bài: không còn bị từ chối vì "đã hoàn thành" (thiếu câu bắt buộc thì báo thiếu câu, đúng như người mới)
            Exception submit = assertThrows(Exception.class, () -> onboarding.submit(id, new SubmitOnboardingRequest(templateId, Map.of())));
            assertFalse(submit.getMessage().contains("đã hoàn thành"), submit.getMessage());
            assertTrue(submit.getMessage().contains("Chưa trả lời"), submit.getMessage());
            assertEquals("SKIPPED", onboarding.status(id).status(), "nộp thiếu thì vẫn là đã bỏ qua");
        } finally {
            jdbc.update("UPDATE assessment_onboarding_settings SET mandatory = ? WHERE id = 1", mandatory);
            jdbc.update("DELETE FROM assessment_sessions WHERE user_id = ?", id);
            jdbc.update("DELETE FROM user_training_constraints WHERE user_id = ?", id);
            jdbc.update("DELETE FROM users WHERE id = ?", id);
        }
    }
}
