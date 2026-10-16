package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.engine.v2.RuleParams;
import com.calishealth.api.engine.v2.level.BaselineDecisionEngine;
import com.calishealth.api.engine.v2.level.LevelModelsV2.*;
import com.calishealth.api.engine.v2.progression.ProgressionModels.LadderResult;
import com.calishealth.api.service.assessmentv2.AssessmentSessionStore.SessionRow;
import com.calishealth.api.service.assessmentv2.BaselineEvidenceBuilder.AttemptData;
import com.calishealth.api.service.assessmentv2.BaselineEvidenceBuilder.TestItem;
import com.calishealth.api.service.assessmentv2.TemplateMeta.QuestionMeta;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Baseline thực hành ĐẦU TIÊN (ASSESSMENT_FRAMEWORK_V2 §8.1): staircase theo level, attempt độc lập, Stability bằng attempt lặp,
 * fast-track không bỏ cổng nào. Bằng chứng không tin cậy ⇒ RETEST_REQUIRED (không nâng/hạ/đổi state); thiếu bằng chứng ⇒ IN_PROGRESS (I19).
 * CHƯA ghi user_level_state/level_evaluations của v1 (nối khi kích hoạt V2); kết quả đầy đủ nằm ở assessment_results.snapshot_json.
 */
@Service
public class BaselineService {
    static final String TYPE = "PERIODIC", PURPOSE = "BASELINE_V2", ALGORITHM = "BASELINE_V2/LEVEL_ENGINE_V2";

    private final AssessmentSessionStore store;
    private final RuleSetV2Loader ruleSets;
    private final SafetyGateService gate;
    private final AssessmentV2Settings settings;
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final L4ReviewService l4Reviews;
    private final AttemptRecorder recorder;
    private final ResultWriter writer;
    private final LevelStateV2Service levelState;
    private final BaselineHistory history;
    private final BaselineEvidenceBuilder builder = new BaselineEvidenceBuilder();
    private final BaselineDecisionEngine engine = new BaselineDecisionEngine();

    public BaselineService(AssessmentSessionStore store, RuleSetV2Loader ruleSets, SafetyGateService gate, AssessmentV2Settings settings, JdbcTemplate jdbc, ObjectMapper json, L4ReviewService l4Reviews, AttemptRecorder recorder, ResultWriter writer, LevelStateV2Service levelState) {
        this.writer = writer; this.levelState = levelState; this.history = new BaselineHistory(jdbc);
        this.recorder = recorder;
        this.l4Reviews = l4Reviews;
        this.store = store; this.ruleSets = ruleSets; this.gate = gate; this.settings = settings; this.jdbc = jdbc; this.json = json;
    }

    // ------------------------------------------------------------------ start

    @Transactional
    public StartBaselineResponse start(long userId) {
        RuleSetV2 rs = ruleSets.loadConfigured();
        var safety = gate.check(userId, "PERIODIC_START");
        if (safety.constraints().contains("NO_MAX_EFFORT_TEST"))
            throw new IllegalStateException("ASSESSMENT_PARTICIPATION_RESTRICTED: ràng buộc an toàn không cho làm bài test tối đa - cần clearance trước. Level giữ nguyên (không bị hạ).");
        // Baseline đầu; hoặc ĐO LẠI (tối đa baseline.retake.max lần trong baseline.retake.windowDays ngày) khi kết quả đầu thấp hơn level tạm (§46)
        boolean v1Verified = !jdbc.queryForList("SELECT 1 FROM user_level_state WHERE user_id = ? AND (status = 'VERIFIED' OR fast_track_consumed = TRUE)", Integer.class, userId).isEmpty();
        boolean hasRuns = !history.completedRuns(userId, rs).isEmpty();
        if (v1Verified || (hasRuns && !history.retake(userId, rs).eligible()))
            throw new IllegalStateException("BASELINE_NOT_FIRST: level đã được xác minh bằng Baseline và không còn lượt đo lại; dùng Periodic Assessment thường");

        TemplateMeta t = store.loadTemplate(settings.periodicTemplateCode());
        Optional<Long> open = store.findInProgress(userId, TYPE, t.id());
        long id;
        boolean resumed = open.isPresent();
        if (resumed) id = open.get();
        else {
            int span = (int) rs.params().require("baseline.max_span_days");
            id = store.createSession(userId, TYPE, t, rs.id(), PURPOSE, ALGORITHM, Instant.now().plus(Duration.ofDays(span)), "AI_MEASURED");
            jdbc.update("DELETE FROM baseline_deferrals WHERE user_id = ?", userId);   // đã quay lại làm bài đo: bỏ trạng thái "đo sau"
        }
        SessionRow s = store.find(id).orElseThrow();
        Instant expires = jdbc.queryForObject("SELECT expires_at FROM assessment_sessions WHERE id = ?", Timestamp.class, id).toInstant();
        return new StartBaselineResponse(id, resumed, (long) rs.params().require("protocol.restSec"), expires, evaluate(s, rs, t, null).progress().next());
    }

