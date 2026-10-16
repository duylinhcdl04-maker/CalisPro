package com.calishealth.api.service.motion;

import com.calishealth.api.dto.MotionDtos.*;
import com.calishealth.api.engine.motion.*;
import com.calishealth.api.engine.motion.MotionTypes.*;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.*;

/**
 * Cấu hình Motion Rule Engine cho admin: catalog, motion profile, rule (version + quy trình duyệt), Rule Tester, audit.
 * MOTION_RULE_ENGINE_DESIGN.md §9–§10.
 */
@Service
public class MotionConfigService {
    public static final String DRAFT = "DRAFT", PENDING_REVIEW = "PENDING_REVIEW", PUBLISHED = "PUBLISHED", ARCHIVED = "ARCHIVED";
    public static final List<String> SOURCE_TYPES = List.of("SCIENTIFIC_EVIDENCE", "COACHING_BENCHMARK", "PRODUCT_RULE", "COACH_CONFIGURED", "DATA_DERIVED", "AI_SUGGESTED");
    public static final List<String> CAMERA_VIEWS = List.of("FRONT", "SIDE", "BACK", "ANY");

    /** Pha do máy trạng thái của FeatureEngine sinh ra — mã cố định, admin chỉ đổi tên/mô tả. */
    static final List<String[]> REPS_PHASES = List.of(
            new String[]{"SETUP", "Chuẩn bị", "Trước rep đầu tiên / chưa vào tư thế"},
            new String[]{"TOP", "Đỉnh", "Vị trí bắt đầu/kết thúc rep (vượt ngưỡng đỉnh)"},
            new String[]{"DESCENDING", "Hạ xuống", "Pha lệch tâm (eccentric)"},
            new String[]{"BOTTOM", "Đáy", "Vị trí sâu nhất (vượt ngưỡng đáy)"},
            new String[]{"ASCENDING", "Đẩy lên", "Pha đồng tâm (concentric)"});
    static final List<String[]> HOLD_PHASES = List.of(
            new String[]{"SETUP", "Chuẩn bị", "Chưa vào tư thế giữ"},
            new String[]{"HOLD", "Giữ", "Trong tư thế giữ (chỉ số đếm nằm trong [đáy, đỉnh])"});

    static final String[] LANDMARKS = {"NOSE", "LEFT_EYE_INNER", "LEFT_EYE", "LEFT_EYE_OUTER", "RIGHT_EYE_INNER", "RIGHT_EYE",
            "RIGHT_EYE_OUTER", "LEFT_EAR", "RIGHT_EAR", "MOUTH_LEFT", "MOUTH_RIGHT", "LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_ELBOW",
            "RIGHT_ELBOW", "LEFT_WRIST", "RIGHT_WRIST", "LEFT_PINKY", "RIGHT_PINKY", "LEFT_INDEX", "RIGHT_INDEX", "LEFT_THUMB",
            "RIGHT_THUMB", "LEFT_HIP", "RIGHT_HIP", "LEFT_KNEE", "RIGHT_KNEE", "LEFT_ANKLE", "RIGHT_ANKLE", "LEFT_HEEL", "RIGHT_HEEL",
            "LEFT_FOOT_INDEX", "RIGHT_FOOT_INDEX"};
    static final String[] LANDMARK_VI = {"Mũi", "Mắt trái (trong)", "Mắt trái", "Mắt trái (ngoài)", "Mắt phải (trong)", "Mắt phải",
            "Mắt phải (ngoài)", "Tai trái", "Tai phải", "Mép miệng trái", "Mép miệng phải", "Vai trái", "Vai phải", "Khuỷu trái",
            "Khuỷu phải", "Cổ tay trái", "Cổ tay phải", "Ngón út trái", "Ngón út phải", "Ngón trỏ trái", "Ngón trỏ phải",
            "Ngón cái trái", "Ngón cái phải", "Hông trái", "Hông phải", "Gối trái", "Gối phải", "Cổ chân trái", "Cổ chân phải",
            "Gót trái", "Gót phải", "Mũi chân trái", "Mũi chân phải"};

    static final Map<MetricType, String> HINTS = new EnumMap<>(Map.ofEntries(
            Map.entry(MetricType.ANGLE_3_POINT, "points = [A, B (đỉnh góc), C]"),
            Map.entry(MetricType.DISTANCE, "points = [A, B]; chuẩn hoá theo chiều dài thân (BODY_RATIO / PERCENT_BODY)"),
            Map.entry(MetricType.ROM, "points = [A, B (khớp), C]; biên độ góc trong một rep (max − min)"),
            Map.entry(MetricType.ALIGNMENT, "method = COLLINEARITY (≥3 điểm, góc lệch khỏi đường thẳng) hoặc AXIS_DEVIATION (2 điểm + axis VERTICAL/HORIZONTAL)"),
            Map.entry(MetricType.SYMMETRY, "points = góc bên trái [A, B, C], pointsRight = góc bên phải [A', B', C']"),
            Map.entry(MetricType.VELOCITY, "points = [landmark]; axis = VERTICAL / HORIZONTAL / ANY"),
            Map.entry(MetricType.ACCELERATION, "points = [landmark]; axis = VERTICAL / HORIZONTAL / ANY"),
            Map.entry(MetricType.TEMPO, "phase = pha được đo thời lượng (DESCENDING, BOTTOM, ASCENDING…); xét khi kết thúc rep"),
            Map.entry(MetricType.DURATION, "phase = pha đang được giữ (vd. HOLD); thời gian liên tục trong pha"),
            Map.entry(MetricType.STABILITY, "points = [landmark]; windowFrames = 3–120 (độ dao động / chiều dài thân)"),
            Map.entry(MetricType.LANDMARK_VISIBILITY, "points = các landmark cần nhìn thấy (lấy mức thấp nhất)"),
            Map.entry(MetricType.POSE_CONFIDENCE, "không cần landmark (trung bình visibility của tư thế)"),
            Map.entry(MetricType.REP_SEQUENCE, "1 = rep đi đủ chuỗi DESCENDING → BOTTOM → ASCENDING, 0 = thiếu pha"),
            Map.entry(MetricType.REP_VALIDATION, "1 = thời lượng rep nằm trong [min, max] của profile, 0 = ngoài")));

