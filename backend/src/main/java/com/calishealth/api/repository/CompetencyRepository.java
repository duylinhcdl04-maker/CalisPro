package com.calishealth.api.repository;

import com.calishealth.api.entity.Competency;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompetencyRepository extends JpaRepository<Competency, String> {
    List<Competency> findByActiveTrueOrderByDisplayOrderAsc();
}
