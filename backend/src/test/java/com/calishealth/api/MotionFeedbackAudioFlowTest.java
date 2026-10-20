package com.calishealth.api;

import com.calishealth.api.dto.AiMotionDtos.TestVoiceResponse;
import com.calishealth.api.service.EmailService;
import com.calishealth.api.service.ai.GeminiTtsService;
import com.calishealth.api.service.ai.ViettelTtsService;
import com.calishealth.api.service.ai.VoiceWarningCacheService;
import com.calishealth.api.service.motion.MotionFeedbackService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Locale;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Giọng đọc phản hồi cho học viên: tạo theo yêu cầu bằng đúng giọng Admin cấu hình, một lần cho mỗi câu; không nhận văn bản tùy ý;
 * lỗi thì không gọi dịch vụ trả phí liên tục. Dịch vụ TTS được giả lập; dữ liệu test tự dọn.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/${V2_TEST_DB:calishealth_le_test}?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root", "spring.datasource.password=123456", "app.seed.enabled=false", "app.mail.log-only=true"})
class MotionFeedbackAudioFlowTest {
    private static final String P = "AUDIOTEST_";

    @Autowired MotionFeedbackService feedback;
    @Autowired JdbcTemplate jdbc;
    @Autowired VoiceWarningCacheService cacheService;
    @MockitoBean ViettelTtsService viettel;
    @MockitoBean GeminiTtsService gemini;
    @MockitoBean EmailService emailService;

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM ai_voice_warning_cache WHERE raw_text LIKE ?", P + "%");
        jdbc.update("DELETE FROM motion_feedback_templates WHERE feedback_code LIKE ?", P + "%");
    }

    private void template(String code, String voice, boolean active) {
        jdbc.update("INSERT INTO motion_feedback_templates (feedback_code, language, ui_text, voice_text, active, created_at, updated_at) VALUES (?, 'vi', 'Hiển thị', ?, ?, NOW(6), NOW(6))", code, voice, active);
    }

    /** Giả lập Viettel tạo audio thành công: ghi cache đúng như dịch vụ thật rồi báo thành công. */
    private void viettelWillSucceed(String text) {
        when(viettel.generateSpeech(eq(text), anyString(), anyDouble())).thenAnswer(inv -> {
            jdbc.update("INSERT INTO ai_voice_warning_cache (text_hash, raw_text, language, voice_name, audio_url, status, hit_count, created_at, last_accessed_at) VALUES (?, ?, 'vi-VN', ?, ?, 'READY', 1, NOW(6), NOW(6))",
                    cacheService.computeHash(text, "vi-VN", inv.getArgument(1), String.format(Locale.US, "VIETTEL_%.1f", (double) inv.getArgument(2))), text, inv.getArgument(1), "/api/v1/admin/ai/audio/" + Math.abs(text.hashCode()) + ".mp3");
            return new TestVoiceResponse(true, "/api/v1/admin/ai/audio/" + Math.abs(text.hashCode()) + ".mp3", "ok", 5, false);
        });
    }

    @Test
    void unknownInactiveOrSilentTemplatesNeverCallTheTtsProvider() {
        template(P + "OFF", P + "câu này đang tắt", false);
        template(P + "SILENT", null, true);
        assertTrue(feedback.ensureAudio(P + "KHONG_CO").isEmpty(), "mã không tồn tại");
        assertTrue(feedback.ensureAudio(P + "OFF").isEmpty(), "mẫu đã tắt");
        assertTrue(feedback.ensureAudio(P + "SILENT").isEmpty(), "mẫu không có câu đọc");
        assertTrue(feedback.ensureAudio(null).isEmpty());
        verifyNoInteractions(viettel, gemini);
    }

    @Test
    void firstRequestGeneratesWithTheConfiguredVoice_andLaterOnesReuseIt() {
        String text = P + "Khép khuỷu tay vào thân người.";
        template(P + "ELBOW", text, true);
        viettelWillSucceed(text);

        Optional<String> first = feedback.ensureAudio(P + "ELBOW");
        assertTrue(first.isPresent(), "tạo xong thì trả về địa chỉ audio");
        assertTrue(first.get().endsWith(".mp3"));
        assertEquals(first, feedback.ensureAudio(P + "elbow"), "mã không phân biệt hoa thường; dùng lại audio đã tạo");
        feedback.ensureAudio(P + "ELBOW");
        verify(viettel, times(1)).generateSpeech(eq(text), anyString(), anyDouble());     // chỉ trả phí một lần
        verifyNoInteractions(gemini);
    }

    @Test
    void aFailedGenerationIsNotRetriedStraightAway() {
        String text = P + "Siết bụng, giữ hông thẳng.";
        template(P + "HIP", text, true);
        when(viettel.generateSpeech(eq(text), anyString(), anyDouble())).thenReturn(new TestVoiceResponse(false, null, "lỗi mạng", 5, false));

        assertTrue(feedback.ensureAudio(P + "HIP").isEmpty());
        assertTrue(feedback.ensureAudio(P + "HIP").isEmpty());
        assertTrue(feedback.ensureAudio(P + "HIP").isEmpty());
        verify(viettel, times(1)).generateSpeech(eq(text), anyString(), anyDouble());     // lỗi thì tạm dừng thử lại, tránh gọi dịch vụ trả phí liên tục
    }

    @Test
    void aProviderExceptionIsHandledAsNoAudio() {
        String text = P + "Hạ sâu thêm một chút.";
        template(P + "DEPTH", text, true);
        when(viettel.generateSpeech(eq(text), anyString(), anyDouble())).thenThrow(new RuntimeException("timeout"));
        assertTrue(feedback.ensureAudio(P + "DEPTH").isEmpty());
    }
}
