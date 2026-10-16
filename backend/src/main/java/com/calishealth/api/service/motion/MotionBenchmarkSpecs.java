package com.calishealth.api.service.motion;

import com.calishealth.api.engine.motion.MotionTypes.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Bản NHÁP rule chấm form cho các bài nằm trên đường Baseline L0–L3 (mandatory hoặc bài nền), cùng cấu hình đếm rep/giữ của profile.
 * Giá trị là ngưỡng tham khảo huấn luyện (COACHING_BENCHMARK) do kỹ sư soạn, CHƯA được kiểm chứng trên video thật và CHƯA có Coach duyệt.
 * Rule vào DB ở trạng thái DRAFT: Coach chạy Rule Tester, chỉnh ngưỡng, gửi duyệt, rồi người duyệt xuất bản (MotionConfigService).
 * Toàn bộ dùng landmark bên TRÁI cơ thể (11/13/15, 23/25/27) như bộ Push-Up tham chiếu: camera đặt phía trái người tập
 * (chưa tự chọn bên rõ hơn - hạn chế đã biết).
 */
public final class MotionBenchmarkSpecs {
    private MotionBenchmarkSpecs() {}

    public static final String SOURCE_REFERENCE = "Ngưỡng tham khảo huấn luyện (coaching benchmark) do kỹ sư soạn làm bản nháp, CHƯA kiểm chứng trên video thật - Coach cần xác nhận hoặc chỉnh trước khi xuất bản. Xem docs/MOTION_RULES_L1_L3.md";

    public record RuleSpec(String code, String name, String phase, MetricType metric, List<Integer> points, String method, String phaseArg,
                           String unit, Operator operator, Double target, Double normalMin, Double normalMax, Severity severity, int priority,
                           boolean invalidRep, PersistenceType persistenceType, int persistence, long cooldownMs, String camera,
                           List<Band> bands, String uiText, String voiceText) {

        public Measurement measurement() { return new Measurement(metric, points, List.of(), method, null, phaseArg, null); }

        public RuleDef toRuleDef(long id) {
            return new RuleDef(id, code, 1, name, "DRAFT", phase, measurement(), unit, operator, target, normalMin, normalMax, true, true, bands,
                    severity, priority, invalidRep, null, false, persistenceType, persistence, cooldownMs, 0, code, camera);
        }
    }

    public record ExerciseSpec(String exerciseCode, String cameraView, String movementType, List<Integer> repPoints, Double repTop, Double repBottom,
                               String repDirection, long minRepMs, long maxRepMs, long debounceMs, String note, List<RuleSpec> rules) {
        public Measurement repMetric() { return Measurement.angle(repPoints.get(0), repPoints.get(1), repPoints.get(2)); }
    }

    // ---- khuôn rule dùng chung ----

    private static List<Band> below(double min, double warnWidth) {   // thiếu so với ngưỡng tối thiểu
        return List.of(new Band(Severity.WARNING, min - warnWidth, min, true, false), new Band(Severity.ERROR, null, min - warnWidth, false, false));
    }

    private static List<Band> above(double max, double warnWidth) {   // vượt ngưỡng tối đa
        return List.of(new Band(Severity.WARNING, max, max + warnWidth, false, true), new Band(Severity.ERROR, max + warnWidth, null, false, false));
    }

    private static RuleSpec depth(String prefix, List<Integer> pts, double minRom, String ui, String voice) {
        return new RuleSpec(prefix + "_DEPTH", "Biên độ chưa đủ", "ALL", MetricType.ROM, pts, null, null, "DEGREE", Operator.MINIMUM_REQUIRED, null,
                minRom, null, Severity.WARNING, 8, true, PersistenceType.FRAME, 1, 0, "SIDE", below(minRom, 15), ui, voice);
    }

    private static RuleSpec fullRep(String prefix) {
        return new RuleSpec(prefix + "_FULL_REP", "Rep thiếu pha (không đủ chu kỳ)", "ALL", MetricType.REP_SEQUENCE, List.of(), null, null, "BOOLEAN",
                Operator.EQUAL, 1.0, null, null, Severity.WARNING, 6, true, PersistenceType.FRAME, 1, 0, "ANY", List.of(),
                "Thực hiện đủ chu kỳ: xuống, chạm đáy rồi trở lại hết tầm.", "Làm đủ biên độ");
    }