    private final ExerciseAiProfileRepository profiles;
    private final ExerciseRepository exercises;
    private final AiMotionRuleRepository rules;
    private final MotionRuleThresholdRepository thresholds;
    private final MotionProfilePhaseRepository phases;
    private final AiConfigurationAuditLogRepository audits;
    private final MotionFeedbackService feedback;
    private final MotionRuleMapper mapper;
    private final ObjectMapper json = new ObjectMapper();
    /** Tùy chọn: không có thì chỉ không gửi thông báo. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.calishealth.api.service.notification.NotificationService notifications;

    public MotionConfigService(ExerciseAiProfileRepository profiles, ExerciseRepository exercises, AiMotionRuleRepository rules,
                               MotionRuleThresholdRepository thresholds, MotionProfilePhaseRepository phases,
                               AiConfigurationAuditLogRepository audits, MotionFeedbackService feedback, MotionRuleMapper mapper) {
        this.profiles = profiles;
        this.exercises = exercises;
        this.rules = rules;
        this.thresholds = thresholds;
        this.phases = phases;
        this.audits = audits;
        this.feedback = feedback;
        this.mapper = mapper;
    }

    // ============================== Catalog ==============================

    public CatalogDto catalog() {
        List<MetricTypeDto> types = MetricEvaluatorFactory.all().stream()
                .sorted(Comparator.comparingInt((MetricEvaluator e) -> e.type().ordinal()))
                .map(e -> new MetricTypeDto(e.type().name(), e.timing().name(),
                        e.operators().stream().sorted().map(o -> o.name()).toList(), e.units(), HINTS.get(e.type()),
                        e.measuresReliability()))
                .toList();
        List<LandmarkDto> lms = new ArrayList<>();
        for (int i = 0; i < LANDMARKS.length; i++) lms.add(new LandmarkDto(i, LANDMARKS[i], LANDMARK_VI[i]));
        Map<String, Integer> penalties = new LinkedHashMap<>();
        penalties.put("INFO", MotionScoring.PENALTY_INFO);
        penalties.put("WARNING", MotionScoring.PENALTY_WARNING);
        penalties.put("ERROR", MotionScoring.PENALTY_ERROR);
        penalties.put("CRITICAL", MotionScoring.PENALTY_CRITICAL);
        penalties.put("INCOMPLETE_REP", MotionScoring.PENALTY_INCOMPLETE);
        return new CatalogDto(types, lms, Arrays.stream(Severity.values()).map(s -> s.name()).toList(), SOURCE_TYPES,
                CAMERA_VIEWS, List.of(DRAFT, PENDING_REVIEW, PUBLISHED, ARCHIVED), penalties);
    }

    // ============================== Profile ==============================

    @Transactional(readOnly = true)
    public List<ProfileSummaryDto> listProfiles(Long exerciseId) {
        List<ExerciseAiProfile> list = exerciseId == null ? profiles.findAll() : profiles.findByExerciseId(exerciseId);
        return list.stream().map(p -> {
            List<AiMotionRule> rs = rules.findByAiProfileIdOrderByRuleCodeAscRuleVersionDesc(p.getId());
            int pub = (int) rs.stream().filter(r -> PUBLISHED.equals(r.getStatus())).count();
            int draft = (int) rs.stream().filter(r -> DRAFT.equals(r.getStatus()) || PENDING_REVIEW.equals(r.getStatus())).count();
            Exercise ex = p.getExercise();
            return new ProfileSummaryDto(p.getId(), ex.getId(), ex.getName(), p.getProfileName(), p.getVersion(), p.getStatus(),
                    p.getCameraView(), movementType(p), pub, draft);
        }).toList();
    }

    @Transactional
    public ProfileDto createProfile(Long exerciseId, ProfileUpsertRequest req, String actor) {
        Exercise ex = exercises.findById(exerciseId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài tập."));
        ExerciseAiProfile p = new ExerciseAiProfile();
        p.setExercise(ex);
        p.setProfileName(req.profileName() == null || req.profileName().isBlank() ? ex.getName() + " – Motion Profile" : req.profileName().trim());
        p.setStatus("DRAFT");
        applyProfile(p, req);
        profiles.save(p);
        syncPhases(p);
        audit(p, actor, "CREATE", null, null, profileJson(p), "Tạo motion profile");
        return profile(p.getId());
    }

    @Transactional
    public ProfileDto profile(Long id) {
        ExerciseAiProfile p = requireProfile(id);
        if (!phases.existsByAiProfileId(id)) syncPhases(p);
        return toProfileDto(p);
    }

    @Transactional
    public ProfileDto updateProfile(Long id, ProfileUpsertRequest req, String actor) {
        ExerciseAiProfile p = requireProfile(id);
        String before = profileJson(p);
        if (req.profileName() != null && !req.profileName().isBlank()) p.setProfileName(req.profileName().trim());
        applyProfile(p, req);
        profiles.save(p);
        syncPhases(p);
        audit(p, actor, "UPDATE", null, before, profileJson(p), "Cập nhật motion profile");
        return toProfileDto(p);
    }

    @Transactional
    public ProfileDto updatePhase(Long profileId, PhaseUpdateRequest req) {
        ExerciseAiProfile p = requireProfile(profileId);
        MotionProfilePhase ph = phases.findByAiProfileIdOrderBySortOrderAsc(profileId).stream()
                .filter(x -> x.getCode().equals(req.code())).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Pha '" + req.code() + "' không thuộc profile."));
        if (req.name() != null && !req.name().isBlank()) ph.setName(req.name().trim());
        ph.setDescription(req.description());
        phases.save(ph);
        return toProfileDto(p);
    }

    private void applyProfile(ExerciseAiProfile p, ProfileUpsertRequest q) {
        if (q.cameraView() != null) {
            if (!CAMERA_VIEWS.contains(q.cameraView())) throw new IllegalArgumentException("Góc camera không hợp lệ: " + q.cameraView());
            p.setCameraView(q.cameraView());
        }
        if (q.movementType() != null) {
            if (!List.of("REPS", "HOLD").contains(q.movementType())) throw new IllegalArgumentException("Kiểu chuyển động phải là REPS hoặc HOLD.");
            p.setMovementType(q.movementType());
        }
        if (q.repMetric() != null) {
            List<Integer> pts = q.repMetric().points();
            if (pts == null || pts.size() != 3 || pts.stream().anyMatch(i -> i == null || i < 0 || i > 32)) {
                throw new IllegalArgumentException("Chỉ số đếm rep phải là góc 3 landmark hợp lệ (0–32).");
            }
            p.setRepMetricJson(mapper.writeMeasurement(new MeasurementDto(pts, null, null, null, null, null)));
        }
        if (q.repTopThreshold() != null) p.setRepTopThreshold(q.repTopThreshold());
        if (q.repBottomThreshold() != null) p.setRepBottomThreshold(q.repBottomThreshold());
        if (p.getRepTopThreshold() != null && p.getRepBottomThreshold() != null && p.getRepBottomThreshold() >= p.getRepTopThreshold()) {
            throw new IllegalArgumentException("Ngưỡng đáy phải nhỏ hơn ngưỡng đỉnh (giá trị góc).");
        }
        if (q.repDirection() != null) {
            if (!List.of("DESCENDING_FIRST", "ASCENDING_FIRST").contains(q.repDirection())) throw new IllegalArgumentException("Hướng rep không hợp lệ.");
            p.setRepDirection(q.repDirection());
        }
        if (q.debounceTimeMs() != null) p.setDebounceTimeMs(nonNegative(q.debounceTimeMs(), "Debounce"));
        if (q.minRepDurationMs() != null) p.setMinRepDurationMs(nonNegative(q.minRepDurationMs(), "Thời lượng rep tối thiểu"));
        if (q.maxRepDurationMs() != null) p.setMaxRepDurationMs(nonNegative(q.maxRepDurationMs(), "Thời lượng rep tối đa"));
        if (p.getMinRepDurationMs() != null && p.getMaxRepDurationMs() != null && p.getMinRepDurationMs() > p.getMaxRepDurationMs()) {
            throw new IllegalArgumentException("Thời lượng rep tối thiểu phải ≤ tối đa.");
        }
        if (q.minPoseConfidence() != null) p.setMinPoseConfidence(unit(q.minPoseConfidence(), "Pose confidence tối thiểu"));
        if (q.minLandmarkVisibility() != null) p.setMinLandmarkVisibility(unit(q.minLandmarkVisibility(), "Visibility tối thiểu"));
        if (q.voiceWarningEnabled() != null) p.setVoiceWarningEnabled(q.voiceWarningEnabled());
        if (q.textWarningEnabled() != null) p.setTextWarningEnabled(q.textWarningEnabled());
        if (q.version() != null && !q.version().isBlank()) p.setVersion(q.version().trim());
    }

    /** Đồng bộ danh sách pha theo kiểu chuyển động, giữ tên/mô tả admin đã đặt cho mã còn dùng. */
    private void syncPhases(ExerciseAiProfile p) {
        List<String[]> want = "HOLD".equals(movementType(p)) ? HOLD_PHASES : REPS_PHASES;
        Map<String, MotionProfilePhase> cur = new HashMap<>();
        phases.findByAiProfileIdOrderBySortOrderAsc(p.getId()).forEach(x -> cur.put(x.getCode(), x));
        Set<String> codes = new HashSet<>();
        int i = 0;
        for (String[] w : want) {
            codes.add(w[0]);
            MotionProfilePhase ph = cur.get(w[0]);
            if (ph == null) {
                ph = new MotionProfilePhase();
                ph.setAiProfileId(p.getId());
                ph.setCode(w[0]);
                ph.setName(w[1]);
                ph.setDescription(w[2]);
            }
            ph.setSortOrder(i++);
            phases.save(ph);
        }
        cur.values().stream().filter(x -> !codes.contains(x.getCode())).forEach(x -> phases.delete(x));
    }

