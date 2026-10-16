package com.calishealth.api.engine.program;

import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.program.ProgramModels.*;
import com.calishealth.api.engine.skill.SkillEngine;
import com.calishealth.api.engine.skill.SkillGraph;

import java.util.*;
import java.util.function.Predicate;

/**
 * Chọn giáo án mẫu (ProgramTemplateMatcher), điền bài cho từng vị trí (SlotFiller) và kiểm soát khối lượng (VolumeGuard).
 * Thuần, không truy cập DB; mọi trọng số lấy từ rule set.
 */
public final class ProgramEngine {
    private ProgramEngine() {}

    public static final List<String> PRIMARY = List.of("PUSH", "PULL", "LEGS", "CORE", "MOBILITY", "SKILL");

    // ============================== CHỌN GIÁO ÁN MẪU ==============================

    /**
     * Quy định sản phẩm: giáo án chỉ được áp theo KẾT QUẢ ĐÁNH GIÁ và LEVEL. Mục tiêu, số buổi/tuần, thời lượng và dụng cụ KHÔNG tham gia chọn mẫu.
     * Bước 1 - lọc cứng: level nằm trong khoảng level của mẫu.
     * Bước 2 - M = wL·LevelFit + wW·WeaknessFit (điểm năng lực từ đánh giá) + wV·Variety; hoà điểm -> priority.
     */
    public static MatchResult match(RuleSetConfig rs, List<TemplateCandidate> templates, MatchProfile u) {
        List<MatchScore> ranked = new ArrayList<>();
        List<Rejection> rejected = new ArrayList<>();
        for (TemplateCandidate t : templates) {
            String reject = null;
            if (u.levelRank() < t.levelMin() || u.levelRank() > t.levelMax()) reject = "Không áp dụng cho level hiện tại";
            if (reject != null) { rejected.add(new Rejection(t, reject)); continue; }

            Map<String, Double> b = new LinkedHashMap<>();
            b.put("levelFit", t.primaryLevel() == u.levelRank() ? 1.0 : 0.7);
            b.put("weaknessFit", round(cosine(t.emphasis(), deficit(u.competencyScores()))));
            List<String> recent = u.recentTemplateCodes();
            boolean usedTwice = recent.size() >= 2 && recent.get(0).equals(t.code()) && recent.get(1).equals(t.code());
            b.put("variety", usedTwice ? 0.0 : 1.0);
            double score = rs.param("match.w.level", 0.25) * b.get("levelFit")
                    + rs.param("match.w.weakness", 0.20) * b.get("weaknessFit")
                    + rs.param("match.w.variety", 0.10) * b.get("variety");
            ranked.add(new MatchScore(t, round(score), b));
        }
        ranked.sort(Comparator.comparingDouble((MatchScore matchScore) -> matchScore.score()).reversed()
                .thenComparing(m -> -m.template().priority())
                .thenComparing(m -> -m.template().id()));
        return new MatchResult(ranked, rejected);
    }

    static double goalFit(TemplateCandidate t, MatchProfile u) {
        List<String> goals = t.goalCodes();
        if (u.primaryGoal() != null && goals.contains(u.primaryGoal())) return 1.0;
        if (u.primaryGoalCategory() != null && goals.contains(u.primaryGoalCategory())) return 0.8;
        if (u.secondaryGoals().stream().anyMatch(goals::contains)) return 0.6;
        if (goals.contains("GENERAL_FITNESS") || goals.isEmpty()) return 0.3;
        return 0;
    }

    public static Map<String, Double> deficit(Map<String, Double> scores) {
        Map<String, Double> d = new LinkedHashMap<>();
        for (String c : PRIMARY) {
            Double s = scores.get(c);
            d.put(c, s == null ? 0.5 : (100 - s) / 100.0);
        }
        return d;
    }

