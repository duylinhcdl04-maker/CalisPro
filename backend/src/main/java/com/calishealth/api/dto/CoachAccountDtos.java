package com.calishealth.api.dto;

import java.time.Instant;

/** Tài khoản Coach do Admin tạo (mật khẩu tạm gửi qua email, bắt buộc đổi ở lần đăng nhập đầu). KHÔNG bao giờ trả mật khẩu trong response. */
public final class CoachAccountDtos {
    private CoachAccountDtos() {}

    public record CreateCoachRequest(String email, String fullName) {}

    /**
     * state: LOCKED (nhập sai mật khẩu nhiều lần, tới lockedUntil) | PENDING_FIRST_LOGIN (chưa đổi mật khẩu tạm) | TEMP_EXPIRED (mật khẩu tạm hết hạn, cần cấp lại) | ACTIVE.
     * status = trạng thái tài khoản (ACTIVE | INACTIVE | SUSPENDED | DELETED), độc lập với state.
     */
    public record CoachAccountDto(long id, String email, String fullName, String status, String state, boolean mustChangePassword, Instant tempPasswordExpiresAt,
                                  Instant lockedUntil, Instant lastLoginAt, Instant createdAt) {}

    public record ChangePasswordRequest(String currentPassword, String newPassword) {}
}
