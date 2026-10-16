package com.calishealth.api.repository;

import com.calishealth.api.entity.BodyMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BodyMeasurementRepository extends JpaRepository<BodyMeasurement, Long> {
    List<BodyMeasurement> findByUserIdOrderByMeasurementDateDesc(Long userId);
    Optional<BodyMeasurement> findByIdAndUserId(Long id, Long userId);
}
