package com.calishealth.api.controller;

import com.calishealth.api.dto.MotionDtos.FeedbackAudioDto;
import com.calishealth.api.service.motion.MotionFeedbackService;
import org.springframework.web.bind.annotation.*;

/** Giọng đọc của câu phản hồi cho học viên khi tập với AI: đúng giọng Admin đã cấu hình, tạo một lần rồi dùng lại. */
@RestController
@RequestMapping("/api/v1/motion/feedback")
public class MotionFeedbackController {
    private final MotionFeedbackService feedback;

    public MotionFeedbackController(MotionFeedbackService feedback) { this.feedback = feedback; }

    @PostMapping("/{code}/audio")
    public FeedbackAudioDto audio(@PathVariable String code) {
        return new FeedbackAudioDto(feedback.ensureAudio(code).orElse(null));
    }
}
