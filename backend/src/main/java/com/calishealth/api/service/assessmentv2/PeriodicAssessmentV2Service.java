package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.dto.AssessmentV2Dtos.*;
import com.calishealth.api.engine.v2.RuleParams;
import com.calishealth.api.engine.v2.competency.CompetencyScoringEngine.CompetencyScore;
import com.calishealth.api.engine.v2.level.LevelModelsV2.*;
import com.calishealth.api.engine.v2.level.PeriodicDecisionEngine;
import com.calishealth.api.engine.v2.level.PeriodicModels.*;
import com.calishealth.api.engine.v2.level.TrainingStabilityEvaluator;
import com.calishealth.api.service.assessmentv2.AssessmentSessionStore.SessionRow;
import com.calishealth.api.service.assessmentv2.BaselineEvidenceBuilder.AttemptData;
import com.calishealth.api.service.assessmentv2.BaselineEvidenceBuilder.TestItem;
import com.calishealth.api.service.assessmentv2.LevelStateV2Service.LevelDecision;
import com.calishealth.api.service.assessmentv2.LevelStateV2Service.LevelState;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * Periodic thường kỳ SAU Baseline (ASSESSMENT_FRAMEWORK_V2 §8, §34): đo bằng camera một bộ bài theo level hiện tại/đích, rồi PeriodicDecisionEngine
 * quyết định lên / giữ / tụt level theo hysteresis và xu hướng.
 *  - Cần level đã xác minh (Baseline) và cách lần đo hợp lệ trước ≥ assessment.minIntervalDays (trừ khi đang RETURNING).
 *  - Đo không tin cậy hoặc user dừng ⇒ RETEST_REQUIRED; thiếu độ phủ năng lực của level hiện tại ⇒ INSUFFICIENT_EVIDENCE. Cả hai KHÔNG đổi level,
 *    EWMA, chuỗi suy giảm (I19) - chỉ để lại dòng lịch sử.
 *  - Stability lai (§41): PASS nếu lần quyết định hợp lệ gần nhất (trong stability.prevWindowWeeks) đạt mức đó, HOẶC các buổi tập thật gần đây đạt chuẩn với form đủ;
 *    thiếu cả hai ⇒ INSUFFICIENT_EVIDENCE (chặn lên level, không phải FAIL).
 *  - CHƯA nối: cờ Coach chặn tụt level; sinh Training Cycle (bước sau). Chưa ghi v1.
 */
@Service
public class PeriodicAssessmentV2Service {
    static final String TYPE = "PERIODIC", PURPOSE = "PERIODIC_V2", ALGORITHM = "PERIODIC_V2/LEVEL_ENGINE_V2";

    private final AssessmentSessionStore store;
    private final RuleSetV2Loader ruleSets;
    private final SafetyGateService gate;
    private final AssessmentV2Settings settings;
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final AttemptRecorder recorder;
    private final ResultWriter writer;
    private final LevelStateV2Service levelState;
    private final L4ReviewService l4Reviews;
    private final TrainingEvidenceSource training;
    private final TrainingStabilityEvaluator trainingStability = new TrainingStabilityEvaluator();
    private final BaselineEvidenceBuilder builder = new BaselineEvidenceBuilder();
    private final PeriodicDecisionEngine engine = new PeriodicDecisionEngine();

    public PeriodicAssessmentV2Service(AssessmentSessionStore store, RuleSetV2Loader ruleSets, SafetyGateService gate, AssessmentV2Settings settings, JdbcTemplate jdbc,
                                     ObjectMapper json, AttemptRecorder recorder, ResultWriter writer, LevelStateV2Service levelState, L4ReviewService l4Reviews,
                                     TrainingEvidenceSource training) {
        this.store = store; this.ruleSets = ruleSets; this.gate = gate; this.settings = settings; this.jdbc = jdbc; this.json = json;
        this.recorder = recorder; this.writer = writer; this.levelState = levelState; this.l4Reviews = l4Reviews; this.training = training;
    }

