package com.calishealth.api.service.assessment;

import com.calishealth.api.config.Actor;
import com.calishealth.api.dto.AssessmentTemplateDtos.*;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Quản trị bài đánh giá (template), ngân hàng câu hỏi và cấu hình bài test đầu vào.
 *
 * Quy ước câu hỏi trong bài:
 *  - Câu hỏi thuộc NGÂN HÀNG (owner = NULL) được tham chiếu trực tiếp nếu admin không sửa nội dung trong bài.
 *  - Sửa nội dung câu hỏi ngân hàng ngay trong bài -> tạo BẢN SAO riêng của bài (ngân hàng không bị ảnh hưởng).
 *  - Câu hỏi tạo mới trong bài (id tạm) -> câu hỏi riêng của bài; câu hỏi riêng của bài khác -> sao chép.
 * Bài đang là bài test đầu vào bị KHÓA: lưu thay đổi sẽ tạo phiên bản mới (bản nháp); xuất bản phiên bản mới thì
 * bài test đầu vào tự chuyển sang phiên bản đó và phiên bản cũ được lưu trữ.
 */
@Service
@Transactional(readOnly = true)
public class AdminAssessmentTemplateService {
    private static final String ONBOARDING = "ONBOARDING";

    private final AssessmentTemplateRepository templateRepo;
    private final AssessmentTemplateQuestionRepository templateQuestionRepo;
    private final AssessmentQuestionRepository questionRepo;
    private final AssessmentQuestionOptionRepository optionRepo;
    private final AssessmentScoreRuleRepository ruleRepo;
    private final AssessmentTemplateLevelRepository levelRepo;
    private final AssessmentOnboardingSettingsRepository settingsRepo;
    private final AssessmentSessionRepository sessionRepo;
    private final QuestionCompetencyMappingRepository competencyMappingRepo;
    private final ObjectMapper json = new ObjectMapper();

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.calishealth.api.service.notification.NotificationService notifications;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.calishealth.api.service.assessmentv2.AssessmentV2Settings v2Settings;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.jdbc.core.JdbcTemplate jdbc;

    public AdminAssessmentTemplateService(AssessmentTemplateRepository templateRepo,
                                          AssessmentTemplateQuestionRepository templateQuestionRepo,
                                          AssessmentQuestionRepository questionRepo,
                                          AssessmentQuestionOptionRepository optionRepo,
                                          AssessmentScoreRuleRepository ruleRepo,
                                          AssessmentTemplateLevelRepository levelRepo,
                                          AssessmentOnboardingSettingsRepository settingsRepo,
                                          AssessmentSessionRepository sessionRepo,
                                          QuestionCompetencyMappingRepository competencyMappingRepo) {
        this.competencyMappingRepo = competencyMappingRepo;
        this.templateRepo = templateRepo;
        this.templateQuestionRepo = templateQuestionRepo;
        this.questionRepo = questionRepo;
        this.optionRepo = optionRepo;
        this.ruleRepo = ruleRepo;
        this.levelRepo = levelRepo;
        this.settingsRepo = settingsRepo;
        this.sessionRepo = sessionRepo;
    }

    // =====================================================================================
    // BÀI ĐÁNH GIÁ
    // =====================================================================================

    public List<AssessmentDto> listTemplates() {
        List<AssessmentTemplate> templates = templateRepo.findAllByOrderByUpdatedAtDesc();
        if (templates.isEmpty()) return List.of();
        List<Long> ids = templates.stream().map(assessmentTemplate -> assessmentTemplate.getId()).toList();
        Map<Long, long[]> stats = loadStats(ids);
        Long activeId = activeOnboardingTemplateId();
        return templates.stream().map(t -> toDto(t, false, stats.get(t.getId()), activeId, null, null)).toList();
    }

    public AssessmentDto getTemplate(Long id) {
        AssessmentTemplate t = findTemplate(id);
        return toDto(t, true, loadStats(List.of(id)).get(id), activeOnboardingTemplateId(), null, null);
    }

    /** Tạo mới / cập nhật. Bài đang là bài test đầu vào -> tạo phiên bản mới (bản nháp) thay vì sửa trực tiếp. */
    @Transactional
    public AssessmentDto saveTemplate(AssessmentDto req) {
        Long reqId = parseId(req.id());
        AssessmentTemplate existing = reqId == null ? null : templateRepo.findById(reqId).orElse(null);
        String forkedFrom = null;
        boolean coachOnly = Actor.coachOnly();
        if (coachOnly && existing != null && !AssessmentTemplate.DRAFT.equals(existing.getStatus()))
            throw new IllegalStateException("Bài đánh giá đã xuất bản/lưu trữ, Coach chỉ sửa được bản nháp. Hãy nhân bản thành bản nháp rồi gửi Admin duyệt.");

        AssessmentTemplate t;
        if (existing == null) {
            t = new AssessmentTemplate();
            t.setCode(uniqueCode("ASM"));
        } else if (isActiveOnboarding(existing)) {
            t = newVersionOf(existing);
            forkedFrom = String.valueOf(existing.getId());
        } else {
            t = existing;
        }

        applyMeta(t, req);
        String requestedStatus = req.status() == null ? null : req.status().toUpperCase(Locale.ROOT);
        if (coachOnly) requestedStatus = AssessmentTemplate.DRAFT;     // Coach không tự xuất bản/lưu trữ
        if (t.getId() == null || forkedFrom != null) {
            t.setStatus(AssessmentTemplate.DRAFT);
        } else if (AssessmentTemplate.DRAFT.equals(requestedStatus) || AssessmentTemplate.ARCHIVED.equals(requestedStatus)) {
            t.setStatus(requestedStatus);
        }
        t = templateRepo.save(t);

        Map<String, String> idMap = saveQuestionsRulesLevels(t, req);

        if (AssessmentTemplate.PUBLISHED.equals(requestedStatus)) {
            publishInternal(t);
        }
        Long activeId = activeOnboardingTemplateId();
        return toDto(t, true, loadStats(List.of(t.getId())).get(t.getId()), activeId, forkedFrom, idMap);
    }

