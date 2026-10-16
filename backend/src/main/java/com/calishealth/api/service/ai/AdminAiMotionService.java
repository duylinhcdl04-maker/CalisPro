package com.calishealth.api.service.ai;

import com.calishealth.api.dto.AiMotionDtos.*;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import com.calishealth.api.service.motion.LegacyMotionRuleConverter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminAiMotionService {
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AdminAiMotionService.class);

    private final ExerciseAiProfileRepository profileRepo;
    private final AiLandmarkRequirementRepository landmarkRepo;
    private final AiMotionRuleRepository ruleRepo;
    private final AiVoiceConfigurationRepository voiceConfigRepo;
    private final AiVoiceWarningCacheRepository cacheRepo;
    private final AiConfigurationVersionRepository versionRepo;
    private final AiConfigurationAuditLogRepository auditRepo;
    private final ExerciseRepository exerciseRepo;
    private final RuleEvaluator ruleEvaluator;
    private final GeminiTtsService geminiTtsService;
    private final ViettelTtsService viettelTtsService;
    private final LegacyMotionRuleConverter ruleConverter;

    public AdminAiMotionService(
            ExerciseAiProfileRepository profileRepo,
            AiLandmarkRequirementRepository landmarkRepo,
            AiMotionRuleRepository ruleRepo,
            AiVoiceConfigurationRepository voiceConfigRepo,
            AiVoiceWarningCacheRepository cacheRepo,
            AiConfigurationVersionRepository versionRepo,
            AiConfigurationAuditLogRepository auditRepo,
            ExerciseRepository exerciseRepo,
            RuleEvaluator ruleEvaluator,
            GeminiTtsService geminiTtsService,
            ViettelTtsService viettelTtsService,
            LegacyMotionRuleConverter ruleConverter
    ) {
        this.profileRepo = profileRepo;
        this.landmarkRepo = landmarkRepo;
        this.ruleRepo = ruleRepo;
        this.voiceConfigRepo = voiceConfigRepo;
        this.cacheRepo = cacheRepo;
        this.versionRepo = versionRepo;
        this.auditRepo = auditRepo;
        this.exerciseRepo = exerciseRepo;
        this.ruleEvaluator = ruleEvaluator;
        this.geminiTtsService = geminiTtsService;
        this.viettelTtsService = viettelTtsService;
        this.ruleConverter = ruleConverter;
    }

    @Transactional
    public List<AiProfileDto> listAllProfiles() {
        // Ensure all exercises in database have an AI Profile
        List<Exercise> allExercises = exerciseRepo.findAll();
        for (Exercise ex : allExercises) {
            if (profileRepo.findFirstByExerciseIdOrderByCreatedAtDesc(ex.getId()).isEmpty()) {
                createDefaultProfileForExercise(ex);
            }
        }
        return profileRepo.findAll().stream().map(this::toProfileDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MotionRuleDto> getRulesByProfileId(Long profileId) {
        return ruleRepo.findByAiProfileIdOrderByPriorityDesc(profileId)
                .stream()
                .map(r -> new MotionRuleDto(
                        r.getId(),
                        r.getRuleCode(),
                        r.getRuleName(),
                        r.getRuleType(),
                        r.getMetricType(),
                        r.getOperator(),
                        r.getThresholdMin(),
                        r.getThresholdMax(),
                        r.getWarningThreshold(),
                        r.getCriticalThreshold(),
                        r.getSeverity(),
                        r.isInvalidRep(),
                        r.isEnabled(),
                        r.getPriority(),
                        r.getFeedbackMessage(),
                        r.getVoicePrompt()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public MotionRuleDto saveRule(MotionRuleDto r) {
        AiMotionRule rule = (r.id() != null)
                ? ruleRepo.findById(r.id()).orElse(new AiMotionRule())
                : new AiMotionRule();

        // Bản đã gửi duyệt / xuất bản / lưu trữ chỉ được đổi qua Motion Rule Engine (tạo phiên bản mới, có audit)
        if (rule.getStatus() != null && !"DRAFT".equals(rule.getStatus())) {
            throw new IllegalStateException("Rule " + rule.getRuleCode() + " v" + rule.getRuleVersion() + " đang ở trạng thái "
                    + rule.getStatus() + " — hãy sửa trong Motion Rule Engine để tạo phiên bản mới.");
        }
        if (rule.getAiProfile() == null) {
            ExerciseAiProfile profile = profileRepo.findFirstByOrderByIdAsc()
                    .orElseGet(() -> createDefaultProfileForExercise(exerciseRepo.findAll().get(0)));
            rule.setAiProfile(profile);
        }

        if (r.ruleCode() != null) rule.setRuleCode(r.ruleCode());
        if (r.ruleName() != null) rule.setRuleName(r.ruleName());
        if (r.ruleType() != null) rule.setRuleType(r.ruleType());
        if (r.metricType() != null) rule.setMetricType(r.metricType());
        if (r.operator() != null) rule.setOperator(r.operator());
        if (r.thresholdMin() != null) rule.setThresholdMin(r.thresholdMin());
        if (r.thresholdMax() != null) rule.setThresholdMax(r.thresholdMax());
        if (r.warningThreshold() != null) rule.setWarningThreshold(r.warningThreshold());
        if (r.criticalThreshold() != null) rule.setCriticalThreshold(r.criticalThreshold());
        if (r.severity() != null) rule.setSeverity(r.severity());
        rule.setInvalidRep(r.invalidRep());
        rule.setEnabled(r.enabled());
        rule.setPriority(r.priority());
        if (r.feedbackMessage() != null) rule.setFeedbackMessage(r.feedbackMessage());
        if (r.voicePrompt() != null) rule.setVoicePrompt(r.voicePrompt());

        rule.setStatus(null);   // chuẩn hoá lại (toán tử/vùng chuẩn) theo giá trị form cũ vừa nhập -> DRAFT
        ruleConverter.convert(rule);
        rule = ruleRepo.save(rule);

        return new MotionRuleDto(
                rule.getId(),
                rule.getRuleCode(),
                rule.getRuleName(),
                rule.getRuleType(),
                rule.getMetricType(),
                rule.getOperator(),
                rule.getThresholdMin(),
                rule.getThresholdMax(),
                rule.getWarningThreshold(),
                rule.getCriticalThreshold(),
                rule.getSeverity(),
                rule.isInvalidRep(),
                rule.isEnabled(),
                rule.getPriority(),
                rule.getFeedbackMessage(),
                rule.getVoicePrompt()
        );
    }

    @Transactional
    public void deleteRule(Long ruleId) {
        ruleRepo.findById(ruleId).filter(r -> r.getStatus() != null && !"DRAFT".equals(r.getStatus())).ifPresent(r -> {
            throw new IllegalStateException("Không xoá được rule đã gửi duyệt / xuất bản (lịch sử phiên bản) — hãy lưu trữ (archive).");
        });
        ruleRepo.deleteById(ruleId);
        ruleRepo.flush();
        ruleConverter.cleanupOrphanThresholds();
    }

    @Transactional
    public AiProfileDto getProfileByExercise(Long exerciseId) {
        Optional<ExerciseAiProfile> opt = profileRepo.findFirstByExerciseIdOrderByCreatedAtDesc(exerciseId);
        if (opt.isPresent()) {
            return toProfileDto(opt.get());
        }
        
        // Auto initialize default profile if exercise exists
        Exercise exercise = exerciseRepo.findById(exerciseId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài tập với ID: " + exerciseId));
        
        ExerciseAiProfile profile = createDefaultProfileForExercise(exercise);
        return toProfileDto(profile);
    }

    @Transactional
    public AiProfileDto saveProfile(Long exerciseId, SaveAiProfileRequest req) {
        Exercise exercise = exerciseRepo.findById(exerciseId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài tập với ID: " + exerciseId));

        ExerciseAiProfile profile = profileRepo.findFirstByExerciseIdOrderByCreatedAtDesc(exerciseId)
                .orElse(new ExerciseAiProfile());

        profile.setExercise(exercise);
        if (req.profileName() != null) profile.setProfileName(req.profileName().trim());
        if (req.poseModel() != null) profile.setPoseModel(req.poseModel());
        if (req.trackingMode() != null) profile.setTrackingMode(req.trackingMode());
        if (req.analysisEnabled() != null) profile.setAnalysisEnabled(req.analysisEnabled());
        if (req.repCountingEnabled() != null) profile.setRepCountingEnabled(req.repCountingEnabled());
        if (req.formAnalysisEnabled() != null) profile.setFormAnalysisEnabled(req.formAnalysisEnabled());
        if (req.voiceWarningEnabled() != null) profile.setVoiceWarningEnabled(req.voiceWarningEnabled());
        if (req.textWarningEnabled() != null) profile.setTextWarningEnabled(req.textWarningEnabled());
        if (req.version() != null) profile.setVersion(req.version());
        if (req.status() != null) profile.setStatus(req.status());
        if (req.repStartCondition() != null) profile.setRepStartCondition(req.repStartCondition());
        if (req.repDownCondition() != null) profile.setRepDownCondition(req.repDownCondition());
        if (req.repUpCondition() != null) profile.setRepUpCondition(req.repUpCondition());
        if (req.minRepDurationMs() != null) profile.setMinRepDurationMs(req.minRepDurationMs());
        if (req.maxRepDurationMs() != null) profile.setMaxRepDurationMs(req.maxRepDurationMs());
        if (req.debounceTimeMs() != null) profile.setDebounceTimeMs(req.debounceTimeMs());
        if (req.minRomPercentage() != null) profile.setMinRomPercentage(req.minRomPercentage());

        profile = profileRepo.save(profile);

        // Update landmarks if provided
        if (req.landmarks() != null) {
            landmarkRepo.deleteByAiProfileId(profile.getId());
            for (LandmarkRequirementDto l : req.landmarks()) {
                AiLandmarkRequirement lr = new AiLandmarkRequirement();
                lr.setAiProfile(profile);
                lr.setLandmarkName(l.landmarkName());
                lr.setLandmarkIndex(l.landmarkIndex() != null ? l.landmarkIndex() : 0);
                lr.setRequired(Boolean.TRUE.equals(l.required()));
                lr.setMinVisibility(l.minVisibility() != null ? l.minVisibility() : 0.65);
                lr.setSide(l.side() != null ? l.side() : "BOTH");
                landmarkRepo.save(lr);
            }
        }

        // Update rules if provided
        if (req.rules() != null) {
            for (MotionRuleDto r : req.rules()) {
                AiMotionRule rule = (r.id() != null)
                        ? ruleRepo.findById(r.id()).orElse(new AiMotionRule())
                        : new AiMotionRule();
                rule.setAiProfile(profile);
                rule.setRuleCode(r.ruleCode());
                rule.setRuleName(r.ruleName());
                rule.setRuleType(r.ruleType() != null ? r.ruleType() : "FORM_CHECK");
                rule.setMetricType(r.metricType() != null ? r.metricType() : "ANGLE");
                rule.setOperator(r.operator() != null ? r.operator() : "BETWEEN");
                rule.setThresholdMin(r.thresholdMin());
                rule.setThresholdMax(r.thresholdMax());
                rule.setWarningThreshold(r.warningThreshold());
                rule.setCriticalThreshold(r.criticalThreshold());
                rule.setSeverity(r.severity() != null ? r.severity() : "WARNING");
                rule.setInvalidRep(r.invalidRep());
                rule.setEnabled(r.enabled());
                rule.setPriority(r.priority());
                rule.setFeedbackMessage(r.feedbackMessage());
                rule.setVoicePrompt(r.voicePrompt());
                ruleRepo.save(rule);
            }
        }

        // Audit Log
        logAudit(profile.getId(), exercise.getName(), "ADMIN", "UPDATE", "Cập nhật cấu hình AI Motion");

        return toProfileDto(profile);
    }

    @Transactional
    public AiProfileDto publishProfile(Long profileId) {
        ExerciseAiProfile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy profile AI với ID: " + profileId));
        
        profile.setStatus("ACTIVE");
        profileRepo.save(profile);

        // Create Version Snapshot
        AiConfigurationVersion v = new AiConfigurationVersion();
        v.setAiProfile(profile);
        v.setVersionNumber(profile.getVersion());
        v.setConfigurationSnapshot("Snapshot version " + profile.getVersion());
        v.setStatus("ACTIVE");
        v.setApprovedBy("ADMIN");
        v.setPublishedAt(Instant.now());
        v.setChangeSummary("Xuất bản phiên bản AI Motion " + profile.getVersion());
        versionRepo.save(v);

        logAudit(profile.getId(), profile.getExercise().getName(), "ADMIN", "PUBLISH", "Xuất bản phiên bản " + profile.getVersion());
        return toProfileDto(profile);
    }

    // Voice Config & API Key
    public VoiceConfigDto getVoiceConfig() {
        AiVoiceConfiguration config = voiceConfigRepo.findFirstByOrderByIdAsc()
                .orElseGet(() -> {
                    AiVoiceConfiguration def = new AiVoiceConfiguration();
                    def.setProvider("VIETTEL_AI");
                    def.setVoiceName("hn-quynhanh");
                    def.setSpeed(1.0);
                    return voiceConfigRepo.save(def);
                });

        String rawKey = config.getApiKey();
        String geminiKey = null;
        String viettelToken = null;

        if (rawKey != null && !rawKey.isBlank()) {
            if (rawKey.contains("GEMINI:") || rawKey.contains("VIETTEL:")) {
                String[] parts = rawKey.split("\\|");
                for (String p : parts) {
                    if (p.startsWith("GEMINI:")) geminiKey = p.substring(7).trim();
                    else if (p.startsWith("VIETTEL:")) viettelToken = p.substring(8).trim();
                }
            } else if (rawKey.startsWith("AQ.") || rawKey.startsWith("AIza")) {
                geminiKey = rawKey.trim();
            } else if (rawKey.length() == 32 || rawKey.matches("^[a-fA-F0-9]{32}$")) {
                viettelToken = rawKey.trim();
            }
        }

        // Gemini key chỉ lấy từ biến môi trường GEMINI_API_KEY (bỏ qua key cũ còn trong DB) và KHÔNG trả về trình duyệt
        geminiKey = geminiTtsService.getEffectiveApiKey();
        if (viettelToken == null || viettelToken.isBlank()) {
            viettelToken = viettelTtsService.getEffectiveToken();
        }

        String geminiMasked = geminiKey.length() > 8
                ? geminiKey.substring(0, 4) + "****************" + geminiKey.substring(geminiKey.length() - 4) + " (GEMINI_API_KEY)"
                : "Chưa cấu hình GEMINI_API_KEY trên server";

        String viettelMasked = (viettelToken != null && viettelToken.length() > 8)
                ? viettelToken.substring(0, 6) + "****************" + viettelToken.substring(viettelToken.length() - 4)
                : "5f113f****************0a8e";

        boolean isViettel = "VIETTEL_AI".equalsIgnoreCase(config.getProvider());
        String activeMasked = isViettel ? viettelMasked : geminiMasked;

        return new VoiceConfigDto(
                config.getId(),
                config.getName(),
                config.getProvider(),
                config.getModel(),
                activeMasked,
                true,
                null, // không bao giờ gửi Gemini key thật về trình duyệt
                geminiMasked,
                viettelToken,
                viettelMasked,
                config.getLanguage(),
                config.getVoiceName(),
                config.getSpeed(),
                config.getPitch(),
                config.isEnabled()
        );
    }

    @Transactional
    public VoiceConfigDto saveVoiceConfig(SaveVoiceConfigRequest req) {
        AiVoiceConfiguration config = voiceConfigRepo.findFirstByOrderByIdAsc()
                .orElse(new AiVoiceConfiguration());

        String currentRaw = config.getApiKey();
        String geminiKey = null;
        String viettelToken = null;
        if (currentRaw != null && !currentRaw.isBlank()) {
            if (currentRaw.contains("GEMINI:") || currentRaw.contains("VIETTEL:")) {
                String[] parts = currentRaw.split("\\|");
                for (String p : parts) {
                    if (p.startsWith("GEMINI:")) geminiKey = p.substring(7).trim();
                    else if (p.startsWith("VIETTEL:")) viettelToken = p.substring(8).trim();
                }
            } else if (currentRaw.startsWith("AQ.") || currentRaw.startsWith("AIza")) {
                geminiKey = currentRaw.trim();
            } else if (currentRaw.length() == 32 || currentRaw.matches("^[a-fA-F0-9]{32}$")) {
                viettelToken = currentRaw.trim();
            }
        }

        // Gemini key KHÔNG lưu vào DB: chỉ cấu hình qua biến môi trường GEMINI_API_KEY trên server.
        // Mọi Gemini key gửi từ giao diện đều bị bỏ qua (kể cả key cũ còn trong DB sẽ bị xóa ở lần lưu này).
        if (geminiKey != null || (req.geminiApiKey() != null && !req.geminiApiKey().isBlank())) {
            logger.info("Bỏ qua Gemini key từ giao diện/DB - dùng biến môi trường GEMINI_API_KEY");
        }
        if (req.viettelToken() != null && !req.viettelToken().isBlank() && !req.viettelToken().contains("••••")) {
            viettelToken = req.viettelToken().trim();
        }
        if (req.apiKey() != null && !req.apiKey().isBlank() && !req.apiKey().contains("••••")) {
            String val = req.apiKey().trim();
            boolean looksLikeGemini = val.startsWith("AQ.") || val.startsWith("AIza");
            if (!looksLikeGemini && (val.length() == 32 || val.matches("^[a-fA-F0-9]{32}$") || "VIETTEL_AI".equalsIgnoreCase(req.provider()))) {
                viettelToken = val;
            }
        }

        // Không có token mới thì giữ nguyên cấu hình hiện tại (token mặc định lấy từ VIETTEL_AI_TOKEN), không ghi chuỗi rỗng đè lên
        if (viettelToken != null && !viettelToken.isBlank()) config.setApiKey("VIETTEL:" + viettelToken);

        if (req.provider() != null) config.setProvider(req.provider());
        if (req.model() != null) config.setModel(req.model());
        if (req.language() != null) config.setLanguage(req.language());
        if (req.voiceName() != null) config.setVoiceName(req.voiceName());
        if (req.speed() != null) config.setSpeed(req.speed());
        if (req.pitch() != null) config.setPitch(req.pitch());
        if (req.enabled() != null) config.setEnabled(req.enabled());

        voiceConfigRepo.save(config);
        return getVoiceConfig();
    }

    public TestVoiceResponse testVoiceConnection(TestVoiceRequest req) {
        AiVoiceConfiguration config = voiceConfigRepo.findFirstByOrderByIdAsc().orElse(null);
        String provider = req.provider();
        if (provider == null && config != null) {
            provider = config.getProvider();
        }
        if (provider == null) provider = "VIETTEL_AI";

        String voice = req.voiceName();
        if ((voice == null || voice.isBlank()) && config != null) {
            voice = config.getVoiceName();
        }
        if (voice == null || voice.isBlank()) {
            voice = "hn-quynhanh";
        }

        Double speed = req.speed();
        if (speed == null && config != null) {
            speed = config.getSpeed();
        }
        if (speed == null) speed = 1.0;

        String text = req.effectiveText();

        boolean isViettel = "VIETTEL_AI".equalsIgnoreCase(provider) ||
                            voice.startsWith("hn-") || voice.startsWith("hcm-") || voice.startsWith("hue-");

        if (isViettel) {
            return viettelTtsService.generateSpeech(text, voice, speed, req.apiKey());
        } else {
            return geminiTtsService.generateSpeech(text, "vi-VN", voice, speed);
        }
    }

    // Motion Evaluation / Live Simulation
    public EvaluateMotionResponse evaluateMotion(EvaluateMotionRequest req) {
        long start = System.currentTimeMillis();
        ExerciseAiProfile profile = profileRepo.findById(req.profileId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy profile AI với ID: " + req.profileId()));

        List<AiMotionRule> activeRules = ruleRepo.findByAiProfileIdAndEnabledTrueOrderByPriorityDesc(profile.getId());
        List<RuleEvaluationResult> results = new ArrayList<>();
        List<String> textWarnings = new ArrayList<>();
        String prioritizedVoice = null;
        int passedCount = 0;

        for (AiMotionRule rule : activeRules) {
            RuleEvaluationResult res = ruleEvaluator.evaluate(rule, req.metrics() != null ? req.metrics() : Collections.emptyMap());
            results.add(res);
            if (res.passed()) {
                passedCount++;
            } else {
                if (res.feedbackMessage() != null) {
                    textWarnings.add(res.feedbackMessage());
                }
                if (prioritizedVoice == null && res.voicePrompt() != null) {
                    prioritizedVoice = res.voicePrompt();
                }
            }
        }

        int total = activeRules.isEmpty() ? 1 : activeRules.size();
        int score = (int) Math.round(((double) passedCount / total) * 100.0);
        boolean overallPassed = textWarnings.isEmpty();
        String overallStatus = overallPassed ? "PASS" : (score < 50 ? "CRITICAL" : (score < 75 ? "ERROR" : "WARNING"));

        String audioUrl = null;
        if (prioritizedVoice != null && profile.isVoiceWarningEnabled()) {
            AiVoiceConfiguration voiceCfg = voiceConfigRepo.findFirstByOrderByIdAsc().orElse(null);
            String provider = (voiceCfg != null && voiceCfg.getProvider() != null) ? voiceCfg.getProvider() : "VIETTEL_AI";
            String voice = (voiceCfg != null && voiceCfg.getVoiceName() != null) ? voiceCfg.getVoiceName() : "hn-quynhanh";
            double speed = 1.0;
            if (voiceCfg != null && voiceCfg.getSpeed() != null) {
                speed = voiceCfg.getSpeed();
            }

            if ("VIETTEL_AI".equalsIgnoreCase(provider) || voice.startsWith("hn-") || voice.startsWith("hcm-") || voice.startsWith("hue-")) {
                TestVoiceResponse tts = viettelTtsService.generateSpeech(prioritizedVoice, voice, speed);
                audioUrl = tts.audioUrl();
            } else {
                TestVoiceResponse tts = geminiTtsService.generateSpeech(prioritizedVoice, "vi-VN", voice, speed);
                audioUrl = tts.audioUrl();
            }
        }

        long processing = System.currentTimeMillis() - start;
        return new EvaluateMotionResponse(
                overallPassed,
                overallStatus,
                score,
                results,
                textWarnings,
                prioritizedVoice,
                audioUrl,
                processing
        );
    }

    public AiSystemStatsResponse getSystemStats() {
        int profileCount = (int) profileRepo.count();
        int ruleCount = (int) ruleRepo.count();
        long cacheCount = cacheRepo.count();

        return new AiSystemStatsResponse(
                96.4,
                18,
                3482,
                89.2,
                profileCount > 0 ? profileCount : 5,
                ruleCount > 0 ? ruleCount : 18,
                cacheCount
        );
    }

    private void logAudit(Long profileId, String exerciseName, String user, String action, String reason) {
        AiConfigurationAuditLog log = new AiConfigurationAuditLog();
        log.setProfileId(profileId);
        log.setExerciseName(exerciseName);
        log.setUserEmail(user);
        log.setAction(action);
        log.setReason(reason);
        auditRepo.save(log);
    }

    private ExerciseAiProfile createDefaultProfileForExercise(Exercise exercise) {
        ExerciseAiProfile profile = new ExerciseAiProfile();
        profile.setExercise(exercise);
        profile.setProfileName(exercise.getName() + " Standard AI Tracking");
        profile.setVersion("1.0");
        profile.setStatus("ACTIVE");
        profile = profileRepo.save(profile);

        // Seed default landmarks
        String[] defaultLandmarks = {"LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_ELBOW", "RIGHT_ELBOW", "LEFT_WRIST", "RIGHT_WRIST", "LEFT_HIP", "RIGHT_HIP", "LEFT_ANKLE", "RIGHT_ANKLE"};
        for (int i = 0; i < defaultLandmarks.length; i++) {
            AiLandmarkRequirement lr = new AiLandmarkRequirement();
            lr.setAiProfile(profile);
            lr.setLandmarkName(defaultLandmarks[i]);
            lr.setLandmarkIndex(11 + i);
            lr.setRequired(true);
            lr.setMinVisibility(0.65);
            landmarkRepo.save(lr);
        }

        String code = exercise.getCode() != null ? exercise.getCode().toLowerCase() : "";

        if (code.contains("pull") || code.contains("chin") || code.contains("hang")) {
            // PULL-UP MOTION RULES
            createRule(profile, "RULE_CHIN_OVER_BAR", "Cằm vượt xà (Chin Over Bar)", "ROM", "GREATER_OR_EQUAL", 90.0, null, "WARNING", 3, true, "Cằm chưa vượt qua xà ở đỉnh phát lực.", "Kéo cao cằm qua xà.");
            createRule(profile, "RULE_DEAD_HANG", "Mở hết biên độ đáy (Dead Hang)", "ANGLE", "GREATER_OR_EQUAL", 165.0, null, "WARNING", 2, true, "Chưa hạ hết tay ở điểm đáy để đạt full ROM.", "Mở thẳng tay ở điểm đáy.");
            createRule(profile, "RULE_KIPPING_SWING", "Hạn chế văng chân / đung đưa", "ALIGNMENT", "BETWEEN", 160.0, 190.0, "ERROR", 1, false, "Thân người bị đung đưa lấy đà. Hãy gồng chặt cơ bụng.", "Khóa chặt thân người, không văng chân.");
        } else if (code.contains("squat") || code.contains("lunge") || code.contains("pistol")) {
            // SQUAT MOTION RULES
            createRule(profile, "RULE_KNEE_VALGUS", "Sụp gối vào trong (Knee Valgus)", "ANGLE", "BETWEEN", 80.0, 110.0, "ERROR", 3, true, "Đầu gối bị chụm vào trong gây hại khớp gối.", "Mở gối theo hướng mũi chân.");
            createRule(profile, "RULE_PARALLEL_DEPTH", "Độ sâu đùi song song (Parallel Depth)", "ROM", "LESS_OR_EQUAL", 90.0, null, "WARNING", 2, true, "Chưa hạ đùi song song với mặt đất.", "Hạ mông sâu hơn đùi song song.");
            createRule(profile, "RULE_TORSO_LEAN", "Gập thân người quá mức", "ALIGNMENT", "GREATER_OR_EQUAL", 60.0, null, "WARNING", 1, false, "Thân trên gập quá sâu về phía trước.", "Giữ ngực mở thẳng.");
        } else if (code.contains("dip")) {
            // DIPS MOTION RULES
            createRule(profile, "RULE_DIP_DEPTH", "Độ sâu gập khuỷu tay 90°", "ANGLE", "LESS_OR_EQUAL", 90.0, null, "WARNING", 3, true, "Hạ khuỷu tay chưa đạt góc 90 độ.", "Xuống sâu vuông góc khuỷu tay.");
            createRule(profile, "RULE_SHOULDER_SHRUG", "Tránh rụt cổ / vai", "ALIGNMENT", "BETWEEN", 160.0, 185.0, "ERROR", 2, false, "Vai bị rụt lên gần tai, gây áp lực khớp.", "Hạ vai, ép chặt cơ ngực dưới.");
        } else if (code.contains("plank") || code.contains("hollow") || code.contains("sit") || code.contains("dragon") || code.contains("leg-raise")) {
            // CORE / PLANK MOTION RULES
            createRule(profile, "RULE_PLANK_SAG", "Võng lưng / chùng hông (Hip Sag)", "ALIGNMENT", "BETWEEN", 168.0, 185.0, "ERROR", 3, true, "Hông bị võng thấp hoặc nhô quá cao.", "Siết chặt cơ bụng và cơ mông.");
            createRule(profile, "RULE_SHOULDER_PROTRACTION", "Đẩy cao bả vai (Protraction)", "ALIGNMENT", "BETWEEN", 165.0, 180.0, "WARNING", 2, false, "Bả vai bị chùng võng.", "Đẩy thẳng vai, căng cơ lõi.");
        } else if (code.contains("handstand") || code.contains("planche") || code.contains("lever")) {
            // SKILL MOTION RULES
            createRule(profile, "RULE_SHOULDER_OPEN", "Mở hết khớp vai 180°", "ANGLE", "GREATER_OR_EQUAL", 175.0, null, "WARNING", 3, false, "Khớp vai chưa mở hết biên độ 180 độ.", "Mở hết vai, đẩy cao toàn thân.");
            createRule(profile, "RULE_BANANA_BACK", "Tránh võng lưng quả chuối", "ALIGNMENT", "BETWEEN", 170.0, 185.0, "ERROR", 2, true, "Lưng bị cong võng quả chuối.", "Cuộn xương chậu, siết bụng phẳng lưng.");
        } else if (code.contains("muscle")) {
            // MUSCLE-UP MOTION RULES
            createRule(profile, "RULE_CHICKEN_WING", "Lên xà lệch tay (Chicken Wing)", "ALIGNMENT", "BETWEEN", 170.0, 185.0, "CRITICAL", 3, true, "Hai tay lên không đều, dễ gây chấn thương vai.", "Lên đều cả hai tay cùng lúc.");
            createRule(profile, "RULE_EXPLOSIVE_PULL", "Lực kéo nổ qua ngực", "ROM", "GREATER_OR_EQUAL", 85.0, null, "WARNING", 2, false, "Lực kéo chưa đủ cao để chuyển tiếp.", "Kéo nổ ngực sát xà.");
        } else {
            // PUSH-UP MOTION RULES (Default)
            createRule(profile, "RULE_ELBOW_FLARE", "Khuỷu tay xòe quá rộng (Elbow Flare)", "ANGLE", "BETWEEN", 40.0, 70.0, "WARNING", 2, false, "Khuỷu tay đang mở quá rộng, hãy khép sát vào thân người góc 45-60 độ.", "Khép bớt khuỷu tay lại.");
            createRule(profile, "RULE_SPINE_SAG", "Võng lưng hoặc chùng hông (Sagging Hips)", "ALIGNMENT", "BETWEEN", 168.0, 185.0, "ERROR", 3, true, "Lưng bị võng hoặc hông chùng! Hãy siết chặt cơ bụng và cơ mông.", "Siết bụng, nâng hông lên.");
            createRule(profile, "RULE_DEPTH_ROM", "Độ sâu hạ ngực (Depth ROM)", "ROM", "LESS_OR_EQUAL", 90.0, null, "WARNING", 2, true, "Chưa xuống đủ sâu! Hãy hạ ngực cách sàn khoảng 5-10cm.", "Hạ sâu thêm chút nữa.");
            createRule(profile, "RULE_TOP_LOCKOUT", "Khóa khớp khuỷu tay an toàn", "ANGLE", "LESS_OR_EQUAL", 175.0, null, "INFO", 1, false, "Đẩy lên hết tầm nhưng tránh giật khóa khớp.", "Tốt, không khóa giật khuỷu tay.");
        }

        return profile;
    }

    private void createRule(ExerciseAiProfile profile, String code, String name, String metricType, String op, Double min, Double max, String sev, int prio, boolean invalidRep, String feedback, String voice) {
        AiMotionRule r = new AiMotionRule();
        r.setAiProfile(profile);
        r.setRuleCode(code);
        r.setRuleName(name);
        r.setMetricType(metricType);
        r.setOperator(op);
        r.setThresholdMin(min);
        r.setThresholdMax(max);
        r.setSeverity(sev);
        r.setPriority(prio);
        r.setInvalidRep(invalidRep);
        r.setFeedbackMessage(feedback);
        r.setVoicePrompt(voice);
        r.setEnabled(true);
        ruleRepo.save(r);
    }

    private AiProfileDto toProfileDto(ExerciseAiProfile p) {
        List<LandmarkRequirementDto> landmarks = landmarkRepo.findByAiProfileId(p.getId())
                .stream()
                .map(l -> new LandmarkRequirementDto(l.getId(), l.getLandmarkName(), l.getLandmarkIndex(), l.isRequired(), l.getMinVisibility(), l.getSide()))
                .collect(Collectors.toList());

        List<MotionRuleDto> rules = ruleRepo.findByAiProfileIdOrderByPriorityDesc(p.getId())
                .stream()
                .map(r -> new MotionRuleDto(
                        r.getId(),
                        r.getRuleCode(),
                        r.getRuleName(),
                        r.getRuleType(),
                        r.getMetricType(),
                        r.getOperator(),
                        r.getThresholdMin(),
                        r.getThresholdMax(),
                        r.getWarningThreshold(),
                        r.getCriticalThreshold(),
                        r.getSeverity(),
                        r.isInvalidRep(),
                        r.isEnabled(),
                        r.getPriority(),
                        r.getFeedbackMessage(),
                        r.getVoicePrompt()
                ))
                .collect(Collectors.toList());

        Long exerciseId = p.getExercise() != null ? p.getExercise().getId() : null;
        String exerciseName = p.getExercise() != null ? p.getExercise().getName() : "Không xác định";

        return new AiProfileDto(
                p.getId(),
                exerciseId,
                exerciseName,
                p.getProfileName(),
                p.getPoseModel(),
                p.getTrackingMode(),
                p.isAnalysisEnabled(),
                p.isRepCountingEnabled(),
                p.isFormAnalysisEnabled(),
                p.isVoiceWarningEnabled(),
                p.isTextWarningEnabled(),
                p.getVersion(),
                p.getStatus(),
                p.getRepStartCondition(),
                p.getRepDownCondition(),
                p.getRepUpCondition(),
                p.getMinRepDurationMs(),
                p.getMaxRepDurationMs(),
                p.getDebounceTimeMs(),
                p.getMinRomPercentage(),
                landmarks,
                rules,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