    /** Tùy chọn để test dựng tay vẫn chạy: điều kiện mở đánh giá (hết chu kỳ tập, Coach mở sớm) và lọc bài chưa quen. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private PeriodicEligibilityService eligibility;

    /** Tùy chọn: chuyên cần (EXP) làm cổng và điểm cộng nhỏ khi xét lên level; không có thì engine chạy như trước. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.calishealth.api.service.exp.ExpService exp;

    // ------------------------------------------------------------------ start

    /** Tùy chọn để test dựng tay vẫn chạy. Đổi level (đo định kỳ) chỉ dành cho người tập theo giáo án HỆ THỐNG. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.calishealth.api.service.level.PlanChoiceService planChoice;

    @Transactional
    public StartPeriodicResponse start(long userId) {
        if (planChoice != null && !com.calishealth.api.service.level.PlanChoiceService.SYSTEM.equals(planChoice.effectiveMode(userId)))
            throw new IllegalStateException("SYSTEM_PLAN_REQUIRED: muốn được nâng hoặc hạ level, bạn cần tập theo giáo án do hệ thống đưa ra theo level của bạn. Danh sách bài tập tự tạo không dùng để xét level.");
        RuleSetV2 rs = ruleSets.loadConfigured();
        var safety = gate.check(userId, "PERIODIC_START");
        if (safety.constraints().contains("NO_MAX_EFFORT_TEST"))
            throw new IllegalStateException("ASSESSMENT_PARTICIPATION_RESTRICTED: ràng buộc an toàn không cho làm bài test tối đa - cần clearance trước. Level giữ nguyên (không bị hạ).");
        LevelState st = levelState.state(userId).orElseThrow(() -> new IllegalStateException("BASELINE_REQUIRED: cần hoàn tất Baseline (level đã xác minh) trước khi đo định kỳ"));
        st = refreshReturning(userId, st, rs.params());

        TemplateMeta t = store.loadTemplate(settings.periodicTemplateCode());
        Optional<Long> open = jdbc.queryForList("SELECT id FROM assessment_sessions WHERE user_id = ? AND purpose = ? AND status = 'IN_PROGRESS' ORDER BY id DESC LIMIT 1", Long.class, userId, PURPOSE)
                .stream().findFirst();
        if (open.isPresent() && expiresAt(open.get()).isBefore(Instant.now())) { store.setStatus(open.get(), "EXPIRED"); open = Optional.empty(); }

        long id;
        boolean resumed = open.isPresent();
        if (resumed) id = open.get();
        else {
            Instant earliest = earliestNext(st, rs.params());
            if (earliest != null && Instant.now().isBefore(earliest))
                throw new IllegalStateException("PERIODIC_TOO_SOON: chưa đủ " + (long) rs.params().require("assessment.minIntervalDays") + " ngày kể từ lần đo hợp lệ trước - sớm nhất " + earliest);
            if (eligibility != null) {
                var gateState = eligibility.check(userId, st, rs.params());
                if (!gateState.open())
                    throw new IllegalStateException("CYCLE_IN_PROGRESS: bạn chưa hoàn thành chu kỳ tập hiện tại (" + gateState.sessionsDone() + "/" + gateState.sessionsPlanned() + " buổi"
                            + (gateState.cycleEnd() == null ? "" : ", kết thúc " + gateState.cycleEnd()) + "). Hoàn thành chu kỳ tập để được đánh giá.");
            }
            int span = (int) rs.params().require("baseline.max_span_days");
            id = store.createSession(userId, TYPE, t, rs.id(), PURPOSE, ALGORITHM, Instant.now().plus(Duration.ofDays(span)), "AI_MEASURED");
        }
        SessionRow s = store.find(id).orElseThrow();
        Evaluation ev = evaluate(s, rs, t, st, null);
        return new StartPeriodicResponse(id, resumed, (long) rs.params().require("protocol.restSec"), expiresAt(id), st.levelCode(), rs.level(PeriodicTestPlan.targetRank(st.levelRank())).code(),
                st.status(), ev.tests(), ev.next());
    }

    public PeriodicProgressDto next(long userId, long sessionId) {
        SessionRow s = own(userId, sessionId);
        if ("COMPLETED".equals(s.status())) return stored(sessionId);
        RuleSetV2 rs = ruleSets.load(s.ruleSetId());
        return evaluate(s, rs, store.loadTemplate(settings.periodicTemplateCode()), levelState.state(userId).orElseThrow(), null).progress();
    }

    public PeriodicProgressDto result(long userId, long sessionId) { return next(userId, sessionId); }

    // ------------------------------------------------------------------ attempt

    @Transactional
    public PeriodicProgressDto submitAttempt(long userId, long sessionId, SubmitAttemptRequest req) {
        SessionRow s = own(userId, sessionId);
        if (!"IN_PROGRESS".equals(s.status())) throw new IllegalStateException("Phiên không còn IN_PROGRESS: " + s.status());
        if (expiresAt(sessionId).isBefore(Instant.now())) {
            store.setStatus(sessionId, "EXPIRED");
            throw new IllegalStateException("SESSION_EXPIRED: quá cửa sổ baseline.max_span_days - bắt đầu lần đo mới (level giữ nguyên)");
        }
        RuleSetV2 rs = ruleSets.load(s.ruleSetId());
        TemplateMeta t = store.loadTemplate(settings.periodicTemplateCode());
        LevelState st = levelState.state(userId).orElseThrow(() -> new IllegalStateException("BASELINE_REQUIRED: chưa có level đã xác minh"));

        List<TestItem> all = recorder.testItems(t);
        List<TestItem> plan = testPlan(s.userId(), rs, all, st.levelRank());
        TestItem item = plan.stream().filter(i -> i.exercise().equals(req.exerciseCode())).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("INVALID_ATTEMPT: bài không thuộc bộ test lần này: " + req.exerciseCode()));
        if (recorder.loadAttempts(sessionId, t, all).containsKey(item.exercise()))
            throw new IllegalStateException("ATTEMPT_ALREADY_RECORDED: mỗi bài chỉ đo một lần trong lần đo định kỳ: " + item.exercise());

        AttemptResultDto last = recorder.record(s, rs, t, req, "gate.reliability");
        Evaluation ev = evaluate(store.find(sessionId).orElseThrow(), rs, t, st, last);
        if (ev.finished()) return finish(s, rs, t, st, ev);
        return ev.progress();
    }

    // ------------------------------------------------------------------ đánh giá

    /** finished = đủ dữ liệu để kết thúc phiên (DECIDED | RETEST_REQUIRED | INSUFFICIENT_EVIDENCE). */
    private record Evaluation(boolean finished, PeriodicOutcome outcome, PeriodicResult result, BaselineEvidenceBuilder.Built built, Double overall, Integer candidateRank,
                              List<Integer> passRanks, List<PeriodicItemDto> tests, NextStepDto next, PeriodicProgressDto progress) {}

