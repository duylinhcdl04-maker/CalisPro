package com.calishealth.api.service.level;

import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.config.RuleSetConfig.LadderNode;
import com.calishealth.api.engine.skill.SkillEngine;
import com.calishealth.api.engine.skill.SkillEngine.NodeProgress;
import com.calishealth.api.engine.skill.SkillGraph;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

/** Skill Tree theo DB (exercise_progressions) + trạng thái từng node của người dùng (user_skill_progress). */
@Service
public class SkillProgressService {
    private static final Map<String, String> EQUIPMENT_CODES = Map.of(
            "no equipment", "NONE", "pull-up bar", "PULL_UP_BAR", "parallel bars", "PARALLEL_BARS", "low bar", "LOW_BAR",
            "gymnastic rings", "RINGS", "rings", "RINGS", "resistance band", "RESISTANCE_BAND");

    private final ExerciseProgressionRepository progressionRepo;
    private final ExerciseRepository exerciseRepo;
    private final ExerciseAttributeRepository attributeRepo;
    private final ExerciseRestrictionRepository restrictionRepo;
    private final UserSkillProgressRepository progressRepo;

    public SkillProgressService(ExerciseProgressionRepository progressionRepo, ExerciseRepository exerciseRepo,
                                ExerciseAttributeRepository attributeRepo, ExerciseRestrictionRepository restrictionRepo,
                                UserSkillProgressRepository progressRepo) {
        this.progressionRepo = progressionRepo;
        this.exerciseRepo = exerciseRepo;
        this.attributeRepo = attributeRepo;
        this.progressRepo = progressRepo;
        this.restrictionRepo = restrictionRepo;
    }

    // ============================== Đồ thị ==============================

    @Transactional(readOnly = true)
    public SkillGraph graph(RuleSetConfig rs) {
        List<ExerciseProgression> all = progressionRepo.findAllWithExercises();
        Map<Long, Exercise> exercises = new LinkedHashMap<>();
        List<SkillGraph.Edge> next = new ArrayList<>();
        Map<Long, Set<Long>> alternatives = new HashMap<>();
        for (ExerciseProgression p : all) {
            exercises.put(p.getExercise().getId(), p.getExercise());
            exercises.put(p.getPrerequisiteExercise().getId(), p.getPrerequisiteExercise());
            switch (p.getProgressionType()) {
                case NEXT -> next.add(new SkillGraph.Edge(p.getPrerequisiteExercise().getId(), p.getExercise().getId(), p.getMinReps(),
                        p.getMinHoldSec(), p.getMinFormScore() == null ? null : p.getMinFormScore().doubleValue(),
                        p.getMinQualifyingSessions() == null ? 2 : p.getMinQualifyingSessions(),
                        p.getMandatory() == null || p.getMandatory(), p.getWeight() == null ? 1 : p.getWeight().doubleValue()));
                case REGRESSION -> next.add(new SkillGraph.Edge(p.getPrerequisiteExercise().getId(), p.getExercise().getId(),
                        p.getMinReps(), null, null, 2, true, 1));
                case ALTERNATIVE -> alternatives.computeIfAbsent(p.getExercise().getId(), k -> new LinkedHashSet<>())
                        .add(p.getPrerequisiteExercise().getId());
            }
        }
        for (LadderNode n : rs.ladderNodes()) {
            if (!exercises.containsKey(n.exerciseId())) exerciseRepo.findById(n.exerciseId()).ifPresent(e -> exercises.put(e.getId(), e));
        }
        List<SkillGraph.Node> nodes = exercises.values().stream().map(e -> new SkillGraph.Node(e.getId(), e.getCode(),
                e.getDisplayName() != null ? e.getDisplayName() : e.getName(),
                rs.ladderNode(e.getId()).map(ladderNode -> ladderNode.competency()).orElse(e.getCategory() == null ? null : e.getCategory().getCode()),
                e.isEquipmentRequired())).toList();
        return new SkillGraph(nodes, next, alternatives);
    }

    /** Dụng cụ cần cho từng bài: tập con bất kỳ (any-of) từ thuộc tính EQUIPMENT; rỗng = không cần dụng cụ. */
    @Transactional(readOnly = true)
    public Map<Long, Set<String>> equipmentRequirements(Collection<Long> exerciseIds) {
        Map<Long, Set<String>> out = new HashMap<>();
        if (exerciseIds.isEmpty()) return out;
        for (ExerciseAttribute a : attributeRepo.findByExerciseIdInOrderBySortOrderAsc(exerciseIds)) {
            if (!"EQUIPMENT".equals(a.getAttributeType())) continue;
            String code = EQUIPMENT_CODES.getOrDefault(a.getAttributeValue().trim().toLowerCase(),
                    a.getAttributeValue().trim().toUpperCase().replace(' ', '_').replace('-', '_'));
            Set<String> set = out.computeIfAbsent(a.getExercise().getId(), k -> new LinkedHashSet<>());
            if (!"NONE".equals(code)) set.add(code);
        }
        for (Long id : exerciseIds) {
            if (out.containsKey(id)) continue;
            // Chưa khai báo dụng cụ: dựa vào cờ equipment_required (cần ít nhất một dụng cụ bất kỳ)
            exerciseRepo.findById(id).ifPresent(e -> out.put(id, e.isEquipmentRequired() ? Set.of("ANY") : Set.of()));
        }
        return out;
    }