    @Transactional
    public AssessmentDto publish(Long id) {
        AssessmentTemplate t = findTemplate(id);
        publishInternal(t);
        return getTemplate(id);
    }

    @Transactional
    public AssessmentDto updateStatus(Long id, String status) {
        String s = status == null ? "" : status.toUpperCase(Locale.ROOT);
        AssessmentTemplate t = findTemplate(id);
        switch (s) {
            case AssessmentTemplate.PUBLISHED -> publishInternal(t);
            case AssessmentTemplate.DRAFT, AssessmentTemplate.ARCHIVED -> {
                if (isActiveOnboarding(t)) {
                    throw new IllegalArgumentException("Bài đang là bài test đầu vào. Hãy chọn bài khác (hoặc tắt bài test đầu vào) trước khi đổi trạng thái.");
                }
                t.setStatus(s);
                templateRepo.save(t);
            }
            default -> throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
        }
        return getTemplate(id);
    }

    /** Sao chép thành bài độc lập mới (bản nháp); câu hỏi riêng của bài gốc được sao chép theo. */
    /** Coach gửi bản nháp cho Admin duyệt và phát hành (chỉ thông báo; vẫn là bản nháp cho tới khi Admin phát hành). */
    @Transactional
    public AssessmentDto submitForReview(Long id) {
        AssessmentTemplate t = findTemplate(id);
        if (!AssessmentTemplate.DRAFT.equals(t.getStatus())) throw new IllegalStateException("Chỉ gửi duyệt được bản nháp (đang " + t.getStatus() + ").");
        List<String> errors = validationErrors(t);
        if (!errors.isEmpty()) throw new IllegalArgumentException("Bài chưa thể phát hành nên chưa gửi duyệt được: " + String.join(" ", errors));
        if (notifications != null) notifications.notifyRole("ADMIN", "ASSESSMENT_TEMPLATE_SUBMITTED", "Bài test đánh giá chờ duyệt",
                "Coach gửi bài \"" + t.getName() + "\" để duyệt và phát hành.", "ASSESSMENT_TEMPLATE", t.getId());
        return getTemplate(id);
    }

    @Transactional
    public AssessmentDto duplicate(Long id) {
        AssessmentDto source = getTemplate(id);
        AssessmentDto copy = new AssessmentDto(null, source.name() + " (Copy)",
                (source.displayName() == null ? source.name() : source.displayName()) + " (Bản sao)",
                source.description(), source.type(), source.estimatedDuration(), source.tags(), AssessmentTemplate.DRAFT,
                source.targetAudience(), source.questions(), source.scoringConfig(), source.fitnessLevels(), source.schedule(),
                null, null, null, null, null, null, null, null, null, null, null);
        return saveTemplate(copy);
    }

    /** Bài đã có người làm -> chỉ lưu trữ (giữ kết quả); chưa có -> xóa hẳn. */
    @Transactional
    public void delete(Long id) {
        AssessmentTemplate t = findTemplate(id);
        if (isActiveOnboarding(t)) {
            throw new IllegalArgumentException("Không thể xóa bài đang là bài test đầu vào. Hãy chọn bài khác trước.");
        }
        if (sessionRepo.existsByTemplateId(id)) {
            t.setStatus(AssessmentTemplate.ARCHIVED);
            templateRepo.save(t);
            return;
        }
        templateQuestionRepo.deleteByTemplateId(id);
        ruleRepo.deleteByTemplateId(id);
        levelRepo.deleteByTemplateId(id);
        templateRepo.delete(t); // câu hỏi riêng của bài bị xóa theo (FK owner_template_id ON DELETE CASCADE)
    }

    /** Kiểm tra bài có đủ điều kiện xuất bản / làm bài test đầu vào. */
    public ValidationResultDto validate(Long id, boolean forOnboarding) {
        AssessmentTemplate t = findTemplate(id);
        List<String> errors = validationErrors(t);
        if (forOnboarding && !AssessmentTemplate.PUBLISHED.equals(t.getStatus())) {
            errors.add(0, "Bài phải ở trạng thái Đã xuất bản.");
        }
        return new ValidationResultDto(errors.isEmpty(), errors);
    }

    // =====================================================================================
    // NGÂN HÀNG CÂU HỎI
    // =====================================================================================

    public List<QuestionDto> listBankQuestions() {
        List<AssessmentQuestion> questions = questionRepo.findByOwnerTemplateIdIsNullAndActiveTrueOrderByUpdatedAtDesc();
        return toQuestionDtos(questions, true);
    }

    public QuestionDto getQuestion(Long id) {
        AssessmentQuestion q = questionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy câu hỏi " + id));
        return toQuestionDtos(List.of(q), true).get(0);
    }

    @Transactional
    public QuestionDto saveBankQuestion(QuestionDto req) {
        Long id = parseId(req.id());
        AssessmentQuestion q = id == null ? null : questionRepo.findById(id).orElse(null);
        if (q == null) {
            q = new AssessmentQuestion();
            q.setQuestionCode(uniqueQuestionCode());
        } else if (q.getOwnerTemplateId() != null) {
            throw new IllegalArgumentException("Câu hỏi này thuộc riêng 1 bài đánh giá, hãy sửa trong trình tạo bài.");
        } else if (Actor.coachOnly() && templateQuestionRepo.existsByQuestionId(q.getId())) {
            throw new IllegalStateException("Câu hỏi đang được bài đánh giá sử dụng nên Coach không sửa trực tiếp (sẽ đổi kết quả của bài đang chạy). Hãy tạo câu hỏi mới rồi nhờ Admin duyệt.");
        } else {
            q.setVersion(q.getVersion() + 1);
        }
        applyQuestionContent(q, req);
        q = questionRepo.save(q);
        syncOptions(q, req.options());
        ruleRepo.deleteBankRulesByQuestionId(q.getId());
        saveRules(null, q, req.scoringRules());
        return getQuestion(q.getId());
    }

