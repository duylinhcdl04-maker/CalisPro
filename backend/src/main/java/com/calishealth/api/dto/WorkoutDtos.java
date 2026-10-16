package com.calishealth.api.dto;

import com.calishealth.api.entity.WorkoutPlanStatus;
import com.calishealth.api.entity.WorkoutSessionStatus;
import java.time.Instant;
import java.time.LocalDate;

public final class WorkoutDtos {
    private WorkoutDtos(){}

    public record WorkoutPlanRequest(
            String name,
            String description,
            Long goalId,
            String difficultyLevel,
            Integer durationWeeks,
            Integer daysPerWeek,
            LocalDate startDate,
            LocalDate endDate,
            WorkoutPlanStatus status
    ){}

    public record WorkoutPlanResponse(
            Long id,
            Long userId,
            String name,
            String description,
            Long goalId,
            String goalName,
            String difficultyLevel,
            Integer durationWeeks,
            Integer daysPerWeek,
            WorkoutPlanStatus status,
            LocalDate startDate,
            LocalDate endDate,
            int version,
            Instant createdAt
    ){}

    public record WorkoutSessionRequest(
            Long workoutPlanId,
            Long workoutPlanDayId,
            Instant startedAt,
            Instant completedAt,
            Integer durationSeconds,
            WorkoutSessionStatus status,
            Integer energyLevel,
            Integer difficultyRating,
            String notes
    ){}

    public record WorkoutSessionResponse(
            Long id,
            Long userId,
            Long workoutPlanId,
            String workoutPlanName,
            Long workoutPlanDayId,
            Instant startedAt,
            Instant completedAt,
            Integer durationSeconds,
            WorkoutSessionStatus status,
            Integer energyLevel,
            Integer difficultyRating,
            String notes,
            Instant createdAt
    ){}
}
