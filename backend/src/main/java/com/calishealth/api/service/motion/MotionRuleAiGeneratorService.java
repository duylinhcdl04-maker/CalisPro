package com.calishealth.api.service.motion;

import com.calishealth.api.dto.ExerciseDtos.CoachingCueDto;
import com.calishealth.api.dto.ExerciseDtos.CommonMistakeDto;
import com.calishealth.api.dto.ExerciseDtos.ExerciseDetailsDto;
import com.calishealth.api.dto.MotionDtos.*;
import com.calishealth.api.entity.Exercise;
import com.calishealth.api.repository.ExerciseRepository;
import com.calishealth.api.service.ExerciseDetailsService;
import com.calishealth.api.service.ai.GeminiClient;
import com.calishealth.api.service.motion.MotionRuleDuplicates.Shape;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * AI (Gemini) soạn rule chấm form cho MỘT động tác. AI chỉ ĐỀ XUẤT; mọi rule đi qua cùng cổng kiểm tra như Coach tự soạn:
 *  1. Bộ kiểm tra của engine (MotionRuleValidator): chỉ số, đơn vị, toán tử, điểm khớp 0-32, pha của bài, vùng chuẩn, thang mức độ, feedback code.
 *  2. Kiểm tra trùng trong cùng động tác (MotionRuleDuplicates), cả với rule đã có lẫn các rule AI vừa đề xuất trong cùng lượt.
 * Rule hợp lệ và không trùng được lưu thành bản NHÁP (nguồn AI_SUGGESTED). AI không bao giờ gửi duyệt hay xuất bản, và không được bật "dừng bài tập":
 * Coach phải xem, chạy Rule Tester rồi tự gửi duyệt; Admin xuất bản.
 * Prompt chung nằm ở prompts/motion-rule-generation.txt.
 */
@Service
public class MotionRuleAiGeneratorService {
    private static final Logger log = LoggerFactory.getLogger(MotionRuleAiGeneratorService.class);
    static final String PROMPT_VERSION = "1";
    static final int DEFAULT_COUNT = 5, MAX_COUNT = 8;
    private static final String SOURCE_TYPE = "AI_SUGGESTED";

    private final MotionConfigService config;
    private final MotionFeedbackService feedback;
    private final GeminiClient gemini;
    private final ExerciseRepository exercises;
    private final ExerciseDetailsService details;
    private final String template;

    public MotionRuleAiGeneratorService(MotionConfigService config, MotionFeedbackService feedback, GeminiClient gemini,
                                        ExerciseRepository exercises, ExerciseDetailsService details) {
        this.config = config; this.feedback = feedback; this.gemini = gemini; this.exercises = exercises; this.details = details;
        try (var in = new ClassPathResource("prompts/motion-rule-generation.txt").getInputStream()) {
            this.template = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Không đọc được prompts/motion-rule-generation.txt", e);
        }
    }

    // ------------------------------------------------------------------ xem prompt

    public PromptPreviewDto preview(Long profileId, GenerateRulesRequest req) {
        return new PromptPreviewDto(PROMPT_VERSION, buildPrompt(profileId, clamp(req == null ? null : req.count()), req == null ? null : req.focus(), liveRules(profileId)));
    }

    // ------------------------------------------------------------------ sinh rule