    private Evaluation evaluate(SessionRow s, RuleSetV2 rs, TemplateMeta t, LevelState st, AttemptResultDto last) {
        RuleParams p = rs.params();
        List<TestItem> all = recorder.testItems(t);
        List<TestItem> plan = testPlan(s.userId(), rs, all, st.levelRank());
        Map<String, List<AttemptData>> attempts = recorder.loadAttempts(s.id(), t, plan);

        List<PeriodicItemDto> tests = new ArrayList<>();
        TestItem firstMissing = null;
        boolean anyBad = false, pain = false;
        for (TestItem it : plan) {
            List<AttemptData> a = attempts.getOrDefault(it.exercise(), List.of());
            String status = a.isEmpty() ? "PENDING" : a.stream().anyMatch(x -> x.status() == AttemptStatus.VALID) ? "VALID"
                    : a.stream().anyMatch(x -> x.status() == AttemptStatus.USER_ABORTED) ? "USER_ABORTED" : "INVALID_MEASUREMENT";
            tests.add(new PeriodicItemDto(it.exercise(), it.competency(), it.metric(), status));
            if (a.isEmpty() && firstMissing == null) firstMissing = it;
            if ("USER_ABORTED".equals(status) || "INVALID_MEASUREMENT".equals(status)) anyBad = true;
        }
        pain = last != null && "PAIN".equals(last.invalidReason());
        String levelBefore = st.levelCode();
        NextStepDto nextStep = null;
        if (firstMissing != null && !anyBad) {
            Instant lastEnd = Optional.ofNullable(jdbc.queryForObject("SELECT MAX(ended_at) FROM assessment_attempts WHERE session_id = ?", Timestamp.class, s.id())).map(Timestamp::toInstant).orElse(null);
            long rest = (long) p.require("protocol.restSec");
            long remaining = lastEnd == null ? 0 : Math.max(0, lastEnd.plusSeconds(rest).getEpochSecond() - Instant.now().getEpochSecond());
            nextStep = new NextStepDto(PeriodicTestPlan.targetRank(st.levelRank()), firstMissing.exercise(), 1, "PERIODIC_TEST", remaining, firstMissing.metric(), firstMissing.competency());
        }

        // 1) đo hỏng / dừng: RETEST_REQUIRED ngay (không nâng, không hạ, không đổi state)
        if (anyBad) {
            Instant retestAfter = Instant.now().plus(Duration.ofDays((long) p.require("baseline.retest_after_days")));
            PeriodicResult r = new PeriodicResult(PeriodicOutcome.RETEST_REQUIRED, null, st.levelRank(), UserLevelStatus.valueOf(st.status()), st.ewma(), st.consecutiveBelow(),
                    pain ? "USER_ABORTED_PAIN" : "MEASUREMENT_UNRELIABLE", Map.of(), null);
            return finishedEvaluation(r, null, null, null, List.of(), tests, levelBefore, null, retestAfter, pain, last, List.of());
        }
        // 2) thiếu bài: tiếp tục
        if (firstMissing != null) {
            PeriodicProgressDto dto = new PeriodicProgressDto("IN_PROGRESS", null, levelBefore, null, false, null, Map.of(), null, null, st.ewma(), st.consecutiveBelow(), tests,
                    nextStep, last, null, false, List.of());
            return new Evaluation(false, null, null, null, null, null, List.of(), tests, nextStep, dto);
        }

        // 3) đủ dữ liệu: dựng bằng chứng và quyết định
        var built = builder.build(rs, plan, attempts, rank -> 1);
        Map<String, Double> scores = new LinkedHashMap<>();
        for (var e : built.competencies().entrySet()) if (e.getValue().score() != null) scores.put(e.getKey(), e.getValue().score());
        LevelDef current = rs.level(st.levelRank());
        // Overall chỉ dùng được khi MỌI năng lực level hiện tại yêu cầu đã có điểm: điểm tổng trên độ phủ một phần không phải bằng chứng để tụt/lên (I19)
        boolean covered = current.competencyReqs().stream().allMatch(c -> scores.get(c.competency()) != null);
        Double overall = covered ? built.overall() : null;
        Map<String, Double> regressionScores = new HashMap<>();
        scores.forEach((c, v) -> { if (builder.coverageComplete(rs, plan, attempts, st.levelRank(), c)) regressionScores.put(c, v); });

        Map<String, Double> regressBelow = new HashMap<>();
        jdbc.query("SELECT code, overall_regress_below FROM fitness_levels WHERE rule_set_id = ?", rch -> { regressBelow.put(rch.getString(1), rch.getDouble(2)); }, rs.id());
        List<PeriodicLevel> levels = rs.levels().stream().map(l -> new PeriodicLevel(l.rank(), l.code(), l.promoteMin(), regressBelow.getOrDefault(l.code(), 0.0), l.competencyReqs())).toList();

        int step = (int) p.require("max_promotion_step");
        Instant window = Instant.now().minus(Duration.ofDays(7 * (long) p.require("stability.prevWindowWeeks")));
        Optional<LevelDecision> previous = levelState.latestDecidedSince(s.userId(), window);
        Map<Integer, TargetGates> gates = new HashMap<>();
        for (int r = st.levelRank() + 1; r <= Math.min(st.levelRank() + step, 4); r++) {
            final int rank = r;
            LevelEvidence ev = built.levels().stream().filter(l -> l.rank() == rank).findFirst().orElseThrow();
            Attempt a = ev.attempts().isEmpty() ? new Attempt(AttemptStatus.NOT_DONE, false) : ev.attempts().get(0);
            GateStatus pq = switch (a.status()) {
                case VALID -> a.meetsLevelRequirements() ? GateStatus.PASS : GateStatus.FAIL;
                case NOT_DONE -> GateStatus.INSUFFICIENT_EVIDENCE;
                default -> GateStatus.UNRELIABLE;
            };
            // Stability lai: PASS nếu lần quyết định trước đạt mức này HOẶC các buổi tập gần đây đạt chuẩn với form đủ (§41). Thiếu cả hai = thiếu bằng chứng, không phải FAIL (I19).
            GateStatus fromHistory = previous.isEmpty() ? null
                    : previous.get().candidateRank() != null && previous.get().candidateRank() >= rank && previous.get().competencyPassRanks().contains(rank) ? GateStatus.PASS : GateStatus.FAIL;
            GateStatus stability = combineStability(fromHistory, trainingVerdict(s.userId(), rs, rank, attempts, p));
            gates.put(rank, new TargetGates(pq, pq, ev.competency(), ev.skill(), stability));
        }

        boolean illness = illness(s.userId(), p);
        PeriodicInput in = new PeriodicInput(st.levelRank(), UserLevelStatus.valueOf(st.status()), overall, GateStatus.PASS, regressionScores, st.ewma(), st.consecutiveBelow(),
                illness, false, levels, gates, exp == null ? null : exp.attendance(s.userId(), p));
        PeriodicResult res = engine.decide(in, p);

        Integer candidate = overall == null ? null : levels.stream().filter(l -> overall >= l.promoteMin()).mapToInt(PeriodicLevel::rank).max().orElse(0);
        List<Integer> passRanks = built.levels().stream().filter(l -> l.competency() == GateStatus.PASS).map(LevelEvidence::rank).toList();
        List<CompetencyDto> comps = built.competencies().entrySet().stream().map(e -> new CompetencyDto(e.getKey(), e.getValue().score(), e.getValue().coverage(),
                e.getValue().answerConfidence(), "HIGH", false)).toList();
        return finishedEvaluation(res, built, overall, candidate, passRanks, tests, levelBefore, rs, null, false, last, comps);
    }