    public static boolean equipmentOk(Set<String> required, Set<String> userEquipment) {
        if (required == null || required.isEmpty()) return true;
        if (required.contains("ANY")) return !userEquipment.isEmpty();
        return required.stream().anyMatch(userEquipment::contains);
    }

    /** Bài bị chống chỉ định (AVOID/WARNING) với vùng đau/chấn thương người dùng khai báo. */
    @Transactional(readOnly = true)
    public Set<Long> restrictedExercises(Set<String> limitations, boolean screeningFlag) {
        Set<Long> out = new HashSet<>();
        if (!limitations.isEmpty()) {
            for (ExerciseRestriction r : restrictionRepo.findAllWithExercise()) {
                if (r.getSeverity() != RestrictionSeverity.AVOID && r.getSeverity() != RestrictionSeverity.WARNING) continue;
                String code = r.getRestrictionCode().toUpperCase();
                if (limitations.stream().anyMatch(code::contains)) out.add(r.getExercise().getId());
            }
        }
        if (screeningFlag) {
            // Cờ sàng lọc an toàn: khoá bài lộn ngược / bật nhảy cho tới khi coach mở khoá
            for (String code : List.of("handstand", "chest-to-wall-handstand", "handstand-push-up", "freestanding-handstand-push-up",
                    "explosive-pull-up", "muscle-up")) {
                exerciseRepo.findByCode(code).ifPresent(e -> out.add(e.getId()));
            }
        }
        return out;
    }

    // ============================== Tiến bộ của người dùng ==============================

    @Transactional(readOnly = true)
    public Map<Long, NodeProgress> progress(Long userId) {
        Map<Long, NodeProgress> m = new HashMap<>();
        for (UserSkillProgress p : progressRepo.findByUserId(userId)) {
            m.put(p.getExerciseId(), new NodeProgress(p.getExerciseId(), p.getStatus(),
                    p.getBestValue() == null ? null : p.getBestValue().doubleValue(),
                    p.getBestFormScore() == null ? null : p.getBestFormScore().doubleValue(), p.getQualifyingSessions()));
        }
        return m;
    }

    /** Ghi nhận một lần thực hiện; trả về true nếu node vừa chuyển sang ACHIEVED. */
    @Transactional
    public boolean record(Long userId, RuleSetConfig rs, SkillGraph graph, Long exerciseId, double value, Double formScore, String source) {
        if (graph.node(exerciseId).isEmpty() && rs.ladderNode(exerciseId).isEmpty()) return false;
        UserSkillProgress row = progressRepo.findByUserIdAndExerciseId(userId, exerciseId).orElseGet(() -> {
            UserSkillProgress p = new UserSkillProgress();
            p.setUserId(userId);
            p.setExerciseId(exerciseId);
            return p;
        });
        NodeProgress current = row.getId() == null ? null : new NodeProgress(exerciseId, row.getStatus(),
                row.getBestValue() == null ? null : row.getBestValue().doubleValue(),
                row.getBestFormScore() == null ? null : row.getBestFormScore().doubleValue(), row.getQualifyingSessions());
        String before = row.getStatus();
        SkillEngine.PerformanceUpdate u = SkillEngine.recordPerformance(current, SkillEngine.criteria(rs, graph, exerciseId), value, formScore, source);
        row.setStatus(u.status());
        row.setBestValue(u.bestValue() == null ? null : BigDecimal.valueOf(u.bestValue()).setScale(2, RoundingMode.HALF_UP));
        row.setBestFormScore(u.bestFormScore() == null ? null : BigDecimal.valueOf(u.bestFormScore()).setScale(2, RoundingMode.HALF_UP));
        row.setQualifyingSessions(u.qualifyingSessions());
        if (u.qualified() || row.getSource() == null) row.setSource(source);
        boolean nowAchieved = SkillEngine.ACHIEVED.equals(u.status()) && !SkillEngine.ACHIEVED.equals(before);
        if (nowAchieved) row.setAchievedAt(Instant.now());
        progressRepo.save(row);
        return nowAchieved;
    }

    /** Tự khai "bài khó nhất làm được": mọi nấc dễ hơn trong chuỗi coi như đã đạt (tự khai). */
    @Transactional
    public void seedFromSelfReport(Long userId, RuleSetConfig rs, SkillGraph graph, Long exerciseId, double value) {
        record(userId, rs, graph, exerciseId, value, null, "SELF_REPORTED");
        for (Long easier : graph.easier(exerciseId, 10).keySet()) {
            UserSkillProgress row = progressRepo.findByUserIdAndExerciseId(userId, easier).orElseGet(() -> {
                UserSkillProgress p = new UserSkillProgress();
                p.setUserId(userId);
                p.setExerciseId(easier);
                return p;
            });
            if (SkillEngine.ACHIEVED.equals(row.getStatus())) continue;
            row.setStatus(SkillEngine.ACHIEVED_SELF_REPORTED);
            row.setSource("SELF_REPORTED");
            progressRepo.save(row);
        }
    }

    /** Coach mở khoá / xác minh một node. */
    @Transactional
    public void setStatus(Long userId, Long exerciseId, String status, String source) {
        UserSkillProgress row = progressRepo.findByUserIdAndExerciseId(userId, exerciseId).orElseGet(() -> {
            UserSkillProgress p = new UserSkillProgress();
            p.setUserId(userId);
            p.setExerciseId(exerciseId);
            return p;
        });
        row.setStatus(status);
        row.setSource(source);
        if (SkillEngine.ACHIEVED.equals(status)) row.setAchievedAt(Instant.now());
        progressRepo.save(row);
    }
}