    public GenerateRulesResponse generate(Long profileId, GenerateRulesRequest req, String actor) {
        ProfileDto profile = config.profile(profileId);
        if (profile.cameraView() == null || profile.repMetric() == null)
            throw new IllegalStateException("PROFILE_NOT_CONFIGURED: hãy cấu hình profile của bài (góc camera, chỉ số đếm rep, ngưỡng đỉnh/đáy) trước khi nhờ AI soạn rule.");
        if (!gemini.isConfigured())
            return new GenerateRulesResponse(false, "AI chưa sẵn sàng: máy chủ chưa cấu hình GEMINI_API_KEY.", 0, 0, 0, List.of());

        int count = clamp(req == null ? null : req.count());
        List<RuleDto> existing = liveRules(profileId);
        String prompt = buildPrompt(profileId, count, req == null ? null : req.focus(), existing);
        Optional<String> raw = gemini.generateJson(prompt, 0.2, 8192);
        if (raw.isEmpty())
            return new GenerateRulesResponse(false, "AI đang quá tải hoặc không phản hồi. Bạn thử lại sau ít phút.", 0, 0, 0, List.of());

        JsonNode rulesNode;
        try {
            JsonNode root = gemini.objectMapper().readTree(raw.get());
            rulesNode = root.isArray() ? root : root.path("rules");
        } catch (Exception e) {
            log.warn("AI trả về JSON không đọc được: {}", e.getMessage());
            return new GenerateRulesResponse(true, "AI trả về dữ liệu không đúng định dạng. Bạn thử lại.", 0, 0, 0, List.of());
        }
        if (!rulesNode.isArray() || rulesNode.size() == 0)
            return new GenerateRulesResponse(true, "AI không tìm thấy rule mới nào khác với các rule đã có.", 0, 0, 0, List.of());

        List<Shape> known = new ArrayList<>(existing.stream().map(MotionRuleDuplicates::of).toList());
        Set<String> phases = new HashSet<>();
        profile.phases().forEach(p -> phases.add(p.code()));
        List<GeneratedRuleOutcome> outcomes = new ArrayList<>();
        int created = 0, dup = 0, invalid = 0, seen = 0;

        for (JsonNode n : rulesNode) {
            if (seen++ >= count) break;                                    // không nhận quá số lượng đã yêu cầu
            Candidate c = Candidate.parse(n, profile);
            if (c.req == null) { invalid++; outcomes.add(outcome("INVALID", c, null, List.of("Rule AI trả về thiếu thông tin cơ bản."), null)); continue; }

            Optional<String> conflict = MotionRuleDuplicates.firstConflict(MotionRuleDuplicates.of(c.req), known);
            if (conflict.isPresent()) { dup++; outcomes.add(outcome("DUPLICATE", c, conflict.get(), List.of(), null)); continue; }

            Set<String> pending = c.feedbackText != null ? Set.of(c.req.feedbackCode()) : Set.of();
            List<String> errors = config.validateCandidate(profileId, c.req, pending);
            if (!errors.isEmpty()) { invalid++; outcomes.add(outcome("INVALID", c, null, errors, null)); continue; }

            try {
                if (c.feedbackText != null && !feedback.exists(c.req.feedbackCode()))
                    feedback.upsert(profileId, null, new FeedbackTemplateRequest(c.req.feedbackCode(), "vi", c.feedbackText[0], c.feedbackText[1], true), actor);
                RuleDto saved = config.createRule(profileId, c.req, actor);
                known.add(MotionRuleDuplicates.of(saved));
                created++;
                outcomes.add(outcome("CREATED", c, null, List.of(), saved.id()));
            } catch (RuntimeException e) {
                invalid++;
                outcomes.add(outcome("INVALID", c, null, List.of(e.getMessage() == null ? "Không lưu được rule." : e.getMessage()), null));
            }
        }
        config.recordAiGeneration(profileId, actor, "AI đề xuất " + outcomes.size() + " rule: lưu " + created + " bản nháp, trùng " + dup + ", không hợp lệ " + invalid + " (prompt v" + PROMPT_VERSION + ").");
        String msg = created > 0
                ? "Đã lưu " + created + " rule ở trạng thái nháp. Hãy xem, chạy Rule Tester rồi tự gửi duyệt."
                : "Không có rule mới nào được lưu.";
        return new GenerateRulesResponse(true, msg, created, dup, invalid, outcomes);
    }

    // ------------------------------------------------------------------ dựng prompt

    private static int clamp(Integer count) {
        return count == null ? DEFAULT_COUNT : Math.max(1, Math.min(MAX_COUNT, count));
    }

