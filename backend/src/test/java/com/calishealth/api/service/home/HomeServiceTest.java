package com.calishealth.api.service.home;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Điểm sẵn sàng chỉ để gợi ý cường độ: chỉ số bỏ trống được loại khỏi công thức, không bị tính như điểm 0. */
class HomeServiceTest {
    @Test
    void fullCheckinIsWeightedByEnergySleepSorenessStress() {
        // năng lượng 4 -> 0,75; ngủ 7,5/8 -> 0,9375; đau mỏi 2 -> ít = 0,75; căng thẳng 2 -> ít = 0,75
        assertEquals(81, HomeService.readinessScore(4, 7.5, 2, 2));
    }

    @Test
    void bestAndWorstDays() {
        assertEquals(100, HomeService.readinessScore(5, 8.0, 1, 1));
        assertEquals(0, HomeService.readinessScore(1, 0.0, 5, 5));
    }

    @Test
    void sleepBeyondEightHoursDoesNotInflateTheScore() {
        assertEquals(HomeService.readinessScore(3, 8.0, 3, 3), HomeService.readinessScore(3, 12.0, 3, 3));
    }

    @Test
    void missingMetricsAreDroppedAndWeightsRenormalised_neverTreatedAsZero() {
        assertEquals(100, HomeService.readinessScore(5, null, null, null), "chỉ có năng lượng tối đa -> 100, không bị kéo xuống vì thiếu ngủ");
        assertEquals(50, HomeService.readinessScore(3, null, null, null));
        assertEquals(100, HomeService.readinessScore(null, 8.0, null, null));
        assertNull(HomeService.readinessScore(null, null, null, null), "không có chỉ số nào thì không có điểm");
    }

    @Test
    void levels() {
        assertEquals("GOOD", HomeService.readinessLevel(70));
        assertEquals("MEDIUM", HomeService.readinessLevel(69));
        assertEquals("MEDIUM", HomeService.readinessLevel(40));
        assertEquals("LOW", HomeService.readinessLevel(39));
    }
}
