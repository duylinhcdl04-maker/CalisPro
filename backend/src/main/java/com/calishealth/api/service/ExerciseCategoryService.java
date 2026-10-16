package com.calishealth.api.service;

import com.calishealth.api.dto.ExerciseDtos.CategoryRequest;
import com.calishealth.api.dto.ExerciseDtos.CategoryResponse;
import com.calishealth.api.entity.ExerciseCategory;
import com.calishealth.api.repository.ExerciseCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ExerciseCategoryService {
    private final ExerciseCategoryRepository repo;

    public ExerciseCategoryService(ExerciseCategoryRepository repo) {
        this.repo = repo;
    }

    public List<CategoryResponse> list() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    public CategoryResponse getById(Long id) {
        return repo.findById(id).map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục bài tập với ID: " + id));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        if (req.code() == null || req.code().isBlank() || req.name() == null || req.name().isBlank()) {
            throw new IllegalArgumentException("Mã và tên danh mục không được để trống");
        }
        if (repo.findByCode(req.code().trim()).isPresent()) {
            throw new IllegalArgumentException("Mã danh mục đã tồn tại: " + req.code());
        }
        ExerciseCategory c = new ExerciseCategory();
        c.setCode(req.code().trim());
        c.setName(req.name().trim());
        c.setDescription(req.description());
        return toResponse(repo.save(c));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest req) {
        ExerciseCategory c = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục bài tập với ID: " + id));
        if (req.name() != null && !req.name().isBlank()) {
            c.setName(req.name().trim());
        }
        if (req.description() != null) {
            c.setDescription(req.description());
        }
        return toResponse(repo.save(c));
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy danh mục bài tập với ID: " + id);
        }
        repo.deleteById(id);
    }

    private CategoryResponse toResponse(ExerciseCategory c) {
        return new CategoryResponse(c.getId(), c.getCode(), c.getName(), c.getDescription());
    }
}
