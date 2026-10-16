package com.calishealth.api.service;

import com.calishealth.api.dto.GoalAndTrackingDtos.GoalRequest;
import com.calishealth.api.dto.GoalAndTrackingDtos.GoalResponse;
import com.calishealth.api.entity.Goal;
import com.calishealth.api.repository.GoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GoalService {
    private final GoalRepository repo;

    public GoalService(GoalRepository repo) {
        this.repo = repo;
    }

    public List<GoalResponse> list() {
        return repo.findByActiveTrue().stream().map(this::toResponse).toList();
    }

    public GoalResponse getById(Long id) {
        return repo.findById(id).map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mục tiêu với ID: " + id));
    }

    @Transactional
    public GoalResponse create(GoalRequest req) {
        if (req.code() == null || req.code().isBlank() || req.name() == null || req.name().isBlank()) {
            throw new IllegalArgumentException("Mã và tên mục tiêu không được để trống");
        }
        if (repo.findByCode(req.code().trim()).isPresent()) {
            throw new IllegalArgumentException("Mã mục tiêu đã tồn tại: " + req.code());
        }

        Goal g = new Goal();
        g.setCode(req.code().trim());
        g.setName(req.name().trim());
        g.setDescription(req.description());
        g.setCategory(req.category());
        g.setActive(req.active() == null || req.active());

        return toResponse(repo.save(g));
    }

    @Transactional
    public GoalResponse update(Long id, GoalRequest req) {
        Goal g = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mục tiêu với ID: " + id));

        if (req.name() != null && !req.name().isBlank()) g.setName(req.name().trim());
        if (req.description() != null) g.setDescription(req.description());
        if (req.category() != null) g.setCategory(req.category());
        if (req.active() != null) g.setActive(req.active());

        return toResponse(repo.save(g));
    }

    @Transactional
    public void delete(Long id) {
        Goal g = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mục tiêu với ID: " + id));
        g.setActive(false);
        repo.save(g);
    }

    private GoalResponse toResponse(Goal g) {
        return new GoalResponse(g.getId(), g.getCode(), g.getName(), g.getDescription(), g.getCategory(), g.isActive());
    }
}
