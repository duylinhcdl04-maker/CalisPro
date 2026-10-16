package com.calishealth.api.repository;

import com.calishealth.api.entity.CoachApplication;
import com.calishealth.api.entity.CoachApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CoachApplicationRepository extends JpaRepository<CoachApplication, Long> {

    List<CoachApplication> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<CoachApplication> findFirstByUserIdOrderByCreatedAtDesc(Long userId);

    Page<CoachApplication> findByStatusOrderByCreatedAtDesc(CoachApplicationStatus status, Pageable pageable);

    Page<CoachApplication> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT a FROM CoachApplication a WHERE " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:keyword IS NULL OR LOWER(a.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.phoneNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.primarySpecialty) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY a.createdAt DESC")
    Page<CoachApplication> searchApplications(@Param("status") CoachApplicationStatus status,
                                              @Param("keyword") String keyword,
                                              Pageable pageable);

    long countByStatus(CoachApplicationStatus status);
}
