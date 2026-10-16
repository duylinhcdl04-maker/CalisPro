package com.calishealth.api.dto;

public final class AuthDtos {
    private AuthDtos(){}

    public record RegisterRequest(String email, String password, String firstName, String lastName){}
    public record RegisterResponse(String message, String email){}
    public record VerifyOtpRequest(String email, String otp){}
    public record ResendOtpRequest(String email){}
    public record LoginRequest(String email, String password){}
    public record SimpleMessageResponse(String message){}
    /** mustChangePassword = true: đang dùng mật khẩu tạm, token chỉ dùng được để đổi mật khẩu (POST /api/v1/account/change-password). */
    public record AuthResponse(String accessToken, String tokenType, String userId, String email, String fullName, boolean mustChangePassword){
        public AuthResponse(String accessToken, String tokenType, String userId, String email, String fullName) {
            this(accessToken, tokenType, userId, email, fullName, false);
        }
    }
}
