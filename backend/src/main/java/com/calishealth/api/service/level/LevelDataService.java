package com.calishealth.api.service.level;

import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.level.CompetencyScoringEngine;
import com.calishealth.api.engine.level.CompetencyScoringEngine.CompetencyResult;
import com.calishealth.api.engine.level.CompetencyScoringEngine.Observation;
import com.calishealth.api.engine.level.CompetencyScoringEngine.PreviousState;
import com.calishealth.api.engine.level.LevelModels.Reason;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/** Đọc/ghi năng lực (append-only), kết quả xét level và con trỏ trạng thái level của người dùng. */
@Service
public class LevelDataService {
    private final UserCompetencyScoreRepository scoreRepo;
    private final LevelEvaluationRepository evaluationRepo;
    private final UserLevelStateRepository stateRepo;
    private final ObjectMapper json = new ObjectMapper();

    public LevelDataService(UserCompetencyScoreRepository scoreRepo, LevelEvaluationRepository evaluationRepo,
                            UserLevelStateRepository stateRepo) {
        this.scoreRepo = scoreRepo;
        this.evaluationRepo = evaluationRepo;
        this.stateRepo = stateRepo;
    }

    // ============================== Năng lực ==============================

    /** Năng lực hiện tại = dòng mới nhất của từng năng lực. */
    @Transactional(readOnly = true)
    public Map<String, CompetencyResult> currentCompetencies(Long userId) {
        Map<String, UserCompetencyScore> latest = new LinkedHashMap<>();
        for (UserCompetencyScore s : scoreRepo.findByUserIdOrderByCreatedAtAsc(userId)) latest.put(s.getCompetencyCode(), s);
        Map<String, CompetencyResult> out = new LinkedHashMap<>();
        latest.forEach((c, s) -> out.put(c, new CompetencyResult(c, d(s.getBlendedScore()), d(s.getObservationScore()),
                s.getConfidence().doubleValue(), s.getBand(), s.getTrend(), s.getSource(), s.getDataQuality())));
        return out;
    }

    /**
     * Hợp nhất observation của lần đánh giá hiện tại với toàn bộ lịch sử rồi ghi 1 dòng / năng lực.
     * @param quality năng lực -> trạng thái chất lượng dữ liệu (HIGH/MEDIUM/LOW/CONFLICTED)
     */
    @Transactional
    public Map<String, CompetencyResult> record(Long userId, Long sessionId, RuleSetConfig rs, Map<String, Observation> current,
                                                Map<String, String> quality, Instant now) {
        List<UserCompetencyScore> rows = scoreRepo.findByUserIdOrderByCreatedAtAsc(userId);
        List<Observation> history = new ArrayList<>();
        Map<String, PreviousState> previous = new HashMap<>();
        for (UserCompetencyScore s : rows) {
            if (s.getObservationScore() != null) {
                history.add(new Observation(s.getCompetencyCode(), s.getObservationScore().doubleValue(), s.getSource(),
                        s.getReliability().doubleValue(), s.getQualityFactor().doubleValue(), s.getCreatedAt()));
            }
            previous.put(s.getCompetencyCode(), new PreviousState(d(s.getBlendedScore()), s.getBand()));
        }
        Map<String, CompetencyResult> results = CompetencyScoringEngine.blend(rs, history, current, previous, now);
        Map<String, CompetencyResult> out = new LinkedHashMap<>();
        for (CompetencyResult r : results.values()) {
            Observation cur = current.get(r.code());
            if (cur == null && r.score() == null) continue;  // chưa từng có dữ liệu cho năng lực này
            String q = quality.getOrDefault(r.code(), "HIGH");
            UserCompetencyScore row = new UserCompetencyScore();
            row.setUserId(userId);
            row.setAssessmentSessionId(sessionId);
            row.setCompetencyCode(r.code());
            row.setObservationScore(cur == null || cur.score() == null ? null : bd(cur.score(), 2));
            row.setBlendedScore(r.score() == null ? null : bd(r.score(), 2));
            row.setConfidence(bd(r.confidence(), 3));
            row.setReliability(bd(cur == null ? 0 : cur.reliability(), 3));
            row.setQualityFactor(bd(cur == null ? 0 : cur.quality(), 3));
            row.setBand(r.band());
            row.setSource(cur == null ? "CARRIED_FORWARD" : cur.source());
            row.setDataQuality(cur == null ? "N/A" : q);
            row.setTrend(r.trend());
            row.setRuleSetId(rs.id());
            row.setCreatedAt(now);
            scoreRepo.save(row);
            out.put(r.code(), new CompetencyResult(r.code(), r.score(), r.observation(), r.confidence(), r.band(), r.trend(),
                    row.getSource(), row.getDataQuality()));
        }
        return out;
    }

    // ============================== Level ==============================

    @Transactional(readOnly = true)
    public Optional<UserLevelState> state(Long userId) {
        return stateRepo.findById(userId);
    }

    @Transactional
    public LevelEvaluation saveEvaluation(Long userId, Long sessionId, RuleSetConfig rs, String previous, String candidate,
                                          String finalLevel, Double overall, Double ewma, Map<String, String> gates,
                                          String decision, List<Reason> reasons, Object snapshot, String explanation) {
        LevelEvaluation e = new LevelEvaluation();
        e.setUserId(userId);
        e.setAssessmentSessionId(sessionId);
        e.setPreviousLevel(previous);
        e.setCandidateLevel(candidate);
        e.setFinalLevel(finalLevel);
        e.setOverallScore(overall == null ? null : bd(overall, 2));
        e.setEwmaOverall(ewma == null ? null : bd(ewma, 2));
        e.setReliabilityGate(gates.get("RELIABILITY"));
        e.setPerformanceGate(gates.get("PERFORMANCE"));
        e.setQualityGate(gates.get("QUALITY"));
        e.setCompetencyGate(gates.get("COMPETENCY"));
        e.setSkillGate(gates.get("SKILL"));
        e.setStabilityGate(gates.get("STABILITY"));
        e.setDecision(decision);
        e.setReasonsJson(json.writeValueAsString(reasons));
        e.setSnapshotJson(json.writeValueAsString(snapshot));
        e.setExplanation(explanation);
        e.setRuleSetId(rs.id());
        e.setAlgorithmVersion(RuleSetConfig.ALGORITHM_VERSION);
        return evaluationRepo.save(e);
    }

    @Transactional
    public UserLevelState updateState(Long userId, String level, String status, Double overall, Double ewma, int consecutiveBelow,
                                      Long evaluationId, LocalDate nextDue) {
        UserLevelState s = stateRepo.findById(userId).orElseGet(() -> {
            UserLevelState n = new UserLevelState();
            n.setUserId(userId);
            return n;
        });
        s.setLevelCode(level);
        s.setStatus(status);
        if (overall != null) s.setOverallScore(bd(overall, 2));
        if (ewma != null) s.setEwmaOverall(bd(ewma, 2));
        s.setConsecutiveBelow(consecutiveBelow);
        s.setLastEvaluationId(evaluationId);
        if (nextDue != null) s.setNextAssessmentDue(nextDue);
        return stateRepo.save(s);
    }

    @Transactional(readOnly = true)
    public List<LevelEvaluation> history(Long userId) {
        return evaluationRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    static Double d(BigDecimal v) { return v == null ? null : v.doubleValue(); }

    static BigDecimal bd(double v, int scale) { return BigDecimal.valueOf(v).setScale(scale, RoundingMode.HALF_UP); }
}