    public BaselineProgressDto next(long userId, long sessionId) {
        SessionRow s = own(userId, sessionId);
        if ("COMPLETED".equals(s.status())) return stored(sessionId);
        RuleSetV2 rs = ruleSets.load(s.ruleSetId());
        return evaluate(s, rs, store.loadTemplate(settings.periodicTemplateCode()), null).progress();
    }

    public BaselineProgressDto result(long userId, long sessionId) { return next(userId, sessionId); }

    // ------------------------------------------------------------------ attempt

    @Transactional
    public BaselineProgressDto submitAttempt(long userId, long sessionId, SubmitAttemptRequest req) {
        SessionRow s = own(userId, sessionId);
        if (!"IN_PROGRESS".equals(s.status())) throw new IllegalStateException("Phiên không còn IN_PROGRESS: " + s.status());
        Instant expires = jdbc.queryForObject("SELECT expires_at FROM assessment_sessions WHERE id = ?", Timestamp.class, sessionId).toInstant();
        if (expires.isBefore(Instant.now())) {
            store.setStatus(sessionId, "EXPIRED");
            throw new IllegalStateException("SESSION_EXPIRED: quá cửa sổ baseline.max_span_days - bắt đầu Baseline mới (chưa tiêu thụ fast-track)");
        }

        RuleSetV2 rs = ruleSets.load(s.ruleSetId());
        RuleParams p = rs.params();
        TemplateMeta t = store.loadTemplate(settings.periodicTemplateCode());
        AttemptResultDto last = recorder.record(s, rs, t, req, "baseline.reliability");
        Evaluation ev = evaluate(store.find(sessionId).orElseThrow(), rs, t, last);
        if (ev.result().outcome() != BaselineOutcome.INCOMPLETE) finish(s, rs, t, ev);
        return ev.progress();
    }

    // ------------------------------------------------------------------ đánh giá

    private record Evaluation(BaselineResult result, BaselineEvidenceBuilder.Built built, BaselineProgressDto progress) {}

    private Evaluation evaluate(SessionRow s, RuleSetV2 rs, TemplateMeta t, AttemptResultDto last) { return evaluate(s, rs, t, last, false); }

    /** early = kết thúc sớm (§46): chốt level đã đủ bằng chứng; thiếu bằng chứng ở level kế không phải RETEST/INCOMPLETE. */
    private Evaluation evaluate(SessionRow s, RuleSetV2 rs, TemplateMeta t, AttemptResultDto last, boolean early) {
        List<TestItem> items = recorder.testItems(t);
        Map<String, List<AttemptData>> attempts = recorder.loadAttempts(s.id(), t, items);

        var built = builder.build(rs, items, attempts);
        int provisional = provisionalRank(s.userId(), rs);
        BaselineInput input = new BaselineInput(provisional, true, built.levels());
        BaselineResult res = early ? engine.decideEarly(input, rs.params()) : engine.decide(input, rs.params());

        NextStepDto next = null;
        if (res.outcome() == BaselineOutcome.INCOMPLETE) {
            Instant lastEnd = Optional.ofNullable(jdbc.queryForObject("SELECT MAX(ended_at) FROM assessment_attempts WHERE session_id = ?", Timestamp.class, s.id())).map(Timestamp::toInstant).orElse(null);
            long rest = (long) rs.params().require("protocol.restSec");
            long remaining = lastEnd == null ? 0 : Math.max(0, lastEnd.plusSeconds(rest).getEpochSecond() - Instant.now().getEpochSecond());
            next = builder.next(rs, items, attempts).map(n -> {
                TestItem it = items.stream().filter(i -> i.exercise().equals(n.exercise())).findFirst().orElse(null);
                return new NextStepDto(n.level(), n.exercise(), n.attemptNo(), n.reason(), remaining, it == null ? null : it.metric(), it == null ? null : it.competency());
            }).orElse(null);
        }
        String finalLevel = res.outcome() == BaselineOutcome.VERIFIED ? rs.level(res.finalRank()).code() : null;
        boolean rescreen = last != null && "PAIN".equals(last.invalidReason());
        Instant retestAfter = res.outcome() == BaselineOutcome.RETEST_REQUIRED
                ? Instant.now().plus(Duration.ofDays((long) rs.params().require("baseline.retest_after_days"))) : null;
        Map<Integer, String> stab = new LinkedHashMap<>();
        res.stabilityByLevel().forEach((k, v) -> stab.put(k, v.name()));
        List<CompetencyDto> comps = built.competencies().entrySet().stream().map(e -> new CompetencyDto(e.getKey(), e.getValue().score(), e.getValue().coverage(),
                e.getValue().answerConfidence(), "HIGH", false)).toList();
        List<LadderDto> ladders = built.ladders().stream().map(l -> new LadderDto(l.ladder(), rs.ladderByCode(l.ladder()).orElseThrow().competency(), l.highestStage(),
                l.stagePerformanceRatio(), l.score(), l.state().name(),
                l.stages().stream().map(st -> new StageDto(st.stage(), st.rank(), st.status().name(), st.origin(), st.value(), st.reasonCode())).toList())).toList();
        String outcome = res.outcome() == BaselineOutcome.INCOMPLETE ? "IN_PROGRESS" : res.outcome().name();
        BaselineProgressDto dto = new BaselineProgressDto(outcome, res.decision() == null ? null : res.decision().name(), finalLevel, res.fastTrackConsumed(), res.reasonCode(),
                next, last, stab, retestAfter, rescreen, built.overall(), comps, ladders, l4Status(s.id(), res));
        return new Evaluation(res, built, dto);
    }

