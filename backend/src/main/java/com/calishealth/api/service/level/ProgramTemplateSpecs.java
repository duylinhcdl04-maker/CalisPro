package com.calishealth.api.service.level;

import com.calishealth.api.dto.LevelEngineDtos.ProgramTemplateRequest;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Bộ giáo án mẫu theo level, soạn từ các bài đang có trong thư viện (mã bài = exercises.code). Mỗi giáo án mô tả MỘT chu kỳ N tuần;
 * Level Engine sẽ chọn giáo án khớp level / mục tiêu / số buổi mỗi tuần / thời lượng / dụng cụ của học viên, rồi tự đổi từng bài về đúng nấc
 * tiến trình của người đó (bài nào bị khoá hay thiếu dụng cụ sẽ được thay bằng bài dễ hơn cùng chuỗi). Vì vậy bài trong giáo án là bài "neo" của level.
 *
 * Nguyên tắc lập trình tập (mỗi giáo án đều theo):
 *  - Buổi sắp theo thứ tự ưu tiên: học viên tập ít buổi hơn số buổi của giáo án thì chỉ lấy N buổi đầu, nên các buổi đầu luôn cân bằng đẩy/kéo/chân/core.
 *  - Khởi động và thả lỏng cố định (locked), bài chính do engine điều chỉnh theo nấc tiến trình.
 *  - Tiến triển qua các tuần: tăng rep hoặc thời gian giữ, tuần cuối tăng thêm một hiệp ở bài chính; từ level 2 có tuần giảm tải (ít hiệp hơn, dư sức hơn).
 *  - RIR (số rep dự trữ) giảm dần theo level: L0 3, L1 2, L2 2, L3 1, L4 1.
 * Giáo án chỉ ở trạng thái NHÁP: Coach rà soát và chỉnh, Admin duyệt và xuất bản mới có hiệu lực.
 */
final class ProgramTemplateSpecs {
    private ProgramTemplateSpecs() {}

    // ------------------------------------------------------------------ DSL

    /** Một bài trong buổi tập (giá trị của TUẦN 1; các tuần sau được tính từ đây). */
    static final class Ex {
        final String code; final int sets; final int min, max, hold; final int rest; final String cue;
        boolean locked; String tempo; boolean noProgress;
        Ex(String code, int sets, int min, int max, int hold, int rest, String cue) {
            this.code = code; this.sets = sets; this.min = min; this.max = max; this.hold = hold; this.rest = rest; this.cue = cue;
        }
        Ex lock() { locked = true; return this; }
        Ex still() { noProgress = true; return this; }
        Ex tempo(String t) { tempo = t; return this; }
    }

    static Ex rep(String code, int sets, int min, int max, int rest, String cue) { return new Ex(code, sets, min, max, 0, rest, cue); }
    static Ex hold(String code, int sets, int sec, int rest, String cue) { return new Ex(code, sets, 0, 0, sec, rest, cue); }

    record Sec(String type, List<Ex> items) {}
    record Day(String name, String focus, String groups, List<Sec> sections) {}

    static Sec W(Ex... e) { return new Sec("WARMUP", List.of(e)); }
    static Sec M(Ex... e) { return new Sec("MAIN", List.of(e)); }
    static Sec S(Ex... e) { return new Sec("SKILL", List.of(e)); }
    static Sec A(Ex... e) { return new Sec("ACCESSORY", List.of(e)); }
    static Sec C(Ex... e) { return new Sec("COOLDOWN", List.of(e)); }
    static Day day(String name, String focus, String groups, Sec... s) { return new Day(name, focus, groups, List.of(s)); }

    record Spec(String name, String description, String levelMin, String levelMax, String level, List<String> goals,
                int daysMin, int daysMax, int minutes, int weeks, Integer deload, List<String> equipment, int rir, int holdStep, int priority,
                List<Day> days) {}

    // ------------------------------------------------------------------ khởi động / thả lỏng dùng chung

    private static Sec warmFloor() {
        return W(rep("bodyweight-squat", 1, 10, 10, 30, "Khởi động hông và gối, xuống chậm, gót chân chạm sàn.").lock().still(),
                hold("shoulder-flexion-test", 1, 20, 20, "Giơ tay lên cao áp sát tai, tư thế kéo giãn vai. Đây là bài giãn, không chấm điểm.").lock().still());
    }

    private static Sec warmBar() {
        return W(rep("scapular-pull-up", 1, 6, 6, 30, "Treo xà, chỉ nhún vai lên xuống để đánh thức cơ lưng, tay thẳng.").lock().still(),
                hold("shoulder-flexion-test", 1, 20, 20, "Giơ tay lên cao áp sát tai, tư thế kéo giãn vai. Đây là bài giãn, không chấm điểm.").lock().still());
    }

    private static Sec coolShoulderHip() {
        return C(hold("pike-fold-test", 2, 25, 15, "Gập người về trước, thả lỏng cổ và lưng, thở đều. Tư thế giãn, không chấm điểm.").lock().still(),
                hold("shoulder-flexion-test", 2, 20, 15, "Giữ tay cao, hạ xương sườn xuống, không ưỡn lưng. Tư thế giãn, không chấm điểm.").lock().still());
    }

    private static Sec coolSquat() {
        return C(hold("overhead-squat-test", 2, 20, 15, "Ngồi xổm sâu, tay giơ cao, gót chạm sàn. Tư thế giãn hông, không chấm điểm.").lock().still(),
                hold("pike-fold-test", 2, 20, 15, "Gập người về trước thả lỏng. Tư thế giãn, không chấm điểm.").lock().still());
    }

    private static final String SAFE = "Dừng ngay nếu đau nhói ở khớp. Mỏi cơ là bình thường, đau khớp thì không.";

    // ------------------------------------------------------------------ L0

    /** Bài đo được bằng AI (có profile đếm rep/giữ giây) tại thời điểm soạn bộ mẫu; kiểm tra thật nằm ở bước gửi duyệt/xuất bản. */
    private static final java.util.Set<String> AI_MEASURABLE = java.util.Set.of("incline-push-up", "push-up", "dips", "pseudo-planche-push-up", "handstand-push-up",
            "australian-pull-up", "pull-up", "chest-to-bar-pull-up", "muscle-up", "assisted-squat", "bodyweight-squat", "bulgarian-split-squat", "shrimp-squat",
            "pistol-squat", "hanging-leg-raise", "dead-hang", "plank", "hollow-body-hold", "l-sit", "handstand", "wall-pike-hold", "crow-pose", "chest-to-wall-handstand");

    /**
     * Mọi buổi tập đều đủ 4 phần (khởi động, bài chính, bài bổ trợ, thả lỏng & đo linh hoạt) và phần Bài chính có ít nhất một bài đo được bằng AI.
     * Buổi nào của bản soạn tay còn thiếu thì bổ sung một bài mặc định theo level (bài bổ trợ cho phần bổ trợ, một bài đo được cho phần chính).
     */
    static List<Spec> all() {
        return rawAll().stream().map(ProgramTemplateSpecs::withSessionStructure).toList();
    }

