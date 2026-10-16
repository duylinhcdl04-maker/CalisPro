package com.calishealth.api.service.ai;

import com.calishealth.api.dto.AiGeneratorDtos.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
public class AiContentGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(AiContentGeneratorService.class);

    private final RedisCacheService cacheService;
    private final DeduplicationService deduplicationService;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final ExerciseAiGeminiService exerciseAiGemini;

    @Value("${app.gemini.api-key:}")
    private String geminiApiKey;

    public AiContentGeneratorService(RedisCacheService cacheService, DeduplicationService deduplicationService,
                                     ExerciseAiGeminiService exerciseAiGemini) {
        this.cacheService = cacheService;
        this.exerciseAiGemini = exerciseAiGemini;
        this.deduplicationService = deduplicationService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(12))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    // =========================================================================
    // 1. GENERATE EXERCISE (THƯ VIỆN ĐỘNG TÁC)
    // =========================================================================
    public GenerateExerciseResponse generateExercise(GenerateExerciseRequest req) {
        String name = req.exerciseName() != null ? req.exerciseName().trim() : "Calisthenics Exercise";
        // Khóa cache gồm mọi tham số đầu vào: cùng tên nhưng khác cấp độ/nhóm cơ mục tiêu phải sinh lại
        String cacheKey = String.format("ai:gen:exercise:v2:%s:%s:%s:%s:%s", deduplicationService.toSlug(name),
                req.category(), req.difficulty(), deduplicationService.toSlug(String.valueOf(req.targetMuscles())),
                deduplicationService.toSlug(String.valueOf(req.specificGoal())));

        Optional<GenerateExerciseResponse> cached = cacheService.get(cacheKey, GenerateExerciseResponse.class);
        if (cached.isPresent()) {
            log.info("Redis cache HIT for exercise generation: [{}]", cacheKey);
            return cached.get();
        }

        // Check if duplicate with existing exercises
        boolean isDup = deduplicationService.isExerciseDuplicate(name, req.existingExercises(), 0.90);
        String deduplicationNote = isDup ? "Cảnh báo: Động tác tương tự đã có trong thư viện. Dữ liệu đã được điều chỉnh biến thể để không bị trùng." : "Đã xác thực tính duy nhất trong thư viện.";

        // 1. Gemini sinh riêng cho động tác (đã kiểm tra & làm sạch). Chỉ cache kết quả thật từ Gemini.
        Optional<GenerateExerciseResponse> fromGemini = exerciseAiGemini.generateExercise(req, name, inferMovementPattern(name), deduplicationNote);
        if (fromGemini.isPresent()) {
            cacheService.set(cacheKey, fromGemini.get(), 86400);
            return fromGemini.get();
        }

        // 2. Dự phòng khi Gemini lỗi: dữ liệu MẪU (cấu trúc Push-Up) - admin bắt buộc phải chỉnh lại
        log.warn("Gemini không khả dụng -> trả dữ liệu mẫu cho động tác [{}]", name);

        // Build domain-accurate biomechanical exercise data
        String category = req.category() != null ? req.category() : "Strength";
        String difficulty = req.difficulty() != null ? req.difficulty() : "Intermediate";
        String pattern = inferMovementPattern(name);

        List<ExercisePhaseDto> phases = List.of(
                new ExercisePhaseDto(1, "Starting Position", "Tư thế chuẩn bị (Setup)",
                        "Định vị khung người, khóa khớp cổ tay và gồng chặt cơ bụng core.",
                        "Khóa vai về phía sau, ngực mở rộng, 2 chân khép chặt.",
                        "Inhale", "Toàn thân & Cơ lõi"),
                new ExercisePhaseDto(2, "Eccentric Phase", "Pha hạ người kiểm soát (Negative)",
                        "Hạ trọng tâm từ từ trong 2-3 giây, kiểm soát góc nách 45 độ.",
                        "Không xòe khuỷu tay sang 2 bên, hít vào đều đặn.",
                        "Inhale", "Cơ chủ vận chính"),
                new ExercisePhaseDto(3, "Bottom Position", "Điểm sâu nhất (Inflection / Bottom)",
                        "Đạt chuẩn biên độ ROM tối thiểu, dừng 0.5s không chạm đất buông lỏng.",
                        "Duy trì cơ thể thành một đường thẳng tắp, không võng hông.",
                        "Hold / Braced", "Cơ ngực & Vai trước"),
                new ExercisePhaseDto(4, "Concentric Phase", "Pha đẩy lên dứt khoát (Positive)",
                        "Phát lực bùng nổ đẩy thẳng thân người trở lại vị trí ban đầu.",
                        "Thở mạnh ra khi vượt qua điểm khó nhất, khóa khớp tay có kiểm soát.",
                        "Exhale", "Tay sau & Ngực")
        );

        List<MuscleTargetDto> muscles = List.of(
                new MuscleTargetDto("PECTORALIS_MAJOR", "Cơ ngực lớn (Chest)", "PRIMARY", "VERY_HIGH", "Cảm nhận cơ ngực căng tối đa ở đáy rep."),
                new MuscleTargetDto("TRICEPS_BRACHII", "Cơ tay sau (Triceps)", "PRIMARY", "HIGH", "Khóa thẳng khớp tay để kích hoạt đầu dài tay sau."),
                new MuscleTargetDto("DELTOID_ANTERIOR", "Cơ vai trước (Anterior Deltoid)", "SECONDARY", "HIGH", "Ổn định khớp vai, chống xệ vai."),
                new MuscleTargetDto("RECTUS_ABDOMINIS", "Cơ bụng thẳng (Core)", "STABILIZER", "VERY_HIGH", "Gồng cứng cơ bụng để giữ cột sống thẳng 180°.")
        );

        List<String> cues = List.of(
                "Khép nách hình mũi tên góc 45 độ so với thân người.",
                "Siết chặt mông và gồng cơ bụng suốt toàn bộ chuyển động.",
                "Đẩy hết biên độ khóa khớp tay trên đỉnh rep.",
                "Mắt nhìn chéo về phía trước 1 mét, không ngửa cổ quá mức."
        );

        List<Map<String, String>> mistakes = List.of(
                Map.of(
                        "name", "Võng lưng / Sụp hông (Sagging Hips)",
                        "problem", "Hông rơi xuống trước ngực, giảm tải cơ ngực và gây đau thắt lưng.",
                        "whyItHappens", "Cơ bụng và cơ mông yếu, mất tập trung khi mỏi.",
                        "correction", "Chủ động cuộn xương chậu ra sau (Posterior Pelvic Tilt) và siết chặt mông.",
                        "severity", "HIGH"
                ),
                Map.of(
                        "name", "Khuỷu tay xòe ngang 90 độ (Flared Elbows)",
                        "problem", "Tạo áp lực xoay nguy hiểm lên bao khớp vai và gân nhị đầu.",
                        "whyItHappens", "Đặt bàn tay quá cao hoặc mở khuỷu theo thói quen.",
                        "correction", "Kéo cùi chỏ hướng về phía hông, tạo góc 45 độ tự nhiên.",
                        "severity", "MEDIUM"
                )
        );

        List<String> safety = List.of(
                "Khởi động kỹ cổ tay và xoay khớp vai tối thiểu 5 phút trước khi tập.",
                "Nếu cảm thấy đau nhói ở khớp vai, dừng ngay lập tức và hạ độ khó."
        );

        GenerateExerciseResponse response = new GenerateExerciseResponse(
                true,
                name,
                name + " Tiêu chuẩn",
                category,
                difficulty,
                pattern,
                List.of("No Equipment"),
                String.format("Động tác %s xây dựng sức mạnh sinh cơ học chuẩn Calisthenics, tập trung vào khả năng kiểm soát cơ thể và phát lực cân bằng.", name),
                List.of("Calisthenics", pattern, difficulty, "Full Body"),
                phases,
                muscles,
                "Bắt đầu ở tư thế Plank thẳng tay, bàn tay rộng bằng vai, các ngón tay xòe đều bám sàn.",
                "Hạ người có kiểm soát trong 2-3 giây đến khi khuỷu tay vuông góc 90 độ, sau đó đẩy mạnh lên vị trí ban đầu.",
                "2-0-1-0 (Hạ 2s - Giữ 0s - Đẩy 1s - Khóa 0s)",
                cues,
                mistakes,
                safety,
                "DỮ LIỆU MẪU: Gemini hiện không phản hồi nên hệ thống trả về khung nội dung chung (theo Push-Up). "
                        + "Bắt buộc chỉnh lại giai đoạn, nhóm cơ, kỹ thuật cho đúng động tác trước khi xuất bản. " + deduplicationNote,
                "Hít vào khi hạ người (pha eccentric)",
                "Thở ra khi phát lực (pha concentric)",
                List.of("Đau nhói ở khớp vai, khuỷu hoặc cổ tay", "Mất kiểm soát cột sống thắt lưng"),
                "Chấn thương cấp tính ở vai, khuỷu, cổ tay hoặc cột sống.",
                "Khởi động khớp kỹ trước khi tập; ưu tiên form chuẩn hơn số lần lặp.",
                new TempoRuleDto(2, 0, 1, 0, 0.5),
                "FALLBACK",
                List.of("Gemini không khả dụng - nội dung là dữ liệu mẫu, chưa phải phân tích riêng cho động tác này.")
        );
        // Không cache dữ liệu mẫu để lần sau thử gọi Gemini lại
        return response;
    }

    // =========================================================================
    // 2. GENERATE WORKOUT PLAN (GIÁO ÁN LỘ TRÌNH VỚI GEMINI & VALIDATION TRÙNG LẶP)
    // =========================================================================
    public GenerateWorkoutPlanResponse generateWorkoutPlan(GenerateWorkoutPlanRequest req) {
        String goal = req.planGoal() != null ? req.planGoal() : "HYPERTROPHY";
        String level = req.targetLevel() != null ? req.targetLevel() : "INTERMEDIATE";
        int days = req.daysPerWeek() > 0 ? req.daysPerWeek() : 4;
        int weeks = req.totalWeeks() > 0 ? req.totalWeeks() : 8;
        String skill = req.focusSkill() != null ? req.focusSkill().trim() : "Core & Strength";

        String cacheKey = String.format("ai:gen:plan:%s:%s:%d:%d:%s",
                goal, level, days, weeks, deduplicationService.toSlug(skill));

        Optional<GenerateWorkoutPlanResponse> cached = cacheService.get(cacheKey, GenerateWorkoutPlanResponse.class);
        if (cached.isPresent()) {
            log.info("Redis cache HIT for workout plan generation: [{}]", cacheKey);
            return cached.get();
        }

        // 1. First attempt: Call Google Gemini Generative AI
        GenerateWorkoutPlanResponse geminiResponse = callGeminiForWorkoutPlan(req, goal, level, days, weeks);
        if (geminiResponse != null) {
            cacheService.set(cacheKey, geminiResponse, 86400);
            return geminiResponse;
        }

        // 2. Fallback: CalisHealth Sports-Science Biomechanical Rule Engine
        log.info("Using CalisHealth Rule Engine fallback for workout plan generation");
        String baseTitle = (skill != null && !skill.isBlank() && !skill.equalsIgnoreCase("none"))
                ? String.format("Lộ Trình Calisthenics %s: %s - %d Tuần (%s)", goal.replace("_", " "), skill, weeks, level)
                : String.format("Lộ Trình Calisthenics %s - Chu Kỳ %d Tuần (%s)", goal.replace("_", " "), weeks, level);

        var dupCheck = deduplicationService.checkPlanDuplicates(baseTitle, goal, level, req.existingPlanNames(), 0.75);
        String planTitle = dupCheck.isDuplicate() ? dupCheck.suggestedUniqueTitle() : baseTitle;
        String deduplicationNote = dupCheck.isDuplicate()
                ? String.format("Phát hiện tương đồng %.0f%% với giáo án '%s'. Đã tự động điều chỉnh thành biến thể độc nhất.", dupCheck.similarityScore() * 100, dupCheck.conflictingPlanName())
                : "Giáo án mới độc quyền cho học viên, xác thực 100% không trùng lặp.";

        List<WorkoutDayPlanDto> sampleDays = new ArrayList<>();
        sampleDays.add(new WorkoutDayPlanDto(1, "Buổi 1: Thân Trên Đẩy (Upper Push Focus)", "CHEST_AND_TRICEPS", List.of(
                new WorkoutExerciseItemDto("Push-Up tiêu chuẩn", 4, "12 - 15 reps", 90, "RPE 8, kiểm soát 2s hạ"),
                new WorkoutExerciseItemDto("Dips xà kép", 3, "8 - 10 reps", 120, "Hạ vuông góc 90 độ"),
                new WorkoutExerciseItemDto("Pike Push-Up", 3, "10 reps", 90, "Tập trung vai trước"),
                new WorkoutExerciseItemDto("Diamond Push-Up", 3, "12 reps", 60, "Kích hoạt tay sau tối đa")
        )));

        sampleDays.add(new WorkoutDayPlanDto(2, "Buổi 2: Thân Trên Kéo & Lưng (Upper Pull Focus)", "BACK_AND_BICEPS", List.of(
                new WorkoutExerciseItemDto("Pull-Up (Hít xà đơn)", 4, "6 - 8 reps", 120, "Cằm vượt xà ngang"),
                new WorkoutExerciseItemDto("Australian Row (Kéo xà thấp)", 4, "12 reps", 90, "Ép chặt 2 xương bả vai"),
                new WorkoutExerciseItemDto("Chin-Up (Tay ngửa)", 3, "8 reps", 90, "Tập trung bắp tay trước"),
                new WorkoutExerciseItemDto("Scapular Pulls", 3, "15 reps", 60, "Khởi động và khỏe khớp bả vai")
        )));

        sampleDays.add(new WorkoutDayPlanDto(3, "Buổi 3: Thân Dưới & Cơ Lõi (Legs & Core Dynamic)", "LEGS_AND_CORE", List.of(
                new WorkoutExerciseItemDto("Bodyweight Squat", 4, "20 reps", 90, "Hông sâu qua đầu gối"),
                new WorkoutExerciseItemDto("Walking Lunges", 3, "12 reps/bên", 90, "Trục gối ổn định"),
                new WorkoutExerciseItemDto("Hanging Leg Raise (Nâng chân xà)", 4, "10 - 12 reps", 90, "Không đung đưa"),
                new WorkoutExerciseItemDto("Plank giữ tĩnh", 3, "60 giây", 60, "Siết chặt cơ mông và bụng")
        )));

        if (days >= 4) {
            sampleDays.add(new WorkoutDayPlanDto(4, "Buổi 4: Kỹ Năng & Thể Lực Tổng Hợp (Skill & Conditioning)", "FULL_BODY_SKILL", List.of(
                    new WorkoutExerciseItemDto("Handstand Wall Hold (Chuối dựa tường)", 4, "30 - 45 giây", 120, "Đẩy vai cao"),
                    new WorkoutExerciseItemDto("L-Sit Progression", 4, "15 - 20 giây", 90, "Khóa chặt khớp gối"),
                    new WorkoutExerciseItemDto("Burpees tiêu chuẩn", 3, "15 reps", 60, "Nhịp tim hiit bùng nổ")
            )));
        }

        if (days >= 5) {
            sampleDays.add(new WorkoutDayPlanDto(5, "Buổi 5: Bổ Trợ Khớp & Phục Hồi Tích Cực (Mobility & Core)", "MOBILITY_CORE", List.of(
                    new WorkoutExerciseItemDto("Hollow Body Hold", 4, "30 giây", 60, "Khóa chặt sống lưng sát sàn"),
                    new WorkoutExerciseItemDto("Deep Squat Hold", 3, "45 giây", 60, "Mở rộng khớp háng và cổ chân"),
                    new WorkoutExerciseItemDto("Dead Hang (Treo xà thả lỏng)", 3, "60 giây", 90, "Giải phóng áp lực đốt sống")
            )));
        }

        List<String> progression = List.of(
                "Tuần 1 - 2: Thích nghi thần kinh cơ (Acclimatization) với RPE 7-8.",
                "Tuần 3 - 5: Quá tải tăng tiến (Progressive Overload) tăng thêm 1-2 reps mỗi set.",
                "Tuần 6: Tuần giảm tải (Deload Week) giảm 40% volume để phục hồi hệ thần kinh.",
                "Tuần 7 - 8: Kiểm tra đỉnh cao thể lực (Peak Performance Testing)."
        );

        GenerateWorkoutPlanResponse response = new GenerateWorkoutPlanResponse(
                true,
                planTitle,
                goal,
                level,
                weeks,
                days,
                String.format("Giáo án chuẩn hóa sinh cơ học %d tuần được thiết kế cho mục tiêu %s, phân bổ tỷ lệ khối lượng cơ và khớp phục hồi tối ưu.", weeks, goal),
                List.of("Thứ 2: Push", "Thứ 3: Nghỉ", "Thứ 4: Pull", "Thứ 5: Legs & Core", "Thứ 6: Nghỉ", "Thứ 7: Skill", "Chủ nhật: Nghỉ"),
                sampleDays,
                progression,
                deduplicationNote,
                dupCheck.isDuplicate(),
                dupCheck.similarityScore(),
                dupCheck.conflictingPlanName(),
                dupCheck.suggestedUniqueTitle()
        );

        cacheService.set(cacheKey, response, 86400);
        return response;
    }

    private GenerateWorkoutPlanResponse callGeminiForWorkoutPlan(GenerateWorkoutPlanRequest req, String goal, String level, int days, int weeks) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return null;
        }

        try {
            String existingNamesStr = (req.existingPlanNames() != null && !req.existingPlanNames().isEmpty())
                    ? String.join(", ", req.existingPlanNames())
                    : "Chưa có";

            String prompt = String.format("""
                    Bạn là Chuyên gia Huấn luyện Calisthenics (CalisHealth AI Engine).
                    Hãy tạo 1 giáo án lộ trình tập luyện Calisthenics hoàn chỉnh với tiêu chí sau:
                    - Mục tiêu chính: %s
                    - Cấp độ thể lực: %s
                    - Số buổi tập/tuần: %d buổi
                    - Tổng thời lượng: %d tuần
                    - Kỹ năng/Động tác trọng tâm: %s
                    - Thiết bị: %s
                    - Danh sách các giáo án ĐÃ CÓ trong hệ thống (BẮT BUỘC TRÁNH TRÙNG LẶP): [%s]

                    QUY TẮC BẮT BUỘC VỀ TRÁNH TRÙNG LẶP (DEDUPLICATION RULES):
                    1. Tên giáo án ("planTitle") PHẢI ĐỘC NHẤT, KHÔNG ĐƯỢC đặt tên giống hoặc tương tự trên 70%% với bất kỳ giáo án nào đã có.
                    2. Trong mỗi buổi tập ("sampleWeekDays"), TUYỆT ĐỐI KHÔNG ĐƯỢC có bài tập trùng lặp nhau (Zero duplicate exercises per session).
                    3. Bố trí lịch tập hợp lý: Đảm bảo nguyên tắc phục hồi cơ (tối thiểu 48h nghỉ giữa các buổi cùng nhóm cơ chính Push/Pull/Legs).

                    TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON (không giải thích, không markdown code fence):
                    {
                      "planTitle": "Tên giáo án độc nhất",
                      "description": "Mô tả chuyên sâu và lời khuyên HLV",
                      "weeklyScheduleOverview": ["Thứ 2: ...", "Thứ 3: Nghỉ", "Thứ 4: ..."],
                      "sampleWeekDays": [
                        {
                          "dayNumber": 1,
                          "dayTitle": "Buổi 1: Thân Trên Đẩy (Push Focus)",
                          "focusCategory": "CHEST_AND_TRICEPS",
                          "exercises": [
                            {
                              "exerciseName": "Tên bài tập tiếng Việt hoặc chuẩn quốc tế",
                              "sets": 4,
                              "repsOrDuration": "10-12 reps",
                              "restSeconds": 90,
                              "intensityNotes": "RPE 8, tempo 2-0-1-0"
                            }
                          ]
                        }
                      ],
                      "progressionStrategy": [
                        "Tuần 1-2: Thích nghi thần kinh cơ...",
                        "Tuần 3-4: Quá tải tăng tiến...",
                        "Tuần 5-6: Nâng cao biến thể...",
                        "Tuần 7-8: Giảm tải và kiểm tra đỉnh phong độ..."
                      ]
                    }
                    """,
                    goal, level, days, weeks,
                    req.focusSkill() != null ? req.focusSkill() : "Toàn diện",
                    req.availableEquipment() != null ? String.join(", ", req.availableEquipment()) : "Bodyweight, Xà đơn, Xà kép",
                    existingNamesStr);

            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(part));
            Map<String, Object> generationConfig = Map.of(
                    "responseMimeType", "application/json",
                    "maxOutputTokens", 8192
            );
            Map<String, Object> bodyObj = Map.of(
                    "contents", List.of(content),
                    "generationConfig", generationConfig
            );

            String requestBody = objectMapper.writeValueAsString(bodyObj);
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + geminiApiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(90))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
                if (!textNode.isMissingNode()) {
                    String rawText = textNode.asString().trim();
                    if (rawText.startsWith("```json")) {
                        rawText = rawText.substring(7);
                    } else if (rawText.startsWith("```")) {
                        rawText = rawText.substring(3);
                    }
                    if (rawText.endsWith("```")) {
                        rawText = rawText.substring(0, rawText.length() - 3);
                    }
                    rawText = rawText.trim();

                    JsonNode planJson = objectMapper.readTree(rawText);
                    String planTitle = planJson.path("planTitle").asString("Lộ Trình Calisthenics Chuyên Biệt AI");
                    String description = planJson.path("description").asString("Lộ trình thiết kế tự động bởi CalisHealth AI Engine.");

                    List<String> overview = new ArrayList<>();
                    if (planJson.has("weeklyScheduleOverview")) {
                        for (JsonNode n : planJson.get("weeklyScheduleOverview")) {
                            overview.add(n.asString());
                        }
                    }

                    List<WorkoutDayPlanDto> daysList = new ArrayList<>();
                    if (planJson.has("sampleWeekDays")) {
                        for (JsonNode dNode : planJson.get("sampleWeekDays")) {
                            int dNum = dNode.path("dayNumber").asInt(daysList.size() + 1);
                            String dTitle = dNode.path("dayTitle").asString("Buổi " + dNum);
                            String dFocus = dNode.path("focusCategory").asString("GENERAL");

                            List<WorkoutExerciseItemDto> exercises = new ArrayList<>();
                            Set<String> seenExNames = new HashSet<>();
                            if (dNode.has("exercises")) {
                                for (JsonNode exNode : dNode.get("exercises")) {
                                    String exName = exNode.path("exerciseName").asString("Exercise");
                                    String exSlug = deduplicationService.toSlug(exName);
                                    if (seenExNames.contains(exSlug)) {
                                        continue; // DEDUPLICATE: Skip duplicate exercise in same day
                                    }
                                    seenExNames.add(exSlug);

                                    exercises.add(new WorkoutExerciseItemDto(
                                            exName,
                                            exNode.path("sets").asInt(3),
                                            exNode.path("repsOrDuration").asString("10 reps"),
                                            exNode.path("restSeconds").asInt(90),
                                            exNode.path("intensityNotes").asString("Form chuẩn")
                                    ));
                                }
                            }
                            daysList.add(new WorkoutDayPlanDto(dNum, dTitle, dFocus, exercises));
                        }
                    }

                    List<String> prog = new ArrayList<>();
                    if (planJson.has("progressionStrategy")) {
                        for (JsonNode n : planJson.get("progressionStrategy")) {
                            prog.add(n.asString());
                        }
                    }

                    var dupCheck = deduplicationService.checkPlanDuplicates(planTitle, goal, level, req.existingPlanNames(), 0.75);
                    String finalTitle = dupCheck.isDuplicate() ? dupCheck.suggestedUniqueTitle() : planTitle;
                    String note = dupCheck.isDuplicate()
                            ? "AI Gemini đã phát hiện tương đồng với giáo án có sẵn và tự động tinh chỉnh thành phiên bản độc nhất."
                            : "AI Gemini đã sinh lộ trình mới độc nhất 100%, bảo đảm không trùng lặp.";

                    return new GenerateWorkoutPlanResponse(
                            true,
                            finalTitle,
                            goal,
                            level,
                            weeks,
                            days,
                            description,
                            overview.isEmpty() ? List.of("Lịch tập chuẩn hóa") : overview,
                            daysList,
                            prog.isEmpty() ? List.of("Tăng tiến tuần tự") : prog,
                            note,
                            dupCheck.isDuplicate(),
                            dupCheck.similarityScore(),
                            dupCheck.conflictingPlanName(),
                            dupCheck.suggestedUniqueTitle()
                    );
                }
            } else {
                log.warn("Gemini API returned status {}: {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Failed to generate plan with Gemini API: {}", e.getMessage());
        }
        return null;
    }

    public ValidateWorkoutPlanResponse validateWorkoutPlan(ValidateWorkoutPlanRequest req) {
        var check = deduplicationService.checkPlanDuplicates(
                req.planName(),
                req.planGoal(),
                req.targetLevel(),
                req.existingPlanNames(),
                0.75
        );
        return new ValidateWorkoutPlanResponse(
                check.isDuplicate(),
                check.similarityScore(),
                check.conflictingPlanName(),
                check.message(),
                check.suggestedUniqueTitle()
        );
    }

    // =========================================================================
    // 3. GENERATE PHYSICAL ASSESSMENT (HỆ THỐNG ĐÁNH GIÁ THỂ LỰC)
    // =========================================================================
    public GenerateAssessmentResponse generateAssessment(GenerateAssessmentRequest req) {
        String name = req.assessmentName() != null ? req.assessmentName() : "Bài Đánh Giá Thể Lực Đầu Vào Calisthenics";
        String cacheKey = "ai:gen:assessment:" + deduplicationService.toSlug(name);

        Optional<GenerateAssessmentResponse> cached = cacheService.get(cacheKey, GenerateAssessmentResponse.class);
        if (cached.isPresent()) {
            return cached.get();
        }

        List<AssessmentTestItemDto> tests = List.of(
                new AssessmentTestItemDto("Hít đất tiêu chuẩn (Max Rep Push-Up)", "Thực hiện tối đa số rep đúng form không giới hạn thời gian", "Không giới hạn", "Khuỷu tay ≤ 90° đáy rep, thân người thẳng 180°", "Dừng bài test nếu nghỉ quá 3 giây ở đỉnh hoặc sụp lưng"),
                new AssessmentTestItemDto("Hít xà đơn (Strict Pull-Up)", "Thực hiện tối đa số rep dead-hang cằm qua xà", "Không giới hạn", "Cằm vượt xà ngang, chân không co đạp lấy đà", "Không tính rep nếu đung đưa chân kipping"),
                new AssessmentTestItemDto("Plank giữ tĩnh (Isometric Plank)", "Giữ tư thế plank chuẩn liên tục", "Tối đa 180 giây", "Cột sống thẳng 180°, gồng cứng cơ mông và bụng", "Dừng bài test nếu hông võng xuống sàn quá 5cm"),
                new AssessmentTestItemDto("Squat không tạ (Bodyweight Squat 60s)", "Số rep squat sâu hoàn chỉnh trong 60 giây", "60 giây", "Hông sâu hơn đầu gối, gót chân bám chặt sàn", "Không tính rep nếu nhón gót hoặc nửa rep")
        );

        List<BenchmarkTierDto> tiers = List.of(
                new BenchmarkTierDto("ELITE", "Vận động viên / Huấn luyện viên cấp cao (> 20 Pull-up, > 50 Push-up)", 90, 100, "Phân loại vào Lộ trình Master Skills (Planche, Muscle-up, Front Lever)"),
                new BenchmarkTierDto("ADVANCED", "Học viên nâng cao (12 - 18 Pull-up, 35 - 50 Push-up)", 75, 89, "Phân loại vào Lộ trình Tăng sức mạnh bùng nổ Weighted Calisthenics"),
                new BenchmarkTierDto("INTERMEDIATE", "Học viên trung cấp (6 - 11 Pull-up, 20 - 34 Push-up)", 50, 74, "Phân loại vào Lộ trình Xây dựng khối lượng cơ bắp Hypertrophy"),
                new BenchmarkTierDto("BEGINNER", "Học viên mới nhập môn (< 5 Pull-up, < 15 Push-up)", 0, 49, "Phân loại vào Khóa Dự Bị Nền Tảng Khớp & Cơ Bản (Foundations)")
        );

        List<String> penalties = List.of(
                "Lỗi No-Rep do không đủ độ sâu: Trừ 1 điểm/rep.",
                "Lỗi cong lưng / sụp hông trong lúc thực hiện: Cảnh báo lần 1, trừ điểm lần 2.",
                "Lỗi co đạp chân lấy đà: Hủy kết quả của hiệp đó."
        );

        GenerateAssessmentResponse response = new GenerateAssessmentResponse(
                true,
                name,
                "Hệ thống kiểm định chuẩn hóa 4 trụ cột thể lực Calisthenics: Sức bền cơ bắp, Sức mạnh tương đối, Độ ổn định trục thân người và Biên độ vận động khớp.",
                "TOÀN DIỆN (FULL SPECTRUM)",
                tests,
                tiers,
                penalties,
                "Hệ thống tiêu chí chuẩn hóa, tự động phân luồng bài tập cho học viên."
        );

        cacheService.set(cacheKey, response, 86400);
        return response;
    }

    // =========================================================================
    // 4. GENERATE MOTION RULES (BỘ QUY TẮC AI & BIOMECHANICS)
    // =========================================================================
    public GenerateMotionRulesResponse generateMotionRules(GenerateMotionRulesRequest req) {
        String name = req.exerciseName() != null ? req.exerciseName() : "Push-Up";
        String pattern = req.movementPattern() != null ? req.movementPattern() : inferMovementPattern(name);

        // 1. Gemini phân tích riêng cho động tác (đã kiểm tra góc 0-180°, enum, động tác tĩnh không đếm rep...)
        Optional<GenerateMotionRulesResponse> fromGemini = exerciseAiGemini.generateMotionRules(req, name, pattern);
        if (fromGemini.isPresent()) {
            return fromGemini.get();
        }
        log.warn("Gemini không khả dụng -> dùng bộ quy tắc mẫu theo loại chuyển động cho [{}]", name);

        // 2. Dự phòng: 3 bộ quy tắc mẫu (kéo / chân / đẩy) chọn theo từ khóa

        Set<String> existingJointSignatures = new HashSet<>(req.existingJointRules() != null ? req.existingJointRules() : List.of());
        Set<String> existingErrorNames = new HashSet<>(req.existingErrorRules() != null ? req.existingErrorRules() : List.of());

        List<GeneratedJointRuleDto> newJointRules = new ArrayList<>();
        List<GeneratedErrorRuleDto> newErrorRules = new ArrayList<>();
        List<Integer> recommendedLandmarks;

        if (pattern.contains("Pull") || name.toLowerCase().contains("pull") || name.toLowerCase().contains("xà")) {
            // PULL EXERCISE
            recommendedLandmarks = List.of(0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26);

            addRuleIfUnique(newJointRules, existingJointSignatures,
                    new GeneratedJointRuleDto("ĐỘ SÂU ĐÁY REP (BOTTOM ROM)", "Elbow Angle (Góc khuỷu tay)", "LESS_THAN", 60, null, 5,
                            "REP_COUNT_TRIGGER", "Cằm vượt thanh xà hoàn chỉnh, đạt chuẩn 1 rep!", "CONCENTRIC_PEAK"));

            addRuleIfUnique(newJointRules, existingJointSignatures,
                    new GeneratedJointRuleDto("KHÓA KHỚP ĐỈNH (DEAD HANG)", "Elbow Angle (Góc khuỷu tay)", "GREATER_THAN", 165, null, 5,
                            "FORM_CUE", "Thả lỏng duỗi tay hoàn toàn trước khi bắt đầu rep mới.", "ECCENTRIC_BOTTOM"));

            addErrorIfUnique(newErrorRules, existingErrorNames,
                    new GeneratedErrorRuleDto("Đung đưa chân lấy đà (Kipping)", "Stability",
                            "Dao động khớp háng quá 25 độ tạo lực quán tính", "WARNING",
                            "Phát hiện đà đung đưa từ chân.", "Khép chặt 2 chân và dùng 100% lực cơ lưng.", true));
        } else if (pattern.contains("Squat") || pattern.contains("Lunge") || name.toLowerCase().contains("squat")) {
            // LEGS EXERCISE
            recommendedLandmarks = List.of(11, 12, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32);

            addRuleIfUnique(newJointRules, existingJointSignatures,
                    new GeneratedJointRuleDto("ĐỘ SÂU SQUAT (PARALLEL DEPTH)", "Knee Angle (Góc đầu gối)", "LESS_THAN", 85, null, 5,
                            "REP_COUNT_TRIGGER", "Đạt chuẩn độ sâu Squat song song mặt sàn!", "BOTTOM"));

            addRuleIfUnique(newJointRules, existingJointSignatures,
                    new GeneratedJointRuleDto("KHÓA HÔNG TRÊN ĐỈNH (TOP LOCKOUT)", "Knee Angle (Góc đầu gối)", "GREATER_THAN", 165, null, 5,
                            "FORM_CUE", "Đứng thẳng người hoàn toàn khóa hông.", "TOP"));

            addErrorIfUnique(newErrorRules, existingErrorNames,
                    new GeneratedErrorRuleDto("Gối chụm vào trong (Knee Valgus)", "Joint Position",
                            "Hai đầu gối khép vào trong nhỏ hơn độ rộng mắt cá chân", "CRITICAL",
                            "Đầu gối đang bị chụm vào trong nguy hiểm.", "Chủ động mở rộng đầu gối theo hướng mũi chân.", false));
        } else {
            // PUSH OR GENERAL EXERCISE
            recommendedLandmarks = List.of(11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28);

            addRuleIfUnique(newJointRules, existingJointSignatures,
                    new GeneratedJointRuleDto("ĐỘ SÂU CHẠM ĐÁY (CHEST DEPTH)", "Elbow Angle (Góc khuỷu tay)", "LESS_THAN", 90, null, 5,
                            "REP_COUNT_TRIGGER", "Hạ đủ độ sâu tối thiểu, góc khuỷu tay 90 độ!", "BOTTOM"));

            addRuleIfUnique(newJointRules, existingJointSignatures,
                    new GeneratedJointRuleDto("TRỤC THÂN NGƯỜI (SPINE ALIGNMENT)", "Hip Spine Trunk Angle (Trục cột sống - hông)", "BETWEEN", 175, 185.0, 5,
                            "WARNING", "Giữ thân người thẳng tắp, gồng chặt cơ bụng.", "ECCENTRIC"));

            addErrorIfUnique(newErrorRules, existingErrorNames,
                    new GeneratedErrorRuleDto("Võng lưng / Sụp hông (Sagging Hips)", "Alignment",
                            "Trục cột sống hông lệch quá 20 độ so với đường thẳng", "CRITICAL",
                            "Lưng đang bị võng sâu xuống sàn.", "Gồng chặt cơ bụng và siết cơ mông để nâng hông thẳng hàng.", true));
        }

        // Động tác giữ tĩnh không có khái niệm đếm rep
        List<GeneratedJointRuleDto> jointRules = "Static Hold".equals(pattern)
                ? newJointRules.stream().map(r -> "REP_COUNT_TRIGGER".equals(r.action())
                        ? new GeneratedJointRuleDto(r.ruleRoleName(), r.measurement(), r.condition(), r.targetValue(), r.secondaryValue(),
                                r.tolerance(), "WARNING", r.voicePromptVi(), r.movementPhase())
                        : r).toList()
                : newJointRules;

        String deduplicationReport = String.format("DỮ LIỆU MẪU (Gemini không phản hồi): bộ quy tắc chung cho nhóm chuyển động, "
                        + "%d quy tắc góc, %d lỗi sai. Cần kiểm tra lại số liệu cho đúng động tác.",
                jointRules.size(), newErrorRules.size());

        return new GenerateMotionRulesResponse(
                true,
                name,
                recommendedLandmarks,
                "SIDE_45_DEGREE",
                80,
                jointRules,
                newErrorRules,
                deduplicationReport,
                List.of(),
                null,
                "FALLBACK",
                List.of("Gemini không khả dụng - đây là quy tắc mẫu theo loại chuyển động, chưa phải phân tích riêng cho động tác này.")
        );
    }

    private void addRuleIfUnique(List<GeneratedJointRuleDto> targetList, Set<String> existingSignatures, GeneratedJointRuleDto candidate) {
        String sig = deduplicationService.generateRuleSignature(candidate.measurement(), candidate.movementPhase(), candidate.condition());
        if (!deduplicationService.isRuleDuplicate(sig, existingSignatures)) {
            targetList.add(candidate);
            existingSignatures.add(sig);
        }
    }

    private void addErrorIfUnique(List<GeneratedErrorRuleDto> targetList, Set<String> existingErrorNames, GeneratedErrorRuleDto candidate) {
        if (!existingErrorNames.contains(candidate.ruleName())) {
            targetList.add(candidate);
            existingErrorNames.add(candidate.ruleName());
        }
    }

    private String inferMovementPattern(String name) {
        String lower = name.toLowerCase();
        if (lower.contains("pull") || lower.contains("xà") || lower.contains("row") || lower.contains("chin")) {
            return "Vertical Pull";
        }
        if (lower.contains("squat") || lower.contains("lunge") || lower.contains("chân")) {
            return "Squat";
        }
        if (lower.contains("dip") || lower.contains("kép")) {
            return "Vertical Push";
        }
        if (lower.contains("plank") || lower.contains("core") || lower.contains("hollow") || lower.contains("bụng")) {
            return "Static Hold";
        }
        return "Horizontal Push";
    }
}
