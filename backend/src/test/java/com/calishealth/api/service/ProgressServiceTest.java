package com.calishealth.api.service;

import com.calishealth.api.dto.UserTraineeDtos.ProgressOverviewResponse;
import com.calishealth.api.entity.DailyCheckin;
import com.calishealth.api.entity.FitnessProfile;
import com.calishealth.api.entity.UserProfile;
import com.calishealth.api.entity.WorkoutSession;
import com.calishealth.api.repository.BodyMeasurementRepository;
import com.calishealth.api.repository.DailyCheckinRepository;
import com.calishealth.api.repository.FitnessProfileRepository;
import com.calishealth.api.repository.UserProfileRepository;
import com.calishealth.api.repository.WorkoutSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProgressServiceTest {

    @Mock
    private WorkoutSessionRepository workoutSessionRepository;
    @Mock
    private DailyCheckinRepository dailyCheckinRepository;
    @Mock
    private BodyMeasurementRepository bodyMeasurementRepository;
    @Mock
    private FitnessProfileRepository fitnessProfileRepository;
    @Mock
    private UserProfileRepository userProfileRepository;

    private ProgressService service;

    @BeforeEach
    void setUp() {
        service = new ProgressService(
                workoutSessionRepository,
                dailyCheckinRepository,
                bodyMeasurementRepository,
                fitnessProfileRepository,
                userProfileRepository
        );
    }

    @Test
    void getOverview_CalculatesCorrectly() {
        Long userId = 100L;

        WorkoutSession s1 = new WorkoutSession();
        s1.setDurationSeconds(1800); // 30 mins
        WorkoutSession s2 = new WorkoutSession();
        s2.setDurationSeconds(2400); // 40 mins

        when(workoutSessionRepository.findByUserIdOrderByStartedAtDesc(userId)).thenReturn(List.of(s1, s2));

        DailyCheckin c1 = new DailyCheckin();
        c1.setCheckinDate(LocalDate.now());
        when(dailyCheckinRepository.findByUserIdOrderByCheckinDateDesc(userId)).thenReturn(List.of(c1));

        when(bodyMeasurementRepository.findByUserIdOrderByMeasurementDateDesc(userId)).thenReturn(Collections.emptyList());

        UserProfile profile = new UserProfile();
        profile.setWeightKg(BigDecimal.valueOf(70.0));
        when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));

        FitnessProfile fp = new FitnessProfile();
        fp.setFitnessLevel("INTERMEDIATE");
        when(fitnessProfileRepository.findTopByUserIdOrderByCreatedAtDesc(userId)).thenReturn(Optional.of(fp));

        ProgressOverviewResponse overview = service.getOverview(userId);

        assertNotNull(overview);
        assertEquals(2, overview.totalWorkouts());
        assertEquals(70, overview.totalDurationMinutes()); // 30 + 40
        assertEquals(1, overview.checkinsLast7Days());
        assertEquals(BigDecimal.valueOf(70.0), overview.latestWeightKg());
        assertEquals("INTERMEDIATE", overview.currentFitnessLevel());
    }
}