    private static RuleSpec bodyLine(String prefix, double maxDeviation, boolean invalidRep, String ui, String voice) {
        return new RuleSpec(prefix + "_BODY_LINE", "Thân người không thẳng", "ALL", MetricType.ALIGNMENT, List.of(11, 23, 27), "COLLINEARITY", null, "DEGREE",
                Operator.MAXIMUM_ALLOWED, null, null, maxDeviation, Severity.WARNING, 9, invalidRep, PersistenceType.TIME, 300, 4000, "SIDE",
                above(maxDeviation, 10), ui, voice);
    }

    private static RuleSpec visibility(String prefix, Integer... pts) {
        return new RuleSpec(prefix + "_CAMERA_VISIBILITY", "Camera không thấy rõ khớp cần đo", "ALL", MetricType.LANDMARK_VISIBILITY, List.of(pts), null, null, "RATIO",
                Operator.MINIMUM_REQUIRED, null, 0.6, null, Severity.INFO, 3, false, PersistenceType.TIME, 1000, 8000, "ANY",
                List.of(new Band(Severity.INFO, null, 0.6, false, false)),
                "Camera chưa thấy rõ toàn thân - đặt máy ngang hông, cách 2-3 mét, phía bên trái của bạn.", "Lùi ra cho camera thấy toàn thân");
    }

    private static RuleSpec eccentricTempo(String prefix) {
        return new RuleSpec(prefix + "_ECCENTRIC_TEMPO", "Hạ người quá nhanh", "ALL", MetricType.TEMPO, List.of(), null, "DESCENDING", "SECOND",
                Operator.MINIMUM_REQUIRED, null, 0.5, null, Severity.INFO, 5, false, PersistenceType.FRAME, 1, 5000, "ANY",
                List.of(new Band(Severity.INFO, 0.3, 0.5, true, false), new Band(Severity.WARNING, null, 0.3, false, false)),
                "Hạ người chậm và có kiểm soát (khoảng 1-2 giây).", "Hạ chậm lại");
    }

    private static RuleSpec straightLimb(String code, String name, List<Integer> pts, double minAngle, String ui, String voice) {
        return new RuleSpec(code, name, "ALL", MetricType.ANGLE_3_POINT, pts, null, null, "DEGREE", Operator.MINIMUM_REQUIRED, null, minAngle, null,
                Severity.WARNING, 7, false, PersistenceType.TIME, 500, 4000, "SIDE", below(minAngle, 15), ui, voice);
    }

    private static final List<Integer> ELBOW = List.of(11, 13, 15), KNEE = List.of(23, 25, 27), HIP = List.of(11, 23, 27);

