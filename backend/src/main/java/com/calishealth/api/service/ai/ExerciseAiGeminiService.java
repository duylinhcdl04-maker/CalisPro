package com.calishealth.api.service.ai;

import com.calishealth.api.dto.AiGeneratorDtos.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Sinh nội dung động tác & quy tắc AI Motion bằng Gemini.
 *
 * Mọi giá trị Gemini trả về đều được KIỂM TRA & LÀM SẠCH trước khi dùng: chỉ chấp nhận mã cơ/enum mà
 * Exercise Builder hiểu, góc khớp 0-180°, động tác giữ tĩnh không có quy tắc đếm rep... Giá trị bị loại/sửa
 * được ghi vào `warnings` để admin biết cần kiểm tra lại. Trả về Optional.empty() khi Gemini lỗi hoặc dữ liệu
 * quá thiếu -> nơi gọi dùng dữ liệu dự phòng (source = FALLBACK).
 */
@Service
public class ExerciseAiGeminiService {
    private static final Logger log = LoggerFactory.getLogger(ExerciseAiGeminiService.class);

    // ===== Tập giá trị hợp lệ (khớp Frontend: features/exercises/types/exercise.ts & bodyMusclesAdapter.ts) =====
    static final Map<String, String> MUSCLES = new LinkedHashMap<>();
    static {
        MUSCLES.put("PECTORALIS_MAJOR", "Cơ ngực lớn / Pectoralis Major");
        MUSCLES.put("PECTORALIS_MINOR", "Cơ ngực bé / Pectoralis Minor");
        MUSCLES.put("SERRATUS_ANTERIOR", "Cơ răng cưa / Serratus Anterior");
        MUSCLES.put("DELTOID_ANTERIOR", "Cơ vai trước / Anterior Deltoid");
        MUSCLES.put("DELTOID_LATERAL", "Cơ vai giữa / Lateral Deltoid");
        MUSCLES.put("DELTOID_POSTERIOR", "Cơ vai sau / Posterior Deltoid");
        MUSCLES.put("ROTATOR_CUFF", "Nhóm cơ chóp xoay / Rotator Cuff");
        MUSCLES.put("TRICEPS_BRACHII", "Cơ tam đầu (tay sau) / Triceps Brachii");
        MUSCLES.put("BICEPS_BRACHII", "Cơ nhị đầu (tay trước) / Biceps Brachii");
        MUSCLES.put("FOREARMS", "Cơ cẳng tay & cổ tay / Forearms");
        MUSCLES.put("LATISSIMUS_DORSI", "Cơ xô / Latissimus Dorsi");
        MUSCLES.put("TRAPEZIUS", "Cơ thang / Trapezius");
        MUSCLES.put("RHOMBOIDS", "Cơ trám / Rhomboids");
        MUSCLES.put("ERECTOR_SPINAE", "Cơ dựng sống / Erector Spinae");
        MUSCLES.put("RECTUS_ABDOMINIS", "Cơ thẳng bụng / Rectus Abdominis");
        MUSCLES.put("OBLIQUES", "Cơ chéo bụng / Obliques");
        MUSCLES.put("GLUTEUS_MAXIMUS", "Cơ mông lớn / Gluteus Maximus");
        MUSCLES.put("QUADRICEPS", "Cơ đùi trước / Quadriceps");
        MUSCLES.put("HAMSTRINGS", "Cơ đùi sau / Hamstrings");
        MUSCLES.put("CALVES", "Cơ bắp chân / Gastrocnemius & Soleus");
    }
    static final List<String> CATEGORIES = List.of("Strength", "Skill", "Mobility", "Flexibility", "Endurance", "Conditioning", "Recovery");
    static final List<String> DIFFICULTIES = List.of("Beginner", "Intermediate", "Advanced", "Expert");
    static final List<String> PATTERNS = List.of("Horizontal Push", "Vertical Push", "Horizontal Pull", "Vertical Pull", "Squat", "Hinge",
            "Lunge", "Core Flexion", "Core Extension", "Rotation", "Anti-Rotation", "Static Hold", "Locomotion");
    static final List<String> EQUIPMENT = List.of("No Equipment", "Pull-up Bar", "Parallel Bars", "Gymnastic Rings", "Resistance Band",
            "Parallettes", "Weight Vest / Dip Belt", "Dumbbell", "Kettlebell", "Bench", "Other");
    static final List<String> BREATHING = List.of("Inhale", "Exhale", "Hold / Braced", "Natural");
    static final List<String> ROLES = List.of("PRIMARY", "SECONDARY", "STABILIZER");
    static final List<String> ACTIVATION = List.of("LOW", "MODERATE", "HIGH", "VERY_HIGH");
    static final List<String> MISTAKE_SEVERITY = List.of("LOW", "MEDIUM", "HIGH");
    // Phép đo góc khớp mà bước 5 & AI runtime hỗ trợ (giữ nguyên chuỗi value của frontend)
    static final List<String> MEASUREMENTS = List.of(
            "Elbow Angle (Góc khuỷu tay)",
            "Shoulder Angle (Góc khớp vai)",
            "Hip Spine Trunk Angle (Trục cột sống - hông)",
            "Knee Angle (Góc đầu gối)",
            "Ankle Angle (Góc cổ chân)",
            "Wrist Alignment (Trục cổ tay)");
    static final List<String> CONDITIONS = List.of("LESS_THAN", "GREATER_THAN", "BETWEEN", "OUTSIDE_RANGE", "STABLE");
    static final List<String> ACTIONS = List.of("REP_COUNT_TRIGGER", "FORM_CUE", "WARNING", "CRITICAL_STOP");
    static final List<String> ERROR_CATEGORIES = List.of("Alignment", "Joint Position", "Range of Motion", "Tempo", "Stability", "Symmetry");
    static final List<String> ERROR_SEVERITY = List.of("INFO", "WARNING", "CRITICAL");
    static final List<String> CAMERA_ANGLES = List.of("SIDE_45_DEGREE", "SIDE_90_DEGREE", "FRONT_VIEW");
    static final List<String> ROM_METRICS = List.of("angle_degrees", "depth_cm", "height_percent");

