package com.calishealth.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class GoalAndTrackingDtos {
    private GoalAndTrackingDtos(){}

    public record GoalRequest(
            String code,
            String name,
            String description,
            String category,
            Boolean active
    ){}

    public record GoalResponse(
            Long id,
            String code,
            String name,
            String description,
            String category,
            boolean active
    ){}

    public record DailyCheckinRequest(
            LocalDate checkinDate,
            BigDecimal sleepHours,
            Integer energyLevel,
            Integer stressLevel,
            Integer muscleSoreness,
            Integer motivationLevel,
            String notes
    ){}

    public record DailyCheckinResponse(
            Long id,
            Long userId,
            LocalDate checkinDate,
            BigDecimal sleepHours,
            Integer energyLevel,
            Integer stressLevel,
            Integer muscleSoreness,
            Integer motivationLevel,
            String notes,
            Instant createdAt
    ){}

    public record BodyMeasurementRequest(
            LocalDate measurementDate,
            BigDecimal weightKg,
            BigDecimal bodyFatPercent,
            BigDecimal muscleMassKg,
            BigDecimal heightCm,
            String source
    ){}

    public record BodyMeasurementResponse(
            Long id,
            Long userId,
            LocalDate measurementDate,
            BigDecimal weightKg,
            BigDecimal bodyFatPercent,
            BigDecimal muscleMassKg,
            BigDecimal heightCm,
            String source,
            Instant createdAt
    ){}
}
