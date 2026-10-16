package com.calishealth.api.service.assessment;

import com.calishealth.api.dto.AssessmentTemplateDtos.*;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import com.calishealth.api.dto.LevelEngineDtos.EngineResultDto;
import com.calishealth.api.service.level.FitnessStateService;
import com.calishealth.api.service.level.InitialAssessmentPipeline;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

/**
 * Bài test đầu vào phía học viên: trạng thái, bộ câu hỏi, nộp bài (chấm điểm ở backend), bỏ qua.
 * Kết quả là dữ liệu TỰ KHAI BÁO (source = SELF_REPORTED) - trình độ tạm thời, sẽ được cập nhật bằng đánh giá thực hành.
 */
@Service
@Transactional(readOnly = true)
public class OnboardingAssessmentService {
    static final String ONBOARDING = "ONBOARDING";
    private static final List<AssessmentSessionStatus> DONE = List.of(AssessmentSessionStatus.COMPLETED, AssessmentSessionStatus.SKIPPED);

    private final AdminAssessmentTemplateService templates;
    private final AssessmentTemplateQuestionRepository templateQuestionRepo;
    private final AssessmentTemplateLevelRepository levelRepo;
    private final AssessmentSessionRepository sessionRepo;
    private final AssessmentResponseRepository responseRepo;
    private final AssessmentScoreRepository scoreRepo;
    private final AssessmentTypeRepository typeRepo;
    private final FitnessProfileRepository fitnessProfileRepo;
    private final UserRepository userRepo;
    private final AssessmentScoringEngine scoring;
    private final InitialAssessmentPipeline levelEngine;
    private final FitnessStateService fitnessState;
    private final ObjectMapper json = new ObjectMapper();

    public OnboardingAssessmentService(AdminAssessmentTemplateService templates,
                                       AssessmentTemplateQuestionRepository templateQuestionRepo,
                                       AssessmentTemplateLevelRepository levelRepo,
                                       AssessmentSessionRepository sessionRepo,
                                       AssessmentResponseRepository responseRepo,
                                       AssessmentScoreRepository scoreRepo,
                                       AssessmentTypeRepository typeRepo,
                                       FitnessProfileRepository fitnessProfileRepo,
                                       UserRepository userRepo,
                                       AssessmentScoringEngine scoring,
                                       InitialAssessmentPipeline levelEngine,
                                       FitnessStateService fitnessState) {
        this.levelEngine = levelEngine;
        this.fitnessState = fitnessState;
        this.templates = templates;
        this.templateQuestionRepo = templateQuestionRepo;
        this.levelRepo = levelRepo;
        this.sessionRepo = sessionRepo;
        this.responseRepo = responseRepo;
        this.scoreRepo = scoreRepo;
        this.typeRepo = typeRepo;
        this.fitnessProfileRepo = fitnessProfileRepo;
        this.userRepo = userRepo;
        this.scoring = scoring;
    }

    // ============================== TRẠNG THÁI ==============================

    /** V2 chạy thật: khảo sát và bài đo nằm trong hành trình đánh giá V2 (chỉ nhắc, không chặn), nên bài test đầu vào v1 không còn chặn cổng vào ứng dụng. */
    @org.springframework.beans.factory.annotation.Value("${app.assessment-v2.enabled:false}")
    private boolean v2Enabled;

    public OnboardingStatusDto status(Long userId) {
        if (v2Enabled) return new OnboardingStatusDto("NOT_REQUIRED", false, false, null, null);
        AssessmentOnboardingSettings s = templates.settings();
        AssessmentTemplate t = s.getActiveTemplate();
        if (t == null) {
            return new OnboardingStatusDto(s.isBlockWhenMissing() ? "BLOCKED" : "NOT_REQUIRED", false, false, null, null);
        }
        Optional<AssessmentSession> done = latestDone(userId);
        if (done.isPresent() && done.get().getOnboardingRound() != null && done.get().getOnboardingRound() >= s.getRound()) {
            return new OnboardingStatusDto(done.get().getStatus().name(), false, false, String.valueOf(t.getId()), t.getVersion());
        }
        return new OnboardingStatusDto("PENDING", s.isMandatory(), !s.isMandatory(), String.valueOf(t.getId()), t.getVersion());
    }