    private final GeminiClient gemini;

    public ExerciseAiGeminiService(GeminiClient gemini) {
        this.gemini = gemini;
    }

    // ===== Cấu trúc JSON thô Gemini trả về (mọi trường có thể thiếu/sai -> kiểm tra sau) =====
    @JsonIgnoreProperties(ignoreUnknown = true)
    record RawPhase(String name, String vietnameseName, String description, String coachingCue, String breathing, String muscleFocus) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    record RawMuscle(String muscleCode, String role, String activationLevel, String userGuidance) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    record RawMistake(String name, String problem, String whyItHappens, String correction, String severity) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    record RawTempo(Double eccentricSec, Double pauseBottomSec, Double concentricSec, Double pauseTopSec, Double toleranceSec) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    record RawExercise(String displayName, String category, String difficulty, String movementPattern, List<String> equipment,
                       String description, List<String> tags, List<RawPhase> phases, List<RawMuscle> muscleTargets,
                       String setupInstructions, String executionInstructions, String inhaleTiming, String exhaleTiming,
                       RawTempo tempo, List<String> coachingCues, List<RawMistake> commonMistakes, List<String> safetyCues,
                       List<String> stopConditions, String contraindications, String generalConsiderations) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record RawJointRule(String ruleRoleName, String measurement, String condition, Double targetValue, Double secondaryValue,
                        Double tolerance, String action, String voicePromptVi, String movementPhase) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    record RawRomRule(String movementName, String metricType, Double minROM, Double maxROM, Double tolerance, String description) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    record RawErrorRule(String ruleName, String category, String conditionDescription, String severity, String aiFeedbackVi,
                        String correctionCueVi, Boolean isInvalidRepPenalty) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    record RawMotion(List<Integer> recommendedLandmarkIds, String cameraAngleRequirement, Integer minBodyVisibilityPercent,
                     List<RawJointRule> jointRules, List<RawRomRule> romRules, RawTempo tempoRule, List<RawErrorRule> errorRules) {}

    // =====================================================================================
    // 1. ĐỘNG TÁC
    // =====================================================================================