    /** Ghép hai nguồn: PASS nếu một nguồn PASS; FAIL nếu có nguồn FAIL (và không nguồn nào PASS); còn lại thiếu bằng chứng. */
    static GateStatus combineStability(GateStatus history, TrainingStabilityEvaluator.Verdict log) {
        if (history == GateStatus.PASS || log == TrainingStabilityEvaluator.Verdict.PASS) return GateStatus.PASS;
        if (history == GateStatus.FAIL || log == TrainingStabilityEvaluator.Verdict.FAIL) return GateStatus.FAIL;
        return GateStatus.INSUFFICIENT_EVIDENCE;
    }

    /** Chất lượng các buổi tập thật cho level đích `rank`: bài nút cổ chai theo yêu cầu hiệu năng bắt buộc và thành tích vừa đo. */
    private TrainingStabilityEvaluator.Verdict trainingVerdict(long userId, RuleSetV2 rs, int rank, Map<String, List<AttemptData>> attempts, RuleParams p) {
        List<TrainingStabilityEvaluator.Req> reqs = new ArrayList<>();
        for (RuleSetV2.PerformanceReq r : rs.performance(rank)) {
            Double best = attempts.getOrDefault(r.exercise(), List.of()).stream().filter(a -> a.status() == AttemptStatus.VALID && a.value() != null)
                    .map(AttemptData::value).max(Double::compare).orElse(null);
            Set<String> harder = new HashSet<>();
            for (var ladder : rs.ladders()) {
                var stage = ladder.stages().stream().filter(st -> st.code().equals(r.exercise())).findFirst();
                stage.ifPresent(st -> ladder.stages().stream().filter(o -> o.rank() > st.rank()).forEach(o -> harder.add(o.code())));
            }
            reqs.add(new TrainingStabilityEvaluator.Req(r.exercise(), r.value(), best, harder));
        }
        int window = (int) p.require("stability.logWindowDays");
        List<TrainingStabilityEvaluator.Obs> obs = training.observations(userId, window);
        return trainingStability.evaluate(reqs, obs, Instant.now(), window, (int) p.require("stability.logLastN"), (int) p.require("stability.logMinPass"),
                p.require("progression.minForm")).verdict();
    }

