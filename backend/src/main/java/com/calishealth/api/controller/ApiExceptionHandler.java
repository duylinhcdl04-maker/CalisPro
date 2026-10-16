package com.calishealth.api.controller;

import com.calishealth.api.dto.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
public class ApiExceptionHandler {

    /** Không đủ quyền với thao tác này (vd. Coach xóa bài đã xuất bản) -> 403 kèm lý do */
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    ResponseEntity<ApiError> forbidden(org.springframework.security.access.AccessDeniedException e, HttpServletRequest req) {
        return ResponseEntity.status(403).body(new ApiError(Instant.now(), 403, "Forbidden", e.getMessage(), req.getRequestURI()));
    }

    /** Dữ liệu không hợp lệ / không tìm thấy -> 400 kèm thông báo cho người dùng */
    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiError> bad(IllegalArgumentException e, HttpServletRequest req) {
        return ResponseEntity.badRequest().body(new ApiError(Instant.now(), 400, "Bad Request", e.getMessage(), req.getRequestURI()));
    }

    /** Xung đột trạng thái (vd. bài test đầu vào đã đổi trong lúc học viên đang làm) -> 409 */
    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<ApiError> conflict(IllegalStateException e, HttpServletRequest req) {
        return ResponseEntity.status(409).body(new ApiError(Instant.now(), 409, "Conflict", e.getMessage(), req.getRequestURI()));
    }
}
