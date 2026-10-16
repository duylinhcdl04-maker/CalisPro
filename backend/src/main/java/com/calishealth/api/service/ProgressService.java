package com.calishealth.api.service;

import com.calishealth.api.dto.UserTraineeDtos.ProgressOverviewResponse;
import com.calishealth.api.entity.BodyMeasurement;
import com.calishealth.api.entity.DailyCheckin;
import com.calishealth.api.entity.WorkoutSession;
import com.calishealth.api.repository.BodyMeasurementRepository;
import com.calishealth.api.repository.DailyCheckinRepository;
import com.calishealth.api.repository.FitnessProfileRepository;
import com.calishealth.api.repository.UserProfileRepository;
import com.calishealth.api.repository.WorkoutSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProgressService {
    private final WorkoutSessionRepository workoutSessionRepository;
    private final DailyCheckinRepository dailyCheckinRepository;
    private final BodyMeasurementRepository bodyMeasurementRepository;
    private final FitnessProfileRepository fitnessProfileRepository;
    private final UserProfileRepository userProfileRepository;

    public ProgressService(WorkoutSessionRepository workoutSessionRepository,
                           DailyCheckinRepository dailyCheckinRepository,
                           BodyMeasurementRepository bodyMeasurementRepository,
                           FitnessProfileRepository fitnessProfileRepository,
                           UserProfileRepository userProfileRepository) {
        this.workoutSessionRepository = workoutSessionRepository;
        this.dailyCheckinRepository = dailyCheckinRepository;
        this.bodyMeasurementRepository = bodyMeasurementRepository;
        this.fitnessProfileRepository = fitnessProfileRepository;
        this.userProfileRepository = userProfileRepository;
    }

    public ProgressOverviewResponse getOverview(Long userId) {
        List<WorkoutSession> sessions = workoutSessionRepository.findByUserIdOrderByStartedAtDesc(userId);
        long totalWorkouts = sessions.size();
        long totalDurationMinutes = sessions.stream()
                .filter(s -> s.getDurationSeconds() != null)
                .mapToLong(s -> s.getDurationSeconds() / 60)
                .sum();

        LocalDate sevenDaysAgo = LocalDate.now().minusDays(7);
        List<DailyCheckin> checkins = dailyCheckinRepository.findByUserIdOrderByCheckinDateDesc(userId);
        int checkinsLast7Days = (int) checkins.stream()
                .filter(c -> !c.getCheckinDate().isBefore(sevenDaysAgo))
                .count();

        List<BodyMeasurement> measurements = bodyMeasurementRepository.findByUserIdOrderByMeasurementDateDesc(userId);
        BigDecimal latestWeight = null;
        BigDecimal latestBodyFat = null;
        if (!measurements.isEmpty()) {
            latestWeight = measurements.getFirst().getWeightKg();
            latestBodyFat = measurements.getFirst().getBodyFatPercent();
        }
        if (latestWeight == null) {
            latestWeight = userProfileRepository.findByUserId(userId)
                    .map(p -> p.getWeightKg())
                    .orElse(null);
        }

        String fitnessLevel = fitnessProfileRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .map(p -> p.getFitnessLevel())
                .orElse("BEGINNER");

        return new ProgressOverviewResponse(
                totalWorkouts,
                totalDurationMinutes,
                checkinsLast7Days,
                latestWeight,
                latestBodyFat,
                fitnessLevel
        );
    }
}
