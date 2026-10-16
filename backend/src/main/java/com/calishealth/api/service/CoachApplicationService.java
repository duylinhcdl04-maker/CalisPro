package com.calishealth.api.service;

import com.calishealth.api.dto.AdminReviewApplicationRequest;
import com.calishealth.api.dto.CertificateItemDto;
import com.calishealth.api.dto.CoachApplicationRequest;
import com.calishealth.api.dto.CoachApplicationResponse;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.CoachApplicationRepository;
import com.calishealth.api.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class CoachApplicationService {

    private final CoachApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public CoachApplicationService(CoachApplicationRepository applicationRepository,
                                   UserRepository userRepository,
                                   EmailService emailService) {
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Transactional
    public CoachApplicationResponse submitApplication(Long userId, CoachApplicationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + userId));

        Optional<CoachApplication> existingOpt = applicationRepository.findFirstByUserIdOrderByCreatedAtDesc(userId);
        if (existingOpt.isPresent()) {
            CoachApplication existing = existingOpt.get();
            if (existing.getStatus() == CoachApplicationStatus.PENDING || existing.getStatus() == CoachApplicationStatus.UNDER_REVIEW) {
                throw new IllegalStateException("Hồ sơ ứng tuyển của bạn đang trong quá trình xét duyệt. Vui lòng chờ phản hồi từ Ban Quản Trị.");
            }
            if (existing.getStatus() == CoachApplicationStatus.APPROVED) {
                throw new IllegalStateException("Bạn đã được phê duyệt làm Huấn luyện viên chính thức của CalisHealth.");
            }
        }

        CoachApplication application = new CoachApplication();
        application.setUser(user);
        mapRequestToEntity(request, application);
        application.setStatus(CoachApplicationStatus.PENDING);

        CoachApplication saved = applicationRepository.save(application);
        return CoachApplicationResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public CoachApplicationResponse getMyApplication(Long userId) {
        return applicationRepository.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .map(CoachApplicationResponse::fromEntity)
                .orElse(null);
    }

    @Transactional
    public CoachApplicationResponse updateMyApplication(Long userId, CoachApplicationRequest request) {
        CoachApplication application = applicationRepository.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> new IllegalArgumentException("Chưa tìm thấy hồ sơ đăng ký nào của bạn."));

        if (application.getStatus() == CoachApplicationStatus.APPROVED) {
            throw new IllegalStateException("Hồ sơ đã được phê duyệt trước đó, không thể chỉnh sửa.");
        }

        mapRequestToEntity(request, application);
        application.setStatus(CoachApplicationStatus.PENDING);
        application.setRejectionReason(null);

        CoachApplication saved = applicationRepository.save(application);
        return CoachApplicationResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public Page<CoachApplicationResponse> adminGetApplications(CoachApplicationStatus status, String keyword, Pageable pageable) {
        return applicationRepository.searchApplications(status, keyword != null && !keyword.isBlank() ? keyword : null, pageable)
                .map(CoachApplicationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CoachApplicationResponse adminGetApplicationById(Long id) {
        CoachApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ với ID: " + id));
        return CoachApplicationResponse.fromEntity(app);
    }

    @Transactional
    public CoachApplicationResponse adminReviewApplication(Long id, Long adminUserId, AdminReviewApplicationRequest request) {
        CoachApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ ứng tuyển với ID: " + id));

        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Admin với ID: " + adminUserId));

        application.setStatus(request.getStatus());
        application.setAdminNotes(request.getAdminNotes());
        application.setRejectionReason(request.getRejectionReason());
        application.setReviewedBy(admin);
        application.setReviewedAt(Instant.now());

        switch (request.getStatus()) {
            case APPROVED -> {
                User applicant = application.getUser();
                applicant.setRole(Role.COACH);
                userRepository.save(applicant);
                emailService.sendCoachApprovalEmail(application.getEmail(), application.getFullName());
            }
            case REJECTED -> emailService.sendCoachRejectionEmail(application.getEmail(), application.getFullName(), request.getRejectionReason());
            case CHANGES_REQUESTED -> emailService.sendCoachChangesRequestedEmail(application.getEmail(), application.getFullName(), request.getAdminNotes());
            default -> {}
        }

        CoachApplication saved = applicationRepository.save(application);
        return CoachApplicationResponse.fromEntity(saved);
    }

    private void mapRequestToEntity(CoachApplicationRequest req, CoachApplication app) {
        app.setFullName(req.getFullName());
        app.setDateOfBirth(req.getDateOfBirth());
        app.setGender(req.getGender());
        app.setPhoneNumber(req.getPhoneNumber());
        app.setEmail(req.getEmail());
        app.setLocation(req.getLocation());
        app.setIdCardNumber(req.getIdCardNumber());
        app.setIdCardFrontUrl(req.getIdCardFrontUrl());
        app.setIdCardBackUrl(req.getIdCardBackUrl());
        app.setExperienceYears(req.getExperienceYears());
        app.setPrimarySpecialty(req.getPrimarySpecialty());
        app.setSkillsDescription(req.getSkillsDescription());
        app.setPersonalRecords(req.getPersonalRecords());
        app.setSkillDemoVideoUrl(req.getSkillDemoVideoUrl());
        app.setBio(req.getBio());
        app.setExpectedRate(req.getExpectedRate());

        app.getCertificates().clear();
        if (req.getCertificates() != null) {
            for (CertificateItemDto certDto : req.getCertificates()) {
                CoachApplicationCertificate cert = new CoachApplicationCertificate();
                cert.setCertificateName(certDto.getCertificateName());
                cert.setIssuingOrganization(certDto.getIssuingOrganization());
                cert.setIssueYear(certDto.getIssueYear());
                cert.setCertificateUrl(certDto.getCertificateUrl());
                app.addCertificate(cert);
            }
        }

        app.getActivities().clear();
        if (req.getActivities() != null) {
            for (com.calishealth.api.dto.ActivityItemDto actDto : req.getActivities()) {
                CoachApplicationActivity act = new CoachApplicationActivity();
                act.setActivityName(actDto.getActivityName());
                act.setRoleOrAchievement(actDto.getRoleOrAchievement());
                act.setOrganizer(actDto.getOrganizer());
                act.setEventYear(actDto.getEventYear());
                act.setProofImageUrl(actDto.getProofImageUrl());
                act.setProofLinkUrl(actDto.getProofLinkUrl());
                app.addActivity(act);
            }
        }
    }
}