    private static Spec withSessionStructure(Spec spec) {
        boolean noEquipment = spec.equipment().isEmpty();
        String level = spec.level();
        List<Day> days = new ArrayList<>();
        for (Day d : spec.days()) {
            List<Sec> secs = new ArrayList<>(d.sections());
            boolean hasAccessory = secs.stream().anyMatch(x -> "ACCESSORY".equals(x.type()) && !x.items().isEmpty());
            boolean aiMain = secs.stream().anyMatch(x -> ("MAIN".equals(x.type()) || "SKILL".equals(x.type())) && x.items().stream().anyMatch(e -> AI_MEASURABLE.contains(e.code)));
            if (!aiMain) {
                Ex add = switch (level) {
                    case "L0" -> rep("bodyweight-squat", 3, 8, 12, 75, "Gót chạm sàn, xuống chậm, ngực mở.");
                    case "L1", "L2" -> rep("push-up", 3, 5, 10, 90, "Thân thẳng từ đầu đến gót, ngực chạm gần sàn.");
                    case "L3" -> rep("dips", 3, 6, 10, 120, "Hạ vai dưới khuỷu, giữ thân ổn định.");
                    default -> rep("pseudo-planche-push-up", 3, 4, 8, 150, "Nghiêng người ra trước, giữ thân cứng.");
                };
                int mainIdx = -1;
                for (int i = 0; i < secs.size(); i++) if ("MAIN".equals(secs.get(i).type())) { mainIdx = i; break; }
                if (mainIdx >= 0) { List<Ex> items = new ArrayList<>(secs.get(mainIdx).items()); items.add(add); secs.set(mainIdx, new Sec("MAIN", items)); }
                else secs.add(1, M(add));
            }
            if (!hasAccessory) {
                Ex add = switch (level) {
                    case "L0", "L1" -> hold("plank", 2, 20, 60, "Siết bụng và mông, không để lưng võng.");
                    case "L2" -> hold("hollow-body-hold", 3, 20, 60, "Ép lưng dưới sát sàn, tay chân duỗi.");
                    default -> noEquipment ? hold("hollow-body-hold", 3, 25, 75, "Ép lưng dưới sát sàn, tay chân duỗi.") : rep("hanging-leg-raise", 3, 5, 8, 90, "Nâng chân có kiểm soát, không đung đưa.");
                };
                int at = secs.size();
                for (int i = 0; i < secs.size(); i++) if ("COOLDOWN".equals(secs.get(i).type())) { at = i; break; }
                secs.add(at, A(add));
            }
            days.add(new Day(d.name(), d.focus(), d.groups(), secs));
        }
        return new Spec(spec.name(), spec.description(), spec.levelMin(), spec.levelMax(), spec.level(), spec.goals(), spec.daysMin(), spec.daysMax(), spec.minutes(),
                spec.weeks(), spec.deload(), spec.equipment(), spec.rir(), spec.holdStep(), spec.priority(), days);
    }

