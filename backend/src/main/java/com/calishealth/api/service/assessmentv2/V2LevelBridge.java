package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.level.LevelModels;
import com.calishealth.api.engine.skill.SkillGraph;
import com.calishealth.api.entity.Goal;
import com.calishealth.api.entity.LevelEvaluation;
import com.calishealth.api.entity.UserCompetencyScore;
import com.calishealth.api.entity.UserGoal;
import com.calishealth.api.entity.UserGoalStatus;
import com.calishealth.api.entity.UserLevelState;
import com.calishealth.api.entity.UserTrainingConstraints;
import com.calishealth.api.repository.GoalRepository;
import com.calishealth.api.repository.UserCompetencyScoreRepository;
import com.calishealth.api.repository.UserGoalRepository;
import com.calishealth.api.repository.UserRepository;
import com.calishealth.api.service.level.LevelDataService;
import com.calishealth.api.service.level.RuleSetProvider;
import com.calishealth.api.service.level.SkillProgressService;
import com.calishealth.api.service.level.TrainingCycleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * Cầu nối V2 -> v1 (ASSESSMENT_FRAMEWORK_V2 §47): khi V2 chạy thật, kết quả V2 được ghi sang các bảng mà phần còn lại của ứng dụng đọc
 * (user_level_state, level_evaluations, user_competency_scores, skill tree, ràng buộc tập luyện, mục tiêu) và sinh chu kỳ tập,
 * để trang Lộ trình, giáo án mẫu theo level và thông tin level của học viên luôn khớp với V2.
 *
 * Nguyên tắc:
 *  - V2 là nguồn sự thật; cầu nối chỉ SAO CHÉP kết quả, không tính lại level.
 *  - Chạy SAU KHI giao dịch của V2 commit và trong giao dịch riêng: cầu nối hỏng thì kết quả V2 vẫn nguyên, chỉ ghi log; gọi lại sẽ bù (idempotent
 *    theo từng cặp phiên + loại nguồn).
 *  - Chỉ kết luận hợp lệ mới đổi level (I19): lần đo cần đo lại hoặc thiếu bằng chứng không tạo đánh giá nào.
 *  - Khảo sát (tự khai) không bao giờ ghi đè level đã xác minh bằng đo thực tế.
 */
@Service
@ConditionalOnProperty(name = "app.assessment-v2.enabled", havingValue = "true")
public class V2LevelBridge {
    private static final Logger log = LoggerFactory.getLogger(V2LevelBridge.class);
    static final String INITIAL = "V2_INITIAL", BASELINE = "V2_BASELINE", PERIODIC = "V2_PERIODIC", COACH_L4 = "V2_COACH_L4";

