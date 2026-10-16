package com.calishealth.api.repository;

import com.calishealth.api.entity.Muscle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MuscleRepository extends JpaRepository<Muscle, Long> {
    Optional<Muscle> findByCode(String code);
    List<Muscle> findByCodeIn(Collection<String> codes);
}