    private static List<Spec> rawAll() {
        List<Spec> out = new ArrayList<>();

        // ===== L0 không dụng cụ =====
        out.add(new Spec("L0 Nền tảng toàn thân (không dụng cụ)",
                "Chu kỳ 4 tuần cho người mới bắt đầu: học đúng kỹ thuật đẩy, squat, giữ thân cứng. Chỉ cần sàn tập. Tập cách ngày, mỗi buổi khoảng 30 phút.",
                "L0", "L0", "L0", List.of("GENERAL_FITNESS", "STRENGTH", "WEIGHT_LOSS", "ENDURANCE", "POSTURE", "FLEXIBILITY", "SKILL", "HANDSTAND"),
                2, 4, 30, 4, null, List.of(), 3, 5, 2, List.of(
                day("Buổi A: đẩy và chân", "Làm quen động tác đẩy và squat", "Ngực, vai, đùi",
                        warmFloor(),
                        M(rep("incline-push-up", 3, 6, 10, 75, "Tay chống cao hơn chân, thân thẳng từ đầu đến gót. " + SAFE),
                          rep("assisted-squat", 3, 8, 12, 75, "Bám vật chắc chắn để giữ thăng bằng, xuống chậm 3 giây.").tempo("3-0-1-0")),
                        A(hold("plank", 3, 15, 60, "Siết bụng và mông, không để lưng võng."), hold("hollow-body-hold", 2, 10, 60, "Ép lưng dưới sát sàn, tay chân duỗi, giữ vừa sức.")),
                        coolShoulderHip()),
                day("Buổi B: đẩy nhẹ, chân đơn", "Đẩy quỳ và bước chân", "Ngực, tay sau, đùi",
                        warmFloor(),
                        M(rep("knee-push-up", 3, 6, 10, 75, "Quỳ chống, thân thẳng từ đầu đến gối, khuỷu tay khoảng 45 độ."),
                          rep("lunges", 3, 6, 8, 75, "Mỗi chân, bước dài vừa phải, gối trước không vượt quá mũi chân.")),
                        A(hold("hollow-body-hold", 3, 10, 60, "Ép lưng dưới sát sàn."), hold("plank", 2, 20, 60, "Siết bụng, mông.")),
                        coolSquat()),
                day("Buổi C: kỹ năng nền và core", "Làm quen tư thế trồng chuối", "Vai, core",
                        warmFloor(),
                        M(rep("incline-push-up", 3, 8, 12, 75, "Giữ nhịp 2 giây xuống, 1 giây lên."), rep("bodyweight-squat", 3, 10, 15, 75, "Gót chạm sàn, ngực mở.")),
                        S(hold("wall-pike-hold", 3, 10, 60, "Chân tựa tường, hông cao, đầu thả giữa hai tay. Dừng nếu chóng mặt.")),
                        A(hold("plank", 3, 20, 60, "Siết bụng, mông.")),
                        coolShoulderHip()),
                day("Buổi D: toàn thân nhẹ", "Củng cố kỹ thuật", "Toàn thân",
                        warmFloor(),
                        M(rep("knee-push-up", 2, 8, 12, 60, "Giữ kỹ thuật sạch, không tập đến kiệt sức."), rep("bodyweight-squat", 2, 10, 15, 60, "Xuống chậm."), rep("lunges", 2, 8, 8, 60, "Mỗi chân.")),
                        A(hold("hollow-body-hold", 2, 12, 60, "Giữ vừa sức.")),
                        coolSquat()))));

        // ===== L0 có xà đơn =====
        out.add(new Spec("L0 Nền tảng với xà đơn: bước đầu tới pull-up",
                "Chu kỳ 4 tuần xây nền cho lực kéo: làm quen treo xà, kéo bả vai, tăng sức nắm. Cần một thanh xà đơn chắc chắn.",
                "L0", "L0", "L0", List.of("FIRST_PULL_UP", "STRENGTH", "MUSCLE_GAIN", "GENERAL_FITNESS"),
                2, 4, 30, 4, null, List.of("PULL_UP_BAR"), 3, 5, 3, List.of(
                day("Buổi A: kéo", "Treo xà và kéo bả vai", "Lưng, cẳng tay, tay trước",
                        warmBar(),
                        M(hold("dead-hang", 3, 15, 75, "Vai xa tai, nắm chắc, thở đều. Xuống xà nếu tay tê."), rep("scapular-pull-up", 3, 5, 8, 75, "Tay thẳng, chỉ kéo bả vai xuống rồi thả chậm."),
                          rep("assisted-squat", 3, 8, 12, 75, "Xuống chậm 3 giây.").tempo("3-0-1-0")),
                        A(hold("plank", 3, 15, 60, "Siết bụng và mông.")),
                        coolShoulderHip()),
                day("Buổi B: đẩy và chân", "Cân bằng với động tác đẩy", "Ngực, đùi",
                        warmBar(),
                        M(rep("incline-push-up", 3, 8, 10, 75, "Thân thẳng từ đầu đến gót."), rep("bodyweight-squat", 3, 10, 12, 75, "Gót chạm sàn.")),
                        A(hold("dead-hang", 2, 15, 60, "Tập sức nắm."), hold("hollow-body-hold", 3, 10, 60, "Ép lưng dưới sát sàn.")),
                        coolSquat()),
                day("Buổi C: kéo lần hai", "Tăng thời gian treo", "Lưng, cẳng tay",
                        warmBar(),
                        M(rep("scapular-pull-up", 3, 6, 8, 75, "Chậm và kiểm soát."), hold("dead-hang", 3, 20, 75, "Giữ đến khi cẳng tay mỏi, không gồng cổ."),
                          rep("incline-push-up", 3, 6, 10, 75, "Thân thẳng.")),
                        A(hold("hollow-body-hold", 2, 12, 60, "Ép lưng dưới sát sàn.")),
                        coolShoulderHip()),
                day("Buổi D: toàn thân nhẹ", "Củng cố kỹ thuật", "Toàn thân",
                        warmBar(),
                        M(rep("assisted-squat", 2, 10, 12, 60, "Xuống chậm."), rep("knee-push-up", 2, 8, 12, 60, "Thân thẳng."), hold("dead-hang", 2, 15, 60, "Nhẹ nhàng.")),
                        A(hold("plank", 2, 20, 60, "Siết bụng.")),
                        coolSquat()))));

        // ===== L1 không dụng cụ =====
        out.add(new Spec("L1 Sức mạnh cơ bản (không dụng cụ)",
                "Chu kỳ 4 tuần củng cố push-up chuẩn, squat và core. Thêm nền kỹ năng (trồng chuối tựa tường, crow). Chỉ cần sàn tập.",
                "L1", "L1", "L1", List.of("STRENGTH", "MUSCLE_GAIN", "GENERAL_FITNESS", "WEIGHT_LOSS", "ENDURANCE", "POSTURE"),
                2, 5, 35, 4, null, List.of(), 2, 5, 2, List.of(
                day("Buổi A: đẩy và chân", "Push-up chuẩn và squat", "Ngực, tay sau, đùi",
                        warmFloor(),
                        M(rep("push-up", 3, 5, 8, 90, "Thân thẳng, ngực chạm gần sàn, khuỷu tay khoảng 45 độ. " + SAFE),
                          rep("bodyweight-squat", 3, 12, 15, 75, "Gót chạm sàn, gối thẳng hướng mũi chân."), rep("lunges", 3, 8, 8, 75, "Mỗi chân, bước vừa phải.")),
                        A(hold("hollow-body-hold", 3, 15, 60, "Ép lưng dưới sát sàn.")),
                        coolShoulderHip()),
                day("Buổi B: kỹ năng và core", "Trồng chuối tựa tường và crow", "Vai, core, cổ tay",
                        warmFloor(),
                        M(rep("incline-push-up", 3, 10, 12, 75, "Nhịp đều."), rep("lunges", 3, 8, 10, 75, "Mỗi chân.")),
                        S(hold("wall-pike-hold", 3, 15, 60, "Hông cao, đầu thả giữa hai tay."), hold("crow-pose", 3, 5, 90, "Đầu gối tựa phía sau cánh tay, nhìn về trước, chuẩn bị đệm mềm phía trước.")),
                        A(hold("plank", 3, 30, 60, "Siết bụng, mông."), hold("hollow-body-hold", 3, 15, 60, "Ép lưng dưới sát sàn.")),
                        coolSquat()),
                day("Buổi C: toàn thân", "Volume vừa phải", "Toàn thân",
                        warmFloor(),
                        M(rep("push-up", 3, 5, 8, 90, "Giữ kỹ thuật sạch."), rep("bodyweight-squat", 4, 10, 12, 75, "Xuống chậm.")),
                        S(hold("wall-pike-hold", 3, 15, 60, "Hông cao.")),
                        A(hold("plank", 3, 30, 60, "Siết bụng."), hold("hollow-body-hold", 3, 15, 60, "Ép lưng dưới sát sàn.")),
                        coolShoulderHip()),
                day("Buổi D: thân trên", "Đẩy khối lượng cao hơn", "Ngực, vai, tay sau",
                        warmFloor(),
                        M(rep("incline-push-up", 4, 8, 12, 75, "Nhịp 2 giây xuống, 1 giây lên."), rep("lunges", 3, 10, 10, 75, "Mỗi chân.")),
                        A(hold("hollow-body-hold", 3, 15, 60, "Ép lưng dưới sát sàn."), hold("plank", 3, 30, 60, "Siết bụng.")),
                        coolSquat()),
                day("Buổi E: sức bền", "Làm tròn tuần bằng bài nhẹ", "Toàn thân",
                        warmFloor(),
                        M(rep("bodyweight-squat", 3, 15, 20, 60, "Nhịp đều, thở đều."), rep("lunges", 3, 10, 12, 60, "Mỗi chân."), rep("incline-push-up", 3, 12, 15, 60, "Nhịp đều.")),
                        A(hold("plank", 3, 40, 60, "Siết bụng, mông.")),
                        coolSquat()))));

        // ===== L1 có xà đơn =====
        out.add(new Spec("L1 Hướng tới pull-up đầu tiên (xà đơn)",
                "Chu kỳ 4 tuần xây lực kéo bằng bài hạ chậm (negative), kéo ngang và treo xà, kèm đẩy và chân để giữ cân bằng cơ thể.",
                "L1", "L1", "L1", List.of("FIRST_PULL_UP", "STRENGTH", "MUSCLE_GAIN", "GENERAL_FITNESS"),
                2, 5, 35, 4, null, List.of("PULL_UP_BAR"), 2, 5, 4, List.of(
                day("Buổi A: kéo chính", "Negative pull-up và kéo ngang", "Lưng, tay trước, cẳng tay",
                        warmBar(),
                        M(rep("negative-pull-up", 4, 3, 5, 120, "Nhảy lên vị trí cằm qua xà, hạ chậm 4 giây. Dừng khi không còn kiểm soát được tốc độ hạ.").tempo("4-0-1-0"),
                          rep("australian-pull-up", 3, 6, 10, 90, "Thân thẳng, kéo ngực chạm xà."), hold("dead-hang", 3, 20, 60, "Vai xa tai, nắm chắc.")),
                        A(hold("hollow-body-hold", 3, 15, 60, "Ép lưng dưới sát sàn.")),
                        coolShoulderHip()),
                day("Buổi B: đẩy và chân", "Cân bằng lực kéo", "Ngực, đùi",
                        warmBar(),
                        M(rep("push-up", 3, 5, 8, 90, "Thân thẳng."), rep("bodyweight-squat", 3, 12, 15, 75, "Gót chạm sàn."), rep("lunges", 3, 8, 8, 75, "Mỗi chân.")),
                        A(hold("plank", 3, 30, 60, "Siết bụng."), hold("hollow-body-hold", 2, 15, 60, "Ép lưng dưới sát sàn.")),
                        coolSquat()),
                day("Buổi C: kéo lần hai", "Tăng sức kéo ngang", "Lưng, tay trước",
                        warmBar(),
                        M(rep("scapular-pull-up", 3, 6, 8, 75, "Tay thẳng, kéo bả vai."), rep("negative-pull-up", 3, 3, 5, 120, "Hạ chậm 4 giây.").tempo("4-0-1-0"),
                          rep("australian-pull-up", 3, 8, 10, 90, "Thân thẳng.")),
                        A(hold("plank", 3, 30, 60, "Siết bụng.")),
                        coolShoulderHip()),
                day("Buổi D: toàn thân", "Củng cố", "Toàn thân",
                        warmBar(),
                        M(rep("push-up", 3, 6, 8, 90, "Thân thẳng."), rep("bodyweight-squat", 3, 12, 12, 75, "Xuống chậm."), rep("australian-pull-up", 3, 8, 8, 90, "Thân thẳng.")),
                        A(hold("hollow-body-hold", 3, 15, 60, "Ép lưng dưới sát sàn."), hold("plank", 2, 30, 60, "Siết bụng.")),
                        coolSquat()),
                day("Buổi E: sức nắm và kỹ năng", "Treo xà lâu hơn, làm quen crow", "Cẳng tay, vai",
                        warmBar(),
                        M(hold("dead-hang", 4, 25, 75, "Tay thẳng, vai xa tai."), rep("scapular-pull-up", 3, 8, 8, 75, "Chậm.")),
                        S(hold("crow-pose", 4, 5, 90, "Đặt đệm phía trước, nhìn về trước.")),
                        coolShoulderHip()))));

        // ===== L1 kỹ năng =====
        out.add(new Spec("L1 Kỹ năng nền: trồng chuối và crow",
                "Chu kỳ 4 tuần làm quen thăng bằng tay: trồng chuối tựa tường, crow, kèm tăng độ linh hoạt vai và hông. Không cần dụng cụ.",
                "L1", "L1", "L1", List.of("SKILL", "HANDSTAND", "FLEXIBILITY", "POSTURE"),
                2, 5, 35, 4, null, List.of(), 2, 5, 3, List.of(
                day("Buổi A: kỹ năng chính", "Trồng chuối tựa tường và crow", "Vai, cổ tay, core",
                        W(hold("shoulder-flexion-test", 2, 20, 20, "Giơ tay lên cao áp sát tai. Tư thế giãn, không chấm điểm.").lock().still(),
                          hold("pike-fold-test", 1, 20, 20, "Gập người về trước. Tư thế giãn, không chấm điểm.").lock().still()),
                        S(hold("wall-pike-hold", 4, 15, 60, "Hông cao, đầu thả giữa hai tay."), hold("crow-pose", 4, 5, 90, "Đặt đệm phía trước, nhìn về trước.")),
                        M(rep("push-up", 3, 5, 8, 90, "Thân thẳng.")),
                        A(hold("hollow-body-hold", 3, 15, 60, "Ép lưng dưới sát sàn.")),
                        coolSquat()),
                day("Buổi B: đẩy và chân", "Sức mạnh nền cho kỹ năng", "Vai, ngực, đùi",
                        warmFloor(),
                        S(hold("wall-pike-hold", 4, 20, 60, "Hông cao.")),
                        M(rep("incline-push-up", 3, 10, 12, 75, "Thân thẳng."), rep("bodyweight-squat", 3, 12, 12, 75, "Gót chạm sàn.")),
                        A(hold("plank", 3, 30, 60, "Siết bụng.")),
                        coolShoulderHip()),
                day("Buổi C: crow và core", "Thăng bằng tay", "Cổ tay, core",
                        warmFloor(),
                        S(hold("crow-pose", 5, 5, 90, "Đặt đệm phía trước."), hold("wall-pike-hold", 3, 15, 60, "Hông cao.")),
                        M(rep("push-up", 3, 5, 8, 90, "Thân thẳng."), rep("lunges", 3, 8, 8, 75, "Mỗi chân.")),
                        A(hold("hollow-body-hold", 3, 15, 60, "Ép lưng dưới sát sàn.")),
                        coolSquat()),
                day("Buổi D: linh hoạt", "Mở vai, hông và cột sống", "Vai, hông, cột sống",
                        W(rep("bodyweight-squat", 1, 10, 10, 30, "Khởi động hông.").lock().still()),
                        M(rep("bodyweight-squat", 2, 12, 12, 60, "Xuống chậm."), rep("incline-push-up", 2, 8, 10, 60, "Thân thẳng.")),
                        A(hold("plank", 2, 30, 60, "Siết bụng.")),
                        C(hold("pike-fold-test", 3, 30, 15, "Gập người về trước. Tư thế giãn, không chấm điểm.").lock().still(),
                          hold("overhead-squat-test", 3, 30, 15, "Ngồi xổm sâu tay giơ cao. Tư thế giãn, không chấm điểm.").lock().still(),
                          hold("shoulder-flexion-test", 3, 30, 15, "Giơ tay cao áp sát tai. Tư thế giãn, không chấm điểm.").lock().still())),
                day("Buổi E: khối lượng kỹ năng", "Tích lũy thời gian giữ", "Vai, core",
                        warmFloor(),
                        S(hold("wall-pike-hold", 5, 15, 60, "Hông cao."), hold("crow-pose", 5, 5, 90, "Đặt đệm phía trước.")),
                        A(hold("hollow-body-hold", 3, 15, 60, "Ép lưng dưới sát sàn.")),
                        coolShoulderHip()))));

        // ===== L2 đẩy kéo chân (xà đơn + xà kép) =====
        out.add(new Spec("L2 Sức mạnh đẩy kéo chân (xà đơn, xà kép)",
                "Chu kỳ 5 tuần chia buổi kéo, đẩy, chân và core để tăng sức mạnh với pull-up, dips, push-up. Tuần 5 là tuần giảm tải. Cần xà đơn và xà kép.",
                "L2", "L2", "L2", List.of("STRENGTH", "MUSCLE_GAIN", "GENERAL_FITNESS", "ENDURANCE"),
                3, 6, 40, 5, 5, List.of("PULL_UP_BAR", "PARALLEL_BARS"), 2, 5, 2, List.of(
                day("Buổi A: kéo", "Pull-up là bài chính", "Lưng, tay trước, cẳng tay",
                        warmBar(),
                        M(rep("pull-up", 4, 4, 6, 150, "Kéo từ treo thẳng tay đến cằm qua xà, hạ có kiểm soát. " + SAFE),
                          rep("australian-pull-up", 3, 8, 12, 90, "Thân thẳng, kéo ngực chạm xà."), hold("dead-hang", 3, 30, 60, "Vai xa tai.")),
                        A(rep("hanging-leg-raise", 3, 6, 10, 75, "Không đung đưa, nâng bằng cơ bụng.")),
                        coolShoulderHip()),
                day("Buổi B: đẩy", "Dips và push-up", "Ngực, tay sau, vai",
                        warmBar(),
                        M(rep("dips", 4, 5, 8, 120, "Vai không nhún lên tai, hạ đến khi khuỷu tay khoảng 90 độ. " + SAFE),
                          rep("push-up", 4, 10, 15, 90, "Thân thẳng."), rep("pike-push-up", 3, 6, 8, 90, "Hông cao, đầu hạ giữa hai tay.")),
                        A(hold("hollow-body-hold", 3, 25, 60, "Ép lưng dưới sát sàn."), hold("l-sit", 3, 10, 75, "Chống tay thẳng, nâng chân song song sàn.")),
                        coolSquat()),
                day("Buổi C: chân và core", "Squat một chân cơ bản", "Đùi, mông, bụng",
                        warmFloor(),
                        M(rep("bulgarian-split-squat", 4, 6, 8, 120, "Mỗi chân, thân thẳng, gối trước không vượt mũi chân."), rep("bodyweight-squat", 3, 20, 20, 75, "Nhịp đều."),
                          rep("lunges", 3, 12, 12, 75, "Mỗi chân.")),
                        A(rep("hanging-leg-raise", 3, 8, 8, 75, "Không đung đưa."), hold("plank", 3, 45, 60, "Siết bụng, mông."), hold("l-sit", 3, 12, 75, "Chống tay thẳng.")),
                        coolSquat()),
                day("Buổi D: kéo lần hai", "Khối lượng kéo", "Lưng, tay trước",
                        warmBar(),
                        M(rep("pull-up", 4, 5, 7, 150, "Hạ có kiểm soát."), rep("australian-pull-up", 3, 10, 12, 90, "Thân thẳng.")),
                        A(hold("hollow-body-hold", 3, 25, 60, "Ép lưng dưới sát sàn.")),
                        coolShoulderHip()),
                day("Buổi E: đẩy lần hai", "Khối lượng đẩy", "Ngực, vai, tay sau",
                        warmBar(),
                        M(rep("dips", 4, 6, 10, 120, "Kiểm soát khi hạ."), rep("push-up", 4, 12, 15, 90, "Thân thẳng."), rep("pike-push-up", 4, 5, 8, 90, "Hông cao.")),
                        A(hold("l-sit", 3, 10, 75, "Chống tay thẳng.")),
                        coolSquat()),
                day("Buổi F: chân và core lần hai", "Ổn định thân dưới", "Đùi, mông, bụng",
                        warmFloor(),
                        M(rep("bulgarian-split-squat", 4, 8, 8, 120, "Mỗi chân."), rep("bodyweight-squat", 3, 20, 25, 75, "Nhịp đều.")),
                        A(rep("hanging-leg-raise", 3, 8, 10, 75, "Không đung đưa."), hold("plank", 3, 45, 60, "Siết bụng.")),
                        coolSquat()))));

        // ===== L2 kỹ năng =====
        out.add(new Spec("L2 Kỹ năng: trồng chuối và nền muscle-up (xà đơn)",
                "Chu kỳ 5 tuần xây trồng chuối tựa ngực vào tường, lực đẩy dọc, pull-up và dips, là nền cho muscle-up. Tuần 5 giảm tải. Cần xà đơn.",
                "L2", "L2", "L2", List.of("SKILL", "HANDSTAND", "MUSCLE_UP", "STRENGTH"),
                3, 6, 40, 5, 5, List.of("PULL_UP_BAR"), 2, 5, 3, List.of(
                day("Buổi A: trồng chuối", "Trồng chuối ngực vào tường và đẩy dọc", "Vai, tay sau, core",
                        W(hold("wall-pike-hold", 1, 15, 45, "Hông cao, đầu thả giữa hai tay.").lock().still(), hold("shoulder-flexion-test", 1, 20, 20, "Tay cao áp sát tai. Tư thế giãn, không chấm điểm.").lock().still()),
                        S(hold("chest-to-wall-handstand", 5, 15, 75, "Ngực quay vào tường, thân thẳng, đẩy cao khỏi vai. Dừng nếu đau cổ tay hoặc chóng mặt.")),
                        M(rep("pike-push-up", 4, 5, 8, 90, "Hông cao, đầu hạ giữa hai tay.")),
                        A(hold("hollow-body-hold", 3, 25, 60, "Ép lưng dưới sát sàn."), hold("l-sit", 3, 10, 75, "Chống tay thẳng.")),
                        coolShoulderHip()),
                day("Buổi B: kéo và đẩy cho muscle-up", "Pull-up và dips", "Lưng, ngực, tay",
                        warmBar(),
                        M(rep("pull-up", 5, 3, 6, 150, "Kéo cao, hạ chậm. " + SAFE), rep("dips", 4, 6, 8, 120, "Vai không nhún lên tai.")),
                        A(rep("hanging-leg-raise", 3, 8, 8, 75, "Không đung đưa.")),
                        coolSquat()),
                day("Buổi C: crow và nén", "Thăng bằng tay và lực nén", "Cổ tay, core, đùi",
                        warmFloor(),
                        S(hold("crow-pose", 5, 8, 90, "Đặt đệm phía trước.")),
                        M(rep("bulgarian-split-squat", 3, 8, 8, 90, "Mỗi chân."), rep("push-up", 3, 12, 15, 90, "Thân thẳng.")),
                        A(hold("l-sit", 5, 10, 75, "Chống tay thẳng, nâng chân song song sàn."), hold("hollow-body-hold", 3, 25, 60, "Ép lưng dưới sát sàn.")),
                        coolSquat()),
                day("Buổi D: trồng chuối và kéo", "Tăng thời gian giữ", "Vai, lưng",
                        warmBar(),
                        S(hold("chest-to-wall-handstand", 5, 20, 75, "Thân thẳng, đẩy cao khỏi vai.")),
                        M(rep("pike-push-up", 4, 6, 8, 90, "Hông cao."), rep("pull-up", 4, 5, 6, 150, "Hạ có kiểm soát.")),
                        coolShoulderHip()),
                day("Buổi E: sức mạnh đẩy kéo", "Dips và pull-up khối lượng", "Ngực, lưng, tay",
                        warmBar(),
                        M(rep("dips", 4, 6, 10, 120, "Kiểm soát khi hạ."), rep("pull-up", 4, 4, 6, 150, "Hạ có kiểm soát."), rep("push-up", 3, 12, 15, 90, "Thân thẳng.")),
                        A(rep("hanging-leg-raise", 3, 8, 10, 75, "Không đung đưa.")),
                        coolSquat()),
                day("Buổi F: chân và core", "Cân bằng thân dưới", "Đùi, bụng",
                        warmFloor(),
                        M(rep("bulgarian-split-squat", 4, 8, 8, 120, "Mỗi chân."), rep("bodyweight-squat", 3, 20, 20, 75, "Nhịp đều.")),
                        A(hold("plank", 3, 45, 60, "Siết bụng."), hold("l-sit", 3, 12, 75, "Chống tay thẳng.")),
                        coolSquat()))));

        // ===== L2 không dụng cụ =====
        out.add(new Spec("L2 Thể lực tổng quát (không dụng cụ)",
                "Chu kỳ 5 tuần cho người chỉ có sàn tập: nhiều biến thể push-up, squat một chân, core và linh hoạt. Tuần 5 giảm tải.",
                "L2", "L2", "L2", List.of("GENERAL_FITNESS", "WEIGHT_LOSS", "ENDURANCE", "POSTURE", "FLEXIBILITY", "STRENGTH", "MUSCLE_GAIN"),
                2, 6, 40, 5, 5, List.of(), 2, 5, 1, List.of(
                day("Buổi A: đẩy, chân, core", "Push-up chuẩn và squat một chân", "Ngực, đùi, bụng",
                        warmFloor(),
                        M(rep("push-up", 4, 10, 15, 90, "Thân thẳng. " + SAFE), rep("bulgarian-split-squat", 3, 8, 10, 90, "Mỗi chân.")),
                        A(hold("hollow-body-hold", 3, 25, 60, "Ép lưng dưới sát sàn."), hold("plank", 3, 45, 60, "Siết bụng, mông.")),
                        coolShoulderHip()),
                day("Buổi B: đẩy biến thể", "Diamond và pike push-up", "Tay sau, vai",
                        warmFloor(),
                        M(rep("diamond-push-up", 3, 8, 12, 90, "Hai tay sát nhau, khuỷu ép vào thân."), rep("lunges", 3, 12, 15, 75, "Mỗi chân."), rep("pike-push-up", 3, 6, 8, 90, "Hông cao.")),
                        A(hold("l-sit", 3, 10, 75, "Chống tay thẳng trên sàn hoặc hai vật chắc.")),
                        coolSquat()),
                day("Buổi C: sức bền thân dưới", "Squat khối lượng cao", "Đùi, mông",
                        warmFloor(),
                        M(rep("bodyweight-squat", 4, 20, 25, 60, "Nhịp đều."), rep("archer-push-up", 3, 4, 6, 90, "Mỗi bên, tay còn lại thẳng."), rep("lunges", 3, 12, 14, 60, "Mỗi chân.")),
                        A(hold("hollow-body-hold", 3, 25, 60, "Ép lưng dưới sát sàn.")),
                        coolSquat()),
                day("Buổi D: kỹ năng nhẹ", "Trồng chuối tựa tường", "Vai, core",
                        warmFloor(),
                        S(hold("chest-to-wall-handstand", 4, 15, 75, "Ngực quay vào tường, thân thẳng.")),
                        M(rep("push-up", 3, 12, 15, 90, "Thân thẳng.")),
                        A(hold("plank", 3, 45, 60, "Siết bụng.")),
                        coolShoulderHip()),
                day("Buổi E: tổng hợp", "Mạch nhẹ", "Toàn thân",
                        warmFloor(),
                        M(rep("push-up", 3, 15, 15, 60, "Nhịp đều."), rep("bodyweight-squat", 3, 25, 25, 60, "Nhịp đều."), rep("lunges", 3, 14, 14, 60, "Mỗi chân.")),
                        A(hold("plank", 3, 60, 60, "Siết bụng.")),
                        coolSquat()),
                day("Buổi F: linh hoạt và kỹ năng", "Mở vai, hông và crow", "Vai, hông",
                        warmFloor(),
                        S(hold("crow-pose", 4, 8, 90, "Đặt đệm phía trước.")),
                        M(rep("bodyweight-squat", 3, 15, 15, 60, "Xuống chậm.")),
                        coolSquat()))));

        // ===== L3 sức mạnh nâng cao =====
        out.add(new Spec("L3 Sức mạnh nâng cao (xà đơn, xà kép)",
                "Chu kỳ 6 tuần cho người đã làm tốt pull-up và dips: chest-to-bar, archer, squat một chân và core nâng cao. Tuần 6 giảm tải. Cần xà đơn và xà kép.",
                "L3", "L3", "L3", List.of("STRENGTH", "MUSCLE_GAIN", "GENERAL_FITNESS", "ENDURANCE"),
                3, 6, 45, 6, 6, List.of("PULL_UP_BAR", "PARALLEL_BARS"), 1, 3, 2, List.of(
                day("Buổi A: kéo nặng", "Chest-to-bar và archer", "Lưng, tay trước",
                        warmBar(),
                        M(rep("chest-to-bar-pull-up", 5, 3, 5, 180, "Kéo ngực chạm xà, thân thẳng. " + SAFE), rep("pull-up", 4, 6, 8, 120, "Hạ có kiểm soát."),
                          rep("archer-pull-up-test", 3, 3, 5, 150, "Mỗi bên, tay còn lại thẳng.")),
                        A(rep("hanging-leg-raise", 4, 8, 12, 75, "Không đung đưa, chạm chân lên xà nếu đủ sức.")),
                        coolShoulderHip()),
                day("Buổi B: đẩy nặng", "Dips, archer, pseudo planche", "Ngực, vai, tay sau",
                        warmBar(),
                        M(rep("dips", 5, 6, 10, 150, "Hạ sâu có kiểm soát."), rep("archer-push-up", 4, 5, 8, 120, "Mỗi bên."), rep("pseudo-planche-push-up", 4, 6, 10, 120, "Thân nghiêng về trước, tay quay ra ngoài."),
                          rep("pike-push-up", 3, 8, 10, 90, "Hông cao.")),
                        A(hold("l-sit", 3, 15, 75, "Chống tay thẳng.")),
                        coolSquat()),
                day("Buổi C: chân và core nâng cao", "Pistol, shrimp, dragon flag", "Đùi, mông, bụng",
                        warmFloor(),
                        M(rep("shrimp-squat", 4, 4, 6, 150, "Mỗi chân, xuống chậm, bám vật nếu cần."), rep("pistol-squat", 3, 3, 5, 150, "Mỗi chân, gót chạm sàn."),
                          rep("bulgarian-split-squat", 3, 10, 10, 90, "Mỗi chân.")),
                        A(rep("dragon-flag", 4, 3, 5, 120, "Hạ chậm, thân thẳng, không gập hông."), hold("l-sit", 4, 15, 75, "Chống tay thẳng.")),
                        coolSquat()),
                day("Buổi D: kéo khối lượng", "Pull-up nhiều rep", "Lưng, tay trước",
                        warmBar(),
                        M(rep("pull-up", 5, 6, 10, 120, "Hạ có kiểm soát."), rep("chest-to-bar-pull-up", 3, 3, 5, 180, "Kéo ngực chạm xà.")),
                        A(rep("hanging-leg-raise", 3, 10, 12, 75, "Không đung đưa.")),
                        coolShoulderHip()),
                day("Buổi E: đẩy khối lượng", "Dips và pike nhiều rep", "Ngực, vai",
                        warmBar(),
                        M(rep("dips", 4, 8, 12, 120, "Kiểm soát."), rep("pike-push-up", 4, 8, 10, 90, "Hông cao."), rep("archer-push-up", 3, 6, 8, 120, "Mỗi bên.")),
                        A(hold("l-sit", 3, 15, 75, "Chống tay thẳng.")),
                        coolSquat()),
                day("Buổi F: chân và core lần hai", "Ổn định một chân", "Đùi, bụng",
                        warmFloor(),
                        M(rep("pistol-squat", 4, 3, 5, 150, "Mỗi chân."), rep("shrimp-squat", 3, 4, 6, 150, "Mỗi chân.")),
                        A(rep("dragon-flag", 3, 3, 5, 120, "Hạ chậm."), hold("hollow-body-hold", 3, 40, 60, "Ép lưng dưới sát sàn.")),
                        coolSquat()))));

        // ===== L3 kỹ năng =====
        out.add(new Spec("L3 Kỹ năng: muscle-up, trồng chuối, planche nền (xà đơn)",
                "Chu kỳ 6 tuần chuẩn bị muscle-up bằng kéo bùng nổ, dips thẳng thanh, trồng chuối đẩy dọc và nền planche, front lever. Tuần 6 giảm tải. Cần xà đơn.",
                "L3", "L3", "L3", List.of("SKILL", "MUSCLE_UP", "HANDSTAND", "STRENGTH"),
                3, 6, 45, 6, 6, List.of("PULL_UP_BAR"), 1, 3, 3, List.of(
                day("Buổi A: nền muscle-up", "Kéo bùng nổ và dips thẳng thanh", "Lưng, ngực, tay",
                        warmBar(),
                        M(rep("explosive-pull-up", 5, 3, 5, 150, "Kéo nhanh và cao, ngực hướng về xà. " + SAFE), rep("chest-to-bar-pull-up", 4, 4, 6, 150, "Kéo ngực chạm xà."),
                          rep("straight-bar-dip", 4, 6, 8, 120, "Thân ngay trên xà, hạ có kiểm soát.")),
                        A(hold("l-sit", 4, 15, 75, "Chống tay thẳng.")),
                        coolShoulderHip()),
                day("Buổi B: trồng chuối", "Đẩy dọc và thăng bằng", "Vai, tay sau, core",
                        warmFloor(),
                        S(hold("handstand", 6, 15, 90, "Thân thẳng, nhìn giữa hai tay, có đệm hoặc tường hỗ trợ."), hold("chest-to-wall-handstand", 4, 30, 75, "Ngực quay vào tường.")),
                        M(rep("pike-push-up", 4, 6, 8, 90, "Hông cao."), rep("handstand-push-up", 3, 3, 5, 150, "Tựa tường, hạ chậm. Dừng nếu đau cổ hoặc chóng mặt.")),
                        A(hold("hollow-body-hold", 3, 40, 60, "Ép lưng dưới sát sàn.")),
                        coolShoulderHip()),
                day("Buổi C: planche và lever nền", "Đẩy nghiêng và kéo ngang", "Vai trước, core, lưng",
                        warmBar(),
                        S(hold("front-lever", 5, 8, 120, "Bắt đầu bằng tư thế gập gối, lưng thẳng, vai xa tai.")),
                        M(rep("pseudo-planche-push-up", 5, 5, 8, 120, "Thân nghiêng về trước, tay quay ra ngoài.")),
                        A(rep("dragon-flag", 3, 3, 5, 120, "Hạ chậm."), hold("hollow-body-hold", 3, 40, 60, "Ép lưng dưới sát sàn.")),
                        coolShoulderHip()),
                day("Buổi D: muscle-up lần hai", "Kéo bùng nổ khối lượng", "Lưng, tay",
                        warmBar(),
                        M(rep("explosive-pull-up", 5, 3, 5, 150, "Kéo nhanh và cao."), rep("straight-bar-dip", 4, 6, 8, 120, "Hạ có kiểm soát.")),
                        A(rep("hanging-leg-raise", 3, 10, 12, 75, "Không đung đưa.")),
                        coolSquat()),
                day("Buổi E: trồng chuối lần hai", "Thời gian giữ", "Vai, core",
                        warmFloor(),
                        S(hold("handstand", 6, 20, 90, "Thân thẳng.")),
                        M(rep("handstand-push-up", 3, 3, 5, 150, "Tựa tường."), rep("pike-push-up", 3, 8, 10, 90, "Hông cao.")),
                        coolShoulderHip()),
                day("Buổi F: chân, core và lever", "Nền cho kỹ năng", "Đùi, bụng, lưng",
                        warmBar(),
                        M(rep("pistol-squat", 3, 3, 5, 150, "Mỗi chân."), rep("shrimp-squat", 3, 4, 6, 150, "Mỗi chân.")),
                        S(hold("front-lever", 4, 8, 120, "Gập gối, lưng thẳng.")),
                        A(rep("dragon-flag", 3, 3, 5, 120, "Hạ chậm.")),
                        coolSquat()))));

        // ===== L4 kỹ năng đỉnh cao =====
        out.add(new Spec("L4 Chuyên sâu kỹ năng đỉnh cao (xà đơn, xà kép)",
                "Chu kỳ 6 tuần dành cho người đã được Coach xác nhận level 4: muscle-up, front lever, planche, trồng chuối đẩy tự do. Khối lượng thấp, cường độ cao, phục hồi đủ. Tuần 6 giảm tải.",
                "L4", "L4", "L4", List.of("SKILL", "MUSCLE_UP", "HANDSTAND", "STRENGTH"),
                3, 6, 50, 6, 6, List.of("PULL_UP_BAR", "PARALLEL_BARS"), 1, 3, 3, List.of(
                day("Buổi A: muscle-up", "Muscle-up và kéo ngực chạm xà", "Lưng, ngực, tay",
                        warmBar(),
                        M(rep("muscle-up", 6, 2, 4, 180, "Kéo bùng nổ, chuyển tư thế nhanh qua xà. Dừng nếu đau khuỷu hoặc vai. " + SAFE), rep("chest-to-bar-pull-up", 4, 5, 6, 150, "Kéo ngực chạm xà."),
                          rep("straight-bar-dip", 4, 6, 8, 120, "Hạ có kiểm soát.")),
                        A(rep("hanging-leg-raise", 3, 10, 12, 75, "Không đung đưa.")),
                        coolShoulderHip()),
                day("Buổi B: trồng chuối", "Đẩy tự do", "Vai, tay sau, core",
                        warmFloor(),
                        S(rep("freestanding-handstand-push-up", 5, 2, 4, 150, "Có người hỗ trợ hoặc có đệm. Dừng nếu đau cổ hoặc chóng mặt."), hold("handstand", 6, 25, 90, "Thân thẳng, nhìn giữa hai tay.")),
                        M(rep("handstand-push-up", 4, 4, 6, 150, "Tựa tường, hạ chậm.")),
                        A(hold("hollow-body-hold", 3, 45, 60, "Ép lưng dưới sát sàn.")),
                        coolShoulderHip()),
                day("Buổi C: lever và planche", "Giữ tĩnh cường độ cao", "Vai trước, lưng, core",
                        warmBar(),
                        S(hold("front-lever", 6, 8, 150, "Giữ tư thế tốt nhất đạt được, không võng lưng."), hold("planche", 6, 5, 150, "Tư thế chuẩn bị, vai nghiêng về trước, không gập hông quá mức.")),
                        M(rep("pseudo-planche-push-up", 4, 8, 10, 120, "Thân nghiêng về trước.")),
                        A(rep("dragon-flag", 4, 4, 6, 120, "Hạ chậm.")),
                        coolShoulderHip()),
                day("Buổi D: chân và core", "Một chân và nén", "Đùi, bụng",
                        warmFloor(),
                        M(rep("pistol-squat", 4, 5, 6, 150, "Mỗi chân."), rep("shrimp-squat", 4, 5, 6, 150, "Mỗi chân.")),
                        A(rep("dragon-flag", 4, 4, 6, 120, "Hạ chậm."), hold("l-sit", 5, 20, 75, "Chống tay thẳng.")),
                        coolSquat()),
                day("Buổi E: sức mạnh kéo đẩy", "Giữ nền sức mạnh", "Lưng, ngực",
                        warmBar(),
                        M(rep("archer-pull-up-test", 4, 4, 6, 150, "Mỗi bên."), rep("chest-to-bar-pull-up", 4, 5, 6, 150, "Kéo ngực chạm xà."), rep("dips", 4, 8, 12, 120, "Kiểm soát.")),
                        coolSquat()),
                day("Buổi F: kỹ năng phối hợp", "Muscle-up và trồng chuối nhẹ", "Toàn thân",
                        warmBar(),
                        M(rep("muscle-up", 5, 2, 4, 180, "Kéo bùng nổ.")),
                        S(hold("handstand", 5, 25, 90, "Thân thẳng.")),
                        coolShoulderHip()))));

        // ===== L3 đến L4 không dụng cụ =====
        out.add(new Spec("L3-L4 Kỹ năng và sức mạnh không dụng cụ",
                "Chu kỳ 6 tuần cho người level 3 hoặc 4 chỉ có sàn tập: trồng chuối, planche nền, squat một chân, dragon flag. Tuần 6 giảm tải.",
                "L3", "L4", "L3", List.of("SKILL", "HANDSTAND", "STRENGTH", "MUSCLE_GAIN", "GENERAL_FITNESS"),
                3, 6, 45, 6, 6, List.of(), 1, 3, 1, List.of(
                day("Buổi A: trồng chuối", "Thăng bằng và đẩy dọc", "Vai, tay sau, core",
                        warmFloor(),
                        S(hold("handstand", 6, 20, 90, "Thân thẳng, nhìn giữa hai tay."), hold("chest-to-wall-handstand", 4, 30, 75, "Ngực quay vào tường.")),
                        M(rep("handstand-push-up", 4, 3, 6, 150, "Tựa tường. " + SAFE), rep("pike-push-up", 3, 8, 10, 90, "Hông cao.")),
                        A(hold("hollow-body-hold", 3, 40, 60, "Ép lưng dưới sát sàn.")),
                        coolShoulderHip()),
                day("Buổi B: planche và đẩy", "Đẩy nghiêng", "Vai trước, ngực",
                        warmFloor(),
                        S(hold("planche", 5, 5, 150, "Tư thế chuẩn bị, vai nghiêng về trước.")),
                        M(rep("pseudo-planche-push-up", 5, 6, 10, 120, "Thân nghiêng về trước."), rep("archer-push-up", 4, 5, 8, 120, "Mỗi bên.")),
                        A(hold("l-sit", 4, 15, 75, "Chống tay thẳng.")),
                        coolShoulderHip()),
                day("Buổi C: chân và core", "Một chân và dragon flag", "Đùi, bụng",
                        warmFloor(),
                        M(rep("pistol-squat", 4, 4, 6, 150, "Mỗi chân."), rep("shrimp-squat", 4, 4, 6, 150, "Mỗi chân."), rep("bulgarian-split-squat", 3, 10, 10, 90, "Mỗi chân.")),
                        A(rep("dragon-flag", 4, 3, 5, 120, "Hạ chậm."), hold("hollow-body-hold", 3, 45, 60, "Ép lưng dưới sát sàn.")),
                        coolSquat()),
                day("Buổi D: đẩy khối lượng", "Duy trì sức mạnh đẩy", "Ngực, vai",
                        warmFloor(),
                        M(rep("archer-push-up", 4, 6, 8, 120, "Mỗi bên."), rep("pike-push-up", 4, 8, 10, 90, "Hông cao."), rep("diamond-push-up", 3, 10, 12, 90, "Khuỷu ép vào thân.")),
                        A(hold("l-sit", 3, 15, 75, "Chống tay thẳng.")),
                        coolShoulderHip()),
                day("Buổi E: trồng chuối lần hai", "Thời gian giữ", "Vai, core",
                        warmFloor(),
                        S(hold("handstand", 6, 25, 90, "Thân thẳng.")),
                        M(rep("handstand-push-up", 3, 3, 5, 150, "Tựa tường.")),
                        coolShoulderHip()),
                day("Buổi F: chân lần hai", "Ổn định một chân", "Đùi, mông",
                        warmFloor(),
                        M(rep("pistol-squat", 3, 4, 6, 150, "Mỗi chân."), rep("shrimp-squat", 3, 4, 6, 150, "Mỗi chân.")),
                        A(rep("dragon-flag", 3, 3, 5, 120, "Hạ chậm.")),
                        coolSquat()))));

        return out;
    }

