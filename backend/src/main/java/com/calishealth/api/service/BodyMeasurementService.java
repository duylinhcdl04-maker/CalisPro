package com.calishealth.api.service;

import com.calishealth.api.dto.GoalAndTrackingDtos.BodyMeasurementRequest;
import com.calishealth.api.dto.GoalAndTrackingDtos.BodyMeasurementResponse;
import com.calishealth.api.entity.BodyMeasurement;
import com.calishealth.api.entity.User;
import com.calishealth.api.repository.BodyMeasurementRepository;
import com.calishealth.api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class BodyMeasurementService {
    private final BodyMeasurementRepository repo;
    private final UserRepository userRepo;

    public BodyMeasurementService(BodyMeasurementRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    public List<BodyMeasurementResponse> listUserMeasurements(Long userId) {
        return repo.findByUserIdOrderByMeasurementDateDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public BodyMeasurementResponse getMeasurement(Long userId, Long id) {
        BodyMeasurement m = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chỉ số cơ thể với ID: " + id));
        return toResponse(m);
    }

    @Transactional
    public BodyMeasurementResponse createMeasurement(Long userId, BodyMeasurementRequest req) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

        BodyMeasurement m = new BodyMeasurement();
        m.setUser(user);
        m.setMeasurementDate(req.measurementDate() != null ? req.measurementDate() : LocalDate.now());
        m.setWeightKg(req.weightKg());
        m.setBodyFatPercent(req.bodyFatPercent());
        m.setMuscleMassKg(req.muscleMassKg());
        m.setHeightCm(req.heightCm());
        m.setSource(req.source() != null ? req.source() : "USER_MANUAL");

        return toResponse(repo.save(m));
    }

    @Transactional
    public BodyMeasurementResponse updateMeasurement(Long userId, Long id, BodyMeasurementRequest req) {
        BodyMeasurement m = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chỉ số cơ thể với ID: " + id));

        if (req.measurementDate() != null) m.setMeasurementDate(req.measurementDate());
        if (req.weightKg() != null) m.setWeightKg(req.weightKg());
        if (req.bodyFatPercent() != null) m.setBodyFatPercent(req.bodyFatPercent());
        if (req.muscleMassKg() != null) m.setMuscleMassKg(req.muscleMassKg());
        if (req.heightCm() != null) m.setHeightCm(req.heightCm());
        if (req.source() != null) m.setSource(req.source());

        return toResponse(repo.save(m));
    }

    @Transactional
    public void deleteMeasurement(Long userId, Long id) {
        BodyMeasurement m = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chỉ số cơ thể với ID: " + id));
        repo.delete(m);
    }

    private BodyMeasurementResponse toResponse(BodyMeasurement m) {
        return new BodyMeasurementResponse(
                m.getId(),
                m.getUser().getId(),
                m.getMeasurementDate(),
                m.getWeightKg(),
                m.getBodyFatPercent(),
                m.getMuscleMassKg(),
                m.getHeightCm(),
                m.getSource(),
                m.getCreatedAt()
        );
    }
}
