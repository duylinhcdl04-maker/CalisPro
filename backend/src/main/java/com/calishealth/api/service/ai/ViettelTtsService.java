package com.calishealth.api.service.ai;

import com.calishealth.api.dto.AiMotionDtos.TestVoiceResponse;

public interface ViettelTtsService {
    byte[] synthesize(String text, String voice, Double speed, Boolean withoutFilter) throws Exception;
    byte[] synthesize(String text, String voice, Double speed, Boolean withoutFilter, String customToken) throws Exception;
    TestVoiceResponse generateSpeech(String text, String voice, Double speed);
    TestVoiceResponse generateSpeech(String text, String voice, Double speed, String customToken);
    String getEffectiveToken();
}
