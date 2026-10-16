package com.calishealth.api.controller;

import com.calishealth.api.dto.MotionDtos.*;
import com.calishealth.api.service.motion.MotionRuntimeService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/** Phiên phân tích chuyển động realtime: client gửi lô landmark (không gửi video). */
@RestController
@RequestMapping("/api/v1/motion/sessions")
public class MotionSessionController {
    private final MotionRuntimeService runtime;

    public MotionSessionController(MotionRuntimeService runtime) {
        this.runtime = runtime;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StartMotionSessionResponse start(@AuthenticationPrincipal Jwt jwt, @RequestBody StartMotionSessionRequest req) {
        return runtime.start(Long.valueOf(jwt.getSubject()), req);
    }

    @PostMapping("/{sessionId}/frames")
    public FrameBatchResponse frames(@AuthenticationPrincipal Jwt jwt, @PathVariable Long sessionId, @RequestBody FrameBatchRequest req) {
        return runtime.frames(Long.valueOf(jwt.getSubject()), sessionId, req);
    }

    @PostMapping("/{sessionId}/finish")
    public FinishMotionSessionResponse finish(@AuthenticationPrincipal Jwt jwt, @PathVariable Long sessionId) {
        return runtime.finish(Long.valueOf(jwt.getSubject()), sessionId);
    }
}
