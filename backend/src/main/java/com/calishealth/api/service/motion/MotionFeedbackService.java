package com.calishealth.api.service.motion;

import com.calishealth.api.dto.AiMotionDtos.TestVoiceResponse;
import com.calishealth.api.dto.MotionDtos.*;
import com.calishealth.api.entity.AiMotionRule;
import com.calishealth.api.entity.AiVoiceConfiguration;
import com.calishealth.api.entity.AiVoiceWarningCache;
import com.calishealth.api.entity.MotionFeedbackTemplate;
import com.calishealth.api.repository.AiMotionRuleRepository;
import com.calishealth.api.repository.AiVoiceConfigurationRepository;
import com.calishealth.api.repository.AiVoiceWarningCacheRepository;
import com.calishealth.api.repository.MotionFeedbackTemplateRepository;
import com.calishealth.api.service.ai.GeminiTtsService;
import com.calishealth.api.service.ai.ViettelTtsService;
import com.calishealth.api.service.ai.VoiceWarningCacheService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Feedback template (feedback_code -> câu hiển thị + câu đọc) và trạng thái audio.
 * Rule chỉ tham chiếu feedback_code; audio chỉ được tạo ở đây (module Voice), không bao giờ trong vòng lặp realtime.
 */
@Service
public class MotionFeedbackService {
    public static final String DEFAULT_LANGUAGE = "vi";
    private static final int VOICE_TEXT_MAX = 200;

    private final MotionFeedbackTemplateRepository templates;
    private final AiMotionRuleRepository rules;
    private final AiVoiceConfigurationRepository voiceConfigs;
    private final AiVoiceWarningCacheRepository voiceCache;
    private final VoiceWarningCacheService cacheService;
    private final ViettelTtsService viettel;
    private final GeminiTtsService gemini;

    public MotionFeedbackService(MotionFeedbackTemplateRepository templates, AiMotionRuleRepository rules,
                                 AiVoiceConfigurationRepository voiceConfigs, AiVoiceWarningCacheRepository voiceCache,
                                 VoiceWarningCacheService cacheService, ViettelTtsService viettel, GeminiTtsService gemini) {
        this.templates = templates;
        this.rules = rules;
        this.voiceConfigs = voiceConfigs;
        this.voiceCache = voiceCache;
        this.cacheService = cacheService;
        this.viettel = viettel;
        this.gemini = gemini;
    }

    // ============================== Giọng đọc hiện hành ==============================

    /** Cấu hình giọng hiện hành; hash phải khớp đúng công thức của ViettelTtsServiceImpl / GeminiTtsService. */
    record VoiceTarget(boolean viettel, String voice, double speed) {
        String hash(VoiceWarningCacheService cache, String text) {
            if (viettel) return cache.computeHash(text, "vi-VN", voice, String.format(Locale.US, "VIETTEL_%.1f", speed));
            return cache.computeHash(text, "vi-VN", voice, "gemini-2.0-flash");
        }
    }

    VoiceTarget voiceTarget() {
        AiVoiceConfiguration cfg = voiceConfigs.findFirstByOrderByIdAsc().orElse(null);
        String provider = cfg != null && cfg.getProvider() != null ? cfg.getProvider() : "VIETTEL_AI";
        String voice = cfg != null && cfg.getVoiceName() != null && !cfg.getVoiceName().isBlank() ? cfg.getVoiceName().trim() : "hn-quynhanh";
        boolean isViettel = "VIETTEL_AI".equalsIgnoreCase(provider) || voice.startsWith("hn-") || voice.startsWith("hcm-") || voice.startsWith("hue-");
        double speed = cfg != null && cfg.getSpeed() != null ? cfg.getSpeed() : 1.0;
        if (isViettel && (speed < 0.8 || speed > 1.2)) speed = 1.0;
        if (!isViettel && "hn-quynhanh".equals(voice)) voice = "Aoede";
        return new VoiceTarget(isViettel, voice, speed);
    }

    // ============================== Tra cứu (dùng bởi runtime) ==============================

    public record Resolved(String uiText, String voiceText, String audioUrl, boolean needsTts) {}

    /** Không gọi TTS: chỉ trả audio đã có trong cache; thiếu thì needsTts = true để client tự đọc (fallback). */
    @Transactional(readOnly = true)
    public Map<String, Resolved> resolve(Collection<String> codes) {
        if (codes.isEmpty()) return Map.of();
        VoiceTarget vt = voiceTarget();
        Map<String, Resolved> out = new HashMap<>();
        for (MotionFeedbackTemplate t : templates.findByFeedbackCodeInAndLanguage(codes, DEFAULT_LANGUAGE)) {
            if (!t.isActive()) continue;
            String voice = t.getVoiceText() == null || t.getVoiceText().isBlank() ? null : t.getVoiceText();
            String url = voice == null ? null : voiceCache.findByTextHash(vt.hash(cacheService, voice)).map(c -> c.getAudioUrl()).orElse(null);
            out.put(t.getFeedbackCode(), new Resolved(t.getUiText(), voice, url, voice != null && url == null));
        }
        return out;
    }

    public boolean exists(String code) {
        return code != null && templates.existsByFeedbackCodeAndActiveTrue(code);
    }

    // ============================== Admin ==============================

