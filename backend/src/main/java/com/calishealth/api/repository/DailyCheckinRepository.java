package com.calishealth.api.repository;

import com.calishealth.api.entity.DailyCheckin;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyCheckinRepository extends JpaRepository<DailyCheckin, Long> {
    List<DailyCheckin> findByUserIdOrderByCheckinDateDesc(Long userId);
    Optional<DailyCheckin> findByIdAndUserId(Long id, Long userId);
    Optional<DailyCheckin> findByUserIdAndCheckinDate(Long userId, LocalDate checkinDate);
}