    /** Các bài thuộc đường Baseline L0-L3 (mandatory, hoặc bài nền của ladder). Bài skill/kéo-đẩy nâng cao (L3-L4) làm ở đợt sau. */
    public static List<ExerciseSpec> all() {
        List<ExerciseSpec> s = new ArrayList<>();

        s.add(new ExerciseSpec("incline-push-up", "SIDE", "REPS", ELBOW, 160.0, 100.0, "DESCENDING_FIRST", 1200, 10_000, 400,
                "Hít đất nghiêng (tay chống bục): đáy nông hơn push-up thường.",
                List.of(bodyLine("INCLINE_PUSHUP", 12, false, "Giữ thân người thẳng từ vai tới cổ chân - siết bụng và mông.", "Giữ thân thẳng"),
                        depth("INCLINE_PUSHUP", ELBOW, 55, "Hạ ngực gần bục hơn, khuỷu tay gập khoảng 90-100 độ.", "Hạ sâu hơn"),
                        fullRep("INCLINE_PUSHUP"), visibility("INCLINE_PUSHUP", 11, 13, 15, 23, 27))));

        s.add(new ExerciseSpec("dips", "SIDE", "REPS", ELBOW, 155.0, 95.0, "DESCENDING_FIRST", 1500, 10_000, 400,
                "Dips xà kép: tay gần thẳng ở đỉnh, vai ngang khuỷu ở đáy.",
                List.of(depth("DIPS", ELBOW, 50, "Hạ thấp hơn cho tới khi vai ngang khuỷu tay.", "Hạ sâu hơn"),
                        fullRep("DIPS"), eccentricTempo("DIPS"), visibility("DIPS", 11, 13, 15, 23))));

        s.add(new ExerciseSpec("pull-up", "SIDE", "REPS", ELBOW, 160.0, 85.0, "DESCENDING_FIRST", 1500, 12_000, 400,
                "Pull-up: góc khuỷu giảm khi kéo; đỉnh = treo thẳng tay, đáy = cằm qua xà.",
                List.of(depth("PULLUP", ELBOW, 65, "Kéo cao hơn cho tới khi cằm qua xà.", "Kéo cao hơn"),
                        fullRep("PULLUP"),
                        bodyLine("PULLUP", 25, false, "Hạn chế đung đưa người, giữ thân thẳng và siết bụng.", "Đừng đung đưa"),
                        visibility("PULLUP", 11, 13, 15, 23, 27))));

        s.add(new ExerciseSpec("australian-pull-up", "SIDE", "REPS", ELBOW, 160.0, 80.0, "DESCENDING_FIRST", 1500, 10_000, 400,
                "Kéo xà thấp (inverted row): thân thẳng, ngực chạm xà.",
                List.of(bodyLine("AUSTRALIAN", 15, false, "Giữ thân thẳng như tấm ván, không để hông chùng.", "Giữ hông cao"),
                        depth("AUSTRALIAN", ELBOW, 60, "Kéo ngực chạm xà, khuỷu tay gập hết cỡ.", "Kéo sát hơn"),
                        fullRep("AUSTRALIAN"), visibility("AUSTRALIAN", 11, 13, 15, 23, 27))));

        s.add(new ExerciseSpec("bodyweight-squat", "SIDE", "REPS", KNEE, 165.0, 100.0, "DESCENDING_FIRST", 1500, 10_000, 400,
                "Squat bodyweight: đáy khi đùi gần song song sàn (góc gối khoảng 90-100 độ).",
                List.of(depth("SQUAT", KNEE, 55, "Hạ thấp hơn cho tới khi đùi gần song song với sàn.", "Xuống sâu hơn"),
                        fullRep("SQUAT"), eccentricTempo("SQUAT"), visibility("SQUAT", 11, 23, 25, 27))));

        s.add(new ExerciseSpec("assisted-squat", "SIDE", "REPS", KNEE, 165.0, 115.0, "DESCENDING_FIRST", 1500, 12_000, 400,
                "Squat có bám hỗ trợ - bài nền cho mức thấp nhất của chân; đáy nông hơn.",
                List.of(depth("ASSISTED_SQUAT", KNEE, 40, "Hạ thấp thêm một chút, bám chắc điểm tựa.", "Xuống thêm"),
                        fullRep("ASSISTED_SQUAT"), visibility("ASSISTED_SQUAT", 23, 25, 27))));

        s.add(new ExerciseSpec("bulgarian-split-squat", "SIDE", "REPS", KNEE, 160.0, 100.0, "DESCENDING_FIRST", 1500, 12_000, 400,
                "Split squat chân sau gác ghế: đo gối chân trước (bên trái).",
                List.of(depth("BULGARIAN", KNEE, 50, "Hạ thấp hơn cho tới khi đùi trước gần song song sàn.", "Xuống sâu hơn"),
                        fullRep("BULGARIAN"), visibility("BULGARIAN", 11, 23, 25, 27))));

        s.add(new ExerciseSpec("shrimp-squat", "SIDE", "REPS", KNEE, 160.0, 85.0, "DESCENDING_FIRST", 2000, 12_000, 500,
                "Shrimp squat: đáy sâu, gối chân trụ gập mạnh.",
                List.of(depth("SHRIMP", KNEE, 65, "Hạ sâu hơn, gối sau gần chạm sàn.", "Xuống sâu hơn"),
                        fullRep("SHRIMP"), visibility("SHRIMP", 11, 23, 25, 27))));

        s.add(new ExerciseSpec("dead-hang", "SIDE", "HOLD", ELBOW, 190.0, 160.0, null, 0, 0, 0,
                "Treo xà: tính là đang giữ khi tay gần thẳng (góc khuỷu 160-190 độ).",
                List.of(new RuleSpec("DEAD_HANG_SWING", "Đung đưa người khi treo", "ALL", MetricType.ALIGNMENT, HIP, "COLLINEARITY", null, "DEGREE",
                                Operator.MAXIMUM_ALLOWED, null, null, 20.0, Severity.INFO, 4, false, PersistenceType.TIME, 500, 8000, "SIDE",
                                above(20, 15), "Giữ người yên, siết nhẹ bụng và vai.", "Giữ người yên"),
                        visibility("DEAD_HANG", 11, 13, 15, 23))));

        s.add(new ExerciseSpec("plank", "SIDE", "HOLD", HIP, 190.0, 160.0, null, 0, 0, 0,
                "Plank: tính là đang giữ khi thân gần thẳng (góc vai-hông-cổ chân 160-190 độ).",
                List.of(bodyLine("PLANK", 10, false, "Giữ thân thẳng - siết bụng và mông, đừng võng lưng.", "Siết bụng, giữ thân thẳng"),
                        visibility("PLANK", 11, 23, 27))));

        s.add(new ExerciseSpec("hollow-body-hold", "SIDE", "HOLD", HIP, 172.0, 135.0, null, 0, 0, 0,
                "Hollow body: vai và chân nâng khỏi sàn, hông hơi gập (góc vai-hông-cổ chân 135-172 độ). Không đo được độ áp lưng dưới xuống sàn.",
                List.of(straightLimb("HOLLOW_KNEES_STRAIGHT", "Gối cong khi giữ", KNEE, 160, "Duỗi thẳng chân.", "Duỗi thẳng chân"),
                        visibility("HOLLOW", 11, 23, 25, 27))));

        s.add(new ExerciseSpec("l-sit", "SIDE", "HOLD", HIP, 115.0, 65.0, null, 0, 0, 0,
                "L-sit: thân và chân tạo góc khoảng 90 độ (góc vai-hông-cổ chân 65-115 độ), chân thẳng.",
                List.of(straightLimb("LSIT_KNEES_STRAIGHT", "Gối cong khi giữ L-sit", KNEE, 155, "Duỗi thẳng chân, mũi chân hướng ra trước.", "Duỗi thẳng chân"),
                        visibility("LSIT", 11, 23, 25, 27))));

        s.addAll(advanced());
        return List.copyOf(s);
    }

