package com.calishealth.api.service.level;

import com.calishealth.api.engine.config.DefaultLevelEngineConfig;
import com.calishealth.api.engine.config.DefaultLevelEngineConfig.*;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * Khởi tạo cấu hình mặc định của Level Engine (idempotent - chỉ tạo phần còn thiếu):
 * năng lực, bài tập & Skill Tree, mục tiêu, rule set LEVEL_ENGINE v1 (ACTIVE), bộ test định kỳ,
 * bài đánh giá đầu vào v2 (PUBLISHED - admin tự chọn làm bài test đầu vào trong trang cấu hình).
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
@Order(20)
public class LevelEngineSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(LevelEngineSeeder.class);
    private static final Map<String, String> EQUIPMENT_LABEL = Map.of(
            "NONE", "No Equipment", "PULL_UP_BAR", "Pull-up Bar", "PARALLEL_BARS", "Parallel Bars",
            "LOW_BAR", "Low Bar", "RINGS", "Gymnastic Rings", "RESISTANCE_BAND", "Resistance Band");

    private final CompetencyRepository competencyRepo;
    private final ExerciseRepository exerciseRepo;
    private final ExerciseCategoryRepository categoryRepo;
    private final ExerciseAttributeRepository attributeRepo;
    private final ExerciseProgressionRepository progressionRepo;
    private final GoalRepository goalRepo;
    private final RuleSetRepository ruleSetRepo;
    private final EngineParameterRepository paramRepo;
    private final CompetencyLadderNodeRepository ladderRepo;
    private final FitnessLevelRepository levelRepo;
    private final LevelRequirementRepository requirementRepo;
    private final ConsistencyRuleRepository consistencyRepo;
    private final AssessmentTemplateRepository templateRepo;
    private final AssessmentTestItemRepository testItemRepo;
    private final AssessmentQuestionRepository questionRepo;
    private final AssessmentQuestionOptionRepository optionRepo;
    private final AssessmentTemplateQuestionRepository templateQuestionRepo;
    private final AssessmentTemplateLevelRepository templateLevelRepo;
    private final QuestionCompetencyMappingRepository mappingRepo;

    public LevelEngineSeeder(CompetencyRepository competencyRepo, ExerciseRepository exerciseRepo, ExerciseCategoryRepository categoryRepo,
                             ExerciseAttributeRepository attributeRepo, ExerciseProgressionRepository progressionRepo, GoalRepository goalRepo,
                             RuleSetRepository ruleSetRepo, EngineParameterRepository paramRepo, CompetencyLadderNodeRepository ladderRepo,
                             FitnessLevelRepository levelRepo, LevelRequirementRepository requirementRepo,
                             ConsistencyRuleRepository consistencyRepo, AssessmentTemplateRepository templateRepo,
                             AssessmentTestItemRepository testItemRepo, AssessmentQuestionRepository questionRepo,
                             AssessmentQuestionOptionRepository optionRepo, AssessmentTemplateQuestionRepository templateQuestionRepo,
                             AssessmentTemplateLevelRepository templateLevelRepo, QuestionCompetencyMappingRepository mappingRepo) {
        this.competencyRepo = competencyRepo;
        this.exerciseRepo = exerciseRepo;
        this.categoryRepo = categoryRepo;
        this.attributeRepo = attributeRepo;
        this.progressionRepo = progressionRepo;
        this.goalRepo = goalRepo;
        this.ruleSetRepo = ruleSetRepo;
        this.paramRepo = paramRepo;
        this.ladderRepo = ladderRepo;
        this.levelRepo = levelRepo;
        this.requirementRepo = requirementRepo;
        this.consistencyRepo = consistencyRepo;
        this.templateRepo = templateRepo;
        this.testItemRepo = testItemRepo;
        this.questionRepo = questionRepo;
        this.optionRepo = optionRepo;
        this.templateQuestionRepo = templateQuestionRepo;
        this.templateLevelRepo = templateLevelRepo;
        this.mappingRepo = mappingRepo;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedCompetencies();
        Map<String, Exercise> ex = seedExercises();
        seedProgressions(ex);
        seedGoals(ex);
        seedRuleSet(ex);
        seedPeriodicTemplate(ex);
        seedInitialTemplate(ex);
    }

    // ============================== Năng lực ==============================

    private void seedCompetencies() {
        for (CompetencySeed s : DefaultLevelEngineConfig.COMPETENCIES) {
            if (competencyRepo.existsById(s.code())) continue;
            Competency c = new Competency();
            c.setCode(s.code());
            c.setName(s.name());
            c.setDescription(s.description());
            c.setPrimaryCompetency(s.primary());
            c.setAggregation(s.aggregation());
            c.setDisplayOrder(s.order());
            competencyRepo.save(c);
        }
    }

    // ============================== Bài tập ==============================

    private Map<String, Exercise> seedExercises() {
        Map<String, Exercise> byCode = new HashMap<>();
        exerciseRepo.findAll().forEach(e -> byCode.put(e.getCode(), e));
        int created = 0;
        for (ExerciseSeed s : DefaultLevelEngineConfig.EXERCISES) {
            if (byCode.containsKey(s.code())) continue;
            ExerciseCategory cat = categoryRepo.findByCode(s.category())
                    .orElseGet(() -> categoryRepo.findByCode("SKILL").orElseThrow());
            Exercise e = new Exercise();
            e.setCategory(cat);
            e.setCode(s.code());
            e.setName(s.name());
            e.setDisplayName(s.name());
            e.setDescription(s.description());
            e.setDifficultyLevel(s.difficulty());
            e.setMovementPattern(s.pattern());
            e.setEquipmentRequired(!"NONE".equals(s.equipment()));
            e.setActive(true);
            e = exerciseRepo.save(e);
            addEquipment(e, s.equipment());
            byCode.put(s.code(), e);
            created++;
        }
        // Bài có sẵn chưa khai báo dụng cụ -> bổ sung để lọc theo dụng cụ của học viên
        Set<Long> withEquipment = new HashSet<>();
        attributeRepo.findByExerciseIdInOrderBySortOrderAsc(byCode.values().stream().map(exercise -> exercise.getId()).toList()).stream()
                .filter(a -> "EQUIPMENT".equals(a.getAttributeType())).forEach(a -> withEquipment.add(a.getExercise().getId()));
        DefaultLevelEngineConfig.EXISTING_EQUIPMENT.forEach((code, eq) -> {
            Exercise e = byCode.get(code);
            if (e != null && !withEquipment.contains(e.getId())) addEquipment(e, eq);
        });
        if (created > 0) log.info("Level Engine: created {} progression exercises.", created);
        return byCode;
    }

    private void addEquipment(Exercise e, String equipment) {
        int i = 100;
        for (String code : equipment.split("\\|")) {
            ExerciseAttribute a = new ExerciseAttribute();
            a.setExercise(e);
            a.setAttributeType("EQUIPMENT");
            a.setSortOrder(i++);
            a.setAttributeValue(EQUIPMENT_LABEL.getOrDefault(code, code));
            attributeRepo.save(a);
        }
    }

    private void seedProgressions(Map<String, Exercise> ex) {
        int created = 0;
        for (ProgressionSeed p : DefaultLevelEngineConfig.PROGRESSIONS) {
            Exercise pre = ex.get(p.prerequisite()), target = ex.get(p.exercise());
            if (pre == null || target == null) continue;
            if (progressionRepo.existsByExerciseIdAndPrerequisiteExerciseIdAndProgressionType(target.getId(), pre.getId(), ProgressionType.NEXT)) continue;
            ExerciseProgression e = new ExerciseProgression();
            e.setExercise(target);
            e.setPrerequisiteExercise(pre);
            e.setProgressionType(ProgressionType.NEXT);
            e.setMinReps(p.minReps());
            e.setMinHoldSec(p.minHoldSec());
            e.setMinFormScore(p.minForm() == null ? null : BigDecimal.valueOf(p.minForm()));
            e.setMinQualifyingSessions(2);
            e.setMandatory(p.mandatory());
            e.setWeight(BigDecimal.valueOf(p.weight()));
            e.setSourceType(DefaultLevelEngineConfig.COACHING);
            progressionRepo.save(e);
            created++;
        }
        for (String[] a : DefaultLevelEngineConfig.ALTERNATIVES) {
            Exercise base = ex.get(a[0]), alt = ex.get(a[1]);
            if (base == null || alt == null) continue;
            if (progressionRepo.existsByExerciseIdAndPrerequisiteExerciseIdAndProgressionType(base.getId(), alt.getId(), ProgressionType.ALTERNATIVE)) continue;
            ExerciseProgression e = new ExerciseProgression();
            e.setExercise(base);
            e.setPrerequisiteExercise(alt);
            e.setProgressionType(ProgressionType.ALTERNATIVE);
            e.setSourceType(DefaultLevelEngineConfig.COACHING);
            progressionRepo.save(e);
            created++;
        }
        if (created > 0) log.info("Level Engine: created {} skill-tree edges.", created);
    }

    private void seedGoals(Map<String, Exercise> ex) {
        for (GoalSeed s : DefaultLevelEngineConfig.GOALS) {
            Goal g = goalRepo.findByCode(s.code()).orElse(null);
            if (g == null) {
                if (s.targetExerciseCode() == null) continue;  // chỉ tạo mới các mục tiêu kỹ năng; mục tiêu chung do admin quản lý
                g = new Goal();
                g.setCode(s.code());
                g.setName(s.name());
                g.setCategory(s.category());
                g.setDescription(s.description());
            }
            if (g.getEmphasisJson() == null) g.setEmphasisJson(s.emphasisJson());
            if (g.getTargetExercise() == null && s.targetExerciseCode() != null) g.setTargetExercise(ex.get(s.targetExerciseCode()));
            goalRepo.save(g);
        }
    }

    // ============================== Rule set v1 ==============================

    private void seedRuleSet(Map<String, Exercise> ex) {
        if (ruleSetRepo.findTopByCodeOrderByVersionDesc(DefaultLevelEngineConfig.RULE_SET_CODE).isPresent()) return;
        RuleSet rs = new RuleSet();
        rs.setCode(DefaultLevelEngineConfig.RULE_SET_CODE);
        rs.setVersion(1);
        rs.setStatus(RuleSet.ACTIVE);
        rs.setActivatedAt(Instant.now());
        rs.setCreatedBy("system");
        rs.setNotes("Cấu hình mặc định theo LEVEL_ASSESSMENT_ROADMAP_DESIGN.md. Ngưỡng là PRODUCT_RULE/COACHING_BENCHMARK - cần coach duyệt.");
        rs = ruleSetRepo.save(rs);
        Long id = rs.getId();

        for (Param p : DefaultLevelEngineConfig.PARAMS) {
            EngineParameter e = new EngineParameter();
            e.setRuleSetId(id);
            e.setParamKey(p.key());
            e.setParamValue(BigDecimal.valueOf(p.value()));
            e.setSourceType(p.sourceType());
            e.setSourceReference(p.reference());
            paramRepo.save(e);
        }
        for (LadderSeed l : DefaultLevelEngineConfig.LADDERS) {
            Exercise e = ex.get(l.exerciseCode());
            if (e == null) continue;
            CompetencyLadderNode n = new CompetencyLadderNode();
            n.setRuleSetId(id);
            n.setCompetencyCode(l.competency());
            n.setExercise(e);
            n.setNodeOrder(l.order());
            n.setMetric(l.metric());
            n.setBaseScore(BigDecimal.valueOf(l.base()));
            n.setSpanScore(BigDecimal.valueOf(l.span()));
            n.setTargetValue(BigDecimal.valueOf(l.target()));
            n.setEntryValue(BigDecimal.valueOf(l.entry()));
            n.setSourceType(DefaultLevelEngineConfig.COACHING);
            ladderRepo.save(n);
        }
        Map<String, FitnessLevel> levels = new HashMap<>();
        for (LevelSeed s : DefaultLevelEngineConfig.LEVELS) {
            FitnessLevel l = new FitnessLevel();
            l.setRuleSetId(id);
            l.setCode(s.code());
            l.setRankNo(s.rank());
            l.setName(s.name());
            l.setOverallPromoteMin(BigDecimal.valueOf(s.promoteMin()));
            l.setOverallRegressBelow(BigDecimal.valueOf(s.regressBelow()));
            l.setColorScheme(s.color());
            l.setDescription(s.description());
            levels.put(s.code(), levelRepo.save(l));
        }
        for (RequirementSeed r : DefaultLevelEngineConfig.REQUIREMENTS) {
            LevelRequirement q = new LevelRequirement();
            q.setLevel(levels.get(r.level()));
            q.setGate(r.gate());
            q.setCompetencyCode(r.competency());
            q.setExercise(r.exerciseCode() == null ? null : ex.get(r.exerciseCode()));
            q.setMetric(r.metric());
            q.setOperator(r.op());
            q.setValue(BigDecimal.valueOf(r.value()));
            q.setSourceType(r.sourceType());
            requirementRepo.save(q);
        }
        for (ConsistencySeed c : DefaultLevelEngineConfig.CONSISTENCY) {
            ConsistencyRule r = new ConsistencyRule();
            r.setRuleSetId(id);
            r.setCode(c.code());
            r.setConditionJson(c.conditionJson());
            r.setSeverity(c.severity());
            r.setAffectedCompetencies("[\"" + String.join("\",\"", c.affected()) + "\"]");
            r.setMessage(c.message());
            consistencyRepo.save(r);
        }
        log.info("Level Engine: rule set {} v1 created and activated.", DefaultLevelEngineConfig.RULE_SET_CODE);
    }

    // ============================== Bộ test định kỳ ==============================

    private void seedPeriodicTemplate(Map<String, Exercise> ex) {
        if (templateRepo.existsByCode(DefaultLevelEngineConfig.PERIODIC_TEMPLATE_CODE)) return;
        AssessmentTemplate t = new AssessmentTemplate();
        t.setCode(DefaultLevelEngineConfig.PERIODIC_TEMPLATE_CODE);
        t.setName("Đánh giá định kỳ thực hành (MediaPipe)");
        t.setDisplayName("Bài đánh giá định kỳ");
        t.setDescription("Bộ test thích ứng theo level: kiểm tra nấc hiện tại và nấc kế tiếp của từng năng lực. "
                + "Thứ tự theo khuyến nghị NSCA: kỹ năng → sức mạnh tối đa → sức bền → linh hoạt; nghỉ 2–3 phút giữa các bài.");
        t.setType("PERIODIC");
        t.setStatus(AssessmentTemplate.PUBLISHED);
        t.setEstimatedDuration(25);
        t.setPublishedAt(Instant.now());
        t = templateRepo.save(t);
        for (TestItemSeed s : DefaultLevelEngineConfig.TEST_ITEMS) {
            Exercise e = ex.get(s.exerciseCode());
            if (e == null) continue;
            AssessmentTestItem i = new AssessmentTestItem();
            i.setTemplate(t);
            i.setExercise(e);
            i.setCompetencyCode(s.competency());
            i.setMetric(s.metric());
            i.setLevelMin(s.levelMin());
            i.setLevelMax(s.levelMax());
            i.setMandatory(s.mandatory());
            i.setInBaseline(s.mandatory());
            i.setSortOrder(s.order());
            i.setProtocolJson("{\"restSec\":150,\"capRatio\":1.5" + (s.instruction() == null ? "" : ",\"instruction\":\"" + s.instruction() + "\"") + "}");
            testItemRepo.save(i);
        }
        log.info("Level Engine: periodic assessment battery created.");
    }

    // ============================== Bài đánh giá đầu vào v2 ==============================

    private record Opt(String code, String label, Double score, Double numeric) {}

    private void seedInitialTemplate(Map<String, Exercise> ex) {
        if (templateRepo.existsByCode(DefaultLevelEngineConfig.INITIAL_TEMPLATE_CODE)) return;
        AssessmentTemplate t = new AssessmentTemplate();
        t.setCode(DefaultLevelEngineConfig.INITIAL_TEMPLATE_CODE);
        t.setName("Đánh giá thể lực đầu vào (Level Engine)");
        t.setDisplayName("Khảo sát thể lực đầu vào");
        t.setDescription("Dữ liệu TỰ KHAI BÁO dùng để xếp level TẠM THỜI theo 6 năng lực; level sẽ được xác nhận bằng bài đánh giá thực hành.");
        t.setType("INITIAL");
        t.setStatus(AssessmentTemplate.PUBLISHED);
        t.setEstimatedDuration(8);
        t.setPublishedAt(Instant.now());
        t = templateRepo.save(t);

        int[] order = {0};
        AssessmentTemplate tt = t;
        String sScreen = "An toàn trước khi tập", sBg = "Nền tảng tập luyện", sPerf = "Bạn làm được gì?",
                sMob = "Linh hoạt", sGoal = "Mục tiêu & lịch tập";

        // A. Sàng lọc (kiểu PAR-Q+, không chẩn đoán)
        q(tt, order, sScreen, "CH_SCREENING", "MULTIPLE_CHOICE", "RECOVERY",
                "Bạn có đang gặp tình trạng nào dưới đây không?",
                "Câu hỏi sàng lọc an toàn (không phải chẩn đoán). Nếu có, hãy hỏi ý kiến bác sĩ trước khi tập cường độ cao.",
                List.of(new Opt("NONE", "Không có tình trạng nào", null, null),
                        new Opt("CHEST_PAIN", "Đau ngực khi vận động", null, null),
                        new Opt("DIZZINESS", "Chóng mặt / mất thăng bằng khi gắng sức", null, null),
                        new Opt("HEART_CONDITION", "Bệnh tim mạch hoặc huyết áp đã được chẩn đoán", null, null),
                        new Opt("BONE_JOINT", "Chấn thương xương khớp đang điều trị", null, null),
                        new Opt("OTHER_MEDICAL", "Bác sĩ từng khuyên hạn chế vận động", null, null)),
                true, 0, "SCREENING", null, null, null);
        q(tt, order, sScreen, "CH_LIMITATIONS", "MULTIPLE_CHOICE", "RECOVERY",
                "Vùng nào của bạn đang đau hoặc từng chấn thương?", null,
                List.of(new Opt("NONE", "Không có", null, null), new Opt("SHOULDER", "Vai", null, null),
                        new Opt("ELBOW", "Khuỷu tay", null, null), new Opt("WRIST", "Cổ tay", null, null),
                        new Opt("LOWER_BACK", "Lưng dưới", null, null), new Opt("KNEE", "Đầu gối", null, null),
                        new Opt("ANKLE", "Cổ chân", null, null)),
                true, 0, "LIMITATIONS", null, null, null);
        // C. Nền tảng (không chấm điểm - dùng cho luật nhất quán & tốc độ tăng tải)
        q(tt, order, sBg, "CH_EXPERIENCE", "SINGLE_CHOICE", "TRAINING_CONSISTENCY",
                "Bạn đã tập calisthenics / bodyweight bao lâu?", null,
                List.of(new Opt("NONE", "Chưa từng tập", null, null), new Opt("LT_6M", "Dưới 6 tháng", null, null),
                        new Opt("6_24M", "6 – 24 tháng", null, null), new Opt("GT_24M", "Trên 2 năm", null, null)),
                true, 0, "EXPERIENCE_MONTHS", null, null, null);
        // D. Hiệu năng tự khai theo thang tiến trình
        ladderPair(tt, order, sPerf, ex, "PULL", "UPPER_BODY_STRENGTH", "Bài KÉO khó nhất bạn làm được đúng kỹ thuật?");
        ladderPair(tt, order, sPerf, ex, "PUSH", "UPPER_BODY_STRENGTH", "Bài ĐẨY khó nhất bạn làm được đúng kỹ thuật?");
        ladderPair(tt, order, sPerf, ex, "LEGS", "LOWER_BODY_STRENGTH", "Bài CHÂN khó nhất bạn làm được đúng kỹ thuật?");
        ladderPair(tt, order, sPerf, ex, "CORE", "CORE_STABILITY", "Bài CORE khó nhất bạn làm được đúng kỹ thuật?");
        ladderPair(tt, order, sPerf, ex, "SKILL", "CALISTHENICS_SKILL", "Kỹ năng THĂNG BẰNG khó nhất bạn giữ được?");
        // E. Linh hoạt tự kiểm tra (chấm điểm -> MOBILITY)
        q(tt, order, sMob, "CH_MOB_TOE_TOUCH", "SINGLE_CHOICE", "HIP_MOBILITY",
                "Đứng thẳng gối, cúi người: tay bạn chạm tới đâu?", null,
                List.of(new Opt("PALMS", "Lòng bàn tay chạm sàn", 100.0, null), new Opt("FINGERS", "Đầu ngón tay chạm sàn / mũi chân", 75.0, null),
                        new Opt("SHIN", "Tới ống chân", 45.0, null), new Opt("KNEE", "Chỉ tới gối", 15.0, null)),
                true, 10, null, "MOBILITY", null, null);
        q(tt, order, sMob, "CH_MOB_DEEP_SQUAT", "SINGLE_CHOICE", "ANKLE_MOBILITY",
                "Ngồi xổm sâu hết mức: gót chân thế nào?", null,
                List.of(new Opt("FLAT", "Ngồi sâu, gót chạm sàn, lưng thẳng", 100.0, null),
                        new Opt("HEELS_UP", "Ngồi sâu được nhưng gót nhấc lên", 55.0, null),
                        new Opt("CANNOT", "Không ngồi sâu được", 15.0, null)),
                true, 10, null, "MOBILITY", null, null);
        q(tt, order, sMob, "CH_MOB_OVERHEAD", "SINGLE_CHOICE", "SHOULDER_MOBILITY",
                "Đứng áp lưng vào tường, giơ thẳng hai tay qua đầu: tay có chạm tường không?", null,
                List.of(new Opt("FULL", "Chạm tường, lưng không cong", 100.0, null),
                        new Opt("PARTIAL", "Gần chạm / phải cong lưng", 55.0, null),
                        new Opt("LIMITED", "Còn cách xa tường", 20.0, null)),
                true, 10, null, "MOBILITY", null, null);
        // F. Mục tiêu & ràng buộc
        List<Opt> goals = new ArrayList<>();
        for (GoalSeed g : DefaultLevelEngineConfig.GOALS) {
            if (goalRepo.findByCode(g.code()).isPresent()) goals.add(new Opt(g.code(), g.name(), null, null));
        }
        q(tt, order, sGoal, "CH_PRIMARY_GOAL", "SINGLE_CHOICE", "TRAINING_CONSISTENCY", "Mục tiêu chính của bạn là gì?", null,
                goals, true, 0, "PRIMARY_GOAL", null, null, null);
        q(tt, order, sGoal, "CH_DAYS_PER_WEEK", "SINGLE_CHOICE", "TRAINING_CONSISTENCY", "Bạn có thể tập mấy buổi mỗi tuần?", null,
                List.of(new Opt("D2", "2 buổi", null, 2.0), new Opt("D3", "3 buổi", null, 3.0), new Opt("D4", "4 buổi", null, 4.0),
                        new Opt("D5", "5 buổi", null, 5.0), new Opt("D6", "6 buổi", null, 6.0)),
                true, 0, "DAYS_PER_WEEK", null, null, null);
        q(tt, order, sGoal, "CH_SESSION_MINUTES", "SINGLE_CHOICE", "TRAINING_CONSISTENCY", "Mỗi buổi bạn có bao nhiêu phút?", null,
                List.of(new Opt("M20", "20 phút", null, 20.0), new Opt("M30", "30 phút", null, 30.0), new Opt("M45", "45 phút", null, 45.0),
                        new Opt("M60", "60 phút", null, 60.0), new Opt("M75", "75 phút", null, 75.0), new Opt("M90", "90 phút", null, 90.0)),
                true, 0, "SESSION_MINUTES", null, null, null);
        q(tt, order, sGoal, "CH_EQUIPMENT", "MULTIPLE_CHOICE", "TRAINING_CONSISTENCY", "Bạn có dụng cụ nào?", null,
                List.of(new Opt("NONE", "Không có dụng cụ", null, null), new Opt("PULL_UP_BAR", "Xà đơn", null, null),
                        new Opt("PARALLEL_BARS", "Xà kép / 2 ghế chắc", null, null), new Opt("LOW_BAR", "Xà thấp / bàn chắc để kéo", null, null),
                        new Opt("RINGS", "Vòng treo", null, null), new Opt("RESISTANCE_BAND", "Dây kháng lực", null, null)),
                true, 0, "EQUIPMENT", null, null, null);

        // Khoảng điểm hiển thị (bắt buộc để bài hợp lệ); level thật do Level Engine quyết định
        double[][] bands = {{0, 24.99}, {25, 49.99}, {50, 71.99}, {72, 87.99}, {88, 100}};
        for (int i = 0; i < DefaultLevelEngineConfig.LEVELS.size(); i++) {
            LevelSeed s = DefaultLevelEngineConfig.LEVELS.get(i);
            AssessmentTemplateLevel l = new AssessmentTemplateLevel();
            l.setTemplate(tt);
            l.setCode(s.code());
            l.setName(s.name());
            l.setMinScore(BigDecimal.valueOf(bands[i][0]));
            l.setMaxScore(BigDecimal.valueOf(bands[i][1]));
            l.setDescription(s.description());
            l.setColorScheme(s.color());
            l.setBadgeLabel(s.code());
            l.setSortOrder(i);
            templateLevelRepo.save(l);
        }
        log.info("Level Engine: initial questionnaire {} created (PUBLISHED - chọn làm bài test đầu vào trong Admin).",
                DefaultLevelEngineConfig.INITIAL_TEMPLATE_CODE);
    }

    private void ladderPair(AssessmentTemplate t, int[] order, String section, Map<String, Exercise> ex, String competency,
                            String category, String text) {
        List<Opt> nodes = new ArrayList<>();
        nodes.add(new Opt("NONE", "Chưa làm được bài nào dưới đây", null, null));
        for (LadderSeed l : DefaultLevelEngineConfig.LADDERS) {
            if (!l.competency().equals(competency) || !ex.containsKey(l.exerciseCode())) continue;
            Exercise e = ex.get(l.exerciseCode());
            String unit = "HOLD_SEC".equals(l.metric()) ? " (giây)" : " (số lần)";
            nodes.add(new Opt(e.getCode(), (e.getDisplayName() != null ? e.getDisplayName() : e.getName()) + unit, null, null));
        }
        q(t, order, section, "CH_" + competency + "_NODE", "SINGLE_CHOICE", category, text,
                "Chọn bài khó nhất bạn làm được ít nhất 1 lần đúng kỹ thuật (hoặc giữ được vài giây).",
                nodes, true, 0, null, competency, QuestionCompetencyMapping.LADDER_NODE, null);
        q(t, order, section, "CH_" + competency + "_VALUE", "NUMERIC_INPUT", category,
                "Với bài vừa chọn, bạn làm được tối đa bao nhiêu lần (hoặc giữ bao nhiêu giây) liên tục?",
                "Chỉ tính lần đúng kỹ thuật. Chọn \"chưa làm được\" ở câu trên thì nhập 0.",
                List.of(), false, 0, null, competency, QuestionCompetencyMapping.LADDER_VALUE, new double[]{0, 600});
    }

    private void q(AssessmentTemplate t, int[] order, String section, String code, String type, String category, String text,
                   String description, List<Opt> options, boolean required, double weight, String semanticKey,
                   String competency, String mappingType, double[] range) {
        AssessmentQuestion q = questionRepo.findByQuestionCode(code).orElse(null);
        if (q == null) {
            q = new AssessmentQuestion();
            q.setQuestionCode(code);
            q.setQuestionText(text);
            q.setDescription(description);
            q.setInputType(type);
            q.setQuestionType(com.calishealth.api.service.assessment.AssessmentQuestionTypes.storageType(type));
            q.setCategory(category);
            q.setRequired(required);
            q.setDefaultWeight(BigDecimal.valueOf(weight));
            q.setSemanticKey(semanticKey);
            if (range != null) { q.setMinValue(BigDecimal.valueOf(range[0])); q.setMaxValue(BigDecimal.valueOf(range[1])); }
            q = questionRepo.save(q);
            int i = 0;
            for (Opt o : options) {
                AssessmentQuestionOption op = new AssessmentQuestionOption();
                op.setQuestion(q);
                op.setOptionCode(o.code());
                op.setOptionLabel(o.label());
                op.setScore(o.score() == null ? null : BigDecimal.valueOf(o.score()));
                op.setNumericValue(o.numeric() == null ? null : BigDecimal.valueOf(o.numeric()));
                op.setSortOrder(i++);
                optionRepo.save(op);
            }
            if (competency != null) {
                QuestionCompetencyMapping m = new QuestionCompetencyMapping();
                m.setQuestion(q);
                m.setCompetencyCode(competency);
                m.setMappingType(mappingType == null ? QuestionCompetencyMapping.SCORE : mappingType);
                mappingRepo.save(m);
            }
        }
        AssessmentTemplateQuestion ref = new AssessmentTemplateQuestion();
        ref.setTemplate(t);
        ref.setQuestion(q);
        ref.setSortOrder(order[0]++);
        ref.setWeight(BigDecimal.valueOf(weight));
        ref.setRequired(required);
        ref.setSectionTitle(section);
        templateQuestionRepo.save(ref);
    }
}