    static double cosine(Map<String, Double> a, Map<String, Double> b) {
        double dot = 0, na = 0, nb = 0;
        for (String c : PRIMARY) {
            double x = a.getOrDefault(c, 0.0), y = b.getOrDefault(c, 0.0);
            dot += x * y; na += x * x; nb += y * y;
        }
        return na == 0 || nb == 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    // ============================== ĐIỀN BÀI CHO SLOT ==============================

    public record SlotContext(SkillGraph graph, Map<Long, String> nodeStatus, Predicate<Long> equipmentOk, Set<Long> restricted,
                              Set<Long> goalPath, Map<Long, Double> gapPriority, Map<String, Double> competencyScores,
                              java.util.function.Function<Long, String> competencyOf) {}

    public record Selection(Long exerciseId, Map<String, Double> breakdown, String reason) {}

    /**
     * Ứng viên = bài admin đặt (E) + 1 nấc khó hơn + tối đa 3 nấc dễ hơn + bài thay thế; loại bài LOCKED, thiếu dụng cụ,
     * bị chống chỉ định. RecScore = Σ w·thành phần (trọng số trong rule set). PRIMARY/MAIN -> nấc đang luyện khó nhất.
     */
    public static Selection pick(RuleSetConfig rs, SlotContext ctx, Long templateExerciseId, String section, boolean locked) {
        SkillGraph g = ctx.graph();
        if (locked || g.node(templateExerciseId).isEmpty()) {
            return new Selection(templateExerciseId, Map.of(), locked ? "Bài được admin cố định trong giáo án." : "Bài không thuộc chuỗi tiến trình nào.");
        }
        LinkedHashMap<Long, Integer> distance = new LinkedHashMap<>();
        distance.put(templateExerciseId, 0);
        for (SkillGraph.Edge e : g.unlocks(templateExerciseId)) distance.putIfAbsent(e.exerciseId(), 1);
        g.easier(templateExerciseId, 3).forEach(distance::putIfAbsent);
        for (Long alt : g.alternatives(templateExerciseId)) distance.putIfAbsent(alt, 1);

        List<Long> eligible = distance.keySet().stream()
                .filter(id -> !SkillEngine.LOCKED.equals(ctx.nodeStatus().getOrDefault(id, SkillEngine.LOCKED)))
                .filter(id -> ctx.equipmentOk().test(id))
                .filter(id -> !ctx.restricted().contains(id))
                .toList();
        if (eligible.isEmpty()) {
            // Không có bài phù hợp: lùi về bài dễ nhất không bị chống chỉ định trong chuỗi
            Long fallback = distance.keySet().stream().filter(id -> ctx.equipmentOk().test(id) && !ctx.restricted().contains(id))
                    .min(Comparator.comparingInt(g::depth)).orElse(null);
            return new Selection(fallback, Map.of(), "Chưa mở khoá bài nào trong chuỗi - dùng bài nền tảng nhất.");
        }

        boolean easyRole = List.of("WARMUP", "COOLDOWN", "ACCESSORY").contains(section);
        Long working = eligible.stream().filter(id -> isOpen(ctx.nodeStatus().get(id)))
                .max(Comparator.comparingInt(g::depth)).orElse(null);
        double maxGap = ctx.gapPriority().values().stream().mapToDouble(value -> value.doubleValue()).max().orElse(0);

        Selection best = null;
        double bestScore = -1;
        for (Long id : eligible) {
            String status = ctx.nodeStatus().get(id);
            boolean achieved = SkillEngine.ACHIEVED.equals(status) || SkillEngine.ACHIEVED_SELF_REPORTED.equals(status);
            Map<String, Double> b = new LinkedHashMap<>();
            b.put("goalFit", ctx.goalPath().contains(id) ? 1.0 : 0.3);
            b.put("skillGapFit", maxGap > 0 ? ctx.gapPriority().getOrDefault(id, 0.0) / maxGap : 0.0);
            b.put("prerequisiteFit", achieved ? 0.8 : 1.0);
            double difficulty = easyRole ? (achieved ? 1.0 : 0.6) : (id.equals(working) ? 1.0 : achieved ? 0.4 : 0.7);
            b.put("difficultyFit", difficulty);
            String comp = ctx.competencyOf().apply(id);
            Double cs = comp == null ? null : ctx.competencyScores().get(comp);
            b.put("weaknessFit", cs == null ? 0.5 : (100 - cs) / 100.0);
            b.put("equipmentFit", 1.0);
            b.put("recentPerformance", 0.5);
            b.put("overloadRisk", 0.0);
            double score = rs.param("rec.w.goal", 0.25) * b.get("goalFit")
                    + rs.param("rec.w.skillGap", 0.20) * b.get("skillGapFit")
                    + rs.param("rec.w.prerequisite", 0.15) * b.get("prerequisiteFit")
                    + rs.param("rec.w.difficulty", 0.15) * b.get("difficultyFit")
                    + rs.param("rec.w.weakness", 0.10) * b.get("weaknessFit")
                    + rs.param("rec.w.equipment", 0.10) * b.get("equipmentFit")
                    + rs.param("rec.w.recent", 0.05) * b.get("recentPerformance")
                    - rs.param("rec.w.overload", 0.10) * b.get("overloadRisk");
            // hoà điểm: ưu tiên gần với bài admin đã chọn
            score = round(score) - distance.get(id) * 1e-4;
            if (score > bestScore) {
                bestScore = score;
                b.put("score", round(score));
                best = new Selection(id, b, reasonText(id, templateExerciseId, status, g));
            }
        }
        return best;
    }

    private static boolean isOpen(String status) {
        return SkillEngine.READY.equals(status) || SkillEngine.IN_PROGRESS.equals(status);
    }

    private static String reasonText(Long chosen, Long template, String status, SkillGraph g) {
        String name = g.node(chosen).map(node -> node.name()).orElse(String.valueOf(chosen));
        if (chosen.equals(template)) return name + " giữ nguyên như kế hoạch (" + status + ").";
        String tName = g.node(template).map(node -> node.name()).orElse(String.valueOf(template));
        return "Điều chỉnh " + tName + " → " + name + " cho phù hợp nấc tiến trình hiện tại (" + status + ").";
    }

    // ============================== KÊ LIỀU & KHỐI LƯỢNG ==============================

    /** Ước lượng thời lượng buổi (phút) = khởi động + Σ set × (thời gian làm + nghỉ) + giãn cơ. */
    public static int estimateMinutes(RuleSetConfig rs, PlannedDay day) {
        double secPerRep = rs.param("session.secPerRep", 3);
        double total = rs.param("session.warmupMin", 8) * 60 + rs.param("session.cooldownMin", 5) * 60;
        for (PlannedExercise e : day.exercises) {
            if ("WARMUP".equals(e.section) || "COOLDOWN".equals(e.section)) { total += e.sets * 30; continue; }
            double work = e.holdSec != null ? e.holdSec : (e.repMax != null ? e.repMax : e.repMin != null ? e.repMin : 8) * secPerRep;
            int rest = e.restSec != null ? e.restSec : 90;
            total += e.sets * (work + rest);
        }
        return (int) Math.ceil(total / 60);
    }

    /**
     * VolumeGuard theo tuần:
     *  1) cộng tối đa N set/tuần cho năng lực yếu nhất (vẫn trong trần);
     *  2) cắt set vượt trần set khó/tuần của mỗi năng lực (ACCESSORY trước, MAIN sau, tối thiểu 1 set);
     *  3) cắt buổi vượt thời lượng: ACCESSORY -> COOLDOWN -> bớt set các bài MAIN phụ; không cắt bài MAIN đầu tiên và SKILL.
     */
    public static List<String> enforceVolume(RuleSetConfig rs, List<PlannedDay> days, String levelCode, String weakest,
                                             int sessionMinutes, double globalVolumeFactor, double deloadFactor) {
        List<String> notes = new ArrayList<>();
        int cap = (int) rs.param("volume.maxSetsPerWeek." + levelCode, 14);
        int bonusLeft;
        Map<Integer, List<PlannedDay>> byWeek = new TreeMap<>();
        days.forEach(d -> byWeek.computeIfAbsent(d.weekNumber, k -> new ArrayList<>()).add(d));

        for (Map.Entry<Integer, List<PlannedDay>> w : byWeek.entrySet()) {
            for (PlannedDay d : w.getValue()) {
                double f = globalVolumeFactor * (d.deload ? deloadFactor : 1);
                if (f < 0.999) for (PlannedExercise e : d.exercises) e.sets = Math.max(1, (int) Math.round(e.sets * f));
            }
            // 1) ưu tiên năng lực yếu nhất
            bonusLeft = (int) rs.param("volume.weakBonusSets", 2);
            if (weakest != null && w.getValue().stream().noneMatch(d -> d.deload)) {
                for (PlannedDay d : w.getValue()) {
                    if (bonusLeft <= 0) break;
                    for (PlannedExercise e : d.exercises) {
                        if ("MAIN".equals(e.section) && weakest.equals(e.competency) && hardSets(w.getValue(), weakest) < cap) {
                            e.sets++;
                            bonusLeft--;
                            break;
                        }
                    }
                }
            }
            // 2) trần set khó/tuần theo năng lực
            for (String c : PRIMARY) {
                int over = hardSets(w.getValue(), c) - cap;
                for (String section : List.of("ACCESSORY", "SKILL", "MAIN")) {
                    for (PlannedDay d : w.getValue()) {
                        for (PlannedExercise e : d.exercises) {
                            while (over > 0 && section.equals(e.section) && c.equals(e.competency) && e.sets > 1) { e.sets--; over--; }
                        }
                    }
                }
                if (hardSets(w.getValue(), c) > cap) notes.add("Tuần " + w.getKey() + ": " + c + " vẫn vượt trần " + cap + " set (mỗi bài tối thiểu 1 set).");
            }
        }
        // 3) thời lượng buổi
        for (PlannedDay d : days) {
            if (d.restDay) continue;
            int guard = 0;
            while (estimateMinutes(rs, d) > sessionMinutes && guard++ < 50) {
                if (removeLast(d, "ACCESSORY") || removeLast(d, "COOLDOWN") || trimSecondaryMain(d)) continue;
                notes.add("Buổi " + d.name + " vẫn dài hơn " + sessionMinutes + " phút sau khi rút gọn.");
                break;
            }
            d.estimatedMinutes = estimateMinutes(rs, d);
        }
        return notes;
    }

    static int hardSets(List<PlannedDay> week, String competency) {
        int n = 0;
        for (PlannedDay d : week) for (PlannedExercise e : d.exercises)
            if (competency.equals(e.competency) && !"WARMUP".equals(e.section) && !"COOLDOWN".equals(e.section)) n += e.sets;
        return n;
    }

    private static boolean removeLast(PlannedDay d, String section) {
        for (int i = d.exercises.size() - 1; i >= 0; i--) {
            if (section.equals(d.exercises.get(i).section)) { d.exercises.remove(i); return true; }
        }
        return false;
    }

    private static boolean trimSecondaryMain(PlannedDay d) {
        PlannedExercise firstMain = d.exercises.stream().filter(x -> "MAIN".equals(x.section)).findFirst().orElse(null);
        for (int i = d.exercises.size() - 1; i >= 0; i--) {
            PlannedExercise e = d.exercises.get(i);
            if ("MAIN".equals(e.section) && e != firstMain && e.sets > 1) { e.sets--; return true; }
        }
        return false;
    }

    private static String diff(Set<String> need, Set<String> have) {
        Set<String> d = new LinkedHashSet<>(need);
        d.removeAll(have);
        return String.join(", ", d);
    }

    static double round(double v) { return Math.round(v * 1000.0) / 1000.0; }
}