    /** Đang được bài nào dùng (hoặc đã có câu trả lời) -> ẩn khỏi ngân hàng; ngược lại xóa hẳn. */
    @Transactional
    public void deleteBankQuestion(Long id) {
        AssessmentQuestion q = questionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy câu hỏi " + id));
        if (templateQuestionRepo.existsByQuestionId(id)) {
            q.setActive(false);
            questionRepo.save(q);
            return;
        }
        try {
            ruleRepo.deleteBankRulesByQuestionId(id);
            optionRepo.deleteByQuestionId(id);
            questionRepo.delete(q);
            questionRepo.flush();
        } catch (RuntimeException e) {
            // Còn câu trả lời của học viên tham chiếu -> chỉ ẩn
            q.setActive(false);
            questionRepo.save(q);
        }
    }

    // =====================================================================================
    // CẤU HÌNH BÀI TEST ĐẦU VÀO
    // =====================================================================================

    public OnboardingSettingsDto getOnboardingSettings() {
        AssessmentOnboardingSettings s = settings();
        AssessmentTemplate t = s.getActiveTemplate();
        long completed = sessionRepo.countByPurposeAndStatusAndOnboardingRoundGreaterThanEqual(
                ONBOARDING, AssessmentSessionStatus.COMPLETED, s.getRound());
        ValidationResultDto validation = t == null ? null : validate(t.getId(), true);
        return new OnboardingSettingsDto(
                t == null ? null : String.valueOf(t.getId()),
                t == null ? null : firstNonBlank(t.getDisplayName(), t.getName()),
                t == null ? null : t.getVersion(),
                t == null ? null : t.getStatus(),
                s.isMandatory(), s.isBlockWhenMissing(), s.getRound(),
                s.getUpdatedAt() == null ? null : s.getUpdatedAt().toString(), s.getUpdatedBy(), completed, validation);
    }

    @Transactional
    public OnboardingSettingsDto updateOnboardingSettings(UpdateOnboardingSettingsRequest req, String adminEmail) {
        AssessmentOnboardingSettings s = settings();
        if (req.activeTemplateId() != null) {
            Long templateId = parseId(req.activeTemplateId());
            if (templateId == null) {
                s.setActiveTemplate(null); // tắt bài test đầu vào
            } else {
                ValidationResultDto v = validate(templateId, true);
                if (!v.valid()) {
                    throw new IllegalArgumentException("Bài chưa đủ điều kiện làm bài test đầu vào: " + String.join(" ", v.errors()));
                }
                s.setActiveTemplate(findTemplate(templateId));
            }
        }
        if (req.mandatory() != null) s.setMandatory(req.mandatory());
        if (req.blockWhenMissing() != null) s.setBlockWhenMissing(req.blockWhenMissing());
        s.setUpdatedBy(adminEmail);
        settingsRepo.save(s);
        return getOnboardingSettings();
    }

    /** Yêu cầu tất cả người dùng làm lại bài test đầu vào (kể cả người đã làm). */
    @Transactional
    public OnboardingSettingsDto requireRetake(String adminEmail) {
        AssessmentOnboardingSettings s = settings();
        s.setRound(s.getRound() + 1);
        s.setUpdatedBy(adminEmail);
        settingsRepo.save(s);
        return getOnboardingSettings();
    }

    // =====================================================================================
    // NỘI BỘ: LƯU CÂU HỎI / QUY TẮC / MỨC TRÌNH ĐỘ
    // =====================================================================================

    private Map<String, String> saveQuestionsRulesLevels(AssessmentTemplate t, AssessmentDto req) {
        Map<String, String> idMap = new LinkedHashMap<>();
        List<QuestionRefDto> refs = req.questions() == null ? List.of() : req.questions().stream()
                .filter(r -> r != null && r.questionId() != null)
                .sorted(Comparator.comparing(r -> r.order() == null ? Integer.MAX_VALUE : r.order()))
                .toList();

        // 1. Xác định câu hỏi thật cho từng tham chiếu
        Map<String, AssessmentQuestion> resolved = new LinkedHashMap<>();
        Map<String, List<ScoreRuleDto>> ownRulesFromDefs = new HashMap<>();
        for (QuestionRefDto ref : refs) {
            if (resolved.containsKey(ref.questionId())) continue;
            AssessmentQuestion q = resolveQuestion(t, ref);
            resolved.put(ref.questionId(), q);
            if (!String.valueOf(q.getId()).equals(ref.questionId())) idMap.put(ref.questionId(), String.valueOf(q.getId()));
            if (ref.question() != null && ref.question().scoringRules() != null && !ref.question().scoringRules().isEmpty()) {
                ownRulesFromDefs.put(ref.questionId(), ref.question().scoringRules());
            }
        }

        // 2. Câu hỏi trong bài (ghi lại toàn bộ)
        templateQuestionRepo.deleteByTemplateId(t.getId());
        int order = 1;
        Set<Long> inserted = new HashSet<>();
        for (QuestionRefDto ref : refs) {
            AssessmentQuestion q = resolved.get(ref.questionId());
            if (q == null || !inserted.add(q.getId())) continue; // bỏ câu hỏi bị gửi lặp
            AssessmentTemplateQuestion tq = new AssessmentTemplateQuestion();
            tq.setTemplate(t);
            tq.setQuestion(q);
            tq.setSortOrder(order++);
            tq.setWeight(decimal(ref.weight() == null ? 0 : Math.max(0, ref.weight())));
            tq.setRequired(ref.required() == null || ref.required());
            tq.setSectionTitle(trimTo(ref.section(), 150));
            templateQuestionRepo.save(tq);
        }

        // 3. Quy tắc chấm điểm theo khoảng (riêng của bài)
        ruleRepo.deleteByTemplateId(t.getId());
        Set<String> withRules = new HashSet<>();
        if (req.scoringConfig() != null && req.scoringConfig().questionScoring() != null) {
            for (QuestionScoringDto qs : req.scoringConfig().questionScoring()) {
                AssessmentQuestion q = resolved.get(qs.questionId());
                if (q == null || qs.rules() == null || qs.rules().isEmpty()) continue;
                saveRules(t, q, qs.rules());
                withRules.add(qs.questionId());
            }
        }
        ownRulesFromDefs.forEach((qid, rules) -> {
            AssessmentQuestion q = resolved.get(qid);
            // Quy tắc trong định nghĩa câu hỏi riêng của bài dùng khi bước Chấm điểm chưa đặt quy tắc
            if (q != null && !withRules.contains(qid) && Objects.equals(q.getOwnerTemplateId(), t.getId())) saveRules(t, q, rules);
        });

        // 4. Mức trình độ
        levelRepo.deleteByTemplateId(t.getId());
        int i = 0;
        for (LevelDto l : req.fitnessLevels() == null ? List.<LevelDto>of() : req.fitnessLevels()) {
            if (l == null || blank(l.name()) || l.minScore() == null || l.maxScore() == null) continue;
            AssessmentTemplateLevel level = new AssessmentTemplateLevel();
            level.setTemplate(t);
            level.setCode(trimTo(firstNonBlank(l.code(), "LEVEL_" + (i + 1)), 30));
            level.setName(trimTo(l.name(), 100));
            level.setMinScore(decimal(Math.min(l.minScore(), l.maxScore())));
            level.setMaxScore(decimal(Math.max(l.minScore(), l.maxScore())));
            level.setDescription(l.description());
            level.setRecommendation(l.recommendation());
            level.setColorScheme(trimTo(l.colorScheme(), 20));
            level.setBadgeLabel(trimTo(l.badgeLabel(), 50));
            level.setSortOrder(i++);
            levelRepo.save(level);
        }
        return idMap;
    }

