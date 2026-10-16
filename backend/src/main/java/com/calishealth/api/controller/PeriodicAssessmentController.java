package com.calishealth.api.controller;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.service.assessmentv2.AssessmentJourneyService;
import com.calishealth.api.service.assessmentv2.BaselineService;
import com.calishealth.api.service.assessmentv2.PeriodicAssessmentV2Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/** Periodic thường kỳ (V2): start → next/attempts → tự kết thúc khi đủ dữ liệu hoặc khi đo không tin cậy. Chỉ bật khi app.assessment-v2.enabled=true. */
@RestController
@ConditionalOnProperty(name = "app.assessment-v2.enabled", havingValue = "true")
public class PeriodicAssessmentController {
    private final PeriodicAssessmentV2Service service;
    private final AssessmentJourneyService journey;
    private final BaselineService baseline;

    public PeriodicAssessmentController(PeriodicAssessmentV2Service service, AssessmentJourneyService journey, BaselineService baseline) {
        this.service = service; this.journey = journey; this.baseline = baseline;
    }

    @PostMapping("/api/v1/assessments/periodic/start")
    public StartPeriodicResponse start(@AuthenticationPrincipal Jwt jwt) { return service.start(uid(jwt)); }

    @GetMapping("/api/v1/assessments/periodic/{sessionId}/next")
    public PeriodicProgressDto next(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId) { return service.next(uid(jwt), sessionId); }

    @PostMapping("/api/v1/assessments/periodic/{sessionId}/attempts")
    public PeriodicProgressDto attempt(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId, @RequestBody SubmitAttemptRequest req) {
        return service.submitAttempt(uid(jwt), sessionId, req);
    }

    @GetMapping("/api/v1/assessments/periodic/{sessionId}/result")
    public PeriodicProgressDto result(@AuthenticationPrincipal Jwt jwt, @PathVariable long sessionId) { return service.result(uid(jwt), sessionId); }

    /** Level V2 hiện tại + lịch sử quyết định. 204 khi chưa có level đã xác minh (cần Baseline). */
    @GetMapping("/api/v1/me/assessment-v2/level")
    public ResponseEntity<LevelStateDto> myLevel(@AuthenticationPrincipal Jwt jwt) {
        return service.myLevel(uid(jwt)).map(ResponseEntity::ok).orElse(ResponseEntity.noContent().build());
    }

    /** Hành trình đánh giá (sàng lọc → khảo sát → Baseline → đo định kỳ): bước nào xong, bước nào làm tiếp. */
    @GetMapping("/api/v1/me/assessment-v2/journey")
    public JourneyDto journey(@AuthenticationPrincipal Jwt jwt) { return journey.journey(uid(jwt)); }

    /** Level đang hiển thị (đã xác nhận hay tạm thời), trần của level tạm, lượt đo lại và trạng thái "đo sau". */
    @GetMapping("/api/v1/me/assessment-v2/level-status")
    public LevelStatusDto levelStatus(@AuthenticationPrincipal Jwt jwt) { return baseline.levelStatus(uid(jwt)); }

    private static long uid(Jwt jwt) { return Long.parseLong(jwt.getSubject()); }
}
