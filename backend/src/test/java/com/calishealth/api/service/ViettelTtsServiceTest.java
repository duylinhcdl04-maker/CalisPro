package com.calishealth.api.service;

import com.calishealth.api.dto.AiMotionDtos.TestVoiceResponse;
import com.calishealth.api.repository.AiVoiceConfigurationRepository;
import com.calishealth.api.service.ai.AudioStorageService;
import com.calishealth.api.service.ai.ViettelTtsServiceImpl;
import com.calishealth.api.service.ai.VoiceWarningCacheService;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/** Test GỌI THẬT tới Viettel AI nên cần token thật: đặt biến môi trường VIETTEL_AI_TOKEN để chạy, không có thì bỏ qua. */
public class ViettelTtsServiceTest {

    @Test
    void testSynthesizeViettelAiLive() {
        String token = System.getenv("VIETTEL_AI_TOKEN");
        Assumptions.assumeTrue(token != null && !token.isBlank(), "Không có VIETTEL_AI_TOKEN: bỏ qua test gọi thật Viettel AI");
        AiVoiceConfigurationRepository configRepo = Mockito.mock(AiVoiceConfigurationRepository.class);
        VoiceWarningCacheService cacheService = Mockito.mock(VoiceWarningCacheService.class);
        AudioStorageService storageService = Mockito.mock(AudioStorageService.class);

        when(configRepo.findFirstByOrderByIdAsc()).thenReturn(Optional.empty());
        when(cacheService.findInCache(any())).thenReturn(Optional.empty());
        when(cacheService.computeHash(any(), any(), any(), any())).thenReturn("test_hash_viettel");
        try {
            when(storageService.storeAudio(any(), any())).thenReturn("/api/v1/admin/ai/audio/test_hash_viettel.mp3");
        } catch (java.io.IOException ignored) {}

        ViettelTtsServiceImpl service = new ViettelTtsServiceImpl(configRepo, cacheService, storageService);
        ReflectionTestUtils.setField(service, "defaultToken", token);
        ReflectionTestUtils.setField(service, "baseUrl", "https://viettelai.vn/tts/speech_synthesis");

        TestVoiceResponse res = service.generateSpeech("Khép bớt khuỷu tay lại, giữ thẳng lưng!", "hn-quynhanh", 1.0);
        assertNotNull(res);
        assertTrue(res.success(), "Speech generation should succeed: " + res.message());
        assertNotNull(res.audioBase64(), "Audio Base64 must be present");
        assertTrue(res.audioBase64().startsWith("data:audio/mp3;base64,"));
        System.out.println("Live Viettel AI TTS Test passed! Latency: " + res.latencyMs() + "ms. Audio base64 length: " + res.audioBase64().length());
    }
}