    // ------------------------------------------------------------------ dựng JSON cấu trúc cho Level Engine và trình dựng giáo án

    record ExInfo(long id, String name, String category, String difficulty, String imageUrl) {}

    private static final Map<String, String> CAT = Map.of("PUSH", "Push", "PULL", "Pull", "CORE", "Core", "LEGS", "Legs", "SKILL", "Skill", "MOBILITY", "Mobility");

    static ProgramTemplateRequest toRequest(Spec s, Function<String, ExInfo> lookup, Map<String, String> levelLabel) {
        List<Map<String, Object>> weeks = new ArrayList<>();
        for (int w = 1; w <= s.weeks(); w++) weeks.add(week(s, w, lookup, levelLabel));
        Map<String, Object> structure = new LinkedHashMap<>();
        structure.put("weeks", weeks);
        // Thời lượng giáo án = trung bình các buổi của TUẦN 1 (ước lượng như Level Engine), làm tròn đến 5 phút. Các tuần sau dài hơn do tăng khối lượng;
        // khi tạo chu kỳ cho học viên, Level Engine tự rút gọn buổi nào vượt thời gian học viên có.
        double sum = 0; int n = 0;
        for (Object dd : (List<?>) weeks.get(0).get("days")) { sum += (int) ((Map<?, ?>) dd).get("estimatedDurationMinutes"); n++; }
        int minutes = Math.max(20, (int) Math.round(sum / Math.max(1, n) / 5.0) * 5);
        return new ProgramTemplateRequest(s.name(), s.description(), "DRAFT", s.levelMin(), s.levelMax(), s.level(), s.goals(),
                s.daysMin(), s.daysMax(), minutes, s.weeks(), s.deload() == null ? 0 : s.deload(), s.equipment(), null, false, s.priority(), structure);
    }

