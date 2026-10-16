package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.JourneyDto;
import com.calishealth.api.dto.AssessmentV2Dtos.JourneyStepDto;
import com.calishealth.api.service.assessmentv2.SafetyStatusService.View;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Hành trình đánh giá của học viên: sàng lọc an toàn → khảo sát → Baseline → đo định kỳ (ASSESSMENT_FRAMEWORK_V2 §42).
 * Chỉ đọc (không ghi): cho giao diện biết bước nào đã xong và bước nào làm tiếp, để NHẮC người dùng (không chặn các trang khác).
 *  - Khảo sát cần sàng lọc xong (backend yêu cầu), Baseline cần khảo sát xong (lấy level tạm), đo định kỳ cần level đã xác minh.
 *  - Đã có level V2 thì khảo sát coi như xong (khảo sát chỉ làm trước Baseline; backend từ chối làm lại khi đã có level xác minh).
 */
@Service
@ConditionalOnProperty(name = "app.assessment-v2.enabled", havingValue = "true")
public class AssessmentJourneyService {
    /** Tùy chọn: điều kiện mở đánh giá định kỳ (hết chu kỳ tập). */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private PeriodicEligibilityService eligibility;
    /** Tùy chọn: đo định kỳ (đổi level) chỉ mở cho người tập theo giáo án hệ thống. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.calishealth.api.service.level.PlanChoiceService planChoice;
    private final JdbcTemplate jdbc;
    private final SafetyStatusService safety;
    private final LevelStateV2Service levelState;
    private final RuleSetV2Loader ruleSets;
    private final BaselineHistory history;

    public AssessmentJourneyService(JdbcTemplate jdbc, SafetyStatusService safety, LevelStateV2Service levelState, RuleSetV2Loader ruleSets) {
        this.history = new BaselineHistory(jdbc); this.jdbc = jdbc; this.safety = safety; this.levelState = levelState; this.ruleSets = ruleSets;
    }

    public JourneyDto journey(long userId) {
        Optional<View> sv = safety.current(userId);
        var level = levelState.state(userId);

        // ---- sàng lọc an toàn ----
        String safetyStatus, safetyDetail = null;
        if (sv.isEmpty()) { safetyStatus = "TODO"; safetyDetail = "SCREEN"; }
        else if (sv.get().status() == com.calishealth.api.safety.SafetyModels.Status.CLEARED && sv.get().expired()) { safetyStatus = "TODO"; safetyDetail = "RESCREEN"; }
        else if (sv.get().status() != com.calishealth.api.safety.SafetyModels.Status.CLEARED && !sv.get().acknowledged()) { safetyStatus = "TODO"; safetyDetail = "ACKNOWLEDGE"; }
        else safetyStatus = "DONE";

        // ---- khảo sát ----
        boolean initialDone = level.isPresent() || Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM assessment_sessions WHERE user_id = ? AND purpose = 'INITIAL_V2' AND status = 'COMPLETED')", Boolean.class, userId));
        String initialStatus = initialDone ? "DONE" : "DONE".equals(safetyStatus) ? "TODO" : "LOCKED";

        // ---- Baseline ----
        // "Bỏ qua, đo sau": hiện DEFERRED tới ngày nhắc lại (không tính là bước cần làm); hết hạn thì quay về TODO
        String baselineStatus, baselineDetail = null;
        if (level.isPresent()) baselineStatus = "DONE";
        else if (!"DONE".equals(initialStatus)) baselineStatus = "LOCKED";
        else {
            Optional<Instant> deferred = history.deferredUntil(userId).filter(d -> Instant.now().isBefore(d));
            baselineStatus = deferred.isPresent() ? "DEFERRED" : "TODO";
            if (deferred.isPresent()) baselineDetail = "UNTIL:" + deferred.get();
        }

        // ---- đo định kỳ ----
        String periodicStatus, periodicDetail = null;
        if (level.isEmpty()) periodicStatus = "LOCKED";
        else if (planChoice != null && !com.calishealth.api.service.level.PlanChoiceService.SYSTEM.equals(planChoice.effectiveMode(userId))) {
            periodicStatus = "LOCKED";
            periodicDetail = "SYSTEM_PLAN_REQUIRED";
        } else {
            Instant earliest = LevelStateV2Service.RETURNING.equals(level.get().status()) ? null
                    : level.get().lastAssessedAt().plus(Duration.ofDays((long) ruleSets.loadConfigured().params().require("assessment.minIntervalDays")));
            PeriodicEligibilityService.Gate cycle = eligibility == null ? null : eligibility.check(userId, level.get(), ruleSets.loadConfigured().params());
            if (earliest != null && Instant.now().isBefore(earliest)) { periodicStatus = "WAIT"; periodicDetail = "UNTIL:" + earliest; }
            else if (cycle != null && !cycle.open()) { periodicStatus = "WAIT"; periodicDetail = "CYCLE:" + cycle.sessionsDone() + "/" + cycle.sessionsPlanned() + (cycle.cycleEnd() == null ? "" : ":" + cycle.cycleEnd()); }
            else periodicStatus = "TODO";
        }

        List<JourneyStepDto> steps = new ArrayList<>();
        steps.add(new JourneyStepDto("SAFETY", safetyStatus, "/safety-screening", safetyDetail));
        steps.add(new JourneyStepDto("INITIAL", initialStatus, "/assessment/initial", null));
        steps.add(new JourneyStepDto("BASELINE", baselineStatus, "/assessment/baseline", baselineDetail));
        steps.add(new JourneyStepDto("PERIODIC", periodicStatus, "/assessment/periodic", periodicDetail));
        JourneyStepDto next = steps.stream().filter(s -> "TODO".equals(s.status())).findFirst().orElse(null);
        boolean complete = "DONE".equals(safetyStatus) && initialDone && level.isPresent();
        return new JourneyDto(steps, next == null ? null : next.key(), next == null ? null : next.path(), complete);
    }
}
