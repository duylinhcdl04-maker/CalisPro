package com.calishealth.api.service;

import com.calishealth.api.dto.AdminDtos.SystemAnalyticsResponse;
import com.calishealth.api.entity.Role;
import com.calishealth.api.entity.UserStatus;
import com.calishealth.api.repository.ExerciseRepository;
import com.calishealth.api.repository.UserRepository;
import com.calishealth.api.repository.WorkoutPlanRepository;
import com.calishealth.api.repository.WorkoutSessionRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AdminAnalyticsService {
    private final UserRepository userRepo;
    private final ExerciseRepository exerciseRepo;
    private final WorkoutPlanRepository planRepo;
    private final WorkoutSessionRepository sessionRepo;

    public AdminAnalyticsService(
            UserRepository userRepo,
            ExerciseRepository exerciseRepo,
            WorkoutPlanRepository planRepo,
            WorkoutSessionRepository sessionRepo
    ) {
        this.userRepo = userRepo;
        this.exerciseRepo = exerciseRepo;
        this.planRepo = planRepo;
        this.sessionRepo = sessionRepo;
    }

    public SystemAnalyticsResponse getOverview() {
        long totalUsers = userRepo.count();
        long activeUsers = userRepo.countByStatus(UserStatus.ACTIVE);
        long suspendedUsers = userRepo.countByStatus(UserStatus.SUSPENDED);
        long totalCoaches = userRepo.countByRole(Role.COACH);
        long totalAdmins = userRepo.countByRole(Role.ADMIN);

        long totalExercises = exerciseRepo.count();
        long totalWorkoutPlans = planRepo.count();
        long totalWorkoutSessions = sessionRepo.count();

        Map<String, Long> usersByRole = new LinkedHashMap<>();
        for (Role r : Role.values()) {
            usersByRole.put(r.name(), userRepo.countByRole(r));
        }

        Map<String, Long> usersByStatus = new LinkedHashMap<>();
        for (UserStatus s : UserStatus.values()) {
            usersByStatus.put(s.name(), userRepo.countByStatus(s));
        }

        return new SystemAnalyticsResponse(
                totalUsers,
                activeUsers,
                suspendedUsers,
                totalCoaches,
                totalAdmins,
                totalExercises,
                totalWorkoutPlans,
                totalWorkoutSessions,
                usersByRole,
                usersByStatus
        );
    }
}
