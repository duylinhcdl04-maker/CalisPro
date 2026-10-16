package com.calishealth.api.service.motion;

import com.calishealth.api.dto.MotionDtos.MeasurementDto;
import com.calishealth.api.dto.MotionDtos.RuleUpsertRequest;
import com.calishealth.api.service.motion.MotionRuleDuplicates.Shape;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** Hai rule của cùng một động tác trùng khi cùng mã, cùng tên, hoặc đo cùng một thứ ở pha giao nhau với vùng chuẩn chồng lên nhau. */
class MotionRuleDuplicatesTest {
    private static MeasurementDto pts(Integer... p) { return new MeasurementDto(List.of(p), null, null, null, null, null); }

    private static Shape rule(String code, String name, String metric, String phase, MeasurementDto m, String op, Double min, Double max, Double target) {
        return MotionRuleDuplicates.of(new RuleUpsertRequest(code, name, null, phase, metric, m, "DEGREE", op, target, min, max, true, true, List.of(),
                "WARNING", 5, false, null, false, "FRAME", 3, 3000L, 0L, "FB", "ANY", "AI_SUGGESTED", null, null));
    }

    private static Shape angle(String code, String name, String phase, MeasurementDto m, String op, Double min, Double max) {
        return rule(code, name, "ANGLE_3_POINT", phase, m, op, min, max, null);
    }

    @Test
    void sameCodeOrSameNameIsDuplicate_ignoringCaseAccentsAndSpaces() {
        Shape a = angle("PUSHUP_HIP", "Võng hông (Sagging Hips)", "ALL", pts(11, 23, 25), "MINIMUM_REQUIRED", 160.0, null);
        assertNotNull(MotionRuleDuplicates.conflict(angle("pushup_hip", "Khác hẳn", "ALL", pts(12, 24, 26), "MINIMUM_REQUIRED", 90.0, null), a), "trùng mã (không phân biệt hoa thường)");
        assertNotNull(MotionRuleDuplicates.conflict(angle("OTHER_CODE", "vong hong (sagging hips)", "ALL", pts(12, 24, 26), "MINIMUM_REQUIRED", 90.0, null), a), "trùng tên không dấu");
    }

    @Test
    void measuringTheSameThingWithOverlappingRangeIsDuplicate_evenWhenEndpointsSwap() {
        Shape existing = angle("A", "Hông thẳng", "ALL", pts(11, 23, 25), "MINIMUM_REQUIRED", 160.0, null);
        assertNotNull(MotionRuleDuplicates.conflict(angle("B", "Hông không võng", "ALL", pts(25, 23, 11), "MINIMUM_REQUIRED", 155.0, null), existing),
                "đảo hai đầu của góc vẫn là cùng một góc, vùng ≥155 chồng vùng ≥160");
    }

    @Test
    void sameMeasurementButDisjointRangeIsADifferentRule() {
        Shape bottom = angle("A", "Đáy đủ sâu", "BOTTOM", pts(11, 13, 15), "MAXIMUM_ALLOWED", null, 90.0);
        Shape top = angle("B", "Duỗi đủ tay", "BOTTOM", pts(11, 13, 15), "MINIMUM_REQUIRED", 160.0, null);
        assertNull(MotionRuleDuplicates.conflict(top, bottom), "≤90 và ≥160 không chồng nhau: hai lỗi khác nhau");
        assertNull(MotionRuleDuplicates.conflict(angle("C", "Khuỷu khoảng giữa", "ALL", pts(11, 13, 15), "BETWEEN", 100.0, 140.0), bottom));
    }

    @Test
    void differentJointsOrDifferentMetricAreNotDuplicates() {
        Shape left = angle("A", "Khuỷu trái", "ALL", pts(11, 13, 15), "BETWEEN", 80.0, 100.0);
        assertNull(MotionRuleDuplicates.conflict(angle("B", "Khuỷu phải", "ALL", pts(12, 14, 16), "BETWEEN", 80.0, 100.0), left), "khớp khác");
        assertNull(MotionRuleDuplicates.conflict(rule("C", "Khoảng cách tay", "DISTANCE", "ALL", pts(11, 13), "BETWEEN", 80.0, 100.0, null), left), "loại chỉ số khác");
    }

    @Test
    void phasesMustIntersect_andAllIntersectsEverything() {
        Shape bottom = angle("A", "Ở đáy", "BOTTOM", pts(11, 13, 15), "BETWEEN", 80.0, 100.0);
        assertNull(MotionRuleDuplicates.conflict(angle("B", "Ở đỉnh", "TOP", pts(11, 13, 15), "BETWEEN", 80.0, 100.0), bottom), "hai pha khác nhau");
        assertNotNull(MotionRuleDuplicates.conflict(angle("C", "Mọi pha", "ALL", pts(11, 13, 15), "BETWEEN", 80.0, 100.0), bottom), "ALL giao với BOTTOM");
    }

    @Test
    void partialOverlapBelowHalfOfTheNarrowerRangeIsNotDuplicate() {
        Shape a = angle("A", "Vùng 80-100", "ALL", pts(11, 13, 15), "BETWEEN", 80.0, 100.0);
        assertNull(MotionRuleDuplicates.conflict(angle("B", "Vùng 95-140", "ALL", pts(11, 13, 15), "BETWEEN", 95.0, 140.0), a), "chồng 5 trên 20 (<50%)");
        assertNotNull(MotionRuleDuplicates.conflict(angle("C", "Vùng 85-120", "ALL", pts(11, 13, 15), "BETWEEN", 85.0, 120.0), a), "chồng 15 trên 20 (≥50%)");
    }

    @Test
    void metricsWithoutLandmarksCompareByTypeOnly() {
        Shape a = rule("A", "Thời lượng rep", "REP_VALIDATION", "ALL", new MeasurementDto(List.of(), null, null, null, null, null), "EQUAL", null, null, 1.0);
        assertNotNull(MotionRuleDuplicates.conflict(rule("B", "Rep đủ thời gian", "REP_VALIDATION", "ALL", new MeasurementDto(List.of(), null, null, null, null, null), "EQUAL", null, null, 1.0), a));
        assertNull(MotionRuleDuplicates.conflict(rule("C", "Chuỗi pha", "REP_SEQUENCE", "ALL", new MeasurementDto(List.of(), null, null, null, null, null), "EQUAL", null, null, 1.0), a));
    }

    @Test
    void firstConflictScansAllExistingRules() {
        List<Shape> existing = List.of(angle("A", "Một", "ALL", pts(11, 13, 15), "BETWEEN", 80.0, 100.0), angle("B", "Hai", "ALL", pts(23, 25, 27), "BETWEEN", 80.0, 100.0));
        assertTrue(MotionRuleDuplicates.firstConflict(angle("C", "Ba", "ALL", pts(23, 25, 27), "BETWEEN", 85.0, 95.0), existing).isPresent());
        assertTrue(MotionRuleDuplicates.firstConflict(angle("D", "Bốn", "ALL", pts(12, 14, 16), "BETWEEN", 85.0, 95.0), existing).isEmpty());
    }
}