    // ============================== BỘ CÂU HỎI ==============================

    public QuestionnaireDto questionnaire() {
        AssessmentOnboardingSettings s = templates.settings();
        AssessmentTemplate t = s.getActiveTemplate();
        if (t == null) throw new IllegalArgumentException("Hệ thống chưa cấu hình bài test đầu vào.");

        List<AssessmentTemplateQuestion> refs = templateQuestionRepo.findWithQuestionByTemplateId(t.getId());
        Map<Long, List<AssessmentQuestionOption>> options = templates.optionsByQuestion(refs);

        // Mỗi "phần" admin đặt là 1 bước; câu không gán phần -> nhóm liên tiếp theo nhóm năng lực
        List<StepDto> steps = new ArrayList<>();
        String currentKey = null;
        List<UserQuestionDto> current = null;
        String currentTitle = null, currentCategory = null;
        for (AssessmentTemplateQuestion ref : refs) {
            AssessmentQuestion q = ref.getQuestion();
            String key = ref.getSectionTitle() != null ? "S:" + ref.getSectionTitle() : "C:" + q.getCategory();
            if (current == null || !key.equals(currentKey)) {
                if (current != null) steps.add(new StepDto(steps.size() + 1, currentTitle, currentCategory, current));
                current = new ArrayList<>();
                currentKey = key;
                currentTitle = ref.getSectionTitle();
                currentCategory = q.getCategory();
            }
            current.add(toUserQuestion(ref, options.getOrDefault(q.getId(), List.of())));
        }
        if (current != null) steps.add(new StepDto(steps.size() + 1, currentTitle, currentCategory, current));

        return new QuestionnaireDto(String.valueOf(t.getId()), t.getVersion(),
                t.getDisplayName() != null ? t.getDisplayName() : t.getName(), t.getDescription(),
                t.getEstimatedDuration(), !s.isMandatory(), steps);
    }

    // ============================== NỘP BÀI ==============================