    private static Map<String, Object> week(Spec s, int w, Function<String, ExInfo> lookup, Map<String, String> levelLabel) {
        boolean deload = s.deload() != null && w == s.deload();
        int lastBuild = s.deload() != null ? s.deload() - 1 : s.weeks();
        String title, objective, type, target;
        if (deload) { title = "Tuần " + w + ": giảm tải, phục hồi"; objective = "Giảm một hiệp mỗi bài và dư sức hơn để cơ thể hồi phục trước chu kỳ mới."; type = "Deload"; target = "Giảm khối lượng, giữ kỹ thuật sạch."; }
        else if (w == 1) { title = "Tuần 1: làm quen và chuẩn kỹ thuật"; objective = "Chọn mức vừa sức, ưu tiên kỹ thuật chuẩn hơn số rep."; type = "Skill"; target = "Hoàn thành đủ hiệp với kỹ thuật sạch."; }
        else if (w == lastBuild) { title = "Tuần " + w + ": đỉnh chu kỳ"; objective = "Bài chính thêm một hiệp, tiến sát giới hạn nhưng vẫn giữ kỹ thuật."; type = "Intensity"; target = "Đạt số rep hoặc thời gian giữ cao nhất của chu kỳ."; }
        else { title = "Tuần " + w + ": tăng khối lượng"; objective = "Thêm rep hoặc thời gian giữ so với tuần trước."; type = "Volume"; target = "Tăng khoảng một rep hoặc vài giây giữ mỗi bài."; }

        List<Map<String, Object>> days = new ArrayList<>();
        int dayNo = 0;
        for (Day d : s.days()) {
            dayNo++;
            days.add(dayMap(s, d, dayNo, w, deload, lastBuild, lookup, levelLabel));
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", "w" + w);
        m.put("weekNumber", w);
        m.put("title", title);
        m.put("objective", objective);
        m.put("progressionTarget", Map.of("type", type, "targetDescription", target));
        m.put("days", days);
        return m;
    }

    private static Map<String, Object> dayMap(Spec s, Day d, int dayNo, int w, boolean deload, int lastBuild, Function<String, ExInfo> lookup, Map<String, String> levelLabel) {
        List<Map<String, Object>> sections = new ArrayList<>();
        int order = 0, minutes = 13;   // 8 phút khởi động + 5 phút thả lỏng, khớp cách Level Engine ước lượng
        for (Sec sec : d.sections()) {
            order++;
            List<Map<String, Object>> items = new ArrayList<>();
            for (Ex x : sec.items()) {
                Map<String, Object> e = exMap(s, sec.type(), x, w, deload, lastBuild, lookup, levelLabel);
                items.add(e);
                int sets = (int) e.get("sets");
                double work = x.hold > 0 ? (int) e.get("holdSec") : ((int) e.get("repMaxVal")) * 3.0;
                if (!"WARMUP".equals(sec.type()) && !"COOLDOWN".equals(sec.type())) minutes += (int) Math.round(sets * (work + (int) e.get("restSeconds")) / 60.0);
                else minutes += (int) Math.round(sets * 30 / 60.0);
                e.remove("holdSec"); e.remove("repMaxVal");
            }
            Map<String, Object> sm = new LinkedHashMap<>();
            sm.put("id", "w" + w + "d" + dayNo + "s" + order);
            sm.put("name", switch (sec.type()) { case "WARMUP" -> "Khởi động"; case "MAIN" -> "Bài chính"; case "SKILL" -> "Kỹ năng"; case "ACCESSORY" -> "Bài phụ"; default -> "Thả lỏng"; });
            sm.put("sectionType", sec.type());
            sm.put("order", order);
            sm.put("exercises", items);
            sections.add(sm);
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", "w" + w + "d" + dayNo);
        m.put("dayNumber", dayNo);
        m.put("dayOfWeekTitle", "Buổi " + dayNo);
        m.put("name", d.name());
        m.put("focus", d.focus());
        m.put("dayType", "WORKOUT");
        m.put("estimatedDurationMinutes", minutes);
        m.put("difficulty", levelLabel.getOrDefault(s.level(), "Beginner"));
        m.put("primaryMuscleGroups", List.of(d.groups().split(",\\s*")));
        m.put("sections", sections);
        return m;
    }

    /** Giá trị của một bài ở tuần w: tăng dần theo tuần, tuần giảm tải bớt một hiệp, tuần cuối của giai đoạn tăng thêm một hiệp ở bài chính. */
    private static Map<String, Object> exMap(Spec s, String section, Ex x, int w, boolean deload, int lastBuild, Function<String, ExInfo> lookup, Map<String, String> levelLabel) {
        ExInfo info = lookup.apply(x.code);
        boolean fixed = x.noProgress || "WARMUP".equals(section) || "COOLDOWN".equals(section);
        int idx = fixed ? 0 : Math.min(w - 1, lastBuild - 1);
        if (deload) idx = Math.max(0, Math.min(w - 2, lastBuild - 2));   // về mức của tuần trước đỉnh
        int sets = x.sets;
        if (!fixed) {
            if (deload && sets >= 3) sets -= 1;
            else if (!deload && w == lastBuild && w >= 3 && "MAIN".equals(section) && sets < 5) sets += 1;
        }
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("id", "e" + w + "-" + x.code);
        e.put("exerciseId", String.valueOf(info.id()));
        e.put("exerciseName", info.name());
        e.put("exerciseCategory", info.category());
        e.put("exerciseDifficulty", levelLabel.getOrDefault(s.level(), "Beginner"));
        e.put("exerciseImageUrl", info.imageUrl() == null ? "" : info.imageUrl());
        e.put("sets", sets);
        if (x.hold > 0) {
            int sec = x.hold + idx * (fixed ? 0 : s.holdStep());
            e.put("prescriptionType", "TIME_HOLD");
            e.put("reps", sec + "s");
            e.put("holdSec", sec);
            e.put("repMaxVal", 0);
        } else {
            int mn = x.min + (fixed ? 0 : idx), mx = x.max + (fixed ? 0 : idx);
            e.put("prescriptionType", mn == mx ? "FIXED_REPS" : "REP_RANGE");
            e.put("reps", mn == mx ? String.valueOf(mn) : mn + "-" + mx);
            e.put("holdSec", 0);
            e.put("repMaxVal", mx);
        }
        e.put("restSeconds", x.rest);
        if (x.tempo != null) e.put("tempo", x.tempo);
        e.put("intensityType", "RIR");
        if (!"WARMUP".equals(section) && !"COOLDOWN".equals(section)) e.put("rir", Math.max(0, s.rir() + (deload ? 1 : 0)));
        e.put("coachingCues", x.cue);
        e.put("locked", x.locked);
        return e;
    }
}