    /** Rule còn hiệu lực trong bài: bản mới nhất của mỗi mã, bỏ rule đã lưu trữ. */
    private List<RuleDto> liveRules(Long profileId) {
        return config.listRules(profileId).stream().filter(r -> !"ARCHIVED".equals(r.status())).toList();
    }

    String buildPrompt(Long profileId, int count, String focus, List<RuleDto> existing) {
        ProfileDto p = config.profile(profileId);
        CatalogDto catalog = config.catalog();
        Exercise ex = exercises.findById(p.exerciseId()).orElse(null);
        ExerciseDetailsDto d = ex == null ? null : details.loadDetails(List.of(ex)).get(ex.getId());

        Map<String, String> landmarkName = new LinkedHashMap<>();
        catalog.landmarks().forEach(l -> landmarkName.put(String.valueOf(l.index()), l.code() + " (" + l.name() + ")"));

        StringBuilder phases = new StringBuilder();
        p.phases().forEach(ph -> phases.append("  - ").append(ph.code()).append(": ").append(nz(ph.name(), "")).append(ph.description() == null ? "" : " — " + ph.description()).append('\n'));
        phases.append("  - ALL: mọi pha\n");

        StringBuilder mistakes = new StringBuilder();
        if (d != null && d.commonMistakes() != null) for (CommonMistakeDto m : d.commonMistakes())
            mistakes.append("  - ").append(nz(m.name(), "")).append(m.problem() == null || m.problem().isBlank() ? "" : ": " + m.problem()).append('\n');
        StringBuilder cues = new StringBuilder();
        if (d != null && d.coachingCues() != null) for (CoachingCueDto c : d.coachingCues()) cues.append("  - ").append(nz(c.text(), "")).append('\n');

        StringBuilder metrics = new StringBuilder();
        catalog.metricTypes().forEach(m -> metrics.append("- ").append(m.type()).append(" (").append("REP".equals(m.timing()) ? "xét cuối mỗi rep" : "xét theo từng khung")
                .append("): toán tử ").append(String.join(", ", m.operators())).append("; đơn vị ").append(String.join(", ", m.units())).append(".\n"));

        StringBuilder lms = new StringBuilder();
        catalog.landmarks().forEach(l -> lms.append(l.index()).append("=").append(l.code()).append(" (").append(l.name()).append("); "));

        StringBuilder rules = new StringBuilder();
        if (existing.isEmpty()) rules.append("  (chưa có rule nào)\n");
        for (RuleDto r : existing) {
            rules.append("  - ").append(r.code()).append(" | ").append(r.name()).append(" | ").append(r.metricType()).append(" ").append(pointsText(r.measurement()))
                    .append(" | pha ").append(r.phase()).append(" | ").append(r.operator()).append(" ").append(rangeText(r)).append('\n');
        }

        StringBuilder codes = new StringBuilder();
        List<FeedbackTemplateDto> templates = feedback.list(profileId);
        if (templates.isEmpty()) codes.append("  (chưa có mã nào)\n");
        for (FeedbackTemplateDto t : templates) codes.append("  - ").append(t.feedbackCode()).append(": ").append(t.uiText()).append('\n');

        Map<String, String> v = new LinkedHashMap<>();
        v.put("EXERCISE_NAME", nz(p.exerciseName(), "?"));
        v.put("EXERCISE_DESCRIPTION", ex == null || ex.getDescription() == null ? "(chưa có mô tả)" : cut(ex.getDescription(), 600));
        v.put("MOVEMENT_TYPE", nz(p.movementType(), "REPS"));
        v.put("CAMERA_VIEW", nz(p.cameraView(), "ANY"));
        v.put("REP_METRIC", p.repMetric() == null || p.repMetric().points() == null ? "(chưa cấu hình)" : pointsText(p.repMetric(), landmarkName));
        v.put("REP_TOP", p.repTopThreshold() == null ? "?" : String.valueOf(p.repTopThreshold()));
        v.put("REP_BOTTOM", p.repBottomThreshold() == null ? "?" : String.valueOf(p.repBottomThreshold()));
        v.put("REP_DIRECTION", nz(p.repDirection(), "DESCENDING_FIRST"));
        v.put("PHASES", phases.toString().stripTrailing());
        v.put("COMMON_MISTAKES", mistakes.length() == 0 ? "  (Coach chưa ghi lỗi nào; hãy tự đề xuất các lỗi phổ biến của bài này)" : mistakes.toString().stripTrailing());
        v.put("COACHING_CUES", cues.length() == 0 ? "  (chưa có)" : cues.toString().stripTrailing());
        v.put("COUNT", String.valueOf(count));
        v.put("FOCUS", focus == null || focus.isBlank() ? "không có, hãy chọn các lỗi quan trọng nhất về an toàn và hiệu quả" : cut(focus.trim(), 300));
        v.put("EXISTING_RULES", rules.toString().stripTrailing());
        v.put("METRIC_CATALOG", metrics.toString().stripTrailing());
        v.put("LANDMARKS", lms.toString().stripTrailing());
        v.put("FEEDBACK_CODES", codes.toString().stripTrailing());

        String out = template;
        for (var e : v.entrySet()) out = out.replace("{{" + e.getKey() + "}}", e.getValue());
        return out;
    }