    private final JdbcTemplate jdbc;
    private final AssessmentSessionStore store;
    private final RuleSetProvider ruleSets;
    private final LevelDataService levelData;
    private final TrainingCycleService cycles;
    private final SkillProgressService skills;
    private final UserCompetencyScoreRepository scoreRepo;
    private final GoalRepository goalRepo;
    private final UserGoalRepository userGoalRepo;
    private final UserRepository userRepo;
    private final ObjectMapper json = new ObjectMapper();
    /** Giao dịch RIÊNG cho mỗi lần đồng bộ. Phải dùng TransactionTemplate chứ không phải @Transactional: trong afterCommit giao dịch cũ vẫn còn gắn vào luồng,
     *  nên @Transactional(REQUIRED) sẽ nhập vào giao dịch đã commit và ghi mất; còn tự gọi nội bộ thì @Transactional không có hiệu lực. */
    private final TransactionTemplate newTx;
    /** Chỉ tự sinh chu kỳ mới khi học viên đã chọn tập theo giáo án hệ thống (chưa chọn hoặc tự tạo thì không đè lên). Tùy chọn để test dựng tay vẫn chạy. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.calishealth.api.service.level.PlanChoiceService planChoice;

    public V2LevelBridge(JdbcTemplate jdbc, AssessmentSessionStore store, RuleSetProvider ruleSets, LevelDataService levelData, TrainingCycleService cycles,
                         SkillProgressService skills, UserCompetencyScoreRepository scoreRepo, GoalRepository goalRepo, UserGoalRepository userGoalRepo, UserRepository userRepo,
                         PlatformTransactionManager txManager) {
        this.jdbc = jdbc; this.store = store; this.ruleSets = ruleSets; this.levelData = levelData; this.cycles = cycles; this.skills = skills;
        this.scoreRepo = scoreRepo; this.goalRepo = goalRepo; this.userGoalRepo = userGoalRepo; this.userRepo = userRepo;
        this.newTx = new TransactionTemplate(txManager);
        this.newTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    // ------------------------------------------------------------------ điểm vào (gọi từ dịch vụ V2)

    /** Lên lịch chạy sau khi giao dịch hiện tại commit (hoặc chạy ngay nếu không có giao dịch). Lỗi chỉ ghi log. */
    static void afterCommit(Runnable work, String what) {
        Runnable safe = () -> {
            try { work.run(); } catch (RuntimeException e) { log.error("Cầu nối V2 -> v1 lỗi ({}): {}", what, e.toString(), e); }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { safe.run(); }
            });
        } else safe.run();
    }

    /** Khảo sát tự khai vừa hoàn tất: level tạm thời, năng lực, ràng buộc, mục tiêu, skill tree và chu kỳ đầu tiên. */
    public void onInitial(long userId, long sessionId) { afterCommit(() -> newTx.executeWithoutResult(st -> syncInitial(userId, sessionId)), "initial s" + sessionId); }

    /** Một quyết định level hợp lệ vừa được ghi (Baseline, định kỳ, Coach xác nhận L4). */
    public void onDecision(long userId, long sessionId, String kind) { afterCommit(() -> newTx.executeWithoutResult(st -> syncDecision(userId, sessionId, kind)), kind + " s" + sessionId); }

    // ------------------------------------------------------------------ đồng bộ

    private boolean autoCycle(long userId) { return planChoice == null || planChoice.autoGenerate(userId); }

    public void syncInitial(long userId, long sessionId) {
        if (done(userId, sessionId, INITIAL)) return;
        // Đã có level xác minh bằng đo thực tế thì khảo sát tự khai không được ghi đè
        Integer verified = jdbc.queryForObject("SELECT COUNT(*) FROM user_level_state_v2 WHERE user_id = ?", Integer.class, userId);
        if (verified != null && verified > 0) return;
        Map<String, Object> s = session(userId, sessionId);
        if (!"COMPLETED".equals(s.get("status")) || s.get("level_code") == null) return;

        RuleSetConfig rs = ruleSets.active();
        String level = (String) s.get("level_code");
        Double overall = num(s.get("overall_score"));
        applyConstraintsAndGoal(userId, sessionId);
        writeCompetencies(userId, sessionId, rs, "SELF_REPORTED");
        String previous = levelData.state(userId).map(UserLevelState::getLevelCode).orElse(null);
        LevelEvaluation ev = saveEvaluation(userId, sessionId, rs, previous, level, overall, null, LevelModels.PROVISIONAL_ASSIGNED, INITIAL, "SELF_REPORTED", "NOT_VERIFIED", UserLevelState.PROVISIONAL,
                "Level tạm thời " + level + " từ khảo sát tự khai (tối đa " + rs.levelByRank((int) rs.param("provisional.maxRank", 2)).code() + "), cần bài đo thực tế để xác nhận.");
        levelData.updateState(userId, level, UserLevelState.PROVISIONAL, overall, overall, 0, ev.getId(), LocalDate.now().plusDays((long) rs.param("assessment.baselineDueDays", 14)));
        seedSkills(userId, sessionId, rs, false);
        if (autoCycle(userId)) cycles.generate(userId, "INITIAL_PROVISIONAL", ev, sessionId);
        else log.info("Cầu nối V2 -> v1: user {} chưa chọn (hoặc đã tự tạo) giáo án, không tự sinh chu kỳ", userId);
        log.info("Cầu nối V2 -> v1: khảo sát user {} -> level tạm thời {}", userId, level);
    }

    public void syncDecision(long userId, long sessionId, String kind) {
        String basis = switch (kind) { case "BASELINE" -> BASELINE; case "PERIODIC" -> PERIODIC; case "COACH_L4" -> COACH_L4; default -> null; };
        if (basis == null || done(userId, sessionId, basis)) return;
        List<Map<String, Object>> decisions = jdbc.queryForList("""
                SELECT decision, level_before, level_after, overall, ewma, consecutive_below, reason_code FROM level_decisions_v2
                WHERE user_id = ? AND session_id = ? AND kind = ? AND outcome = 'DECIDED' ORDER BY id DESC LIMIT 1""", userId, sessionId, kind);
        if (decisions.isEmpty()) return;   // không phải kết luận hợp lệ: không đổi level (I19)
        Map<String, Object> d = decisions.get(0);
        // Lần đo lại không cao hơn: level giữ nguyên và điểm năng lực của lần đo thấp hơn không được thay điểm hiện tại
        if ("BASELINE_RETAKE_NOT_HIGHER".equals(d.get("reason_code"))) return;
        Map<String, Object> v2 = jdbc.queryForMap("SELECT level_code, status, source, ewma, consecutive_below FROM user_level_state_v2 WHERE user_id = ?", userId);

        RuleSetConfig rs = ruleSets.active();
        String level = (String) v2.get("level_code");
        String source = (String) v2.get("source");
        String vStatus = "RETURNING".equals(v2.get("status")) ? UserLevelState.RETURNING : UserLevelState.VERIFIED;
        Double overall = num(d.get("overall"));
        Double ewma = num(v2.get("ewma"));
        if (!COACH_L4.equals(basis)) writeCompetencies(userId, sessionId, rs, source == null ? "AI_MEASURED" : source);
        String previous = levelData.state(userId).map(UserLevelState::getLevelCode).orElse(null);
        String decision = String.valueOf(d.get("decision"));
        LevelEvaluation ev = saveEvaluation(userId, sessionId, rs, previous, level, overall, ewma, decision, basis, source == null ? "AI_MEASURED" : source, "VERIFIED", vStatus,
                switch (basis) {
                    case BASELINE -> "Level " + level + " được xác nhận bằng bài đo thực hành.";
                    case PERIODIC -> "Đánh giá định kỳ: " + decision + ", level " + level + ".";
                    default -> "Huấn luyện viên xác nhận level " + level + ".";
                });
        levelData.updateState(userId, level, vStatus, overall, ewma, ((Number) v2.get("consecutive_below")).intValue(), ev.getId(),
                LocalDate.now().plusDays((long) rs.param("assessment.minIntervalDays", 14)));
        if (!COACH_L4.equals(basis)) seedSkills(userId, sessionId, rs, true);
        String reason = switch (basis) {
            case BASELINE -> "BASELINE_RECALIBRATION";
            case PERIODIC -> "REGRESSED".equals(decision) ? "PERIODIC_REGRESSED" : "PROMOTED".equals(decision) ? "PERIODIC_PROMOTED" : "PERIODIC_MAINTAINED";
            default -> "PERIODIC_PROMOTED";
        };
        if (autoCycle(userId)) cycles.generate(userId, reason, ev, sessionId);
        else log.info("Cầu nối V2 -> v1: user {} không tập theo giáo án hệ thống, giữ nguyên giáo án hiện tại", userId);
        log.info("Cầu nối V2 -> v1: {} user {} -> level {} ({})", kind, userId, level, vStatus);
    }

    // ------------------------------------------------------------------ chi tiết

    private boolean done(long userId, long sessionId, String basis) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM level_evaluations WHERE user_id = ? AND assessment_session_id = ? AND basis = ?", Integer.class, userId, sessionId, basis);
        return n != null && n > 0;
    }

    private Map<String, Object> session(long userId, long sessionId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT status, level_code, overall_score FROM assessment_sessions WHERE id = ? AND user_id = ?", sessionId, userId);
        if (rows.isEmpty()) throw new IllegalStateException("Không tìm thấy phiên " + sessionId + " của user " + userId);
        return rows.get(0);
    }

    private LevelEvaluation saveEvaluation(long userId, long sessionId, RuleSetConfig rs, String previous, String level, Double overall, Double ewma, String decision,
                                           String basis, String source, String verification, String levelStatus, String explanation) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("origin", "ASSESSMENT_V2");
        snapshot.put("basis", basis);
        snapshot.put("sessionId", sessionId);
        LevelEvaluation ev = levelData.saveEvaluation(userId, sessionId, rs, previous, level, level, overall, ewma == null ? overall : ewma, Map.of(), decision, List.of(), snapshot, explanation);
        jdbc.update("UPDATE level_evaluations SET basis = ?, source = ?, verification_status = ?, level_status = ? WHERE id = ?", basis, source, verification, levelStatus, ev.getId());
        return ev;
    }

    /** Điểm năng lực của phiên V2 -> user_competency_scores (một dòng mới mỗi năng lực; dòng mới nhất là điểm hiện tại). */
    private void writeCompetencies(long userId, long sessionId, RuleSetConfig rs, String source) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT c.competency_code, c.score, c.answer_confidence, c.merge_weight, c.data_quality FROM assessment_result_competencies c
                JOIN assessment_results r ON r.id = c.result_id WHERE r.session_id = ?""", sessionId);
        Map<String, UserCompetencyScore> latest = new HashMap<>();
        for (UserCompetencyScore s : scoreRepo.findByUserIdOrderByCreatedAtAsc(userId)) latest.put(s.getCompetencyCode(), s);
        Instant now = Instant.now();
        for (Map<String, Object> r : rows) {
            Double score = num(r.get("score"));
            if (score == null) continue;   // thiếu bằng chứng không phải điểm 0 (I19)
            String code = (String) r.get("competency_code");
            UserCompetencyScore prev = latest.get(code);
            UserCompetencyScore row = new UserCompetencyScore();
            row.setUserId(userId);
            row.setAssessmentSessionId(sessionId);
            row.setCompetencyCode(code);
            row.setObservationScore(bd(score, 2));
            row.setBlendedScore(bd(score, 2));
            Double conf = num(r.get("answer_confidence"));
            row.setConfidence(bd(conf == null ? ("SELF_REPORTED".equals(source) ? 0.5 : 0.9) : conf, 3));
            Double merge = num(r.get("merge_weight"));
            row.setReliability(bd(merge == null ? 0.5 : Math.min(1, merge), 3));
            row.setQualityFactor(bd(1.0, 3));
            row.setBand(rs.band(score, prev == null ? null : prev.getBand()));
            row.setSource(source);
            row.setDataQuality(r.get("data_quality") == null ? "HIGH" : String.valueOf(r.get("data_quality")));
            double delta = rs.param("trend.delta", 3);
            if (prev != null && prev.getBlendedScore() != null) {
                double diff = score - prev.getBlendedScore().doubleValue();
                row.setTrend(diff >= delta ? "IMPROVING" : diff <= -delta ? "DECLINING" : "STABLE");
            }
            row.setRuleSetId(rs.id());
            row.setCreatedAt(now);
            scoreRepo.save(row);
        }
    }

    /** Skill tree: bài đã đạt trong phiên V2 (tự khai thì đánh dấu tự khai, đo thực tế thì ghi như một lần thực hiện). */
    private void seedSkills(long userId, long sessionId, RuleSetConfig rs, boolean measured) {
        SkillGraph graph = skills.graph(rs);
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT exercise_id, performance_value FROM assessment_evidence WHERE session_id = ? AND evidence_role = 'PERFORMANCE_LADDER'
                AND status LIKE '%PASS%' AND performance_value IS NOT NULL""", sessionId);
        for (Map<String, Object> r : rows) {
            long exerciseId = ((Number) r.get("exercise_id")).longValue();
            double value = ((Number) r.get("performance_value")).doubleValue();
            if (measured) skills.record(userId, rs, graph, exerciseId, value, null, "AI_MEASURED");
            else rs.ladderNode(exerciseId).filter(l -> l.entered(value)).ifPresent(l -> skills.seedFromSelfReport(userId, rs, graph, exerciseId, value));
        }
    }

    // ------------------------------------------------------------------ ràng buộc và mục tiêu từ khảo sát

    private void applyConstraintsAndGoal(long userId, long sessionId) {
        Map<String, Object> a = store.loadAnswers(sessionId);
        UserTrainingConstraints c = cycles.constraints(userId);
        Integer days = digits(a.get("IA2_DAYS_PER_WEEK"));
        Integer minutes = digits(a.get("IA2_SESSION_MINUTES"));
        if (days != null) c.setDaysPerWeek(Math.max(1, Math.min(7, days)));
        if (minutes != null) c.setSessionMinutes(Math.max(10, minutes));
        if (a.get("IA2_EQUIPMENT") != null) {
            List<String> eq = new ArrayList<>();
            Object raw = a.get("IA2_EQUIPMENT");
            if (raw instanceof Collection<?> col) col.forEach(x -> eq.add(String.valueOf(x).toUpperCase())); else eq.add(String.valueOf(raw).toUpperCase());
            eq.remove("NONE");
            eq.replaceAll(x -> "BANDS".equals(x) ? "RESISTANCE_BAND" : x);   // mã dụng cụ của khảo sát V2 -> mã của Level Engine
            c.setEquipmentJson(json.writeValueAsString(eq.stream().distinct().toList()));
        }
        // Hướng tập người dùng chọn trong khảo sát (chỉ để gợi ý bài, không ảnh hưởng level/giáo án)
        String focus = a.get("IA2_TRAINING_FOCUS") == null ? "" : String.valueOf(a.get("IA2_TRAINING_FOCUS")).trim().toUpperCase();
        if (focus.equals("HEALTH") || focus.equals("SKILL")) c.setTrainingFocus(focus);
        cycles.saveConstraints(c);

        Object goalCode = a.get("IA2_PRIMARY_GOAL");
        if (goalCode == null || String.valueOf(goalCode).isBlank()) return;
        Goal goal = goalRepo.findByCode(String.valueOf(goalCode)).orElse(null);
        if (goal == null) return;
        List<UserGoal> existing = userGoalRepo.findByUserIdOrderByPriorityAsc(userId);
        UserGoal primary = existing.stream().filter(g -> g.getGoal().getId().equals(goal.getId())).findFirst().orElse(null);
        int p = 2;
        for (UserGoal g : existing) { if (g == primary) continue; g.setPriority(p++); userGoalRepo.save(g); }
        if (primary == null) {
            primary = new UserGoal();
            primary.setUser(userRepo.findById(userId).orElseThrow());
            primary.setGoal(goal);
            primary.setStartDate(LocalDate.now());
        }
        primary.setPriority(1);
        primary.setStatus(UserGoalStatus.ACTIVE);
        userGoalRepo.save(primary);
        // Hướng tập (chỉ để đề xuất bài) lấy từ mục tiêu chính nếu người dùng chưa tự chọn
        if (c.getTrainingFocus() == null) {
            c.setTrainingFocus("SKILL".equalsIgnoreCase(goal.getCategory()) ? "SKILL" : "HEALTH");
            cycles.saveConstraints(c);
        }
    }

    private static Integer digits(Object v) {
        if (v == null) return null;
        String d = String.valueOf(v).replaceAll("\\D", "");
        return d.isEmpty() ? null : Integer.parseInt(d);
    }

    private static Double num(Object o) { return o instanceof Number n ? n.doubleValue() : null; }

    private static BigDecimal bd(double v, int scale) { return BigDecimal.valueOf(v).setScale(scale, RoundingMode.HALF_UP); }
}
