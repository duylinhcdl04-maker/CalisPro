package com.calishealth.api.controller;

import com.calishealth.api.dto.AdminDtos.AssessmentQuestionRequest;
import com.calishealth.api.dto.AdminDtos.AssessmentQuestionResponse;
import com.calishealth.api.dto.AdminDtos.AssessmentTypeRequest;
import com.calishealth.api.dto.AdminDtos.AssessmentTypeResponse;
import com.calishealth.api.service.AdminAssessmentService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/assessments")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAssessmentController {
    private final AdminAssessmentService service;

    public AdminAssessmentController(AdminAssessmentService service) {
        this.service = service;
    }

    // Types
    @GetMapping("/types")
    public List<AssessmentTypeResponse> listTypes() {
        return service.listTypes();
    }

    @GetMapping("/types/{id}")
    public AssessmentTypeResponse getType(@PathVariable Long id) {
        return service.getType(id);
    }

    @PostMapping("/types")
    @ResponseStatus(HttpStatus.CREATED)
    public AssessmentTypeResponse createType(@RequestBody AssessmentTypeRequest req) {
        return service.createType(req);
    }

    @PutMapping("/types/{id}")
    public AssessmentTypeResponse updateType(@PathVariable Long id, @RequestBody AssessmentTypeRequest req) {
        return service.updateType(id, req);
    }

    @DeleteMapping("/types/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteType(@PathVariable Long id) {
        service.deleteType(id);
    }

    // Questions
    @GetMapping("/questions")
    public List<AssessmentQuestionResponse> listQuestions() {
        return service.listQuestions();
    }

    @GetMapping("/questions/{id}")
    public AssessmentQuestionResponse getQuestion(@PathVariable Long id) {
        return service.getQuestion(id);
    }

    @PostMapping("/questions")
    @ResponseStatus(HttpStatus.CREATED)
    public AssessmentQuestionResponse createQuestion(@RequestBody AssessmentQuestionRequest req) {
        return service.createQuestion(req);
    }

    @PutMapping("/questions/{id}")
    public AssessmentQuestionResponse updateQuestion(@PathVariable Long id, @RequestBody AssessmentQuestionRequest req) {
        return service.updateQuestion(id, req);
    }

    @DeleteMapping("/questions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteQuestion(@PathVariable Long id) {
        service.deleteQuestion(id);
    }
}
