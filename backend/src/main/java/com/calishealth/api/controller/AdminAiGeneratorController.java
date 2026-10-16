package com.calishealth.api.controller;

import com.calishealth.api.dto.AiGeneratorDtos.*;
import com.calishealth.api.service.ai.AiContentGeneratorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/ai/generate")
public class AdminAiGeneratorController {

    private final AiContentGeneratorService generatorService;

    public AdminAiGeneratorController(AiContentGeneratorService generatorService) {
        this.generatorService = generatorService;
    }

    /**
     * Module 1: AI Auto-Generate Full Exercise Data
     */
    @PostMapping("/exercise")
    public ResponseEntity<GenerateExerciseResponse> generateExercise(@RequestBody GenerateExerciseRequest req) {
        GenerateExerciseResponse response = generatorService.generateExercise(req);
        return ResponseEntity.ok(response);
    }

    /**
     * Module 2: AI Auto-Generate Structured Workout Plan / Roadmap
     */
    @PostMapping("/workout-plan")
    public ResponseEntity<GenerateWorkoutPlanResponse> generateWorkoutPlan(@RequestBody GenerateWorkoutPlanRequest req) {
        GenerateWorkoutPlanResponse response = generatorService.generateWorkoutPlan(req);
        return ResponseEntity.ok(response);
    }

    /**
     * Module 2.1: Validate Workout Plan Duplicates & Collision Scoring
     */
    @PostMapping("/validate/workout-plan")
    public ResponseEntity<ValidateWorkoutPlanResponse> validateWorkoutPlan(@RequestBody ValidateWorkoutPlanRequest req) {
        ValidateWorkoutPlanResponse response = generatorService.validateWorkoutPlan(req);
        return ResponseEntity.ok(response);
    }

    /**
     * Module 3: AI Auto-Generate Physical Assessment & Evaluation Rubric
     */
    @PostMapping("/assessment")
    public ResponseEntity<GenerateAssessmentResponse> generateAssessment(@RequestBody GenerateAssessmentRequest req) {
        GenerateAssessmentResponse response = generatorService.generateAssessment(req);
        return ResponseEntity.ok(response);
    }

    /**
     * Module 4: AI Auto-Generate Biomechanical Motion & Joint Angle Rules
     */
    @PostMapping("/motion-rules")
    public ResponseEntity<GenerateMotionRulesResponse> generateMotionRules(@RequestBody GenerateMotionRulesRequest req) {
        GenerateMotionRulesResponse response = generatorService.generateMotionRules(req);
        return ResponseEntity.ok(response);
    }
}