    private ProfileDto toProfileDto(ExerciseAiProfile p) {
        List<PhaseDto> ph = phases.findByAiProfileIdOrderBySortOrderAsc(p.getId()).stream()
                .map(x -> new PhaseDto(x.getId(), x.getCode(), x.getName(), x.getDescription(), x.getSortOrder())).toList();
        List<String> issues = new ArrayList<>();
        if (p.getCameraView() == null) issues.add("Chưa chọn góc camera chuẩn của bài tập.");
        if (p.getRepMetricJson() == null) issues.add("Chưa cấu hình chỉ số đếm rep (góc 3 điểm) → không đếm rep / không xác định pha.");
        if (p.getRepTopThreshold() == null || p.getRepBottomThreshold() == null) issues.add("Thiếu ngưỡng đỉnh/đáy của máy trạng thái rep.");
        Exercise ex = p.getExercise();
        return new ProfileDto(p.getId(), ex.getId(), ex.getName(), p.getProfileName(), p.getVersion(), p.getStatus(),
                p.getCameraView(), movementType(p), mapper.readMeasurement(p.getRepMetricJson()), p.getRepTopThreshold(),
                p.getRepBottomThreshold(), p.getRepDirection() == null ? "DESCENDING_FIRST" : p.getRepDirection(),
                p.getDebounceTimeMs(), p.getMinRepDurationMs(), p.getMaxRepDurationMs(),
                p.getMinPoseConfidence() == null ? 0.5 : p.getMinPoseConfidence(),
                p.getMinLandmarkVisibility() == null ? 0.5 : p.getMinLandmarkVisibility(),
                p.isVoiceWarningEnabled(), p.isTextWarningEnabled(), ph, issues);
    }

