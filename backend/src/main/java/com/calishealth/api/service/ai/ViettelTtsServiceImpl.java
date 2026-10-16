package com.calishealth.api.service.ai;

import com.calishealth.api.dto.AiMotionDtos.TestVoiceResponse;
import com.calishealth.api.entity.AiVoiceConfiguration;
import com.calishealth.api.entity.AiVoiceWarningCache;
import com.calishealth.api.repository.AiVoiceConfigurationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Locale;
import java.util.Optional;

@Service
public class ViettelTtsServiceImpl implements ViettelTtsService {

    private static final Logger log = LoggerFactory.getLogger(ViettelTtsServiceImpl.class);

    private final AiVoiceConfigurationRepository voiceConfigRepo;
    private final VoiceWarningCacheService cacheService;
    private final AudioStorageService audioStorageService;
    private final HttpClient httpClient;

    @Value("${viettel.ai.token:}")
    private String defaultToken;

    @Value("${viettel.ai.base-url:https://viettelai.vn/tts/speech_synthesis}")
    private String baseUrl;

    public ViettelTtsServiceImpl(
            AiVoiceConfigurationRepository voiceConfigRepo,
            VoiceWarningCacheService cacheService,
            AudioStorageService audioStorageService
    ) {
        this.voiceConfigRepo = voiceConfigRepo;
        this.cacheService = cacheService;
        this.audioStorageService = audioStorageService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(6))
                .build();
    }

    @Override
    public String getEffectiveToken() {
        Optional<AiVoiceConfiguration> config = voiceConfigRepo.findFirstByOrderByIdAsc();
        if (config.isPresent()) {
            String raw = config.get().getApiKey();
            if (raw != null && !raw.isBlank()) {
                if (raw.contains("VIETTEL:")) {
                    String[] parts = raw.split("\\|");
                    for (String p : parts) {
                        if (p.startsWith("VIETTEL:") && !p.substring(8).isBlank()) return p.substring(8).trim();
                    }
                } else if (raw.length() == 32 || raw.matches("^[a-fA-F0-9]{32}$")) {
                    return raw.trim();
                }
            }
        }
        return (defaultToken != null && !defaultToken.isBlank()) ? defaultToken.trim() : "";   // token lấy từ VIETTEL_AI_TOKEN; không có thì để trống
    }

    private String escapeJson(String str) {
        if (str == null) return "\"\"";
        StringBuilder sb = new StringBuilder("\"");
        for (char c : str.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < ' ') {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        sb.append("\"");
        return sb.toString();
    }

    @Override
    public byte[] synthesize(String text, String voice, Double speed, Boolean withoutFilter) throws Exception {
        return synthesize(text, voice, speed, withoutFilter, null);
    }

    @Override
    public byte[] synthesize(String text, String voice, Double speed, Boolean withoutFilter, String customToken) throws Exception {
        String token = (customToken != null && !customToken.isBlank() && !customToken.contains("•") && !customToken.contains("*"))
                ? customToken.trim()
                : getEffectiveToken();
        String selectedVoice = (voice != null && !voice.isBlank()) ? voice.trim() : "hn-quynhanh";
        double selectedSpeed = (speed != null && speed >= 0.8 && speed <= 1.2) ? speed : 1.0;
        boolean filter = (withoutFilter != null) ? withoutFilter : false;

        String jsonPayload = String.format(
                Locale.US,
                "{\"text\":%s,\"voice\":\"%s\",\"speed\":%.1f,\"tts_return_option\":3,\"token\":\"%s\",\"without_filter\":%b}",
                escapeJson(text),
                selectedVoice,
                selectedSpeed,
                token,
                filter
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json; charset=utf-8")
                .header("accept", "*/*")
                .POST(HttpRequest.BodyPublishers.ofByteArray(jsonPayload.getBytes(StandardCharsets.UTF_8)))
                .build();

        HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

        if (response.statusCode() != 200) {
            String errorMsg = new String(response.body(), StandardCharsets.UTF_8);
            log.error("Viettel AI TTS API error status {}: {}", response.statusCode(), errorMsg);
            throw new RuntimeException("Viettel AI TTS returned code " + response.statusCode() + ": " + errorMsg);
        }

        byte[] audioBytes = response.body();
        if (audioBytes == null || audioBytes.length == 0) {
            throw new RuntimeException("Viettel AI TTS returned empty audio stream");
        }

        return audioBytes;
    }

    @Override
    public TestVoiceResponse generateSpeech(String text, String voice, Double speed) {
        return generateSpeech(text, voice, speed, null);
    }

    @Override
    public TestVoiceResponse generateSpeech(String text, String voice, Double speed, String customToken) {
        long startTime = System.currentTimeMillis();
        if (text == null || text.isBlank()) {
            return new TestVoiceResponse(false, null, null, "Nội dung cảnh báo không được để trống", 0, false);
        }

        String targetVoice = (voice != null && !voice.isBlank()) ? voice.trim() : "hn-quynhanh";
        double targetSpeed = (speed != null && speed >= 0.8 && speed <= 1.2) ? speed : 1.0;
        String hash = cacheService.computeHash(text, "vi-VN", targetVoice, String.format(Locale.US, "VIETTEL_%.1f", targetSpeed));

        // 1. Check in Database & Storage Cache
        Optional<AiVoiceWarningCache> cached = cacheService.findInCache(hash);
        if (cached.isPresent() && cached.get().getAudioUrl() != null) {
            long latency = System.currentTimeMillis() - startTime;
            String audioUrl = cached.get().getAudioUrl();
            String base64 = null;
            try {
                byte[] bytes = audioStorageService.loadAsBytes(hash + ".mp3");
                if (bytes.length > 0) {
                    base64 = "data:audio/mp3;base64," + Base64.getEncoder().encodeToString(bytes);
                }
            } catch (java.io.IOException ignored) {}

            log.info("Viettel AI TTS Cache HIT for text hash: {}", hash);
            return new TestVoiceResponse(true, audioUrl, base64, "Lấy từ Audio Cache thành công (Viettel AI - 0ms trễ)", latency, true);
        }

        // 2. Call Viettel AI API
        try {
            byte[] audioBytes = synthesize(text, targetVoice, targetSpeed, false, customToken);
            String fileName = hash + ".mp3";
            String audioUrl = audioStorageService.storeAudio(fileName, audioBytes);
            String base64 = "data:audio/mp3;base64," + Base64.getEncoder().encodeToString(audioBytes);

            // Save to database cache
            cacheService.saveToCache(hash, text, "vi-VN", targetVoice, audioUrl, 2.5);

            long latency = System.currentTimeMillis() - startTime;
            log.info("Viettel AI TTS synthesized successfully in {}ms ({} bytes)", latency, audioBytes.length);

            return new TestVoiceResponse(
                    true,
                    audioUrl,
                    base64,
                    "Tổng hợp giọng nói Viettel AI (" + targetVoice + ") thành công!",
                    latency,
                    false
            );
        } catch (Exception e) {
            log.error("Viettel AI TTS synthesis error: {}", e.getMessage(), e);
            long latency = System.currentTimeMillis() - startTime;
            return new TestVoiceResponse(
                    false,
                    null,
                    null,
                    "Lỗi kết nối Viettel AI TTS: " + e.getMessage(),
                    latency,
                    false
            );
        }
    }
}