    private Evaluation finishedEvaluation(PeriodicResult r, BaselineEvidenceBuilder.Built built, Double overall, Integer candidate, List<Integer> passRanks, List<PeriodicItemDto> tests,
                                          String levelBefore, RuleSetV2 rs, Instant retestAfter, boolean rescreen, AttemptResultDto last, List<CompetencyDto> comps) {
        boolean decided = r.outcome() == PeriodicOutcome.DECIDED;
        String after = decided ? (rs == null ? levelBefore : rs.level(r.finalRank()).code()) : null;
        Map<String, String> blocked = new LinkedHashMap<>();
        r.blockedGates().forEach((k, v) -> blocked.put(k, v.name()));
        PeriodicProgressDto dto = new PeriodicProgressDto(r.outcome().name(), decided ? r.decision().name() : null, levelBefore, after, decided && !levelBefore.equals(after), r.reasonCode(), blocked,
                null, overall, r.ewma(), r.consecutiveBelow(), tests, null, last, retestAfter, rescreen, comps);
        return new Evaluation(true, r.outcome(), r, built, overall, candidate, passRanks, tests, null, dto);
    }

    // ------------------------------------------------------------------ kết thúc

    private PeriodicProgressDto finish(SessionRow s, RuleSetV2 rs, TemplateMeta t, LevelState st, Evaluation ev) {
        PeriodicResult r = ev.result();
        boolean decided = r.outcome() == PeriodicOutcome.DECIDED;
        String after = decided ? rs.level(r.finalRank()).code() : null;
        Integer pending = r.pendingCoachRank();
        String l4Status = pending == null ? null : l4Reviews.consentGranted(s.id()) ? "PENDING_COACH" : "RECORDING_CONSENT_REQUIRED";
        PeriodicProgressDto dto = withL4(ev.progress(), l4Status);

        if (ev.built() != null) writer.persist(s, rs, t, ev.built(), ev.overall(), dto, decided, after, ALGORITHM);
        else writer.persistWithoutEvidence(s, rs, dto, ALGORITHM);

        Instant now = Instant.now();
        if (decided && exp != null) exp.onAssessmentFinished(s.userId(), s.id());     // thưởng việc đo trọn vẹn; sau khi đã quyết định nên không tự nâng điểm của chính lần đo này
        if (decided) {
            String source = r.finalRank() == 4 && st.levelRank() == 4 ? st.source() : "AI_MEASURED";    // Coach đã xác nhận L4 và vẫn ở L4 ⇒ giữ nguồn
            levelState.upsert(s.userId(), after, r.finalRank(), r.statusAfter().name(), source, r.ewma(), r.consecutiveBelow(), s.id(), now);
            levelState.recordDecision(s.userId(), s.id(), "PERIODIC", "DECIDED", r.decision().name(), st.levelCode(), after, ev.candidateRank(), ev.passRanks(), ev.overall(), r.ewma(),
                    r.consecutiveBelow(), r.reasonCode(), pending);
            if (pending != null && "PENDING_COACH".equals(l4Status))
                l4Reviews.openPackage(s.userId(), s.id(), "PERIODIC", rs.id(), after, rs.level(pending).code(), ev.overall(), (int) rs.params().require("l4.review.expiry_days"));
            else l4Reviews.supersedePending(s.userId());     // kết quả mới không còn đủ điều kiện L4: gói chờ cũ đã lỗi thời
        } else {
            levelState.recordDecision(s.userId(), s.id(), "PERIODIC", r.outcome().name(), null, st.levelCode(), null, null, ev.passRanks(), ev.overall(), null, null, r.reasonCode(), null);
        }
        return dto;
    }

