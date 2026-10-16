package com.calishealth.api.repository;

import com.calishealth.api.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {
    Optional<EmailVerification> findTopByEmailAndOtpCodeAndTypeAndVerifiedAtIsNullOrderByCreatedAtDesc(String email, String otpCode, String type);
    Optional<EmailVerification> findTopByEmailAndTypeAndVerifiedAtIsNullOrderByCreatedAtDesc(String email, String type);
}
