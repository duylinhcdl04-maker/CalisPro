package com.calishealth.api.controller;

import com.calishealth.api.dto.ExerciseDtos.ExerciseRequest;
import com.calishealth.api.dto.ExerciseDtos.ExerciseResponse;
import com.calishealth.api.service.ExerciseRevisionService;
import com.calishealth.api.service.ExerciseService;
import com.calishealth.api.service.level.AiReadinessService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/exercises")
public class ExerciseController {
    private final ExerciseService service;
    private final AiReadinessService aiReadiness;
    private final ExerciseRevisionService revisions;

    public ExerciseController(ExerciseService service, AiReadinessService aiReadiness, ExerciseRevisionService revisions) {
        this.service = service;
        this.aiReadiness = aiReadiness;
        this.revisions = revisions;
    }

    /** Bài nào đo được bằng AI (camera) và bài nào còn chấm form được: để trang soạn giáo án chọn bài đo cho phần Bài chính. */
    /** Trạng thái AI Coach của một bài, cho trang chi tiết bài tập của học viên. */
    @GetMapping("/{id}/ai-coach")
    public com.calishealth.api.dto.TrainingSessionDtos.AiCoachInfo aiCoach(@PathVariable Long id) {
        return aiReadiness.coach(id);
    }

    @GetMapping("/ai-readiness")
    public Map<Long, AiReadinessService.Readiness> aiReadiness() {
        return aiReadiness.all();
    }

    @GetMapping
    public List<ExerciseResponse> list(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String difficultyLevel,
            @RequestParam(required = false) String muscleCode,   // vd. PECTORALIS_MAJOR
            @RequestParam(required = false) String muscleRole,   // PRIMARY / SECONDARY / STABILIZER
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String equipment,
            Authentication auth
    ) {
        return service.list(categoryId, difficultyLevel, muscleCode, muscleRole, tag, equipment, isStaff(auth));
    }

    @GetMapping("/{id}")
    public ExerciseResponse getById(@PathVariable Long id, Authentication auth) {
        return service.getById(id, isStaff(auth));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExerciseResponse create(@RequestBody ExerciseRequest req, Authentication auth) {
        return service.create(req, hasRole(auth, "ROLE_ADMIN"), userId(auth));
    }

    @PutMapping("/{id}")
    public org.springframework.http.ResponseEntity<ExerciseResponse> update(@PathVariable Long id, @RequestBody ExerciseRequest req, Authentication auth) {
        boolean admin = hasRole(auth, "ROLE_ADMIN");
        // Coach sửa bài ĐÃ XUẤT BẢN: không áp ngay, lưu thành bản chờ Admin duyệt (202, trả về nội dung hiện hành của bài)
        if (!admin && service.isPublished(id)) {
            Long revision = revisions.submit(id, userId(auth), req);
            return org.springframework.http.ResponseEntity.status(revision == null ? 200 : 202).body(service.getById(id, true));
        }
        return org.springframework.http.ResponseEntity.ok(service.update(id, req, admin, userId(auth)));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth) {
        service.delete(id, hasRole(auth, "ROLE_ADMIN"));
    }

    /** Coach và Admin thấy cả bài nháp; học viên và khách chỉ thấy bài đã xuất bản. */
    private static boolean isStaff(Authentication auth) {
        return hasRole(auth, "ROLE_ADMIN") || hasRole(auth, "ROLE_COACH");
    }

    private static Long userId(Authentication auth) {
        try { return auth == null ? null : Long.valueOf(auth.getName()); } catch (NumberFormatException e) { return null; }
    }

    private static boolean hasRole(Authentication auth, String role) {
        if (auth == null) return false;
        for (GrantedAuthority a : auth.getAuthorities()) if (role.equals(a.getAuthority())) return true;
        return false;
    }
}