    static String movementType(ExerciseAiProfile p) {
        return "HOLD".equals(p.getMovementType()) ? "HOLD" : "REPS";
    }

    Set<String> phaseCodes(Long profileId) {
        Set<String> s = new HashSet<>();
        phases.findByAiProfileIdOrderBySortOrderAsc(profileId).forEach(x -> s.add(x.getCode()));
        return s;
    }

    ExerciseAiProfile requireProfile(Long id) {
        return profiles.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy motion profile."));
    }

    // ============================== Rule: đọc ==============================

    /** Bản mới nhất của mỗi mã rule, kèm bản PUBLISHED đang chạy nếu bản mới nhất là nháp. */
    @Transactional(readOnly = true)
    public List<RuleDto> listRules(Long profileId) {
        requireProfile(profileId);
        List<AiMotionRule> all = rules.findByAiProfileIdOrderByRuleCodeAscRuleVersionDesc(profileId);
        Map<String, List<AiMotionRule>> byCode = new LinkedHashMap<>();
        all.forEach(r -> byCode.computeIfAbsent(r.getRuleCode(), k -> new ArrayList<>()).add(r));
        List<AiMotionRule> shown = new ArrayList<>();
        for (List<AiMotionRule> versions : byCode.values()) {
            AiMotionRule latest = versions.get(0);
            shown.add(latest);
            if (!PUBLISHED.equals(latest.getStatus())) {
                versions.stream().filter(r -> PUBLISHED.equals(r.getStatus())).findFirst().ifPresent(r -> shown.add(r));
            }
        }
        return toDtos(shown, profileId);
    }

    @Transactional(readOnly = true)
    public RuleDto rule(Long id) {
        AiMotionRule r = requireRule(id);
        return toDtos(List.of(r), r.getAiProfile().getId()).get(0);
    }

