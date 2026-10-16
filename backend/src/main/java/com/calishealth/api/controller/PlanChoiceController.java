package com.calishealth.api.controller;

import com.calishealth.api.dto.PlanChoiceDtos.*;
import com.calishealth.api.service.level.ExerciseRecommendationService;
import com.calishealth.api.service.level.PlanChoiceService;
import com.calishealth.api.service.level.SelfPlanService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/** Học viên chọn tập theo giáo án hệ thống hay tự tạo danh sách bài tập, đặt hướng tập (Sức khỏe/Kỹ năng) và nhận gợi ý bài tập. */
@RestController
@RequestMapping("/api/v1/me")
public class PlanChoiceController {
    private final PlanChoiceService service;
    private final SelfPlanService selfPlan;
    private final ExerciseRecommendationService recommendations;

    public PlanChoiceController(PlanChoiceService service, SelfPlanService selfPlan, ExerciseRecommendationService recommendations) {
        this.service = service; this.selfPlan = selfPlan; this.recommendations = recommendations;
    }

    @GetMapping("/plan-choice")
    public PlanChoiceStatus status(@AuthenticationPrincipal Jwt jwt) { return service.status(uid(jwt)); }

    @PostMapping("/plan-choice")
    public PlanChoiceStatus choose(@AuthenticationPrincipal Jwt jwt, @RequestBody ChoosePlanRequest req) {
        return service.choose(uid(jwt), req.mode(), req.trainingFocus());
    }

    @PutMapping("/training-focus")
    public PlanChoiceStatus focus(@AuthenticationPrincipal Jwt jwt, @RequestBody FocusRequest req) {
        return service.setFocus(uid(jwt), req.trainingFocus());
    }

    @GetMapping("/self-plan")
    public SelfPlanView selfPlan(@AuthenticationPrincipal Jwt jwt) { return selfPlan.get(uid(jwt)); }

    @PutMapping("/self-plan")
    public SelfPlanView saveSelfPlan(@AuthenticationPrincipal Jwt jwt, @RequestBody SaveSelfPlanRequest req) { return selfPlan.save(uid(jwt), req); }

    @GetMapping("/exercise-recommendations/ids")
    public RecommendedIds recommendedIds(@AuthenticationPrincipal Jwt jwt) { return recommendations.recommendedIds(uid(jwt)); }

    @GetMapping("/exercise-recommendations")
    public Recommendations recommendations(@AuthenticationPrincipal Jwt jwt) { return recommendations.recommend(uid(jwt)); }

    private static Long uid(Jwt jwt) { return Long.valueOf(jwt.getSubject()); }
}
