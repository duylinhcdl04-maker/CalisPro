package com.calishealth.api.service;

import com.calishealth.api.dto.AdminDtos.AssessmentQuestionRequest;
import com.calishealth.api.dto.AdminDtos.AssessmentQuestionResponse;
import com.calishealth.api.dto.AdminDtos.AssessmentTypeRequest;
import com.calishealth.api.dto.AdminDtos.AssessmentTypeResponse;
import com.calishealth.api.entity.AssessmentQuestion;
import com.calishealth.api.entity.AssessmentType;
import com.calishealth.api.repository.AssessmentQuestionRepository;
import com.calishealth.api.repository.AssessmentTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminAssessmentService {
    private final AssessmentTypeRepository typeRepo;
    private final AssessmentQuestionRepository questionRepo;

    public AdminAssessmentService(AssessmentTypeRepository typeRepo, AssessmentQuestionRepository questionRepo) {
        this.typeRepo = typeRepo;
        this.questionRepo = questionRepo;
    }

    // Assessment Types CRUD
    public List<AssessmentTypeResponse> listTypes() {
        return typeRepo.findAll().stream().map(this::toTypeResponse).toList();
    }

    public AssessmentTypeResponse getType(Long id) {
        return typeRepo.findById(id).map(this::toTypeResponse)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại khảo sát với ID: " + id));
    }

    @Transactional
    public AssessmentTypeResponse createType(AssessmentTypeRequest req) {
        if (req.code() == null || req.code().isBlank() || req.name() == null || req.name().isBlank()) {
            throw new IllegalArgumentException("Mã và tên loại khảo sát không được để trống");
        }
        if (typeRepo.findByCode(req.code().trim()).isPresent()) {
            throw new IllegalArgumentException("Mã loại khảo sát đã tồn tại: " + req.code());
        }

        AssessmentType t = new AssessmentType();
        t.setCode(req.code().trim());
        t.setName(req.name().trim());
        t.setDescription(req.description());
        t.setVersion(req.version() != null ? req.version() : "1.0");
        t.setActive(req.active() == null || req.active());

        return toTypeResponse(typeRepo.save(t));
    }

    @Transactional
    public AssessmentTypeResponse updateType(Long id, AssessmentTypeRequest req) {
        AssessmentType t = typeRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại khảo sát với ID: " + id));

        if (req.name() != null && !req.name().isBlank()) t.setName(req.name().trim());
        if (req.description() != null) t.setDescription(req.description());
        if (req.version() != null) t.setVersion(req.version());
        if (req.active() != null) t.setActive(req.active());

        return toTypeResponse(typeRepo.save(t));
    }

    @Transactional
    public void deleteType(Long id) {
        AssessmentType t = typeRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại khảo sát với ID: " + id));
        t.setActive(false);
        typeRepo.save(t);
    }

    // Assessment Questions CRUD
    public List<AssessmentQuestionResponse> listQuestions() {
        return questionRepo.findAll().stream().map(this::toQuestionResponse).toList();
    }

    public AssessmentQuestionResponse getQuestion(Long id) {
        return questionRepo.findById(id).map(this::toQuestionResponse)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy câu hỏi với ID: " + id));
    }

    @Transactional
    public AssessmentQuestionResponse createQuestion(AssessmentQuestionRequest req) {
        if (req.questionCode() == null || req.questionCode().isBlank() || req.questionText() == null || req.questionText().isBlank()) {
            throw new IllegalArgumentException("Mã và nội dung câu hỏi không được để trống");
        }
        if (req.questionType() == null) {
            throw new IllegalArgumentException("Loại câu hỏi không được để trống");
        }
        if (questionRepo.findByQuestionCode(req.questionCode().trim()).isPresent()) {
            throw new IllegalArgumentException("Mã câu hỏi đã tồn tại: " + req.questionCode());
        }

        AssessmentQuestion q = new AssessmentQuestion();
        q.setQuestionCode(req.questionCode().trim());
        q.setQuestionText(req.questionText().trim());
        q.setQuestionType(req.questionType());
        q.setCategory(req.category());
        q.setUnit(req.unit());
        q.setRequired(req.required() == null || req.required());
        q.setMinValue(req.minValue());
        q.setMaxValue(req.maxValue());
        q.setActive(req.active() == null || req.active());

        return toQuestionResponse(questionRepo.save(q));
    }

    @Transactional
    public AssessmentQuestionResponse updateQuestion(Long id, AssessmentQuestionRequest req) {
        AssessmentQuestion q = questionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy câu hỏi với ID: " + id));

        if (req.questionText() != null && !req.questionText().isBlank()) q.setQuestionText(req.questionText().trim());
        if (req.questionType() != null) q.setQuestionType(req.questionType());
        if (req.category() != null) q.setCategory(req.category());
        if (req.unit() != null) q.setUnit(req.unit());
        if (req.required() != null) q.setRequired(req.required());
        if (req.minValue() != null) q.setMinValue(req.minValue());
        if (req.maxValue() != null) q.setMaxValue(req.maxValue());
        if (req.active() != null) q.setActive(req.active());

        return toQuestionResponse(questionRepo.save(q));
    }

    @Transactional
    public void deleteQuestion(Long id) {
        AssessmentQuestion q = questionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy câu hỏi với ID: " + id));
        q.setActive(false);
        questionRepo.save(q);
    }

    private AssessmentTypeResponse toTypeResponse(AssessmentType t) {
        return new AssessmentTypeResponse(t.getId(), t.getCode(), t.getName(), t.getDescription(), t.getVersion(), t.isActive(), t.getCreatedAt());
    }

    private AssessmentQuestionResponse toQuestionResponse(AssessmentQuestion q) {
        return new AssessmentQuestionResponse(
                q.getId(),
                q.getQuestionCode(),
                q.getQuestionText(),
                q.getQuestionType(),
                q.getCategory(),
                q.getUnit(),
                q.isRequired(),
                q.getMinValue(),
                q.getMaxValue(),
                q.isActive(),
                q.getCreatedAt()
        );
    }
}
