package com.calishealth.api.repository;

import com.calishealth.api.entity.CoachApplicationActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoachApplicationActivityRepository extends JpaRepository<CoachApplicationActivity, Long> {
    List<CoachApplicationActivity> findByApplicationId(Long applicationId);
}