    private static String pointsText(MeasurementDto m) { return pointsText(m, null); }

    private static String pointsText(MeasurementDto m, Map<String, String> names) {
        if (m == null) return "";
        StringBuilder sb = new StringBuilder();
        if (m.points() != null && !m.points().isEmpty())
            sb.append(m.points().stream().map(i -> names != null && names.containsKey(String.valueOf(i)) ? "#" + i + " " + names.get(String.valueOf(i)) : "#" + i).toList());
        if (m.pointsRight() != null && !m.pointsRight().isEmpty()) sb.append(" / phải ").append(m.pointsRight());
        if (m.phase() != null) sb.append(" pha ").append(m.phase());
        if (m.axis() != null) sb.append(" trục ").append(m.axis());
        return sb.toString();
    }

    private static String rangeText(RuleDto r) {
        List<String> parts = new ArrayList<>();
        if (r.normalMin() != null) parts.add("min " + r.normalMin());
        if (r.normalMax() != null) parts.add("max " + r.normalMax());
        if (r.target() != null) parts.add("mục tiêu " + r.target());
        return String.join(", ", parts);
    }

    private static String nz(String s, String fallback) { return s == null || s.isBlank() ? fallback : s; }

    private static String cut(String s, int max) { return s.length() <= max ? s : s.substring(0, max - 3) + "..."; }

    private static GeneratedRuleOutcome outcome(String status, Candidate c, String reason, List<String> errors, Long id) {
        return new GeneratedRuleOutcome(status, c.code, c.name, reason, errors, id, c.rationale);
    }

    // ------------------------------------------------------------------ đọc rule do AI trả về

    /** Một rule AI đề xuất đã được làm sạch và ép về giới hạn an toàn; req = null nếu thiếu thông tin tối thiểu. */
    static final class Candidate {
        String code, name, rationale;
        String[] feedbackText;           // {uiText, voiceText} khi AI đề xuất mã phản hồi mới
        RuleUpsertRequest req;

        static Candidate parse(JsonNode n, ProfileDto profile) {
            Candidate c = new Candidate();
            c.name = text(n, "name");
            String rawCode = text(n, "code");
            c.code = rawCode == null ? null : rawCode.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9_]", "_");
            c.rationale = text(n, "rationale");
            String metric = text(n, "metricType");
            if (c.code == null || c.code.length() < 3 || c.name == null || metric == null) return c;

            MeasurementDto m = measurement(n.path("measurement"));
            List<BandDto> bands = new ArrayList<>();
            for (JsonNode b : n.path("bands")) {
                String sev = text(b, "severity");
                if (sev == null) continue;
                bands.add(new BandDto(sev.toUpperCase(Locale.ROOT), dbl(b, "min"), dbl(b, "max"), bool(b, "minInclusive", true), bool(b, "maxInclusive", true)));
            }
            String feedbackCode = text(n, "feedbackCode");
            feedbackCode = feedbackCode == null ? null : feedbackCode.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9_]", "_");
            JsonNode fb = n.path("feedback");
            String ui = text(fb, "uiText"), voice = text(fb, "voiceText");
            if (ui != null && !ui.isBlank()) c.feedbackText = new String[]{ui.trim(), voice == null ? null : cut(voice.trim(), 200)};

