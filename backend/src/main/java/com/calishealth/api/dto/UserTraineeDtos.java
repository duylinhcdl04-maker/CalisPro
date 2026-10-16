package com.calishealth.api.dto;

import com.calishealth.api.entity.UserGoalStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class UserTraineeDtos {
    private UserTraineeDtos(){}

    // Profile DTOs
    public record UserProfileResponse(
            Long userId,
            String email,
            String role,
            String firstName,
            String lastName,
            String fullName,
            LocalDate dateOfBirth,
            String gender,
            BigDecimal heightCm,
            BigDecimal weightKg,
            String timezone,
            String avatarUrl
    ){}

    public record UpdateProfileRequest(
            String firstName,
            String lastName,
            LocalDate dateOfBirth,
            String gender,
            BigDecimal heightCm,
            BigDecimal weightKg,
            String timezone,
            String avatarUrl
    ){}

    // UserGoal DTOs
    public record UserGoalRequest(
            Long goalId,
            Integer priority,
            BigDecimal targetValue,
            String targetUnit,
            LocalDate startDate,
            LocalDate targetDate,
            UserGoalStatus status
    ){}

    public record UserGoalResponse(
            Long id,
            Long userId,
            Long goalId,
            String goalCode,
            String goalName,
            int priority,
            BigDecimal targetValue,
            String targetUnit,
            LocalDate startDate,
            LocalDate targetDate,
            UserGoalStatus status,
            Instant createdAt
    ){}

    // Fitness Profile DTOs
    public record FitnessProfileResponse(
            Long id,
            Long userId,
            Long assessmentSessionId,
            String fitnessLevel,
            BigDecimal strengthScore,
            BigDecimal enduranceScore,
            BigDecimal mobilityScore,
            BigDecimal balanceScore,
            BigDecimal coreScore,
            BigDecimal overallScore,
            Instant createdAt
    ){}

    // Plan Generation DTOs
    public record GeneratePlanRequest(
            Long goalId,
            Integer durationWeeks,
            Integer daysPerWeek
    ){}

    // Workout Performance Report
    public record WorkoutPerformanceReport(
            Long sessionId,
            String workoutPlanName,
            Instant startedAt,
            Instant completedAt,
            Integer durationSeconds,
            String status,
            Integer energyLevel,
            Integer difficultyRating,
            String notes,
            String summaryFeedback
    ){}

    // Progress Overview
    public record ProgressOverviewResponse(
            long totalWorkouts,
            long totalDurationMinutes,
            int checkinsLast7Days,
            BigDecimal latestWeightKg,
            BigDecimal latestBodyFatPercent,
            String currentFitnessLevel
    ){}
}