    public Optional<GenerateExerciseResponse> generateExercise(GenerateExerciseRequest req, String name, String fallbackPattern, String dedupNote) {
        String prompt = buildExercisePrompt(req, name);
        Optional<String> json = gemini.generateJson(prompt, 0.4, 8192);
        if (json.isEmpty()) return Optional.empty();

        RawExercise raw;
        try {
            raw = gemini.objectMapper().readValue(json.get(), RawExercise.class);
        } catch (Exception e) {
            log.warn("Không đọc được JSON động tác từ Gemini: {}", e.getMessage());
            return Optional.empty();
        }

        List<String> warnings = new ArrayList<>();
        String category = pick(raw.category(), CATEGORIES, firstValid(req.category(), CATEGORIES, "Strength"), "Nhóm tập luyện", warnings);
        String difficulty = pick(raw.difficulty(), DIFFICULTIES, firstValid(req.difficulty(), DIFFICULTIES, "Intermediate"), "Cấp độ", warnings);
        String pattern = pick(raw.movementPattern(), PATTERNS, fallbackPattern, "Mẫu chuyển động", warnings);
        boolean staticHold = "Static Hold".equals(pattern);

        List<String> equipment = new ArrayList<>();
        for (String eq : nonNull(raw.equipment())) {
            String v = matchIgnoreCase(eq, EQUIPMENT);
            if (v != null && !equipment.contains(v)) equipment.add(v);
            else if (v == null && eq != null) warnings.add("Bỏ dụng cụ không hỗ trợ: " + eq);
        }
        if (equipment.isEmpty()) equipment.add("No Equipment");

        // Giai đoạn chuyển động
        List<ExercisePhaseDto> phases = new ArrayList<>();
        for (RawPhase p : nonNull(raw.phases())) {
            if (blank(p.name()) || phases.size() >= 6) continue;
            String breathing = matchIgnoreCase(p.breathing(), BREATHING);
            if (breathing == null) {
                warnings.add("Nhịp thở \"" + p.breathing() + "\" của pha " + p.name() + " không hợp lệ -> Natural");
                breathing = "Natural";
            }
            phases.add(new ExercisePhaseDto(phases.size() + 1, clean(p.name(), 100), clean(p.vietnameseName(), 150),
                    clean(p.description(), 2000), clean(p.coachingCue(), 500), breathing, clean(p.muscleFocus(), 255)));
        }

        // Nhóm cơ: chỉ mã có trong danh mục, gộp trùng, bắt buộc có ít nhất 1 cơ chính
        List<MuscleTargetDto> muscles = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (RawMuscle m : nonNull(raw.muscleTargets())) {
            String code = m.muscleCode() == null ? null : m.muscleCode().trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z_]", "_");
            if (code == null || !MUSCLES.containsKey(code)) {
                warnings.add("Bỏ nhóm cơ ngoài danh mục: " + m.muscleCode());
                continue;
            }
            if (!seen.add(code)) continue;
            String role = pick(m.role(), ROLES, "SECONDARY", "Vai trò cơ " + code, warnings);
            String level = pick(m.activationLevel(), ACTIVATION, "MODERATE", "Mức kích hoạt cơ " + code, warnings);
            muscles.add(new MuscleTargetDto(code, MUSCLES.get(code), role, level, clean(m.userGuidance(), 500)));
        }
        if (!muscles.isEmpty() && muscles.stream().noneMatch(m -> "PRIMARY".equals(m.role()))) {
            MuscleTargetDto first = muscles.get(0);
            muscles.set(0, new MuscleTargetDto(first.muscleCode(), first.muscleNameVi(), "PRIMARY", first.activationLevel(), first.userGuidance()));
            warnings.add("AI không chỉ định cơ chính -> đặt " + first.muscleNameVi() + " làm cơ chính");
        }

        List<String> cues = cleanList(raw.coachingCues(), 8, 500);
        if (phases.size() < 2 || muscles.isEmpty() || cues.isEmpty()) {
            log.warn("Gemini trả dữ liệu động tác quá thiếu (phases={}, muscles={}, cues={}) -> dùng dự phòng",
                    phases.size(), muscles.size(), cues.size());
            return Optional.empty();
        }

        List<Map<String, String>> mistakes = new ArrayList<>();
        for (RawMistake m : nonNull(raw.commonMistakes())) {
            if (blank(m.name()) || mistakes.size() >= 6) continue;
            Map<String, String> item = new LinkedHashMap<>();
            item.put("name", clean(m.name(), 255));
            item.put("problem", clean(m.problem(), 1000));
            item.put("whyItHappens", clean(m.whyItHappens(), 1000));
            item.put("correction", clean(m.correction(), 1000));
            item.put("severity", pick(m.severity(), MISTAKE_SEVERITY, "MEDIUM", "Mức độ lỗi " + m.name(), warnings));
            mistakes.add(item);
        }