    private static PeriodicProgressDto withL4(PeriodicProgressDto d, String l4) {
        return new PeriodicProgressDto(d.outcome(), d.decision(), d.levelBefore(), d.levelAfter(), d.levelChanged(), d.reasonCode(), d.blockedGates(), l4, d.overallScore(), d.ewma(),
                d.consecutiveBelow(), d.tests(), d.next(), d.lastAttempt(), d.retestAfter(), d.rescreenRecommended(), d.competencies());
    }

    // ------------------------------------------------------------------ trạng thái level của user

    public Optional<LevelStateDto> myLevel(long userId) {
        Optional<LevelState> st = levelState.state(userId);
        if (st.isEmpty()) return Optional.empty();
        RuleSetV2 rs = ruleSets.loadConfigured();
        Instant earliest = earliestNext(st.get(), rs.params());
        String l4 = l4Reviews.latestFor(userId).map(L4ReviewSummaryDto::status).orElse(null);
        List<LevelHistoryDto> history = levelState.history(userId, 30).stream()
                .map(h -> new LevelHistoryDto(h.createdAt(), h.kind(), h.outcome(), h.decision(), h.levelBefore(), h.levelAfter(), h.reasonCode())).toList();
        LevelState s = st.get();
        PeriodicEligibilityService.Gate g = eligibility == null ? null : eligibility.check(userId, s, rs.params());
        return Optional.of(new LevelStateDto(s.levelCode(), s.levelRank(), s.status(), s.source(), s.ewma(), s.lastAssessedAt(), earliest, l4, history,
                g == null ? PeriodicEligibilityService.OPEN : g.code(), g == null ? null : g.cycleEnd(), g == null ? 0 : g.sessionsDone(), g == null ? 0 : g.sessionsPlanned()));
    }