    /** Trả về câu hỏi thật cho 1 tham chiếu: dùng lại / cập nhật / sao chép / tạo mới theo quy ước ở đầu lớp. */
    private AssessmentQuestion resolveQuestion(AssessmentTemplate t, QuestionRefDto ref) {
        Long qid = parseId(ref.questionId());
        AssessmentQuestion existing = qid == null ? null : questionRepo.findById(qid).orElse(null);
        QuestionDto def = ref.question();

        if (existing == null) {
            if (def == null) throw new IllegalArgumentException("Thiếu nội dung cho câu hỏi mới " + ref.questionId());
            return createOwnedQuestion(t, def);
        }
        boolean ownedByThis = Objects.equals(existing.getOwnerTemplateId(), t.getId());
        boolean changed = def != null && !contentKey(def).equals(contentKey(toQuestionDtos(List.of(existing), false).get(0)));

        if (ownedByThis) {
            if (changed && def != null) {
                applyQuestionContent(existing, def);
                existing.setVersion(existing.getVersion() + 1);
                existing = questionRepo.save(existing);
                syncOptions(existing, def.options());
            }
            return existing;
        }
        if (existing.getOwnerTemplateId() == null && !changed) return existing; // câu hỏi ngân hàng giữ nguyên
        // Sửa câu hỏi ngân hàng trong bài, hoặc câu hỏi riêng của bài khác -> bản sao riêng cho bài này
        QuestionDto source = def != null ? def : toQuestionDtos(List.of(existing), false).get(0);
        AssessmentQuestion copy = createOwnedQuestion(t, source);
        copyLevelEngineMetadata(existing, copy);
        return copy;
    }

    /** Bản sao câu hỏi phải giữ ý nghĩa nghiệp vụ và ánh xạ năng lực của Level Engine. */
    private void copyLevelEngineMetadata(AssessmentQuestion from, AssessmentQuestion to) {
        if (from.getSemanticKey() != null) {
            to.setSemanticKey(from.getSemanticKey());
            questionRepo.save(to);
        }
        for (QuestionCompetencyMapping m : competencyMappingRepo.findByQuestionId(from.getId())) {
            QuestionCompetencyMapping c = new QuestionCompetencyMapping();
            c.setQuestion(to);
            c.setCompetencyCode(m.getCompetencyCode());
            c.setMappingType(m.getMappingType());
            c.setExercise(m.getExercise());
            c.setWeight(m.getWeight());
            competencyMappingRepo.save(c);
        }
    }

    private AssessmentQuestion createOwnedQuestion(AssessmentTemplate t, QuestionDto def) {
        AssessmentQuestion q = new AssessmentQuestion();
        q.setQuestionCode(uniqueQuestionCode());
        q.setOwnerTemplateId(t.getId());
        applyQuestionContent(q, def);
        q = questionRepo.save(q);
        syncOptions(q, def.options());
        return q;
    }

    private void applyQuestionContent(AssessmentQuestion q, QuestionDto d) {
        String type = d.type() != null && AssessmentQuestionTypes.ADMIN_TYPES.contains(d.type()) ? d.type() : "NUMERIC_INPUT";
        q.setQuestionText(firstNonBlank(d.text(), "Câu hỏi mới"));
        q.setDescription(d.description());
        q.setInstruction(d.instruction());
        q.setInputType(type);
        q.setQuestionType(AssessmentQuestionTypes.storageType(type));
        q.setCategory(trimTo(d.category(), 50));
        q.setUnit(trimTo(d.unit(), 30));
        q.setRequired(d.required() == null || d.required());
        q.setDefaultWeight(decimal(d.weight() == null ? 10 : Math.max(0, d.weight())));
        q.setActive(true);

        Map<String, Object> config = new LinkedHashMap<>();
        if (d.performanceConfig() != null) config.put("performanceConfig", d.performanceConfig());
        if (d.measurementConfig() != null) config.put("measurementConfig", d.measurementConfig());
        if (d.ratingConfig() != null) config.put("ratingConfig", d.ratingConfig());
        q.setConfigJson(config.isEmpty() ? null : json.writeValueAsString(config));

        // Khoảng giá trị hợp lệ lấy từ cấu hình tương ứng với loại câu hỏi
        Double[] range = switch (type) {
            case "PERFORMANCE_TEST" -> range(d.performanceConfig(), "minValue", "maxValue");
            case "MEASUREMENT" -> range(d.measurementConfig(), "minValue", "maxValue");
            case "RATING_SCALE" -> range(d.ratingConfig(), "minScale", "maxScale");
            default -> new Double[]{null, null};
        };
        if (range[0] != null && range[1] != null && range[0] > range[1]) range = new Double[]{range[1], range[0]};
        q.setMinValue(range[0] == null ? null : decimal(range[0]));
        q.setMaxValue(range[1] == null ? null : decimal(range[1]));
    }