    /** null nếu không liên quan L4; RECORDING_CONSENT_REQUIRED = đủ điều kiện L4 nhưng user không đồng ý ghi hình nên không vào hàng chờ Coach. */
    private String l4Status(long sessionId, BaselineResult res) {
        if (res.pendingCoachRank() == null) return null;
        return l4Reviews.consentGranted(sessionId) ? "PENDING_COACH" : "RECORDING_CONSENT_REQUIRED";
    }

    private int provisionalRank(long userId, RuleSetV2 rs) { return history.provisionalRank(userId, rs); }

    // ------------------------------------------------------------------ kết thúc sớm / bỏ qua đo sau / level đang hiển thị (§46)

    /** Chốt level theo những bài đã đo đủ (vd không có dụng cụ cho bài kế tiếp). Chưa đủ bằng chứng thì không kết thúc được và KHÔNG hạ level tạm. */
    @Transactional
    public BaselineProgressDto finishEarly(long userId, long sessionId) {
        SessionRow s = own(userId, sessionId);
        if (!"IN_PROGRESS".equals(s.status())) throw new IllegalStateException("Phiên không còn IN_PROGRESS: " + s.status());
        RuleSetV2 rs = ruleSets.load(s.ruleSetId());
        TemplateMeta t = store.loadTemplate(settings.periodicTemplateCode());
        Evaluation ev = evaluate(s, rs, t, null, true);
        if (ev.result().outcome() != BaselineOutcome.VERIFIED) {
            throw new IllegalStateException("PARTIAL_EVIDENCE_BELOW_PROVISIONAL".equals(ev.result().reasonCode())
                    ? "PARTIAL_EVIDENCE_BELOW_PROVISIONAL: các bài đã đo chưa đủ để kết luận bạn thấp hơn level tạm. Hãy đo thêm hoặc chọn bỏ qua, đo sau (level tạm được giữ nguyên)."
                    : "NO_EVIDENCE_FOR_EARLY_FINISH: chưa có bài nào được đo đủ để xác nhận level. Hãy đo thêm hoặc chọn bỏ qua, đo sau.");
        }
        finish(s, rs, t, ev);
        return ev.progress();
    }

    /** Người dùng chọn chưa làm bài đo thực hành: dùng level tạm từ khảo sát, nhắc lại sau baseline.defer.remindDays ngày. Phiên đang dở (nếu có) vẫn giữ để làm tiếp. */
    @Transactional
    public DeferDto defer(long userId) {
        RuleSetV2 rs = ruleSets.loadConfigured();
        if (levelState.state(userId).isPresent()) throw new IllegalStateException("BASELINE_ALREADY_DONE: level đã được xác minh, không cần bỏ qua bài đo");
        Instant remind = Instant.now().plus(Duration.ofDays((long) rs.params().require("baseline.defer.remindDays")));
        jdbc.update("""
                INSERT INTO baseline_deferrals (user_id, deferred_at, remind_after, defer_count) VALUES (?, ?, ?, 1)
                ON DUPLICATE KEY UPDATE deferred_at = VALUES(deferred_at), remind_after = VALUES(remind_after), defer_count = defer_count + 1""",
                userId, Timestamp.from(Instant.now()), Timestamp.from(remind));
        int count = jdbc.queryForObject("SELECT defer_count FROM baseline_deferrals WHERE user_id = ?", Integer.class, userId);
        return new DeferDto(remind, count);
    }