    // ------------------------------------------------------------------ nội bộ

    /**
     * Bộ bài đo lần này. Bài chỉ thuộc level CAO HƠN level hiện tại mà học viên chưa tập đủ `periodic.familiar.minSessions` buổi (mặc định 2) thì không đưa vào:
     * bắt đo bài chưa từng tập làm sai số đo và rủi ro chấn thương. Thiếu bài đó nghĩa là thiếu bằng chứng để lên level (I19), không phải trượt.
     */
    private List<TestItem> testPlan(long userId, RuleSetV2 rs, List<TestItem> all, int rank) {
        List<TestItem> plan = PeriodicTestPlan.select(rs, all, rank);
        if (eligibility == null) return plan;
        List<String> higher = plan.stream().filter(i -> i.levelMin() > rank).map(TestItem::exercise).distinct().toList();
        if (higher.isEmpty()) return plan;
        Set<String> known = eligibility.familiar(userId, higher, (int) rs.params().find("periodic.familiar.minSessions").orElse(2));
        return plan.stream().filter(i -> i.levelMin() <= rank || known.contains(i.exercise())).toList();
    }

    /** Sớm nhất được đo lại: lần đo hợp lệ trước + minIntervalDays; RETURNING thì được đo ngay. */
    private Instant earliestNext(LevelState st, RuleParams p) {
        if (LevelStateV2Service.RETURNING.equals(st.status())) return null;
        return st.lastAssessedAt().plus(Duration.ofDays((long) p.require("assessment.minIntervalDays")));
    }

    /** Không có buổi tập hoàn thành và không có lần đo nào ≥ returning.inactiveDays ngày ⇒ RETURNING (giữ level, phải đo lại; không tự hạ vì chưa có bằng chứng). */
    private LevelState refreshReturning(long userId, LevelState st, RuleParams p) {
        if (LevelStateV2Service.RETURNING.equals(st.status())) return st;
        Instant lastWorkout = Optional.ofNullable(jdbc.queryForObject("SELECT MAX(completed_at) FROM workout_sessions WHERE user_id = ? AND completed_at IS NOT NULL", Timestamp.class, userId))
                .map(Timestamp::toInstant).orElse(null);
        Instant lastActivity = lastWorkout != null && lastWorkout.isAfter(st.lastAssessedAt()) ? lastWorkout : st.lastAssessedAt();
        if (Duration.between(lastActivity, Instant.now()).toDays() >= (long) p.require("returning.inactiveDays")) {
            levelState.markReturning(userId);
            return levelState.state(userId).orElseThrow();
        }
        return st;
    }

    private boolean illness(long userId, RuleParams p) {
        LocalDate since = LocalDate.now().minusDays((long) p.require("periodic.illness.windowDays"));
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM daily_checkins WHERE user_id = ? AND checkin_date >= ? AND energy_level IS NOT NULL AND energy_level <= ?",
                Integer.class, userId, java.sql.Date.valueOf(since), (int) p.require("periodic.illness.maxEnergy"));
        return n != null && n > 0;
    }

    private Instant expiresAt(long sessionId) { return jdbc.queryForObject("SELECT expires_at FROM assessment_sessions WHERE id = ?", Timestamp.class, sessionId).toInstant(); }

    private PeriodicProgressDto stored(long sessionId) {
        return json.readValue(jdbc.queryForObject("SELECT snapshot_json FROM assessment_results WHERE session_id = ?", String.class, sessionId), PeriodicProgressDto.class);
    }

    private SessionRow own(long userId, long sessionId) {
        SessionRow s = store.find(sessionId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên " + sessionId));
        boolean periodic = Objects.equals(PURPOSE, jdbc.queryForObject("SELECT purpose FROM assessment_sessions WHERE id = ?", String.class, sessionId));
        if (s.userId() != userId || !TYPE.equals(s.typeCode()) || !periodic) throw new IllegalArgumentException("Không tìm thấy phiên " + sessionId);
        return s;
    }
}