        TempoRuleDto tempo = sanitizeTempo(raw.tempo(), staticHold, warnings);
        String tempoText = fmt(tempo.eccentricSec()) + "-" + fmt(tempo.pauseBottomSec()) + "-" + fmt(tempo.concentricSec()) + "-" + fmt(tempo.pauseTopSec());

        String dedup = dedupNote + " Nội dung do Gemini sinh riêng cho động tác này - vui lòng kiểm tra chuyên môn trước khi xuất bản.";
        return Optional.of(new GenerateExerciseResponse(
                true,
                name,
                firstNonBlank(clean(raw.displayName(), 255), name),
                category,
                difficulty,
                pattern,
                equipment,
                clean(raw.description(), 3000),
                cleanList(raw.tags(), 8, 50),
                phases,
                muscles,
                clean(raw.setupInstructions(), 3000),
                clean(raw.executionInstructions(), 3000),
                tempoText,
                cues,
                mistakes,
                cleanList(raw.safetyCues(), 6, 500),
                dedup,
                clean(raw.inhaleTiming(), 500),
                clean(raw.exhaleTiming(), 500),
                cleanList(raw.stopConditions(), 6, 500),
                clean(raw.contraindications(), 2000),
                clean(raw.generalConsiderations(), 2000),
                tempo,
                "GEMINI",
                warnings
        ));
    }

    private String buildExercisePrompt(GenerateExerciseRequest req, String name) {
        String existing = req.existingExercises() == null || req.existingExercises().isEmpty()
                ? "Chưa có" : req.existingExercises().stream().limit(80).collect(Collectors.joining(", "));
        String muscleList = MUSCLES.entrySet().stream().map(e -> e.getKey() + " (" + e.getValue() + ")").collect(Collectors.joining("\n  - "));

        return """
                Bạn là chuyên gia sinh cơ học (biomechanics) và huấn luyện viên Calisthenics. Hãy mô tả CHÍNH XÁC động tác dưới đây
                cho thư viện bài tập của ứng dụng CalisHealth. Nội dung phải đúng riêng cho động tác này (không dùng mô tả chung chung
                của động tác khác), an toàn, dựa trên kiến thức giải phẫu & khoa học thể thao được công nhận.

                THÔNG TIN ĐẦU VÀO
                - Tên động tác: %s
                - Nhóm tập luyện mong muốn: %s
                - Cấp độ mong muốn: %s
                - Nhóm cơ mục tiêu admin gợi ý (có thể trống): %s
                - Mục tiêu cụ thể: %s
                - Động tác đã có trong thư viện (để phân biệt biến thể, KHÔNG sao chép): %s

                RÀNG BUỘC GIÁ TRỊ (BẮT BUỘC dùng đúng chuỗi, phân biệt hoa thường)
                - category: %s
                - difficulty: %s
                - movementPattern: %s  (động tác giữ tư thế như plank, L-sit, handstand -> "Static Hold")
                - equipment (mảng): %s
                - phases[].breathing: %s
                - muscleTargets[].muscleCode CHỈ được chọn trong danh sách:
                  - %s
                - muscleTargets[].role: PRIMARY | SECONDARY | STABILIZER (ít nhất 1 PRIMARY; chỉ liệt kê cơ thực sự tham gia đáng kể)
                - muscleTargets[].activationLevel: LOW | MODERATE | HIGH | VERY_HIGH
                - commonMistakes[].severity: LOW | MEDIUM | HIGH
                - tempo: số giây cho từng pha (eccentricSec = pha hạ/giãn cơ, pauseBottomSec = dừng ở điểm khó nhất,
                  concentricSec = pha phát lực, pauseTopSec = dừng ở đỉnh; động tác giữ tĩnh: dùng pauseTopSec cho thời gian giữ,
                  các pha khác = 0), toleranceSec = sai số cho phép.

                YÊU CẦU NỘI DUNG
                - phases: 3-5 pha theo đúng trình tự 1 rep của CHÍNH động tác này (name tiếng Anh ngắn gọn, vietnameseName tiếng Việt).
                - Văn bản mô tả, khẩu lệnh, lỗi sai, an toàn viết bằng tiếng Việt, ngắn gọn, cụ thể (nêu góc khớp/vị trí khi phù hợp).
                - commonMistakes: 2-4 lỗi đặc trưng của động tác này.
                - stopConditions: dấu hiệu phải dừng tập ngay; contraindications: đối tượng/chấn thương không nên tập.

                TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON với cấu trúc:
                {
                  "displayName": "Tên hiển thị tiếng Việt",
                  "category": "...", "difficulty": "...", "movementPattern": "...",
                  "equipment": ["..."],
                  "description": "Mô tả 2-3 câu về động tác và lợi ích",
                  "tags": ["..."],
                  "phases": [{"name": "...", "vietnameseName": "...", "description": "...", "coachingCue": "...", "breathing": "...", "muscleFocus": "..."}],
                  "muscleTargets": [{"muscleCode": "...", "role": "...", "activationLevel": "...", "userGuidance": "Học viên nên cảm nhận gì"}],
                  "setupInstructions": "...", "executionInstructions": "...",
                  "inhaleTiming": "Hít vào khi ...", "exhaleTiming": "Thở ra khi ...",
                  "tempo": {"eccentricSec": 2, "pauseBottomSec": 0, "concentricSec": 1, "pauseTopSec": 0, "toleranceSec": 0.5},
                  "coachingCues": ["..."],
                  "commonMistakes": [{"name": "...", "problem": "...", "whyItHappens": "...", "correction": "...", "severity": "..."}],
                  "safetyCues": ["..."], "stopConditions": ["..."],
                  "contraindications": "...", "generalConsiderations": "..."
                }
                """.formatted(
                name,
                firstNonBlank(req.category(), "Strength"),
                firstNonBlank(req.difficulty(), "Intermediate"),
                firstNonBlank(req.targetMuscles(), "(trống)"),
                firstNonBlank(req.specificGoal(), "Calisthenics tổng quát"),
                existing,
                String.join(" | ", CATEGORIES),
                String.join(" | ", DIFFICULTIES),
                String.join(" | ", PATTERNS),
                String.join(" | ", EQUIPMENT),
                String.join(" | ", BREATHING),
                muscleList);
    }

    // =====================================================================================
    // 2. QUY TẮC AI MOTION (GÓC KHỚP, ROM, TEMPO, LỖI SAI, LANDMARK)
    // =====================================================================================

    public Optional<GenerateMotionRulesResponse> generateMotionRules(GenerateMotionRulesRequest req, String name, String pattern) {
        boolean staticHold = "Static Hold".equals(pattern);
        Optional<String> json = gemini.generateJson(buildMotionPrompt(req, name, pattern), 0.2, 8192);
        if (json.isEmpty()) return Optional.empty();

        RawMotion raw;
        try {
            raw = gemini.objectMapper().readValue(json.get(), RawMotion.class);
        } catch (Exception e) {
            log.warn("Không đọc được JSON quy tắc AI từ Gemini: {}", e.getMessage());
            return Optional.empty();
        }

        List<String> warnings = new ArrayList<>();

        List<GeneratedJointRuleDto> joints = new ArrayList<>();
        Set<String> signatures = new HashSet<>();
        for (RawJointRule r : nonNull(raw.jointRules())) {
            String label = firstNonBlank(r.ruleRoleName(), r.measurement());
            String measurement = matchIgnoreCase(r.measurement(), MEASUREMENTS);
            if (measurement == null) measurement = matchMeasurementByKeyword(r.measurement());
            if (measurement == null) { warnings.add("Bỏ quy tắc \"" + label + "\": phép đo không hỗ trợ (" + r.measurement() + ")"); continue; }
            String condition = matchIgnoreCase(r.condition(), CONDITIONS);
            if (condition == null) { warnings.add("Bỏ quy tắc \"" + label + "\": điều kiện không hỗ trợ (" + r.condition() + ")"); continue; }
            if (r.targetValue() == null || r.targetValue() < 0 || r.targetValue() > 180) {
                warnings.add("Bỏ quy tắc \"" + label + "\": góc mục tiêu ngoài 0-180° (" + r.targetValue() + ")"); continue;
            }
            double target = r.targetValue();
            Double secondary = r.secondaryValue();
            if ("BETWEEN".equals(condition) || "OUTSIDE_RANGE".equals(condition)) {
                if (secondary == null || secondary < 0 || secondary > 180 || secondary.equals(target)) {
                    warnings.add("Bỏ quy tắc \"" + label + "\": khoảng góc không hợp lệ"); continue;
                }
                if (secondary < target) { double t = target; target = secondary; secondary = t; }
            } else {
                secondary = null;
            }
            String action = matchIgnoreCase(r.action(), ACTIONS);
            if (action == null) action = "WARNING";
            if (staticHold && "REP_COUNT_TRIGGER".equals(action)) {
                warnings.add("Động tác giữ tĩnh không đếm rep -> đổi quy tắc \"" + label + "\" thành cảnh báo");
                action = "WARNING";
            }
            double tolerance = r.tolerance() == null ? 5 : Math.max(0, Math.min(20, r.tolerance()));
            String phase = firstNonBlank(clean(r.movementPhase(), 30), "ANY").toUpperCase(Locale.ROOT);
            if (!signatures.add(measurement + "|" + condition + "|" + phase)) continue;
            joints.add(new GeneratedJointRuleDto(clean(label, 150), measurement, condition, target, secondary, tolerance,
                    action, clean(r.voicePromptVi(), 300), phase));
        }

        if (joints.isEmpty()) {
            log.warn("Gemini không trả quy tắc góc khớp hợp lệ nào -> dùng dự phòng");
            return Optional.empty();
        }
        if (!staticHold && joints.stream().noneMatch(j -> "REP_COUNT_TRIGGER".equals(j.action()))) {
            warnings.add("Chưa có quy tắc đếm rep - hãy thêm 1 quy tắc \"Đếm rep\" ở điểm đáy/đỉnh của động tác.");
        }

        List<GeneratedRomRuleDto> roms = new ArrayList<>();
        for (RawRomRule r : nonNull(raw.romRules())) {
            if (blank(r.movementName()) || r.minROM() == null || r.maxROM() == null) continue;
            String metric = matchIgnoreCase(r.metricType(), ROM_METRICS);
            if (metric == null) metric = "angle_degrees";
            double max = "angle_degrees".equals(metric) ? 180 : 100;
            double lo = Math.min(r.minROM(), r.maxROM()), hi = Math.max(r.minROM(), r.maxROM());
            if (lo < 0 || hi > max || lo == hi) { warnings.add("Bỏ ROM \"" + r.movementName() + "\": khoảng giá trị không hợp lệ"); continue; }
            String unit = switch (metric) { case "depth_cm" -> "cm"; case "height_percent" -> "%"; default -> "°"; };
            double tol = r.tolerance() == null ? 5 : Math.max(0, Math.min(20, r.tolerance()));
            roms.add(new GeneratedRomRuleDto(clean(r.movementName(), 150), metric, lo, hi, tol, unit, clean(r.description(), 500)));
        }

        List<GeneratedErrorRuleDto> errors = new ArrayList<>();
        Set<String> errorNames = new HashSet<>(nonNull(req.existingErrorRules()));
        for (RawErrorRule e : nonNull(raw.errorRules())) {
            if (blank(e.ruleName()) || !errorNames.add(e.ruleName().trim())) continue;
            String category = matchIgnoreCase(e.category(), ERROR_CATEGORIES);
            String severity = matchIgnoreCase(e.severity(), ERROR_SEVERITY);
            errors.add(new GeneratedErrorRuleDto(clean(e.ruleName(), 150), category == null ? "Alignment" : category,
                    clean(e.conditionDescription(), 500), severity == null ? "WARNING" : severity,
                    clean(e.aiFeedbackVi(), 300), clean(e.correctionCueVi(), 300), Boolean.TRUE.equals(e.isInvalidRepPenalty())));
        }

        List<Integer> landmarks = nonNull(raw.recommendedLandmarkIds()).stream()
                .filter(Objects::nonNull).filter(i -> i >= 0 && i <= 32).distinct().sorted().toList();
        String camera = matchIgnoreCase(raw.cameraAngleRequirement(), CAMERA_ANGLES);
        int visibility = raw.minBodyVisibilityPercent() == null ? 80 : Math.max(50, Math.min(100, raw.minBodyVisibilityPercent()));
        TempoRuleDto tempo = raw.tempoRule() == null ? null : sanitizeTempo(raw.tempoRule(), staticHold, warnings);

        String report = String.format("Gemini đã phân tích \"%s\": %d quy tắc góc, %d ROM, %d lỗi sai, %d landmark.%s",
                name, joints.size(), roms.size(), errors.size(), landmarks.size(),
                warnings.isEmpty() ? "" : " Có " + warnings.size() + " điều chỉnh khi kiểm tra.");
        return Optional.of(new GenerateMotionRulesResponse(true, name, landmarks,
                camera == null ? "SIDE_45_DEGREE" : camera, visibility, joints, errors, report, roms, tempo, "GEMINI", warnings));
    }

    private String buildMotionPrompt(GenerateMotionRulesRequest req, String name, String pattern) {
        String existingJoints = nonNull(req.existingJointRules()).isEmpty() ? "Chưa có" : String.join(", ", req.existingJointRules());
        String existingErrors = nonNull(req.existingErrorRules()).isEmpty() ? "Chưa có" : String.join(", ", req.existingErrorRules());
        return """
                Bạn là chuyên gia sinh cơ học và thị giác máy tính (MediaPipe Pose 33 landmarks). Hãy thiết kế bộ quy tắc đánh giá
                form cho động tác dưới đây để AI chấm điểm học viên qua camera. Số liệu góc khớp phải đúng với CHÍNH động tác này
                (theo tài liệu huấn luyện/sinh cơ học được công nhận), không dùng số liệu của động tác khác.

                ĐỘNG TÁC: %s
                Mẫu chuyển động: %s | Cấp độ: %s
                Phép đo đã có trong cấu hình (tránh trùng): %s
                Lỗi sai đã có (tránh trùng): %s

                NGỮ NGHĨA BẮT BUỘC
                - Mỗi quy tắc góc mô tả TƯ THẾ ĐÚNG (đạt điều kiện = đạt chuẩn). Ví dụ đáy chống đẩy: Elbow LESS_THAN 90.
                - condition: LESS_THAN | GREATER_THAN | BETWEEN | OUTSIDE_RANGE | STABLE. BETWEEN/OUTSIDE_RANGE cần secondaryValue > targetValue.
                - Góc tính bằng độ, 0-180. tolerance = sai số cho phép (độ), thường 3-10.
                - action: REP_COUNT_TRIGGER (điểm đáy/đỉnh dùng để đếm 1 rep) | FORM_CUE (nhắc nhẹ) | WARNING | CRITICAL_STOP (nguy cơ chấn thương).
                - Động tác giữ tĩnh (Static Hold): KHÔNG dùng REP_COUNT_TRIGGER; dùng STABLE/BETWEEN để giữ tư thế.
                - Động tác động: có ít nhất 1 REP_COUNT_TRIGGER.
                - measurement CHỈ chọn trong: %s
                - movementPhase: SETUP | ECCENTRIC | BOTTOM | CONCENTRIC | TOP | HOLD
                - romRules[].metricType: angle_degrees | depth_cm | height_percent
                - errorRules[].category: %s ; severity: INFO | WARNING | CRITICAL
                - recommendedLandmarkIds: chỉ số MediaPipe 0-32 cần nhìn thấy (0 mũi, 11/12 vai, 13/14 khuỷu, 15/16 cổ tay,
                  23/24 hông, 25/26 gối, 27/28 cổ chân, 29/30 gót, 31/32 mũi chân).
                - cameraAngleRequirement: SIDE_45_DEGREE | SIDE_90_DEGREE | FRONT_VIEW (góc quay giúp đo chính xác nhất).
                - Văn bản tiếng Việt, ngắn gọn.

                TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON:
                {
                  "recommendedLandmarkIds": [11, 12],
                  "cameraAngleRequirement": "SIDE_90_DEGREE",
                  "minBodyVisibilityPercent": 80,
                  "jointRules": [{"ruleRoleName": "Tên quy tắc", "measurement": "...", "condition": "...", "targetValue": 90, "secondaryValue": null,
                                  "tolerance": 5, "action": "...", "voicePromptVi": "Câu nhắc bằng giọng nói", "movementPhase": "BOTTOM"}],
                  "romRules": [{"movementName": "...", "metricType": "angle_degrees", "minROM": 70, "maxROM": 90, "tolerance": 5, "description": "..."}],
                  "tempoRule": {"eccentricSec": 2, "pauseBottomSec": 0, "concentricSec": 1, "pauseTopSec": 0, "toleranceSec": 0.5},
                  "errorRules": [{"ruleName": "...", "category": "...", "conditionDescription": "Mô tả điều kiện phát hiện (nêu góc/landmark)",
                                  "severity": "...", "aiFeedbackVi": "...", "correctionCueVi": "...", "isInvalidRepPenalty": true}]
                }
                """.formatted(name, pattern, firstNonBlank(req.difficulty(), "Intermediate"), existingJoints, existingErrors,
                String.join(" | ", MEASUREMENTS), String.join(" | ", ERROR_CATEGORIES));
    }

    // =====================================================================================
    // HELPERS
    // =====================================================================================

    private static TempoRuleDto sanitizeTempo(RawTempo t, boolean staticHold, List<String> warnings) {
        if (t == null) return staticHold ? new TempoRuleDto(0, 0, 0, 30, 5) : new TempoRuleDto(2, 0, 1, 0, 0.5);
        double maxPhase = staticHold ? 120 : 10;
        double e = clamp(t.eccentricSec(), 0, 10), pb = clamp(t.pauseBottomSec(), 0, 10), c = clamp(t.concentricSec(), 0, 10);
        double pt = clamp(t.pauseTopSec(), 0, maxPhase), tol = clamp(t.toleranceSec(), 0, staticHold ? 15 : 3);
        if (e + pb + c + pt <= 0) {
            warnings.add("Tempo AI trả về bằng 0 -> dùng mặc định");
            return staticHold ? new TempoRuleDto(0, 0, 0, 30, 5) : new TempoRuleDto(2, 0, 1, 0, 0.5);
        }
        return new TempoRuleDto(e, pb, c, pt, tol);
    }

    private static String matchMeasurementByKeyword(String raw) {
        if (raw == null) return null;
        String s = raw.toLowerCase(Locale.ROOT);
        if (s.contains("elbow") || s.contains("khuỷu")) return MEASUREMENTS.get(0);
        if (s.contains("shoulder") || s.contains("vai")) return MEASUREMENTS.get(1);
        if (s.contains("hip") || s.contains("spine") || s.contains("trunk") || s.contains("hông") || s.contains("sống")) return MEASUREMENTS.get(2);
        if (s.contains("knee") || s.contains("gối")) return MEASUREMENTS.get(3);
        if (s.contains("ankle") || s.contains("cổ chân")) return MEASUREMENTS.get(4);
        if (s.contains("wrist") || s.contains("cổ tay")) return MEASUREMENTS.get(5);
        return null;
    }

    private static String pick(String value, List<String> allowed, String fallback, String field, List<String> warnings) {
        String v = matchIgnoreCase(value, allowed);
        if (v != null) return v;
        if (value != null && !value.isBlank()) warnings.add(field + " \"" + value + "\" không hợp lệ -> " + fallback);
        return fallback;
    }

    private static String firstValid(String value, List<String> allowed, String fallback) {
        String v = matchIgnoreCase(value, allowed);
        return v != null ? v : fallback;
    }

    private static String matchIgnoreCase(String value, List<String> allowed) {
        if (value == null) return null;
        String v = value.trim();
        return allowed.stream().filter(a -> a.equalsIgnoreCase(v)).findFirst().orElse(null);
    }

    private static List<String> cleanList(List<String> list, int maxItems, int maxLen) {
        return nonNull(list).stream().filter(s -> !blank(s)).map(s -> clean(s, maxLen)).distinct().limit(maxItems).toList();
    }

    private static String clean(String s, int max) {
        if (s == null) return "";
        String t = s.trim();
        return t.length() <= max ? t : t.substring(0, max);
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private static String firstNonBlank(String a, String b) {
        return blank(a) ? b : a.trim();
    }

    private static double clamp(Double v, double min, double max) {
        return v == null ? 0 : Math.max(min, Math.min(max, v));
    }

    private static String fmt(double d) {
        return d == Math.floor(d) ? String.valueOf((long) d) : String.valueOf(d);
    }

    private static <T> List<T> nonNull(List<T> list) {
        return list == null ? List.of() : list;
    }
}
