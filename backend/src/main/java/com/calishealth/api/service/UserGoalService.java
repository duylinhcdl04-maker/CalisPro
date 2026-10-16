package com.calishealth.api.service;

import com.calishealth.api.dto.UserTraineeDtos.UserGoalRequest;
import com.calishealth.api.dto.UserTraineeDtos.UserGoalResponse;
import com.calishealth.api.entity.Goal;
import com.calishealth.api.entity.User;
import com.calishealth.api.entity.UserGoal;
import com.calishealth.api.entity.UserGoalStatus;
import com.calishealth.api.repository.GoalRepository;
import com.calishealth.api.repository.UserGoalRepository;
import com.calishealth.api.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class UserGoalService {
    private final UserGoalRepository userGoalRepository;
    private final UserRepository userRepository;
    private final GoalRepository goalRepository;

    public UserGoalService(UserGoalRepository userGoalRepository,
                           UserRepository userRepository,
                           GoalRepository goalRepository) {
        this.userGoalRepository = userGoalRepository;
        this.userRepository = userRepository;
        this.goalRepository = goalRepository;
    }

    @Transactional(readOnly = true)
    public List<UserGoalResponse> listUserGoals(Long userId) {
        return userGoalRepository.findByUserIdOrderByPriorityAsc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public UserGoalResponse addUserGoal(Long userId, UserGoalRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Goal goal = goalRepository.findById(req.goalId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found"));

        UserGoal ug = new UserGoal();
        ug.setUser(user);
        ug.setGoal(goal);
        if (req.priority() != null) ug.setPriority(req.priority());
        ug.setTargetValue(req.targetValue());
        ug.setTargetUnit(req.targetUnit());
        ug.setStartDate(req.startDate());
        ug.setTargetDate(req.targetDate());
        ug.setStatus(req.status() != null ? req.status() : UserGoalStatus.ACTIVE);

        UserGoal saved = userGoalRepository.save(ug);
        return toResponse(saved);
    }

    public UserGoalResponse updateUserGoal(Long userId, Long userGoalId, UserGoalRequest req) {
        UserGoal ug = userGoalRepository.findByIdAndUserId(userGoalId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User goal not found"));

        if (req.goalId() != null && !req.goalId().equals(ug.getGoal().getId())) {
            Goal goal = goalRepository.findById(req.goalId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found"));
            ug.setGoal(goal);
        }
        if (req.priority() != null) ug.setPriority(req.priority());
        if (req.targetValue() != null) ug.setTargetValue(req.targetValue());
        if (req.targetUnit() != null) ug.setTargetUnit(req.targetUnit());
        if (req.startDate() != null) ug.setStartDate(req.startDate());
        if (req.targetDate() != null) ug.setTargetDate(req.targetDate());
        if (req.status() != null) ug.setStatus(req.status());

        UserGoal saved = userGoalRepository.save(ug);
        return toResponse(saved);
    }

    public void deleteUserGoal(Long userId, Long userGoalId) {
        UserGoal ug = userGoalRepository.findByIdAndUserId(userGoalId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User goal not found"));
        userGoalRepository.delete(ug);
    }

    private UserGoalResponse toResponse(UserGoal ug) {
        return new UserGoalResponse(
                ug.getId(),
                ug.getUser().getId(),
                ug.getGoal().getId(),
                ug.getGoal().getCode(),
                ug.getGoal().getName(),
                ug.getPriority(),
                ug.getTargetValue(),
                ug.getTargetUnit(),
                ug.getStartDate(),
                ug.getTargetDate(),
                ug.getStatus(),
                ug.getCreatedAt()
        );
    }
}
