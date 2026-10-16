package com.calishealth.api.dto;

import com.calishealth.api.entity.QuestionType;
import com.calishealth.api.entity.Role;
import com.calishealth.api.entity.UserStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

public final class AdminDtos {
    private AdminDtos(){}

    public record AdminUserResponse(
            Long id,
            String email,
            Role role,
            UserStatus status,
            boolean emailVerified,
            String firstName,
            String lastName,
            String fullName,
            Instant lastLoginAt,
            Instant createdAt
    ){}

    public record UpdateUserStatusRequest(
            UserStatus status
    ){}

    public record UpdateUserRoleRequest(
            Role role
    ){}

    public record SystemAnalyticsResponse(
            long totalUsers,
            long activeUsers,
            long suspendedUsers,
            long totalCoaches,
            long totalAdmins,
            long totalExercises,
            long totalWorkoutPlans,
            long totalWorkoutSessions,
            Map<String, Long> usersByRole,
            Map<String, Long> usersByStatus
    ){}

    public record AssessmentTypeRequest(
            String code,
            String name,
            String description,
            String version,
            Boolean active
    ){}

    public record AssessmentTypeResponse(
            Long id,
            String code,
            String name,
            String description,
            String version,
            boolean active,
            Instant createdAt
    ){}

    public record AssessmentQuestionRequest(
            String questionCode,
            String questionText,
            QuestionType questionType,
            String category,
            String unit,
            Boolean required,
            BigDecimal minValue,
            BigDecimal maxValue,
            Boolean active
    ){}

    public record AssessmentQuestionResponse(
            Long id,
            String questionCode,
            String questionText,
            QuestionType questionType,
            String category,
            String unit,
            boolean required,
            BigDecimal minValue,
            BigDecimal maxValue,
            boolean active,
            Instant createdAt
    ){}
}