            // Giới hạn an toàn: camera theo bài, không tự dừng bài tập, ưu tiên/cooldown/duy trì trong khoảng hợp lý
            String camera = text(n, "cameraView");
            if (profile.cameraView() != null && (camera == null || !"ANY".equals(camera))) camera = profile.cameraView();
            String persistenceType = "TIME".equalsIgnoreCase(text(n, "persistenceType")) ? "TIME" : "FRAME";
            int persistence = clampInt(intg(n, "persistenceValue", 3), 1, "TIME".equals(persistenceType) ? 5000 : 60);
            String sev = text(n, "severity");
            String invalidMin = text(n, "invalidRepMinSeverity");
            c.req = new RuleUpsertRequest(c.code, c.name.trim(), text(n, "description"), nz(text(n, "phase"), "ALL"), metric.toUpperCase(Locale.ROOT), m,
                    text(n, "unit"), text(n, "operator"), dbl(n, "target"), dbl(n, "normalMin"), dbl(n, "normalMax"),
                    bool(n, "normalMinInclusive", true), bool(n, "normalMaxInclusive", true), bands, sev == null ? "WARNING" : sev.toUpperCase(Locale.ROOT),
                    clampInt(intg(n, "priority", 5), 1, 10), bool(n, "invalidRep", false), invalidMin == null ? null : invalidMin.toUpperCase(Locale.ROOT),
                    false, persistenceType, persistence, (long) clampInt(intg(n, "cooldownMs", 3000), 0, 30000),
                    (long) clampInt(intg(n, "evaluationIntervalMs", 0), 0, 10000), feedbackCode, camera, SOURCE_TYPE,
                    "AI (Gemini) đề xuất theo prompt v" + PROMPT_VERSION + (c.rationale == null ? "" : ": " + cut(c.rationale, 300)),
                    "Tạo bởi AI, cần Coach kiểm tra ngưỡng và chạy Rule Tester trước khi gửi duyệt");
            return c;
        }

        private static MeasurementDto measurement(JsonNode m) {
            if (m == null || m.isMissingNode() || m.isNull()) return new MeasurementDto(List.of(), null, null, null, null, null);
            return new MeasurementDto(ints(m.path("points")), m.path("pointsRight").isArray() ? ints(m.path("pointsRight")) : null,
                    text(m, "method"), text(m, "axis"), text(m, "phase"), m.path("windowFrames").isNumber() ? m.path("windowFrames").asInt() : null);
        }

        private static List<Integer> ints(JsonNode a) {
            List<Integer> out = new ArrayList<>();
            if (a != null && a.isArray()) for (JsonNode x : a) if (x.isNumber()) out.add(x.asInt());
            return out;
        }

        private static String text(JsonNode n, String f) {
            JsonNode v = n == null ? null : n.get(f);
            return v == null || v.isNull() || !v.isString() || v.asString().isBlank() ? null : v.asString();
        }

        private static Double dbl(JsonNode n, String f) {
            JsonNode v = n == null ? null : n.get(f);
            return v == null || !v.isNumber() ? null : v.asDouble();
        }

        private static int intg(JsonNode n, String f, int def) {
            JsonNode v = n == null ? null : n.get(f);
            return v == null || !v.isNumber() ? def : v.asInt();
        }

        private static boolean bool(JsonNode n, String f, boolean def) {
            JsonNode v = n == null ? null : n.get(f);
            return v == null || !v.isBoolean() ? def : v.asBoolean();
        }

        private static int clampInt(int v, int lo, int hi) { return Math.max(lo, Math.min(hi, v)); }
    }
}