    /** Cập nhật đáp án theo mã (value): giữ id đáp án cũ vì câu trả lời của học viên tham chiếu tới. */
    private void syncOptions(AssessmentQuestion q, List<OptionDto> defs) {
        Map<String, AssessmentQuestionOption> current = new HashMap<>();
        for (AssessmentQuestionOption o : optionRepo.findAllByQuestionId(q.getId())) current.put(o.getOptionCode(), o);
        Set<String> kept = new HashSet<>();
        int i = 0;
        for (OptionDto d : defs == null ? List.<OptionDto>of() : defs) {
            if (d == null || blank(d.label())) continue;
            String code = trimTo(firstNonBlank(d.value(), firstNonBlank(d.id(), d.label())), 50);
            String unique = code;
            for (int n = 2; kept.contains(unique); n++) unique = trimTo(code, 45) + "_" + n;
            kept.add(unique);
            AssessmentQuestionOption o = current.getOrDefault(unique, new AssessmentQuestionOption());
            o.setQuestion(q);
            o.setOptionCode(unique);
            o.setOptionLabel(trimTo(d.label(), 255));
            o.setScore(d.score() == null ? null : decimal(Math.max(0, Math.min(100, d.score()))));
            Double numeric = AssessmentScoringEngine.toNumber(d.value());
            o.setNumericValue(numeric == null ? null : decimal(numeric));
            o.setSortOrder(i++);
            o.setActive(true);
            optionRepo.save(o);
        }
        current.forEach((code, o) -> {
            if (!kept.contains(code) && o.isActive()) {
                o.setActive(false);
                optionRepo.save(o);
            }
        });
    }

    private void saveRules(AssessmentTemplate t, AssessmentQuestion q, List<ScoreRuleDto> rules) {
        if (rules == null) return;
        int i = 0;
        for (ScoreRuleDto r : rules) {
            if (r == null || r.score() == null || r.operator() == null) continue;
            String op = r.operator().toUpperCase(Locale.ROOT);
            if (!List.of("GT", "GTE", "LT", "LTE", "BETWEEN", "EQ").contains(op)) continue;
            AssessmentScoreRule rule = new AssessmentScoreRule();
            rule.setTemplate(t);
            rule.setQuestion(q);
            rule.setOperator(op);
            rule.setMinValue(r.minValue() == null ? null : decimal(r.minValue()));
            rule.setMaxValue(r.maxValue() == null ? null : decimal(r.maxValue()));
            rule.setExactValue(r.exactValue() == null ? null : trimTo(String.valueOf(r.exactValue()), 100));
            rule.setScore(decimal(Math.max(0, Math.min(100, r.score()))));
            rule.setLabel(trimTo(r.label(), 150));
            rule.setSortOrder(i++);
            ruleRepo.save(rule);
        }
    }

    // =====================================================================================
    // NỘI BỘ: XUẤT BẢN, PHIÊN BẢN, KIỂM TRA
    // =====================================================================================

    private void publishInternal(AssessmentTemplate t) {
        List<String> errors = validationErrors(t);
        if (!errors.isEmpty()) {
            throw new IllegalArgumentException("Chưa thể xuất bản: " + String.join(" ", errors));
        }
        t.setStatus(AssessmentTemplate.PUBLISHED);
        t.setPublishedAt(java.time.Instant.now());
        templateRepo.save(t);
        if (notifications != null) notifications.notifyRole("COACH", "ASSESSMENT_TEMPLATE_PUBLISHED", "Bài test đánh giá đã được phát hành",
                "Bài \"" + t.getName() + "\" đã được Admin duyệt và phát hành.", "ASSESSMENT_TEMPLATE", t.getId());

        // Phiên bản mới của bài test đầu vào đang dùng -> chuyển sang dùng phiên bản này, lưu trữ bản cũ
        AssessmentOnboardingSettings s = settings();
        AssessmentTemplate active = s.getActiveTemplate();
        if (active != null && !active.getId().equals(t.getId()) && active.lineageId().equals(t.lineageId())) {
            s.setActiveTemplate(t);
            settingsRepo.save(s);
            active.setStatus(AssessmentTemplate.ARCHIVED);
            templateRepo.save(active);
        }
    }

    private AssessmentTemplate newVersionOf(AssessmentTemplate base) {
        Long rootId = base.lineageId();
        int nextVersion = templateRepo.findByIdOrRootIdOrderByVersionDesc(rootId, rootId).stream()
                .mapToInt(assessmentTemplate -> assessmentTemplate.getVersion()).max().orElse(base.getVersion()) + 1;
        AssessmentTemplate t = new AssessmentTemplate();
        t.setRootId(rootId);
        t.setParentId(base.getId());
        t.setVersion(nextVersion);
        String rootCode = templateRepo.findById(rootId).map(assessmentTemplate -> assessmentTemplate.getCode()).orElse(base.getCode());
        String code = trimTo(rootCode, 70) + "-V" + nextVersion;
        t.setCode(templateRepo.existsByCode(code) ? uniqueCode("ASM") : code);
        return t;
    }