    @Transactional(readOnly = true)
    public List<RuleVersionDto> versions(Long id) {
        AiMotionRule r = requireRule(id);
        return rules.findByAiProfileIdAndRuleCodeOrderByRuleVersionDesc(r.getAiProfile().getId(), r.getRuleCode()).stream()
                .map(v -> new RuleVersionDto(v.getId(), version(v), v.getStatus(), v.getChangeNote(), v.getUpdatedBy(),
                        v.getUpdatedAt(), v.getApprovedBy(), v.getApprovedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuditDto> audit(Long id) {
        AiMotionRule r = requireRule(id);
        return audits.findByTargetRefOrderByCreatedAtDesc(ruleRef(r)).stream()
                .map(a -> new AuditDto(a.getId(), a.getAction(), a.getUserEmail(), a.getReason(), a.getOldValue(), a.getNewValue(), a.getCreatedAt()))
                .toList();
    }

    // ============================== Rule: ghi ==============================

    @Transactional
    public RuleDto createRule(Long profileId, RuleUpsertRequest req, String actor) {
        ExerciseAiProfile p = requireProfile(profileId);
        String code = req.code() == null ? null : req.code().trim().toUpperCase(Locale.ROOT);
        if (code == null || !code.matches("[A-Z0-9_]{3,80}")) throw new IllegalArgumentException("Mã rule chỉ gồm A–Z, 0–9, _ (3–80 ký tự).");
        if (!rules.findByAiProfileIdAndRuleCodeOrderByRuleVersionDesc(profileId, code).isEmpty()) {
            throw new IllegalArgumentException("Mã rule '" + code + "' đã tồn tại trong profile này.");
        }
        AiMotionRule r = new AiMotionRule();
        r.setAiProfile(p);
        r.setRuleVersion(1);
        r.setStatus(DRAFT);
        r.setCreatedBy(actor);
        saveContent(r, req, actor);
        audit(p, actor, "CREATE", ruleRef(r), null, ruleJson(r), req.changeNote());
        return rule(r.getId());
    }

    /**
     * DRAFT: sửa tại chỗ. PENDING_REVIEW: sửa tại chỗ và quay về DRAFT (phải duyệt lại).
     * PUBLISHED / ARCHIVED: không sửa bản đang chạy — tạo bản DRAFT mới (version + 1, previous_version_id).
     */
    @Transactional
    public RuleDto updateRule(Long id, RuleUpsertRequest req, String actor) {
        AiMotionRule r = requireRule(id);
        if (req.code() != null && !req.code().trim().equalsIgnoreCase(r.getRuleCode())) {
            throw new IllegalArgumentException("Không đổi được mã rule (mã dùng để liên kết các phiên bản). Hãy tạo rule mới.");
        }
        ExerciseAiProfile p = r.getAiProfile();
        if (PUBLISHED.equals(r.getStatus()) || ARCHIVED.equals(r.getStatus())) {
            List<AiMotionRule> versions = rules.findByAiProfileIdAndRuleCodeOrderByRuleVersionDesc(p.getId(), r.getRuleCode());
            versions.stream().filter(v -> DRAFT.equals(v.getStatus()) || PENDING_REVIEW.equals(v.getStatus())).findFirst().ifPresent(v -> {
                throw new IllegalStateException("Rule đang có bản nháp v" + version(v) + " — hãy sửa bản đó thay vì tạo thêm phiên bản.");
            });
            AiMotionRule next = new AiMotionRule();
            mapper.copyContent(r, next);
            next.setRuleVersion(version(versions.get(0)) + 1);
            next.setStatus(DRAFT);
            next.setPreviousVersionId(r.getId());
            next.setCreatedBy(actor);
            next.setChangeNote(null);
            saveContent(next, req, actor);
            audit(p, actor, "NEW_VERSION", ruleRef(next), ruleJson(r), ruleJson(next), req.changeNote());
            return rule(next.getId());
        }
        String before = ruleJson(r);
        if (PENDING_REVIEW.equals(r.getStatus())) {
            r.setStatus(DRAFT);
            r.setSubmittedBy(null);
            r.setSubmittedAt(null);
        }
        saveContent(r, req, actor);
        audit(p, actor, "UPDATE", ruleRef(r), before, ruleJson(r), req.changeNote());
        return rule(r.getId());
    }

    private void saveContent(AiMotionRule r, RuleUpsertRequest req, String actor) {
        if (MotionRuleMapper.metricType(req.metricType()) == null) throw new IllegalArgumentException("Loại chỉ số (metric type) không hợp lệ.");
        if (MotionRuleMapper.operator(req.operator()) == null) throw new IllegalArgumentException("Toán tử không hợp lệ.");
        if (req.severity() != null && MotionRuleMapper.severity(req.severity()) == null) throw new IllegalArgumentException("Mức độ không hợp lệ.");
        if (req.invalidRepMinSeverity() != null && !req.invalidRepMinSeverity().isBlank() && MotionRuleMapper.severity(req.invalidRepMinSeverity()) == null) {
            throw new IllegalArgumentException("Mức tối thiểu để đánh rep không hợp lệ không đúng.");
        }
        if (req.bands() != null && req.bands().stream().anyMatch(b -> MotionRuleMapper.severity(b.severity()) == null)) {
            throw new IllegalArgumentException("Mỗi dải ngưỡng phải có mức độ hợp lệ (INFO/WARNING/ERROR/CRITICAL).");
        }
        if (req.sourceType() != null && !req.sourceType().isBlank() && !SOURCE_TYPES.contains(req.sourceType())) {
            throw new IllegalArgumentException("Nguồn ngưỡng không hợp lệ.");
        }
        if (req.cameraView() != null && !req.cameraView().isBlank() && !CAMERA_VIEWS.contains(req.cameraView())) {
            throw new IllegalArgumentException("Góc camera không hợp lệ.");
        }
        List<MotionRuleThreshold> bands = new ArrayList<>();
        mapper.apply(r, req, bands);
        if (r.getRuleName() == null || r.getRuleName().isBlank()) throw new IllegalArgumentException("Tên rule không được để trống.");
        // Cột cũ giữ tương thích cho màn hình/evaluator cũ
        r.setThresholdMin(r.getNormalMin());
        r.setThresholdMax(r.getNormalMax());
        r.setEnabled(true);
        r.setUpdatedBy(actor);
        r.setLastTestedAt(null);   // nội dung đổi -> phải chạy lại Rule Tester trước khi gửi duyệt
        rules.save(r);
        if (req.bands() != null) {
            thresholds.deleteByRuleId(r.getId());
            bands.forEach(b -> b.setRuleId(r.getId()));
            thresholds.saveAll(bands);
        }
    }

    @Transactional
    public void deleteDraft(Long id, String actor) {
        AiMotionRule r = requireRule(id);
        if (!DRAFT.equals(r.getStatus())) throw new IllegalStateException("Chỉ xoá được bản DRAFT; bản đã xuất bản hãy lưu trữ (archive).");
        String before = ruleJson(r);
        thresholds.deleteByRuleId(r.getId());
        rules.delete(r);
        audit(r.getAiProfile(), actor, "DELETE", ruleRef(r), before, null, "Xoá bản nháp v" + version(r));
    }

    // ============================== Quy trình ==============================

    @Transactional
    public RuleDto submitReview(Long id, String note, String actor) {
        AiMotionRule r = requireRule(id);
        if (!DRAFT.equals(r.getStatus())) throw new IllegalStateException("Chỉ gửi duyệt được bản DRAFT.");
        MotionRuleValidator.Result v = validate(r);
        if (!v.valid()) throw new IllegalArgumentException("Rule chưa hợp lệ: " + String.join(" ", v.errors()));
        if (r.getLastTestedAt() == null) throw new IllegalStateException("Hãy chạy Rule Tester trên phiên bản hiện tại trước khi gửi duyệt.");
        if (r.getSourceType() == null) throw new IllegalArgumentException("Hãy chọn nguồn của ngưỡng (source type) trước khi gửi duyệt.");
        r.setStatus(PENDING_REVIEW);
        r.setSubmittedBy(actor);
        r.setSubmittedAt(Instant.now());
        rules.save(r);
        audit(r.getAiProfile(), actor, "SUBMIT_REVIEW", ruleRef(r), null, null, note);
        if (notifications != null) notifications.notifyRole("ADMIN", "MOTION_RULE_SUBMITTED", "Rule chấm form chờ duyệt",
                (actor == null ? "Coach" : actor) + " gửi rule " + ruleRef(r) + " để duyệt và xuất bản." + (note == null || note.isBlank() ? "" : " Ghi chú: " + note.trim()), "MOTION_RULE", id);
        return rule(id);
    }

    @Transactional
    public RuleDto reject(Long id, String note, String actor) {
        AiMotionRule r = requireRule(id);
        if (!PENDING_REVIEW.equals(r.getStatus())) throw new IllegalStateException("Chỉ trả lại được bản đang chờ duyệt.");
        if (note == null || note.isBlank()) throw new IllegalArgumentException("Hãy ghi lý do trả lại.");
        r.setStatus(DRAFT);
        rules.save(r);
        audit(r.getAiProfile(), actor, "REJECT", ruleRef(r), null, null, note);
        if (notifications != null) notifications.notifyEmail(r.getSubmittedBy(), "MOTION_RULE_REJECTED", "Rule chấm form cần chỉnh sửa",
                "Rule " + ruleRef(r) + " bị trả lại: " + note.trim(), "MOTION_RULE", id);
        return rule(id);
    }

    /** Xuất bản bản đang chờ duyệt; bản PUBLISHED cũ cùng mã chuyển ARCHIVED (một mã chỉ có một bản chạy). */
    @Transactional
    public RuleDto publish(Long id, String note, String actor) {
        AiMotionRule r = requireRule(id);
        if (!PENDING_REVIEW.equals(r.getStatus())) throw new IllegalStateException("Chỉ xuất bản được bản đã gửi duyệt (PENDING_REVIEW).");
        // Tách vai: người gửi duyệt không được tự xuất bản (Coach soạn, người khác - Admin - duyệt)
        if (actor != null && actor.equalsIgnoreCase(r.getSubmittedBy())) throw new IllegalStateException("SELF_APPROVAL_NOT_ALLOWED: người gửi duyệt không được tự xuất bản rule của mình");
        MotionRuleValidator.Result v = validate(r);
        if (!v.valid()) throw new IllegalArgumentException("Rule chưa hợp lệ: " + String.join(" ", v.errors()));
        for (AiMotionRule old : rules.findByAiProfileIdAndRuleCodeOrderByRuleVersionDesc(r.getAiProfile().getId(), r.getRuleCode())) {
            if (PUBLISHED.equals(old.getStatus()) && !old.getId().equals(r.getId())) {
                old.setStatus(ARCHIVED);
                rules.save(old);
                audit(old.getAiProfile(), actor, "ARCHIVE", ruleRef(old), null, null, "Thay bằng v" + version(r));
            }
        }
        r.setStatus(PUBLISHED);
        r.setApprovedBy(actor);
        r.setApprovedAt(Instant.now());
        rules.save(r);
        audit(r.getAiProfile(), actor, "PUBLISH", ruleRef(r), null, ruleJson(r), note);
        if (notifications != null) notifications.notifyEmail(r.getSubmittedBy(), "MOTION_RULE_PUBLISHED", "Rule chấm form đã được xuất bản",
                "Rule " + ruleRef(r) + " đã được duyệt và đang chạy khi học viên tập.", "MOTION_RULE", id);
        return rule(id);
    }

    @Transactional
    public RuleDto archive(Long id, String note, String actor) {
        AiMotionRule r = requireRule(id);
        if (ARCHIVED.equals(r.getStatus())) throw new IllegalStateException("Rule đã được lưu trữ.");
        r.setStatus(ARCHIVED);
        rules.save(r);
        audit(r.getAiProfile(), actor, "ARCHIVE", ruleRef(r), null, null, note);
        return rule(id);
    }

    // ============================== Rule Tester ==============================

    @Transactional
    public RuleTestResponse test(Long id, RuleTestRequest req) {
        AiMotionRule entity = requireRule(id);
        RuleDef r = mapper.toDef(entity, thresholds.findByRuleIdOrderBySortOrderAsc(id));
        MotionRuleValidator.Result v = validate(entity);
        if (r.operator() == null) throw new IllegalArgumentException("Rule chưa có toán tử, không thử được.");
        if (req == null || (req.value() == null && (req.samples() == null || req.samples().isEmpty()))) {
            throw new IllegalArgumentException("Nhập giá trị đo hoặc chuỗi giá trị để thử.");
        }
        Map<String, MotionFeedbackService.Resolved> fb = r.feedbackCode() == null ? Map.of() : feedback.resolve(List.of(r.feedbackCode()));
        MotionFeedbackService.Resolved text = fb.get(r.feedbackCode());

        Classification single = req.value() == null ? null : ThresholdClassifier.classify(r, req.value());
        List<TestStepDto> steps = new ArrayList<>();
        if (req.samples() != null && !req.samples().isEmpty()) steps = replay(r, req.samples());

        // Chỉ ghi nhận "đã thử" cho bản chưa xuất bản (điều kiện gửi duyệt)
        if (!PUBLISHED.equals(entity.getStatus()) && !ARCHIVED.equals(entity.getStatus())) {
            entity.setLastTestedAt(Instant.now());
            rules.save(entity);
        }
        Severity sev = single == null ? null : single.status().severity();
        return new RuleTestResponse(single == null ? null : single.status().name(), req.value(),
                single == null ? null : single.evaluatedValue(), ThresholdClassifier.expected(r),
                single == null || single.band() == null ? null : bandText(single.band()),
                r.feedbackCode(), text == null ? null : text.uiText(), text == null ? null : text.voiceText(),
                sev != null && r.invalidatesRep(sev), sev == Severity.CRITICAL && r.stopExercise(), steps, v.errors(), v.warnings());
    }

    /** Phát lại chuỗi giá trị qua đúng tracker persistence + aggregator cooldown mà runtime dùng. */
    private List<TestStepDto> replay(RuleDef r, List<TestSample> samples) {
        RulePersistenceTracker tracker = new RulePersistenceTracker();
        ViolationAggregator aggregator = new ViolationAggregator();
        Map<String, Long> cooldown = r.feedbackCode() == null ? Map.of() : Map.of(r.feedbackCode(), r.cooldownMs());
        List<TestSample> sorted = samples.stream().sorted(Comparator.comparingLong((TestSample s) -> s.t())).toList();
        List<TestStepDto> out = new ArrayList<>();
        Long lastEval = null;
        Severity prev = null;
        for (TestSample s : sorted) {
            if (lastEval != null && r.evaluationIntervalMs() > 0 && s.t() - lastEval < r.evaluationIntervalMs()) {
                out.add(new TestStepDto(s.t(), s.value(), null, Status.SKIPPED.name(), prev == null ? null : prev.name(), false, false,
                        "Bỏ qua — chưa đến chu kỳ đánh giá " + r.evaluationIntervalMs() + " ms"));
                continue;
            }
            lastEval = s.t();
            Classification c = s.value() == null ? null : ThresholdClassifier.classify(r, s.value());
            Status st = c == null ? Status.UNRELIABLE : c.status();
            Severity confirmed = tracker.update(r, st, s.t());
            boolean fired = confirmed != null && (prev == null || confirmed.ordinal() > prev.ordinal());
            boolean spoken = false;
            if (confirmed != null) {
                Violation viol = new Violation(r.id(), r.code(), r.version(), r.name(), confirmed, r.priority(), r.measurement() == null ? null : r.measurement().type(),
                        s.value() == null ? 0 : s.value(), c == null ? 0 : c.evaluatedValue(), r.unit(), r.target(), r.normalMin(), r.normalMax(),
                        ThresholdClassifier.expected(r), r.feedbackCode(), r.invalidatesRep(confirmed), r.stopExercise(), r.phase(), s.t(), 0);
                spoken = aggregator.decide(List.of(viol), cooldown, s.t()).mode() != FeedbackMode.NONE;
            }
            String note = st == Status.UNRELIABLE ? "Không đo được — giữ nguyên trạng thái persistence"
                    : st == Status.UNCLASSIFIED ? "Giá trị rơi vào khoảng trống giữa các dải — không phân loại"
                    : confirmed == null && st != Status.NORMAL ? "Lệch nhưng chưa đủ persistence"
                    : confirmed != null && !spoken ? "Vi phạm còn hiệu lực — không nhắc lại (cooldown)" : null;
            out.add(new TestStepDto(s.t(), s.value(), c == null ? null : c.evaluatedValue(), st.name(),
                    confirmed == null ? null : confirmed.name(), fired, spoken, note));
            prev = confirmed;
        }
        return out;
    }

    private static String bandText(Band b) {
        return b.severity() + ": " + (b.min() == null ? "−∞" : (b.minInclusive() ? "[" : "(") + b.min()) + " … "
                + (b.max() == null ? "+∞" : b.max() + (b.maxInclusive() ? "]" : ")"));
    }

    // ============================== Hỗ trợ ==============================

    /**
     * Kiểm tra một rule ứng viên bằng đúng bộ kiểm tra của engine mà KHÔNG lưu gì. pendingFeedbackCodes: mã phản hồi sắp được tạo cùng rule.
     * Trả về danh sách lỗi (rỗng = hợp lệ).
     */
    @Transactional(readOnly = true)
    public List<String> validateCandidate(Long profileId, RuleUpsertRequest req, Set<String> pendingFeedbackCodes) {
        ExerciseAiProfile p = requireProfile(profileId);
        AiMotionRule r = new AiMotionRule();
        r.setAiProfile(p);
        List<MotionRuleThreshold> bands = new ArrayList<>();
        try {
            mapper.apply(r, req, bands);
            RuleDef def = mapper.toDef(r, bands);
            boolean feedbackKnown = feedback.exists(r.getFeedbackCode()) || (r.getFeedbackCode() != null && pendingFeedbackCodes.contains(r.getFeedbackCode()));
            return MotionRuleValidator.validate(def, phaseCodes(profileId), feedbackKnown).errors();
        } catch (RuntimeException e) {
            return List.of(e.getMessage() == null ? "Cấu hình rule không đọc được." : e.getMessage());
        }
    }

    /** Ghi nhật ký một lần AI soạn rule cho profile (kết quả tóm tắt). */
    @Transactional
    public void recordAiGeneration(Long profileId, String actor, String summary) {
        audit(requireProfile(profileId), actor, "AI_GENERATE", "PROFILE#" + profileId, null, null, summary);
    }

    MotionRuleValidator.Result validate(AiMotionRule r) {
        RuleDef def = mapper.toDef(r, r.getId() == null ? List.of() : thresholds.findByRuleIdOrderBySortOrderAsc(r.getId()));
        return MotionRuleValidator.validate(def, phaseCodes(r.getAiProfile().getId()), feedback.exists(r.getFeedbackCode()));
    }

    private List<RuleDto> toDtos(List<AiMotionRule> list, Long profileId) {
        if (list.isEmpty()) return List.of();
        Set<String> ph = phaseCodes(profileId);
        Map<Long, List<MotionRuleThreshold>> byRule = new HashMap<>();
        thresholds.findByRuleIdIn(list.stream().map(r -> r.getId()).toList())
                .forEach(t -> byRule.computeIfAbsent(t.getRuleId(), k -> new ArrayList<>()).add(t));
        List<RuleDto> out = new ArrayList<>();
        for (AiMotionRule r : list) {
            RuleDef d = mapper.toDef(r, byRule.getOrDefault(r.getId(), List.of()));
            MotionRuleValidator.Result v = MotionRuleValidator.validate(d, ph, feedback.exists(r.getFeedbackCode()));
            List<BandDto> bands = d.bands().stream()
                    .map(b -> new BandDto(b.severity().name(), b.min(), b.max(), b.minInclusive(), b.maxInclusive())).toList();
            boolean legacy = r.getMeasurementJson() == null;
            out.add(new RuleDto(r.getId(), profileId, r.getRuleCode(), version(r), r.getRuleName(), r.getDescription(),
                    r.getStatus(), d.phase(), r.getMetricType(), mapper.readMeasurement(r.getMeasurementJson()), r.getUnit(),
                    r.getOperator(), r.getTargetValue(), r.getNormalMin(), r.getNormalMax(), d.normalMinInclusive(),
                    d.normalMaxInclusive(), bands, r.getSeverity(), r.getPriority(), r.isInvalidRep(), r.getInvalidRepMinSeverity(),
                    d.stopExercise(), d.persistenceType().name(), d.persistenceValue(), d.cooldownMs(), d.evaluationIntervalMs(),
                    r.getFeedbackCode(), r.getCameraView(), r.getSourceType(), r.getSourceReference(), r.getChangeNote(),
                    r.getPreviousVersionId(), d.operator() == null ? null : ThresholdClassifier.expected(d),
                    r.getCreatedBy(), r.getUpdatedBy(), r.getSubmittedBy(), r.getSubmittedAt(), r.getApprovedBy(),
                    r.getApprovedAt(), r.getLastTestedAt(), r.getUpdatedAt(), r.getLastTestedAt() != null, v.errors(), v.warnings(),
                    legacy ? new LegacyDto(r.getMetricType(), r.getOperator(), r.getThresholdMin(), r.getThresholdMax(),
                            r.getFeedbackMessage(), r.getVoicePrompt()) : null));
        }
        return out;
    }

    AiMotionRule requireRule(Long id) {
        return rules.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy rule."));
    }

    static int version(AiMotionRule r) {
        return r.getRuleVersion() == null ? 1 : r.getRuleVersion();
    }

    static String ruleRef(AiMotionRule r) {
        return "MOTION_RULE:" + r.getAiProfile().getId() + ":" + r.getRuleCode();
    }

    private String ruleJson(AiMotionRule r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("version", version(r));
        m.put("status", r.getStatus());
        m.put("phase", r.getPhaseCode());
        m.put("metricType", r.getMetricType());
        m.put("measurement", r.getMeasurementJson());
        m.put("unit", r.getUnit());
        m.put("operator", r.getOperator());
        m.put("target", r.getTargetValue());
        m.put("normalMin", r.getNormalMin());
        m.put("normalMax", r.getNormalMax());
        m.put("severity", r.getSeverity());
        m.put("priority", r.getPriority());
        m.put("invalidRep", r.isInvalidRep());
        m.put("stopExercise", r.getStopExercise());
        m.put("persistence", r.getPersistenceType() + ":" + r.getPersistenceValue());
        m.put("cooldownMs", r.getCooldownMs());
        m.put("feedbackCode", r.getFeedbackCode());
        m.put("cameraView", r.getCameraView());
        m.put("source", r.getSourceType());
        if (r.getId() != null) {
            m.put("bands", thresholds.findByRuleIdOrderBySortOrderAsc(r.getId()).stream()
                    .map(t -> t.getSeverity() + "[" + t.getMinValue() + "," + t.getMaxValue() + "]").toList());
        }
        return json.writeValueAsString(m);
    }

    private String profileJson(ExerciseAiProfile p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("cameraView", p.getCameraView());
        m.put("movementType", p.getMovementType());
        m.put("repMetric", p.getRepMetricJson());
        m.put("repTop", p.getRepTopThreshold());
        m.put("repBottom", p.getRepBottomThreshold());
        m.put("repDirection", p.getRepDirection());
        m.put("debounceMs", p.getDebounceTimeMs());
        m.put("minRepMs", p.getMinRepDurationMs());
        m.put("maxRepMs", p.getMaxRepDurationMs());
        m.put("minPoseConfidence", p.getMinPoseConfidence());
        m.put("minLandmarkVisibility", p.getMinLandmarkVisibility());
        return json.writeValueAsString(m);
    }

    private void audit(ExerciseAiProfile p, String actor, String action, String ref, String oldV, String newV, String reason) {
        AiConfigurationAuditLog a = new AiConfigurationAuditLog();
        a.setProfileId(p.getId());
        a.setExerciseName(p.getExercise() == null ? null : p.getExercise().getName());
        a.setUserEmail(actor);
        a.setAction(action);
        a.setTargetRef(ref);
        a.setOldValue(oldV);
        a.setNewValue(newV);
        a.setReason(reason);
        audits.save(a);
    }

    private static int nonNegative(int v, String label) {
        if (v < 0) throw new IllegalArgumentException(label + " phải ≥ 0.");
        return v;
    }

    private static double unit(double v, String label) {
        if (v < 0 || v > 1) throw new IllegalArgumentException(label + " phải trong [0, 1].");
        return v;
    }
}
