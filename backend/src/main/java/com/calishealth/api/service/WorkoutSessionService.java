package com.calishealth.api.service;

import com.calishealth.api.dto.WorkoutDtos.WorkoutSessionRequest;
import com.calishealth.api.dto.WorkoutDtos.WorkoutSessionResponse;
import com.calishealth.api.entity.User;
import com.calishealth.api.entity.WorkoutPlan;
import com.calishealth.api.entity.WorkoutSession;
import com.calishealth.api.entity.WorkoutSessionStatus;
import com.calishealth.api.repository.UserRepository;
import com.calishealth.api.repository.WorkoutPlanRepository;
import com.calishealth.api.repository.WorkoutSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class WorkoutSessionService {
    private final WorkoutSessionRepository sessionRepo;
    private final UserRepository userRepo;
    private final WorkoutPlanRepository planRepo;
    private final com.calishealth.api.service.level.TrainingLogService trainingLog;

    public WorkoutSessionService(WorkoutSessionRepository sessionRepo, UserRepository userRepo, WorkoutPlanRepository planRepo,
                                 com.calishealth.api.service.level.TrainingLogService trainingLog) {
        this.trainingLog = trainingLog;
        this.sessionRepo = sessionRepo;
        this.userRepo = userRepo;
        this.planRepo = planRepo;
    }

    public List<WorkoutSessionResponse> listUserSessions(Long userId) {
        return sessionRepo.findByUserIdOrderByStartedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public WorkoutSessionResponse getSession(Long userId, Long id) {
        WorkoutSession s = sessionRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy buổi tập với ID: " + id));
        return toResponse(s);
    }

    public com.calishealth.api.dto.UserTraineeDtos.WorkoutPerformanceReport getSessionReport(Long userId, Long id) {
        WorkoutSession s = sessionRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy buổi tập với ID: " + id));

        String planName = s.getWorkoutPlan() != null ? s.getWorkoutPlan().getName() : "Buổi tập tự do";
        String feedback;
        if (s.getStatus() == WorkoutSessionStatus.COMPLETED) {
            int diff = s.getDifficultyRating() != null ? s.getDifficultyRating() : 3;
            if (diff >= 4) {
                feedback = "Bạn đã hoàn thành xuất sắc buổi tập cường độ cao! Hãy bổ sung nước và nghỉ ngơi đầy đủ.";
            } else {
                feedback = "Hoàn thành buổi tập rất tốt! Động tác chuẩn chỉ và duy trì thể lực ổn định.";
            }
        } else if (s.getStatus() == WorkoutSessionStatus.ABANDONED) {
            feedback = "Buổi tập bị gián đoạn. Đừng nản lòng, hãy hồi phục và sẵn sàng cho buổi tiếp theo!";
        } else {
            feedback = "Buổi tập đang được ghi nhận.";
        }

        return new com.calishealth.api.dto.UserTraineeDtos.WorkoutPerformanceReport(
                s.getId(),
                planName,
                s.getStartedAt(),
                s.getCompletedAt(),
                s.getDurationSeconds(),
                s.getStatus().name(),
                s.getEnergyLevel(),
                s.getDifficultyRating(),
                s.getNotes(),
                feedback
        );
    }

    @Transactional
    public WorkoutSessionResponse createSession(Long userId, WorkoutSessionRequest req) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

        WorkoutPlan plan = null;
        if (req.workoutPlanId() != null) {
            plan = planRepo.findByIdAndUserId(req.workoutPlanId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch tập luyện ID: " + req.workoutPlanId()));
        }

        WorkoutSession s = new WorkoutSession();
        s.setUser(user);
        s.setWorkoutPlan(plan);
        s.setStartedAt(req.startedAt() != null ? req.startedAt() : Instant.now());
        s.setCompletedAt(req.completedAt());
        s.setDurationSeconds(req.durationSeconds());
        s.setStatus(req.status() != null ? req.status() : WorkoutSessionStatus.IN_PROGRESS);
        s.setEnergyLevel(req.energyLevel());
        s.setDifficultyRating(req.difficultyRating());
        s.setNotes(req.notes());

        WorkoutSession saved = sessionRepo.save(s);
        // Buổi tập hoàn thành: bài có form đo bằng AI được tính vào Skill Tree (Level Engine)
        if (saved.getStatus() == WorkoutSessionStatus.COMPLETED) trainingLog.onWorkoutCompleted(userId, saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public WorkoutSessionResponse updateSession(Long userId, Long id, WorkoutSessionRequest req) {
        WorkoutSession s = sessionRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy buổi tập với ID: " + id));

        if (req.workoutPlanId() != null) {
            WorkoutPlan plan = planRepo.findByIdAndUserId(req.workoutPlanId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch tập luyện ID: " + req.workoutPlanId()));
            s.setWorkoutPlan(plan);
        }
        WorkoutSessionStatus before = s.getStatus();
        if (req.startedAt() != null) s.setStartedAt(req.startedAt());
        if (req.completedAt() != null) s.setCompletedAt(req.completedAt());
        if (req.durationSeconds() != null) s.setDurationSeconds(req.durationSeconds());
        if (req.status() != null) s.setStatus(req.status());
        if (req.energyLevel() != null) s.setEnergyLevel(req.energyLevel());
        if (req.difficultyRating() != null) s.setDifficultyRating(req.difficultyRating());
        if (req.notes() != null) s.setNotes(req.notes());

        WorkoutSession saved = sessionRepo.save(s);
        if (before != WorkoutSessionStatus.COMPLETED && saved.getStatus() == WorkoutSessionStatus.COMPLETED) {
            trainingLog.onWorkoutCompleted(userId, saved.getId());
        }
        return toResponse(saved);
    }

    @Transactional
    public void deleteSession(Long userId, Long id) {
        WorkoutSession s = sessionRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy buổi tập với ID: " + id));
        sessionRepo.delete(s);
    }

    private WorkoutSessionResponse toResponse(WorkoutSession s) {
        return new WorkoutSessionResponse(
                s.getId(),
                s.getUser().getId(),
                s.getWorkoutPlan() != null ? s.getWorkoutPlan().getId() : null,
                s.getWorkoutPlan() != null ? s.getWorkoutPlan().getName() : null,
                s.getWorkoutPlanDay() != null ? s.getWorkoutPlanDay().getId() : null,
                s.getStartedAt(),
                s.getCompletedAt(),
                s.getDurationSeconds(),
                s.getStatus(),
                s.getEnergyLevel(),
                s.getDifficultyRating(),
                s.getNotes(),
                s.getCreatedAt()
        );
    }
}