    private List<String> validationErrors(AssessmentTemplate t) {
        List<String> errors = new ArrayList<>();
        List<AssessmentTemplateQuestion> refs = templateQuestionRepo.findWithQuestionByTemplateId(t.getId());
        if (refs.isEmpty()) {
            errors.add("Bài chưa có câu hỏi nào.");
            return errors;
        }
        // Bài của Assessment Framework V2 (sàng lọc, khảo sát, đo thực hành): chấm bằng BỘ QUY TẮC V2 (Level Engine), không dùng cách chấm điểm và mức trình độ
        // của template v1. Điều kiện phát hành là bộ quy tắc V2 đã được duyệt và kích hoạt.
        if (isV2Template(t)) {
            Integer active = jdbc == null ? 1 : jdbc.queryForObject("SELECT COUNT(*) FROM rule_sets WHERE code = ? AND status = 'ACTIVE'", Integer.class, v2Settings.ruleSetCode());
            if (active == null || active == 0)
                errors.add("Bộ quy tắc đánh giá V2 chưa được duyệt và kích hoạt. Hãy duyệt ở mục \"Bộ quy tắc đánh giá V2\" (Coach gửi, Admin duyệt) trước khi phát hành bài này.");
            return errors;
        }
        double totalWeight = refs.stream().mapToDouble(r -> r.getWeight().doubleValue()).sum();
        if (totalWeight <= 0) errors.add("Tổng trọng số các câu hỏi phải lớn hơn 0.");

        Map<Long, List<AssessmentQuestionOption>> options = optionsByQuestion(refs);
        Map<Long, List<AssessmentScoreRule>> rules = effectiveRules(t.getId(), refs);
        for (AssessmentTemplateQuestion ref : refs) {
            if (ref.getWeight().signum() <= 0) continue; // câu chỉ thu thập thông tin
            AssessmentQuestion q = ref.getQuestion();
            if (!isScorable(q, options.getOrDefault(q.getId(), List.of()), rules.getOrDefault(q.getId(), List.of()))) {
                errors.add("Câu \"" + truncate(q.getQuestionText(), 60) + "\" có trọng số nhưng chưa có cách chấm điểm"
                        + " (điểm cho đáp án hoặc quy tắc theo khoảng giá trị).");
            }
        }

        List<AssessmentTemplateLevel> levels = levelRepo.findByTemplateId(t.getId()).stream()
                .sorted(Comparator.comparing(assessmentTemplateLevel -> assessmentTemplateLevel.getMinScore())).toList();
        double max = t.getMaxTotalScore() == null ? 100 : t.getMaxTotalScore().doubleValue();
        // Bài INITIAL khi Level Engine đang ACTIVE: level do Level Engine quyết định nên không đòi mức trình độ riêng của bài
        Integer engines = "INITIAL".equals(t.getType()) && jdbc != null
                ? jdbc.queryForObject("SELECT COUNT(*) FROM rule_sets WHERE code = 'LEVEL_ENGINE' AND status = 'ACTIVE'", Integer.class) : 0;
        boolean engineDecidesLevel = engines != null && engines > 0;
        if (engineDecidesLevel) {
            return errors;
        }
        if (levels.isEmpty()) {
            errors.add("Chưa cấu hình mức trình độ nào.");
        } else {
            if (levels.get(0).getMinScore().doubleValue() > 0) errors.add("Mức thấp nhất phải bắt đầu từ 0 điểm.");
            if (levels.get(levels.size() - 1).getMaxScore().doubleValue() < max) {
                errors.add("Mức cao nhất phải đạt tới " + fmt(max) + " điểm.");
            }
            for (int i = 1; i < levels.size(); i++) {
                double prevMax = levels.get(i - 1).getMaxScore().doubleValue();
                double min = levels.get(i).getMinScore().doubleValue();
                if (min <= prevMax) {
                    errors.add("Mức \"" + levels.get(i - 1).getName() + "\" và \"" + levels.get(i).getName() + "\" bị chồng khoảng điểm.");
                } else if (min - prevMax > 1) {
                    errors.add("Có khoảng điểm trống giữa mức \"" + levels.get(i - 1).getName() + "\" và \"" + levels.get(i).getName() + "\".");
                }
            }
        }
        return errors;
    }

    private boolean isV2Template(AssessmentTemplate t) {
        return v2Settings != null && t.getCode() != null
                && (t.getCode().equals(v2Settings.initialTemplateCode()) || t.getCode().equals(v2Settings.safetyTemplateCode()) || t.getCode().equals(v2Settings.periodicTemplateCode()));
    }

    private boolean isScorable(AssessmentQuestion q, List<AssessmentQuestionOption> options, List<AssessmentScoreRule> rules) {
        String type = AssessmentQuestionTypes.inputType(q);
        boolean optionScores = options.stream().anyMatch(o -> o.getScore() != null);
        return switch (type) {
            case "SINGLE_CHOICE", "MULTIPLE_CHOICE", "SELF_ASSESSMENT", "YES_NO" -> optionScores || !rules.isEmpty();
            case "RATING_SCALE" -> !rules.isEmpty() || (q.getMinValue() != null && q.getMaxValue() != null
                    && q.getMaxValue().compareTo(q.getMinValue()) > 0);
            default -> !rules.isEmpty();
        };
    }

    // =====================================================================================
    // NỘI BỘ: CHUYỂN ĐỔI DTO
    // =====================================================================================

