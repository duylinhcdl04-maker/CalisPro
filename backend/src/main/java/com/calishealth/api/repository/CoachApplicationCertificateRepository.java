package com.calishealth.api.repository;

import com.calishealth.api.entity.CoachApplicationCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoachApplicationCertificateRepository extends JpaRepository<CoachApplicationCertificate, Long> {
    List<CoachApplicationCertificate> findByApplicationId(Long applicationId);
}