    @Transactional
    public OnboardingResultDto submit(Long userId, SubmitOnboardingRequest req) {
        AssessmentOnboardingSettings s = templates.settings();
        AssessmentTemplate t = s.getActiveTemplate();
        if (t == null) throw new IllegalArgumentException("Hệ thống chưa cấu hình bài test đầu vào.");
        if (!String.valueOf(t.getId()).equals(req.templateId())) {
            throw new IllegalStateException("Bài test đầu vào vừa được cập nhật. Vui lòng tải lại trang để làm phiên bản mới nhất.");
        }
        OnboardingStatusDto st = status(userId);
        // PENDING: làm lần đầu. SKIPPED: đã bỏ qua trước đó nay quay lại làm. COMPLETED: đã có kết quả nên không nộp lại.
        if (!"PENDING".equals(st.status()) && !"SKIPPED".equals(st.status())) {
            throw new IllegalStateException("Bạn đã hoàn thành bài test đầu vào.");
        }

        Map<String, Object> answers = req.answers() == null ? Map.of() : req.answers();
        List<AssessmentTemplateQuestion> refs = templateQuestionRepo.findWithQuestionByTemplateId(t.getId());
        Map<Long, List<AssessmentQuestionOption>> options = templates.optionsByQuestion(refs);
        Map<Long, List<AssessmentScoreRule>> rules = templates.effectiveRules(t.getId(), refs);

        validateAnswers(refs, options, answers);

        List<AssessmentScoringEngine.QuestionContext> contexts = refs.stream().map(ref -> new AssessmentScoringEngine.QuestionContext(
                ref, options.getOrDefault(ref.getQuestion().getId(), List.of()),
                rules.getOrDefault(ref.getQuestion().getId(), List.of()), ratingRange(ref.getQuestion()))).toList();
        List<AssessmentTemplateLevel> levels = levelRepo.findByTemplateId(t.getId());
        AssessmentScoringEngine.Result result = scoring.score(contexts, answers, levels, t.getMaxTotalScore());

        // ---- Phiên làm bài ----
        User user = userRepo.findById(userId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        AssessmentSession session = new AssessmentSession();
        session.setUser(user);
        session.setAssessmentType(ensureType(t.getType()));
        session.setTemplate(t);
        session.setTemplateVersion(t.getVersion());
        session.setVersion(String.valueOf(t.getVersion()));
        session.setPurpose(ONBOARDING);
        session.setSource("SELF_REPORTED");
        session.setOnboardingRound(s.getRound());
        session.setStatus(AssessmentSessionStatus.COMPLETED);
        session.setCompletedAt(Instant.now());
        session.setOverallScore(decimal(result.overallScore()));
        session.setLevelCode(result.level() == null ? null : result.level().getCode());
        final AssessmentSession saved = sessionRepo.save(session);

        // ---- Câu trả lời ----
        for (AssessmentTemplateQuestion ref : refs) {
            AssessmentQuestion q = ref.getQuestion();
            Object answer = answers.get(String.valueOf(q.getId()));
            if (isEmpty(answer)) continue;
            AssessmentResponse r = new AssessmentResponse();
            r.setAssessmentSession(saved);
            r.setQuestion(q);
            String type = AssessmentQuestionTypes.inputType(q);
            switch (AssessmentQuestionTypes.rendererType(type, !options.getOrDefault(q.getId(), List.of()).isEmpty())) {
                case "SINGLE_CHOICE" -> {
                    r.setAnswerText(String.valueOf(answer));
                    options.getOrDefault(q.getId(), List.of()).stream()
                            .filter(o -> o.getOptionCode().equalsIgnoreCase(String.valueOf(answer))).findFirst().ifPresent(r::setOption);
                }
                case "MULTIPLE_CHOICE" -> r.setAnswerJson(json.writeValueAsString(answer));
                case "BOOLEAN" -> r.setAnswerBoolean(Boolean.TRUE.equals(answer) || "true".equalsIgnoreCase(String.valueOf(answer)));
                default -> {
                    Double v = AssessmentScoringEngine.toNumber(answer);
                    if (v != null) r.setAnswerNumber(decimal(v));
                    else r.setAnswerText(String.valueOf(answer));
                }
            }
            responseRepo.save(r);
        }

        // ---- Điểm tổng & điểm từng nhóm năng lực ----
        AssessmentScore overall = new AssessmentScore();
        overall.setAssessmentSession(saved);
        overall.setScoreType("OVERALL");
        overall.setScore(decimal(result.overallScore()));
        overall.setLevel(result.level() == null ? null : result.level().getCode());
        overall.setMetadata(json.writeValueAsString(Map.of("percent", result.overallPercent(), "scoredQuestions", result.scoredCount(),
                "maxScore", t.getMaxTotalScore().doubleValue(), "source", "SELF_REPORTED")));
        scoreRepo.save(overall);
        result.dimensions().forEach((cat, v) -> {
            AssessmentScore d = new AssessmentScore();
            d.setAssessmentSession(saved);
            d.setScoreType(trimTo("DIMENSION:" + cat, 50));
            d.setScore(decimal(v[0]));
            d.setMetadata(json.writeValueAsString(Map.of("category", cat, "questionCount", (int) v[1])));
            scoreRepo.save(d);
        });

        // ---- Hồ sơ thể lực (tương thích các màn hình đang đọc fitness_profiles) ----
        FitnessProfile fp = new FitnessProfile();
        fp.setUser(user);
        fp.setAssessmentSession(saved);
        fp.setFitnessLevel(result.level() == null ? "UNRATED" : trimTo(result.level().getCode(), 30));
        fp.setOverallScore(decimal(result.overallScore()));
        fp.setStrengthScore(avg(result.dimensions(), "UPPER_BODY_STRENGTH", "LOWER_BODY_STRENGTH"));
        fp.setEnduranceScore(avg(result.dimensions(), "MUSCULAR_ENDURANCE", "CARDIO_ENDURANCE"));
        fp.setMobilityScore(avg(result.dimensions(), "SHOULDER_MOBILITY", "HIP_MOBILITY", "ANKLE_MOBILITY"));
        fp.setBalanceScore(avg(result.dimensions(), "BALANCE", "BODY_CONTROL"));
        fp.setCoreScore(avg(result.dimensions(), "CORE_STABILITY"));

        // ---- Level Engine: 6 năng lực, level TẠM THỜI theo cổng năng lực, chu kỳ tập đầu tiên ----
        EngineResultDto engine = levelEngine.enabled()
                ? levelEngine.process(userId, saved, refs, options, answers, result.questionScores()) : null;
        if (engine != null) {
            fp.setFitnessLevel(engine.level().code());
            if (engine.overallScore() != null) fp.setOverallScore(decimal(engine.overallScore()));
        }
        fitnessProfileRepo.save(fp);

        return toResult(saved, t, result.level(), result.dimensions(), result.overallScore(), result.scoredCount(),
                (int) answers.values().stream().filter(a -> !isEmpty(a)).count(), engine);
    }

    /** Kết quả bài test đầu vào gần nhất (dùng khi tải lại trang kết quả). */
    public OnboardingResultDto latestResult(Long userId) {
        AssessmentSession session = sessionRepo.findTopByUserIdAndPurposeAndStatusInOrderByCreatedAtDesc(
                        userId, ONBOARDING, List.of(AssessmentSessionStatus.COMPLETED))
                .orElseThrow(() -> new IllegalArgumentException("Bạn chưa hoàn thành bài test đầu vào."));
        AssessmentTemplate t = session.getTemplate();
        if (t == null) throw new IllegalArgumentException("Bài test của kết quả này không còn tồn tại.");
        AssessmentTemplateLevel level = levelRepo.findByTemplateId(t.getId()).stream()
                .filter(l -> l.getCode().equals(session.getLevelCode())).findFirst().orElse(null);
        Map<String, double[]> dims = new LinkedHashMap<>();
        for (AssessmentScore sc : scoreRepoFind(session.getId())) {
            if (!sc.getScoreType().startsWith("DIMENSION:")) continue;
            Map<String, Object> meta = readMap(sc.getMetadata());
            Object count = meta.get("questionCount");
            dims.put(sc.getScoreType().substring("DIMENSION:".length()),
                    new double[]{sc.getScore().doubleValue(), count instanceof Number n ? n.doubleValue() : 0});
        }
        return toResult(session, t, level, dims, session.getOverallScore() == null ? 0 : session.getOverallScore().doubleValue(), -1, -1,
                fitnessState.engineResultForSession(userId, session.getId()));
    }

    /** Bỏ qua bài test đầu vào (chỉ khi admin cho phép). */
    @Transactional
    public OnboardingStatusDto skip(Long userId) {
        AssessmentOnboardingSettings s = templates.settings();
        AssessmentTemplate t = s.getActiveTemplate();
        if (t == null) return status(userId);
        if (s.isMandatory()) throw new IllegalArgumentException("Bài test đầu vào là bắt buộc, không thể bỏ qua.");
        if (!"PENDING".equals(status(userId).status())) return status(userId);

        AssessmentSession session = new AssessmentSession();
        session.setUser(userRepo.findById(userId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng")));
        session.setAssessmentType(ensureType(t.getType()));
        session.setTemplate(t);
        session.setTemplateVersion(t.getVersion());
        session.setVersion(String.valueOf(t.getVersion()));
        session.setPurpose(ONBOARDING);
        session.setOnboardingRound(s.getRound());
        session.setStatus(AssessmentSessionStatus.SKIPPED);
        session.setCompletedAt(Instant.now());
        sessionRepo.save(session);
        return status(userId);
    }

    // ============================== HELPERS ==============================

    private void validateAnswers(List<AssessmentTemplateQuestion> refs, Map<Long, List<AssessmentQuestionOption>> options,
                                 Map<String, Object> answers) {
        List<String> errors = new ArrayList<>();
        for (AssessmentTemplateQuestion ref : refs) {
            AssessmentQuestion q = ref.getQuestion();
            Object a = answers.get(String.valueOf(q.getId()));
            String label = "\"" + truncate(q.getQuestionText(), 60) + "\"";
            if (isEmpty(a)) {
                if (ref.isRequired()) errors.add("Chưa trả lời câu bắt buộc " + label + ".");
                continue;
            }
            List<AssessmentQuestionOption> opts = options.getOrDefault(q.getId(), List.of());
            String renderer = AssessmentQuestionTypes.rendererType(AssessmentQuestionTypes.inputType(q), !opts.isEmpty());
            switch (renderer) {
                case "SINGLE_CHOICE" -> {
                    if (opts.stream().noneMatch(o -> o.getOptionCode().equalsIgnoreCase(String.valueOf(a)))) {
                        errors.add("Đáp án không hợp lệ cho câu " + label + ".");
                    }
                }
                case "MULTIPLE_CHOICE" -> {
                    if (!(a instanceof Collection<?> values)
                            || values.stream().anyMatch(v -> opts.stream().noneMatch(o -> o.getOptionCode().equalsIgnoreCase(String.valueOf(v))))) {
                        errors.add("Đáp án không hợp lệ cho câu " + label + ".");
                    }
                }
                case "BOOLEAN" -> { }
                default -> {
                    Double v = AssessmentScoringEngine.toNumber(a);
                    if (v == null) {
                        errors.add("Câu " + label + " cần nhập số.");
                    } else if ((q.getMinValue() != null && v < q.getMinValue().doubleValue())
                            || (q.getMaxValue() != null && v > q.getMaxValue().doubleValue())) {
                        errors.add("Giá trị của câu " + label + " phải trong khoảng " + fmt(q.getMinValue()) + " – " + fmt(q.getMaxValue()) + ".");
                    }
                }
            }
        }
        if (!errors.isEmpty()) throw new IllegalArgumentException(String.join(" ", errors));
    }

    private UserQuestionDto toUserQuestion(AssessmentTemplateQuestion ref, List<AssessmentQuestionOption> options) {
        AssessmentQuestion q = ref.getQuestion();
        String type = AssessmentQuestionTypes.inputType(q);
        String renderer = AssessmentQuestionTypes.rendererType(type, !options.isEmpty());
        Map<String, Object> config = readMap(q.getConfigJson());
        Map<String, Object> perf = asMap(config.get("performanceConfig"));
        Map<String, Object> rating = asMap(config.get("ratingConfig"));

        Double min = q.getMinValue() == null ? null : q.getMinValue().doubleValue();
        Double max = q.getMaxValue() == null ? null : q.getMaxValue().doubleValue();
        if ("SCALE".equals(renderer) && (min == null || max == null)) { min = 1.0; max = 5.0; }

        List<String> help = new ArrayList<>();
        if (q.getDescription() != null && !q.getDescription().isBlank()) help.add(q.getDescription().trim());
        if (q.getInstruction() != null && !q.getInstruction().isBlank()) help.add(q.getInstruction().trim());
        Object perfInstruction = perf.get("instructionText");
        if (perfInstruction != null && !String.valueOf(perfInstruction).isBlank() && !help.contains(String.valueOf(perfInstruction).trim())) {
            help.add(String.valueOf(perfInstruction).trim());
        }
        String unit = q.getUnit() != null ? q.getUnit() : (perf.get("unit") == null ? null : String.valueOf(perf.get("unit")));

        return new UserQuestionDto(
                String.valueOf(q.getId()), renderer, q.getQuestionText(), help.isEmpty() ? null : String.join(" ", help),
                options.stream().map(o -> new UserOptionDto(o.getOptionCode(), o.getOptionLabel(), null)).toList(),
                min, max, unit, ref.isRequired(), q.getCategory(),
                rating.get("minLabel") == null ? null : String.valueOf(rating.get("minLabel")),
                rating.get("maxLabel") == null ? null : String.valueOf(rating.get("maxLabel")),
                perf.get("videoUrl") == null ? null : String.valueOf(perf.get("videoUrl")),
                perf.get("imageUrl") == null ? null : String.valueOf(perf.get("imageUrl")));
    }

    private AssessmentScoringEngine.RatingRange ratingRange(AssessmentQuestion q) {
        if (q.getMinValue() == null || q.getMaxValue() == null) return null;
        return new AssessmentScoringEngine.RatingRange(q.getMinValue().doubleValue(), q.getMaxValue().doubleValue());
    }

    private OnboardingResultDto toResult(AssessmentSession session, AssessmentTemplate t, AssessmentTemplateLevel level,
                                         Map<String, double[]> dims, double overall, int scored, int answered,
                                         EngineResultDto engine) {
        List<DimensionScoreDto> dimensions = new ArrayList<>();
        dims.forEach((cat, v) -> dimensions.add(new DimensionScoreDto(cat, v[0], (int) v[1])));
        List<DimensionScoreDto> dimensionList = dimensions;
        LevelResultDto levelDto = level == null ? null : new LevelResultDto(level.getCode(), level.getName(), level.getDescription(),
                level.getRecommendation(), level.getColorScheme(), level.getBadgeLabel());
        if (engine != null) {
            // Level do Level Engine quyết định (điểm tổng + cổng năng lực), không theo khoảng điểm riêng của template
            if (engine.overallScore() != null) overall = engine.overallScore();
            levelDto = new LevelResultDto(engine.level().code(), engine.level().name(), engine.level().description(),
                    engine.explanation(), level == null ? null : level.getColorScheme(), engine.level().code());
            dimensionList = engine.competencies().stream()
                    .map(c -> new DimensionScoreDto(c.code(), c.score() == null ? 0 : c.score(), 0)).toList();
        }
        Boolean passed = t.getPassScore() == null ? null : overall >= t.getPassScore().doubleValue();
        return new OnboardingResultDto(
                String.valueOf(session.getId()), String.valueOf(t.getId()), t.getVersion(), overall,
                t.getMaxTotalScore().doubleValue(), levelDto,
                dimensionList, passed, answered, scored, session.getSource(),
                session.getCompletedAt() == null ? null : session.getCompletedAt().toString(), engine);
    }

    private List<AssessmentScore> scoreRepoFind(Long sessionId) {
        return scoreRepo.findByAssessmentSessionId(sessionId);
    }

    private Optional<AssessmentSession> latestDone(Long userId) {
        return sessionRepo.findTopByUserIdAndPurposeAndStatusInOrderByCreatedAtDesc(userId, ONBOARDING, DONE);
    }

    private AssessmentType ensureType(String code) {
        String c = trimTo(code == null || code.isBlank() ? "INITIAL" : code, 50);
        return typeRepo.findByCode(c).orElseGet(() -> {
            AssessmentType type = new AssessmentType();
            type.setCode(c);
            type.setName(c);
            type.setDescription("Tạo tự động từ bài đánh giá do admin cấu hình");
            return typeRepo.save(type);
        });
    }

    private static BigDecimal avg(Map<String, double[]> dims, String... categories) {
        double sum = 0; int n = 0;
        for (String c : categories) {
            double[] v = dims.get(c);
            if (v != null) { sum += v[0]; n++; }
        }
        return n == 0 ? null : decimal(sum / n);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object o) {
        return o instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of();
    }

    private Map<String, Object> readMap(String raw) {
        if (raw == null || raw.isBlank()) return Map.of();
        try {
            return json.readValue(raw, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    private static boolean isEmpty(Object a) {
        if (a == null) return true;
        if (a instanceof String s) return s.isBlank();
        if (a instanceof Collection<?> c) return c.isEmpty();
        return false;
    }

    private static BigDecimal decimal(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP);
    }

    private static String fmt(BigDecimal v) {
        if (v == null) return "?";
        return v.stripTrailingZeros().toPlainString();
    }

    private static String trimTo(String s, int max) {
        return s == null ? null : (s.length() <= max ? s : s.substring(0, max));
    }

    private static String truncate(String s, int max) {
        return s == null ? "" : (s.length() <= max ? s : s.substring(0, max) + "…");
    }
}