    private AssessmentDto toDto(AssessmentTemplate t, boolean full, long[] stats, Long activeId,
                                String forkedFrom, Map<String, String> idMap) {
        List<AssessmentTemplateQuestion> refs = templateQuestionRepo.findWithQuestionByTemplateId(t.getId());
        Map<Long, QuestionDto> defs = full
                ? toQuestionDtos(refs.stream().map(assessmentTemplateQuestion -> assessmentTemplateQuestion.getQuestion()).toList(), false).stream()
                    .collect(Collectors.toMap(d -> Long.valueOf(d.id()), d -> d, (a, b) -> a))
                : Map.of();

        List<QuestionRefDto> questionRefs = refs.stream().map(r -> new QuestionRefDto(
                String.valueOf(r.getQuestion().getId()), r.getSortOrder(), r.getWeight().doubleValue(), r.isRequired(),
                r.getSectionTitle(), defs.get(r.getQuestion().getId()))).toList();

        ScoringConfigDto scoring = null;
        if (full) {
            Map<Long, List<AssessmentScoreRule>> rules = effectiveRules(t.getId(), refs);
            List<QuestionScoringDto> qs = new ArrayList<>();
            rules.forEach((qid, list) -> qs.add(new QuestionScoringDto(String.valueOf(qid),
                    list.stream().map(AdminAssessmentTemplateService::toRuleDto).toList())));
            scoring = new ScoringConfigDto(t.getMaxTotalScore().doubleValue(), qs,
                    t.getPassScore() == null ? null : t.getPassScore().doubleValue());
        } else {
            scoring = new ScoringConfigDto(t.getMaxTotalScore().doubleValue(), List.of(),
                    t.getPassScore() == null ? null : t.getPassScore().doubleValue());
        }

        List<LevelDto> levels = levelRepo.findByTemplateId(t.getId()).stream().map(l -> new LevelDto(
                String.valueOf(l.getId()), l.getCode(), l.getName(), l.getMinScore().doubleValue(), l.getMaxScore().doubleValue(),
                l.getDescription(), l.getRecommendation(), l.getColorScheme(), l.getBadgeLabel())).toList();

        long attempts = stats == null ? 0 : stats[0];
        long completed = stats == null ? 0 : stats[1];
        double avg = stats == null ? 0 : stats[2] / 100.0;
        boolean onboarding = activeId != null && activeId.equals(t.getId());

        return new AssessmentDto(
                String.valueOf(t.getId()), t.getName(), t.getDisplayName(), t.getDescription(), t.getType(),
                t.getEstimatedDuration(), readList(t.getTagsJson()), t.getStatus(), readObject(t.getTargetAudienceJson()),
                questionRefs, scoring, levels, readObject(t.getScheduleJson()),
                t.getCreatedAt() == null ? null : t.getCreatedAt().toString(),
                t.getUpdatedAt() == null ? null : t.getUpdatedAt().toString(),
                t.getVersion(), (int) completed, avg,
                attempts == 0 ? 0 : Math.round(completed * 1000.0 / attempts) / 10.0,
                onboarding, onboarding, String.valueOf(t.lineageId()), forkedFrom,
                idMap == null || idMap.isEmpty() ? null : idMap);
    }

    private List<QuestionDto> toQuestionDtos(List<AssessmentQuestion> questions, boolean withUsage) {
        if (questions.isEmpty()) return List.of();
        List<Long> ids = questions.stream().map(assessmentQuestion -> assessmentQuestion.getId()).toList();
        Map<Long, List<AssessmentQuestionOption>> options = optionRepo.findActiveByQuestionIds(ids).stream()
                .collect(Collectors.groupingBy(o -> o.getQuestion().getId()));
        Map<Long, List<AssessmentScoreRule>> bankRules = ruleRepo.findBankRules(ids).stream()
                .collect(Collectors.groupingBy(r -> r.getQuestion().getId()));
        Map<Long, Long> usage = new HashMap<>();
        if (withUsage) {
            for (Object[] row : templateQuestionRepo.countUsageByQuestion()) usage.put((Long) row[0], (Long) row[1]);
        }

        List<QuestionDto> result = new ArrayList<>();
        for (AssessmentQuestion q : questions) {
            Map<String, Object> config = readMap(q.getConfigJson());
            result.add(new QuestionDto(
                    String.valueOf(q.getId()), q.getQuestionText(), q.getDescription(), q.getInstruction(),
                    AssessmentQuestionTypes.inputType(q), q.getCategory(), q.isRequired(),
                    q.getDefaultWeight() == null ? 10 : q.getDefaultWeight().doubleValue(), q.getUnit(),
                    options.getOrDefault(q.getId(), List.of()).stream().map(o -> new OptionDto(
                            String.valueOf(o.getId()), o.getOptionLabel(), o.getOptionCode(),
                            o.getScore() == null ? null : o.getScore().doubleValue(), null)).toList(),
                    config.get("performanceConfig"), config.get("measurementConfig"), config.get("ratingConfig"),
                    bankRules.getOrDefault(q.getId(), List.of()).stream().map(AdminAssessmentTemplateService::toRuleDto).toList(),
                    usage.getOrDefault(q.getId(), 0L).intValue(), q.getOwnerTemplateId() == null, q.getVersion(),
                    q.getCreatedAt() == null ? null : q.getCreatedAt().toString(),
                    q.getUpdatedAt() == null ? null : q.getUpdatedAt().toString()));
        }
        return result;
    }

    private static ScoreRuleDto toRuleDto(AssessmentScoreRule r) {
        return new ScoreRuleDto(String.valueOf(r.getId()), String.valueOf(r.getQuestion().getId()), r.getOperator(),
                r.getMinValue() == null ? null : r.getMinValue().doubleValue(),
                r.getMaxValue() == null ? null : r.getMaxValue().doubleValue(),
                r.getExactValue(), r.getScore().doubleValue(), r.getLabel());
    }

    /** So sánh nội dung câu hỏi (bỏ qua id, thời gian, thống kê) để biết admin có sửa trong bài hay không. */
    private String contentKey(QuestionDto d) {
        Map<String, Object> m = new TreeMap<>();
        m.put("text", nz(d.text()));
        m.put("description", nz(d.description()));
        m.put("instruction", nz(d.instruction()));
        m.put("type", nz(d.type()));
        m.put("category", nz(d.category()));
        m.put("unit", nz(d.unit()));
        m.put("required", d.required() == null || d.required());
        List<String> opts = new ArrayList<>();
        for (OptionDto o : d.options() == null ? List.<OptionDto>of() : d.options()) {
            if (o == null || blank(o.label())) continue;
            opts.add(nz(o.label()) + "|" + nz(firstNonBlank(o.value(), o.label())) + "|" + (o.score() == null ? "" : fmt(o.score())));
        }
        m.put("options", opts);
        m.put("config", json.writeValueAsString(new TreeMap<>(Map.of(
                "p", d.performanceConfig() == null ? "" : d.performanceConfig(),
                "m", d.measurementConfig() == null ? "" : d.measurementConfig(),
                "r", d.ratingConfig() == null ? "" : d.ratingConfig()))));
        return json.writeValueAsString(m);
    }