    @Transactional(readOnly = true)
    public List<FeedbackTemplateDto> list(Long profileId) {
        List<AiMotionRule> profileRules = rules.findByAiProfileIdOrderByRuleCodeAscRuleVersionDesc(profileId);
        Set<String> codes = new TreeSet<>();
        profileRules.forEach(r -> { if (r.getFeedbackCode() != null) codes.add(r.getFeedbackCode()); });
        Map<String, MotionFeedbackTemplate> byCode = new LinkedHashMap<>();
        templates.findByAiProfileIdOrderByFeedbackCodeAsc(profileId).forEach(t -> byCode.put(t.getFeedbackCode(), t));
        // Template dùng chung (aiProfileId khác/null) nhưng được rule của profile tham chiếu
        templates.findByFeedbackCodeInAndLanguage(codes, DEFAULT_LANGUAGE).forEach(t -> byCode.putIfAbsent(t.getFeedbackCode(), t));
        VoiceTarget vt = voiceTarget();
        return byCode.values().stream().map(t -> toDto(t, vt, profileRules)).toList();
    }

    @Transactional
    public FeedbackTemplateDto upsert(Long profileId, Long id, FeedbackTemplateRequest req, String actor) {
        String code = req.feedbackCode() == null ? null : req.feedbackCode().trim().toUpperCase(Locale.ROOT);
        if (code == null || !code.matches("[A-Z0-9_]{3,100}")) throw new IllegalArgumentException("Feedback Code chỉ gồm A–Z, 0–9, _ (3–100 ký tự).");
        if (req.uiText() == null || req.uiText().isBlank()) throw new IllegalArgumentException("Câu hiển thị (UI text) không được để trống.");
        if (req.voiceText() != null && req.voiceText().length() > VOICE_TEXT_MAX) {
            throw new IllegalArgumentException("Câu đọc tối đa " + VOICE_TEXT_MAX + " ký tự (đọc trong lúc tập phải ngắn).");
        }
        String lang = req.language() == null || req.language().isBlank() ? DEFAULT_LANGUAGE : req.language();
        MotionFeedbackTemplate t = id == null ? new MotionFeedbackTemplate()
                : templates.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy feedback template."));
        templates.findByFeedbackCodeAndLanguage(code, lang).filter(o -> !o.getId().equals(t.getId())).ifPresent(o -> {
            throw new IllegalArgumentException("Feedback Code '" + code + "' (" + lang + ") đã tồn tại.");
        });
        if (t.getId() != null && !t.getFeedbackCode().equals(code)
                && rules.findAll().stream().anyMatch(r -> t.getFeedbackCode().equals(r.getFeedbackCode()))) {
            throw new IllegalStateException("Feedback Code đang được rule tham chiếu, không đổi mã được (tạo mã mới thay thế).");
        }
        if (t.getAiProfileId() == null) t.setAiProfileId(profileId);
        t.setFeedbackCode(code);
        t.setLanguage(lang);
        t.setUiText(req.uiText().trim());
        t.setVoiceText(MotionRuleMapper.blankToNull(req.voiceText()));
        t.setActive(req.active() == null || req.active());
        t.setUpdatedBy(actor);
        templates.save(t);
        return toDto(t, voiceTarget(), rules.findByAiProfileIdOrderByRuleCodeAscRuleVersionDesc(profileId));
    }

    /** Tạo audio cho câu đọc qua module Voice (Viettel AI / Gemini theo cấu hình) - có cache theo hash. */
    @Transactional
    public FeedbackTemplateDto generateAudio(Long templateId, String actor) {
        MotionFeedbackTemplate t = templates.findById(templateId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy feedback template."));
        if (t.getVoiceText() == null) throw new IllegalArgumentException("Template chưa có câu đọc (voice text).");
        VoiceTarget vt = voiceTarget();
        TestVoiceResponse res = vt.viettel()
                ? viettel.generateSpeech(t.getVoiceText(), vt.voice(), vt.speed())
                : gemini.generateSpeech(t.getVoiceText(), "vi-VN", vt.voice(), vt.speed());
        if (!res.success()) throw new IllegalStateException("Tạo audio thất bại: " + res.message());
        t.setAudioTextHash(vt.hash(cacheService, t.getVoiceText()));
        t.setUpdatedBy(actor);
        templates.save(t);
        return toDto(t, vt, t.getAiProfileId() == null ? List.of() : rules.findByAiProfileIdOrderByRuleCodeAscRuleVersionDesc(t.getAiProfileId()));
    }

    private FeedbackTemplateDto toDto(MotionFeedbackTemplate t, VoiceTarget vt, List<AiMotionRule> profileRules) {
        String status = "NOT_GENERATED";
        String url = null;
        if (t.getVoiceText() != null) {
            String hash = vt.hash(cacheService, t.getVoiceText());
            url = voiceCache.findByTextHash(hash).map(c -> c.getAudioUrl()).orElse(null);
            if (url != null) status = "GENERATED";
            else if (t.getAudioTextHash() != null) status = "OUTDATED";   // đã tạo trước đây nhưng câu đọc / giọng đã đổi
        } else {
            status = "NO_VOICE_TEXT";
        }
        List<String> usedBy = profileRules.stream().filter(r -> t.getFeedbackCode().equals(r.getFeedbackCode()))
                .filter(r -> !"ARCHIVED".equals(r.getStatus()))
                .map(r -> r.getRuleCode() + " v" + (r.getRuleVersion() == null ? 1 : r.getRuleVersion())).distinct().toList();
        return new FeedbackTemplateDto(t.getId(), t.getAiProfileId(), t.getFeedbackCode(), t.getLanguage(), t.getUiText(),
                t.getVoiceText(), t.isActive(), status, url, usedBy, t.getUpdatedAt());
    }
}