    /**
     * Đợt 2: bài bậc L3-L4 và kỹ năng. Cùng mức tin cậy với đợt 1 (nháp kỹ thuật, chưa kiểm chứng video thật); các bài đảo ngược/treo xà
     * khó đo hơn nên ngưỡng rộng hơn và nhiều ghi chú cần Coach xác nhận.
     */
    static List<ExerciseSpec> advanced() {
        List<ExerciseSpec> s = new ArrayList<>();

        s.add(new ExerciseSpec("muscle-up", "SIDE", "REPS", ELBOW, 160.0, 70.0, "DESCENDING_FIRST", 2000, 14_000, 500,
                "Muscle-up: một rep = kéo (khuỷu gập sâu) rồi đẩy lên qua xà (khuỷu duỗi lại). Chỉ đo góc khuỷu nên chưa phân biệt kéo thường với kipping lớn.",
                List.of(depth("MUSCLEUP", ELBOW, 80, "Kéo cao hơn, ngực chạm xà trước khi chuyển lên.", "Kéo cao hơn"),
                        fullRep("MUSCLEUP"),
                        bodyLine("MUSCLEUP", 30, false, "Hạn chế đung đưa, giữ thân chặt (không kipping).", "Đừng đung đưa"),
                        visibility("MUSCLEUP", 11, 13, 15, 23, 27))));

        s.add(new ExerciseSpec("handstand-push-up", "SIDE", "REPS", ELBOW, 160.0, 90.0, "DESCENDING_FIRST", 2000, 14_000, 500,
                "Hít đất trồng chuối (có tường): thân đảo ngược nên 'thân thẳng' đo bằng vai-hông-cổ chân gần thẳng hàng.",
                List.of(depth("HSPU", ELBOW, 55, "Hạ đầu thấp hơn, khuỷu tay gập khoảng 90 độ.", "Hạ sâu hơn"),
                        fullRep("HSPU"),
                        bodyLine("HSPU", 15, false, "Giữ thân thẳng, siết bụng, không võng lưng.", "Siết bụng, giữ thân thẳng"),
                        visibility("HSPU", 11, 13, 15, 23, 27))));

        s.add(new ExerciseSpec("chest-to-bar-pull-up", "SIDE", "REPS", ELBOW, 160.0, 70.0, "DESCENDING_FIRST", 1800, 12_000, 400,
                "Pull-up kéo ngực chạm xà: đáy khuỷu gập sâu hơn pull-up thường.",
                List.of(depth("C2BPULLUP", ELBOW, 80, "Kéo cao hơn cho tới khi ngực chạm xà.", "Kéo ngực chạm xà"),
                        fullRep("C2BPULLUP"),
                        bodyLine("C2BPULLUP", 25, false, "Hạn chế đung đưa người, giữ thân thẳng.", "Đừng đung đưa"),
                        visibility("C2BPULLUP", 11, 13, 15, 23, 27))));

        s.add(new ExerciseSpec("pseudo-planche-push-up", "SIDE", "REPS", ELBOW, 160.0, 90.0, "DESCENDING_FIRST", 1800, 12_000, 400,
                "Hít đất nghiêng người ra trước (vai vượt qua cổ tay): vẫn giữ thân thẳng hàng.",
                List.of(bodyLine("PSEUDOPLANCHE", 12, false, "Giữ thân người thẳng từ vai tới cổ chân, siết bụng và mông.", "Giữ thân thẳng"),
                        depth("PSEUDOPLANCHE", ELBOW, 55, "Hạ sâu hơn, khuỷu tay gập khoảng 90 độ.", "Hạ sâu hơn"),
                        fullRep("PSEUDOPLANCHE"), visibility("PSEUDOPLANCHE", 11, 13, 15, 23, 27))));

        s.add(new ExerciseSpec("pistol-squat", "SIDE", "REPS", KNEE, 160.0, 65.0, "DESCENDING_FIRST", 2500, 14_000, 500,
                "Squat một chân: đo gối chân trụ (bên trái); chưa kiểm tra chân kia duỗi thẳng phía trước.",
                List.of(depth("PISTOL", KNEE, 90, "Hạ sâu hơn, mông gần chạm gót.", "Xuống sâu hơn"),
                        fullRep("PISTOL"), eccentricTempo("PISTOL"), visibility("PISTOL", 11, 23, 25, 27))));

        s.add(new ExerciseSpec("hanging-leg-raise", "SIDE", "REPS", HIP, 175.0, 100.0, "DESCENDING_FIRST", 1800, 12_000, 400,
                "Nâng chân khi treo xà: góc vai-hông-cổ chân giảm khi nâng (treo thẳng khoảng 175 độ, chân ngang khoảng 90 độ).",
                List.of(depth("HLR", HIP, 55, "Nâng chân cao hơn, gần ngang xà hơn.", "Nâng cao hơn"),
                        straightLimb("HLR_KNEES_STRAIGHT", "Gối cong khi nâng chân", KNEE, 150, "Giữ chân thẳng khi nâng.", "Duỗi thẳng chân"),
                        fullRep("HLR"), visibility("HLR", 11, 23, 25, 27))));

        s.add(new ExerciseSpec("wall-pike-hold", "SIDE", "HOLD", HIP, 115.0, 70.0, null, 0, 0, 0,
                "Giữ pike chân gác tường, hông cao (góc vai-hông-cổ chân 70-115 độ).",
                List.of(straightLimb("WALLPIKE_KNEES_STRAIGHT", "Gối cong khi giữ pike", KNEE, 155, "Duỗi thẳng chân, đẩy hông lên cao.", "Duỗi thẳng chân"),
                        visibility("WALLPIKE", 11, 23, 25, 27))));

        s.add(new ExerciseSpec("crow-pose", "SIDE", "HOLD", ELBOW, 130.0, 60.0, null, 0, 0, 0,
                "Tư thế quạ: khuỷu gập khoảng 90-120 độ khi gối tựa lên cánh tay. Chưa đo được chân đã nhấc khỏi sàn chưa.",
                List.of(visibility("CROW", 11, 13, 15, 23, 27))));

        s.add(new ExerciseSpec("chest-to-wall-handstand", "SIDE", "HOLD", HIP, 190.0, 160.0, null, 0, 0, 0,
                "Trồng chuối quay ngực vào tường: tính là đang giữ khi thân gần thẳng hàng (góc vai-hông-cổ chân 160-190 độ).",
                List.of(bodyLine("C2WHANDSTAND", 12, false, "Giữ thân thẳng, siết bụng và mông, đừng võng lưng.", "Siết bụng, giữ thân thẳng"),
                        straightLimb("C2WHANDSTAND_ARMS_STRAIGHT", "Tay cong khi trồng chuối", ELBOW, 160, "Khoá thẳng khuỷu tay, đẩy vai lên cao.", "Duỗi thẳng tay"),
                        visibility("C2WHANDSTAND", 11, 13, 15, 23, 27))));

        s.add(new ExerciseSpec("handstand", "SIDE", "HOLD", HIP, 190.0, 160.0, null, 0, 0, 0,
                "Trồng chuối tự do: tính là đang giữ khi thân gần thẳng hàng (góc vai-hông-cổ chân 160-190 độ).",
                List.of(bodyLine("HANDSTAND", 10, false, "Giữ thân thẳng như một đường, siết bụng và mông.", "Siết bụng, giữ thân thẳng"),
                        straightLimb("HANDSTAND_ARMS_STRAIGHT", "Tay cong khi trồng chuối", ELBOW, 160, "Khoá thẳng khuỷu tay, đẩy vai lên cao.", "Duỗi thẳng tay"),
                        visibility("HANDSTAND", 11, 13, 15, 23, 27))));

        return s;
    }
}