    // =====================================================================================
    // HELPERS
    // =====================================================================================

    Map<Long, List<AssessmentQuestionOption>> optionsByQuestion(List<AssessmentTemplateQuestion> refs) {
        List<Long> ids = refs.stream().map(r -> r.getQuestion().getId()).toList();
        if (ids.isEmpty()) return Map.of();
        return optionRepo.findActiveByQuestionIds(ids).stream().collect(Collectors.groupingBy(o -> o.getQuestion().getId()));
    }

    /** Quy tắc của bài; câu nào bài chưa đặt quy tắc thì dùng quy tắc mặc định trong ngân hàng. */
    Map<Long, List<AssessmentScoreRule>> effectiveRules(Long templateId, List<AssessmentTemplateQuestion> refs) {
        Map<Long, List<AssessmentScoreRule>> result = ruleRepo.findByTemplateId(templateId).stream()
                .collect(Collectors.groupingBy(r -> r.getQuestion().getId(), LinkedHashMap::new, Collectors.toList()));
        List<Long> missing = refs.stream().map(r -> r.getQuestion().getId()).filter(id -> !result.containsKey(id)).toList();
        if (!missing.isEmpty()) {
            ruleRepo.findBankRules(missing).forEach(r ->
                    result.computeIfAbsent(r.getQuestion().getId(), k -> new ArrayList<>()).add(r));
        }
        return result;
    }

    private Map<Long, long[]> loadStats(List<Long> ids) {
        Map<Long, long[]> stats = new HashMap<>();
        if (ids.isEmpty()) return stats;
        for (Object[] row : sessionRepo.statsByTemplateIds(ids)) {
            long attempts = ((Number) row[1]).longValue();
            long completed = row[2] == null ? 0 : ((Number) row[2]).longValue();
            long avgX100 = row[3] == null ? 0 : Math.round(((Number) row[3]).doubleValue() * 100);
            stats.put((Long) row[0], new long[]{attempts, completed, avgX100});
        }
        return stats;
    }

    private void applyMeta(AssessmentTemplate t, AssessmentDto req) {
        t.setName(trimTo(firstNonBlank(req.name(), firstNonBlank(req.displayName(), "Bài đánh giá mới")), 255));
        t.setDisplayName(trimTo(req.displayName(), 255));
        t.setDescription(req.description());
        t.setType(trimTo(firstNonBlank(req.type(), "INITIAL"), 50));
        t.setEstimatedDuration(req.estimatedDuration() == null ? 10 : Math.max(1, req.estimatedDuration()));
        t.setTagsJson(req.tags() == null ? null : json.writeValueAsString(req.tags()));
        t.setTargetAudienceJson(req.targetAudience() == null ? null : json.writeValueAsString(req.targetAudience()));
        t.setScheduleJson(req.schedule() == null ? null : json.writeValueAsString(req.schedule()));
        ScoringConfigDto sc = req.scoringConfig();
        double max = sc == null || sc.maxTotalScore() == null || sc.maxTotalScore() <= 0 ? 100 : sc.maxTotalScore();
        t.setMaxTotalScore(decimal(max));
        t.setPassScore(sc == null || sc.passScore() == null ? null : decimal(sc.passScore()));
    }

    AssessmentOnboardingSettings settings() {
        return settingsRepo.findById(AssessmentOnboardingSettings.SINGLETON_ID).orElseGet(() -> settingsRepo.save(new AssessmentOnboardingSettings()));
    }

    private Long activeOnboardingTemplateId() {
        AssessmentTemplate t = settings().getActiveTemplate();
        return t == null ? null : t.getId();
    }

    private boolean isActiveOnboarding(AssessmentTemplate t) {
        return t.getId() != null && t.getId().equals(activeOnboardingTemplateId());
    }

    private AssessmentTemplate findTemplate(Long id) {
        return templateRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài đánh giá " + id));
    }

    private String uniqueCode(String prefix) {
        String code;
        do {
            code = prefix + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        } while (templateRepo.existsByCode(code));
        return code;
    }

    private String uniqueQuestionCode() {
        String code;
        do {
            code = "Q-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase(Locale.ROOT);
        } while (questionRepo.existsByQuestionCode(code));
        return code;
    }

    @SuppressWarnings("unchecked")
    private static Double[] range(Object config, String minKey, String maxKey) {
        if (!(config instanceof Map<?, ?> m)) return new Double[]{null, null};
        return new Double[]{AssessmentScoringEngine.toNumber(((Map<String, Object>) m).get(minKey)),
                AssessmentScoringEngine.toNumber(((Map<String, Object>) m).get(maxKey))};
    }

    private Object readObject(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return json.readValue(raw, Object.class);
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, Object> readMap(String raw) {
        if (raw == null || raw.isBlank()) return Map.of();
        try {
            return json.readValue(raw, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    private List<String> readList(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        try {
            return json.readValue(raw, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    static Long parseId(String id) {
        if (id == null || !id.matches("\\d{1,18}")) return null;
        return Long.valueOf(id);
    }

    private static BigDecimal decimal(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP);
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private static String nz(String s) {
        return s == null ? "" : s.trim();
    }

    private static String firstNonBlank(String a, String b) {
        return blank(a) ? b : a.trim();
    }

    private static String trimTo(String s, int max) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : (t.length() <= max ? t : t.substring(0, max));
    }

    private static String truncate(String s, int max) {
        return s == null ? "" : (s.length() <= max ? s : s.substring(0, max) + "…");
    }

    private static String fmt(double d) {
        return d == Math.floor(d) ? String.valueOf((long) d) : String.valueOf(d);
    }
}
