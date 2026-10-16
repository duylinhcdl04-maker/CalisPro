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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserGoalServiceTest {

    @Mock
    private UserGoalRepository userGoalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GoalRepository goalRepository;

    private UserGoalService service;

    @BeforeEach
    void setUp() {
        service = new UserGoalService(userGoalRepository, userRepository, goalRepository);
    }

    @Test
    void listUserGoals_ReturnsList() {
        User user = new User();
        user.setId(5L);

        Goal goal = new Goal();
        goal.setId(1L);
        goal.setCode("MUSCLE_UP");
        goal.setName("First Muscle Up");

        UserGoal ug = new UserGoal();
        ug.setUser(user);
        ug.setGoal(goal);
        ug.setPriority(1);
        ug.setStatus(UserGoalStatus.ACTIVE);

        when(userGoalRepository.findByUserIdOrderByPriorityAsc(5L)).thenReturn(List.of(ug));

        List<UserGoalResponse> result = service.listUserGoals(5L);

        assertEquals(1, result.size());
        assertEquals("MUSCLE_UP", result.get(0).goalCode());
        assertEquals(1, result.get(0).priority());
    }

    @Test
    void addUserGoal_Success() {
        User user = new User();
        user.setId(5L);

        Goal goal = new Goal();
        goal.setId(2L);
        goal.setCode("PUSH_UPS");
        goal.setName("50 Push Ups");

        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(goalRepository.findById(2L)).thenReturn(Optional.of(goal));
        when(userGoalRepository.save(any(UserGoal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserGoalRequest req = new UserGoalRequest(
                2L,
                1,
                BigDecimal.valueOf(50),
                "reps",
                LocalDate.now(),
                LocalDate.now().plusMonths(2),
                UserGoalStatus.ACTIVE
        );

        UserGoalResponse resp = service.addUserGoal(5L, req);

        assertNotNull(resp);
        assertEquals("PUSH_UPS", resp.goalCode());
        assertEquals(BigDecimal.valueOf(50), resp.targetValue());
        verify(userGoalRepository).save(any(UserGoal.class));
    }
}