    /** Level đang hiển thị: đã xác nhận (VERIFIED) hoặc tạm thời (PROVISIONAL, từ khảo sát, tối đa initial.max_level_rank). */
    public LevelStatusDto levelStatus(long userId) {
        RuleSetV2 rs = ruleSets.loadConfigured();
        Optional<String> provisional = history.provisionalCode(userId);
        var state = levelState.state(userId);
        int capRank = (int) rs.params().require("initial.max_level_rank");
        String cap = rs.levels().stream().filter(l -> l.rank() == capRank).map(l -> l.code()).findFirst().orElse(null);
        String verified = state.map(LevelStateV2Service.LevelState::levelCode).orElse(null);
        String display = verified != null ? verified : provisional.orElse(null);
        String label = verified != null ? "VERIFIED" : provisional.isPresent() ? "PROVISIONAL" : "NONE";
        Instant deferred = state.isPresent() ? null : history.deferredUntil(userId).orElse(null);
        return new LevelStatusDto(provisional.orElse(null), cap, verified, verified != null && history.lastWasPartial(userId), display, label, history.retake(userId, rs), deferred);
    }

    // ------------------------------------------------------------------ kết thúc (VERIFIED | RETEST_REQUIRED)

    private void finish(SessionRow s, RuleSetV2 rs, TemplateMeta t, Evaluation ev) {
        BaselineProgressDto dto = ev.progress();
        boolean verified = ev.result().outcome() == BaselineOutcome.VERIFIED;
        Timestamp now = Timestamp.from(Instant.now());

        writer.persist(s, rs, t, ev.built(), dto.overallScore(), dto, verified, dto.finalLevel(), ALGORITHM);

        // L4 cần Coach xác nhận: có đồng ý ghi hình => mở gói review (tham chiếu attempt gốc); không đồng ý => chỉ có L3, không vào hàng chờ
        Integer pending = ev.result().pendingCoachRank();
        if (verified && pending != null && l4Reviews.consentGranted(s.id()))
            l4Reviews.openPackage(s.userId(), s.id(), "BASELINE", rs.id(), dto.finalLevel(), rs.level(pending).code(), dto.overallScore(),
                    (int) rs.params().require("l4.review.expiry_days"));

        // Trạng thái level V2 + lịch sử: chỉ có kết luận hợp lệ mới tạo trạng thái; RETEST_REQUIRED chỉ để lại dòng lịch sử (I19). EWMA khởi tạo bằng Overall (F6).
        BaselineResult r = ev.result();
        List<Integer> passRanks = ev.built().levels().stream().filter(l -> l.competency() == GateStatus.PASS).map(l -> l.rank()).toList();
        String before = rs.level(provisionalRank(s.userId(), rs)).code();
        if (verified) {
            // Đo lại: level cuối là mức CAO NHẤT của các lần đo hợp lệ; lần đo lại không cao hơn thì giữ level cũ (chỉ ghi lịch sử)
            var existing = levelState.state(s.userId());
            if (existing.isPresent() && r.finalRank() <= existing.get().levelRank()) {
                levelState.recordDecision(s.userId(), s.id(), "BASELINE", "DECIDED", "MAINTAINED", existing.get().levelCode(), existing.get().levelCode(), existing.get().levelRank(),
                        passRanks, dto.overallScore(), existing.get().ewma(), 0, "BASELINE_RETAKE_NOT_HIGHER", pending);
            } else {
                levelState.upsert(s.userId(), dto.finalLevel(), r.finalRank(), LevelStateV2Service.VERIFIED, "AI_MEASURED", dto.overallScore(), 0, s.id(), Instant.now());
                levelState.recordDecision(s.userId(), s.id(), "BASELINE", "DECIDED", r.decision().name(), before, dto.finalLevel(), pending != null ? pending : r.finalRank(),
                        passRanks, dto.overallScore(), dto.overallScore(), 0, existing.isPresent() ? "BASELINE_RETAKE_HIGHER" : r.reasonCode(), pending);
            }
        } else {
            levelState.recordDecision(s.userId(), s.id(), "BASELINE", r.outcome().name(), null, before, null, null, passRanks, dto.overallScore(), null, null, r.reasonCode(), null);
        }
    }

    private BaselineProgressDto stored(long sessionId) {
        return json.readValue(jdbc.queryForObject("SELECT snapshot_json FROM assessment_results WHERE session_id = ?", String.class, sessionId), BaselineProgressDto.class);
    }

    private SessionRow own(long userId, long sessionId) {
        SessionRow s = store.find(sessionId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên " + sessionId));
        if (s.userId() != userId || !TYPE.equals(s.typeCode())) throw new IllegalArgumentException("Không tìm thấy phiên " + sessionId);
        return s;
    }
}
