package com.calishealth.api.service.level;

import com.calishealth.api.dto.LevelEngineDtos.*;
import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.level.LevelModels.Reason;
import com.calishealth.api.engine.skill.SkillEngine;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.util.*;

/**
 * Coach can thiệp có kiểm toán: đổi level, mở khoá / xác minh node kỹ năng, xác minh kết quả bài test.
 * Lưu quyết định gốc + quyết định mới + lý do + coach thực hiện; engine vẫn chạy bình thường ở lần đánh giá sau.
 */
@Service
public class CoachOverrideService {
    private final RuleSetProvider ruleSets;
    private final LevelDataService levelData;
    private final SkillProgressService skills;
    private final FitnessStateService fitnessState;
    private final PeriodicAssessmentService periodic;
    private final CoachOverrideRepository overrideRepo;
    private final UserRepository userRepo;
    private final ObjectMapper json = new ObjectMapper();

    public CoachOverrideService(RuleSetProvider ruleSets, LevelDataService levelData, SkillProgressService skills,
                                FitnessStateService fitnessState, PeriodicAssessmentService periodic,
                                CoachOverrideRepository overrideRepo, UserRepository userRepo) {
        this.ruleSets = ruleSets;
        this.levelData = levelData;
        this.skills = skills;
        this.fitnessState = fitnessState;
        this.periodic = periodic;
        this.overrideRepo = overrideRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public OverrideDto override(Long coachId, Long userId, OverrideRequest req) {
        if (req.reason() == null || req.reason().isBlank()) throw new IllegalArgumentException("Bắt buộc nhập lý do khi can thiệp.");
        User user = userRepo.findById(userId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy học viên"));
        if (user.getRole() != Role.USER) throw new IllegalArgumentException("Chỉ can thiệp được hồ sơ học viên.");
        RuleSetConfig rs = ruleSets.active();
        CoachOverride o = new CoachOverride();
        o.setUserId(userId);
        o.setCoachId(coachId);
        o.setReason(req.reason().trim());
        String type = req.targetType() == null ? "" : req.targetType().toUpperCase();
        switch (type) {
            case "LEVEL" -> {
                String newLevel = rs.level(req.newLevel()).code();
                if (!newLevel.equalsIgnoreCase(req.newLevel())) throw new IllegalArgumentException("Level không hợp lệ: " + req.newLevel());
                Optional<UserLevelState> st = levelData.state(userId);
                String old = st.map(userLevelState -> userLevelState.getLevelCode()).orElse(null);
                o.setTargetType("LEVEL");
                o.setOriginalValueJson(json.writeValueAsString(Map.of("level", String.valueOf(old),
                        "status", st.map(userLevelState -> userLevelState.getStatus()).orElse("NONE"))));
                o.setNewValueJson(json.writeValueAsString(Map.of("level", newLevel, "status", UserLevelState.VERIFIED)));
                o = overrideRepo.save(o);
                Long sessionId = st.map(userLevelState -> userLevelState.getLastEvaluationId()).flatMap(id -> levelData.history(userId).stream()
                        .filter(e -> e.getId().equals(id)).findFirst()).map(levelEvaluation -> levelEvaluation.getAssessmentSessionId()).orElse(0L);
                List<Reason> reasons = List.of(new Reason("DECISION", "COACH_OVERRIDE", null, null, null, null, true,
                        "Coach điều chỉnh level: " + req.reason().trim()));
                LevelEvaluation ev = levelData.saveEvaluation(userId, sessionId, rs, old, newLevel, newLevel,
                        st.map(s -> s.getOverallScore() == null ? null : s.getOverallScore().doubleValue()).orElse(null),
                        st.map(s -> s.getEwmaOverall() == null ? null : s.getEwmaOverall().doubleValue()).orElse(null),
                        Map.of(), "COACH_OVERRIDE", reasons, Map.of("overrideId", o.getId()),
                        "Coach đã điều chỉnh level của bạn thành " + rs.level(newLevel).name() + ". Lý do: " + req.reason().trim());
                ev.setCoachOverrideId(o.getId());
                levelData.updateState(userId, newLevel, UserLevelState.VERIFIED, null, null, 0, ev.getId(),
                        st.map(userLevelState -> userLevelState.getNextAssessmentDue()).orElse(null));
            }
            case "SKILL_NODE" -> {
                Long exId = Long.valueOf(req.exerciseId());
                String status = req.nodeStatus() == null ? SkillEngine.ACHIEVED : req.nodeStatus().toUpperCase();
                if (!List.of(SkillEngine.ACHIEVED, SkillEngine.READY, SkillEngine.LOCKED).contains(status)) {
                    throw new IllegalArgumentException("Trạng thái node không hợp lệ: " + status);
                }
                String old = Optional.ofNullable(skills.progress(userId).get(exId)).map(nodeProgress -> nodeProgress.status()).orElse("LOCKED");
                o.setTargetType("SKILL_NODE");
                o.setTargetId(exId);
                o.setOriginalValueJson(json.writeValueAsString(Map.of("status", old)));
                o.setNewValueJson(json.writeValueAsString(Map.of("status", status)));
                o = overrideRepo.save(o);
                skills.setStatus(userId, exId, status, "COACH_VERIFIED");
            }
            default -> throw new IllegalArgumentException("targetType phải là LEVEL hoặc SKILL_NODE.");
        }
        if (Boolean.TRUE.equals(req.regenerateCycle())) fitnessState.regenerate(userId, "CONSTRAINT_CHANGED");
        return dto(o);
    }

    @Transactional
    public List<TestResultDto> verifyAssessment(Long coachId, Long sessionId, String reason) {
        List<TestResultDto> results = periodic.verify(sessionId, ruleSets.active());
        CoachOverride o = new CoachOverride();
        o.setCoachId(coachId);
        o.setUserId(0L);
        o.setTargetType("VERIFY_TEST");
        o.setTargetId(sessionId);
        o.setOriginalValueJson("{}");
        o.setNewValueJson(json.writeValueAsString(Map.of("verifiedResults", results.size())));
        o.setReason(reason == null || reason.isBlank() ? "Coach xác minh kết quả bài test" : reason);
        overrideRepo.save(o);
        return results;
    }

    @Transactional(readOnly = true)
    public List<OverrideDto> list(Long userId) {
        return overrideRepo.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::dto).toList();
    }

    private OverrideDto dto(CoachOverride o) {
        return new OverrideDto(String.valueOf(o.getId()), String.valueOf(o.getUserId()), String.valueOf(o.getCoachId()), o.getTargetType(),
                o.getTargetId() == null ? null : String.valueOf(o.getTargetId()), o.getOriginalValueJson(), o.getNewValueJson(),
                o.getReason(), o.getCreatedAt());
    }
}
