package com.calishealth.api.service;

import com.calishealth.api.dto.AuthDtos.*;
import com.calishealth.api.entity.EmailVerification;
import com.calishealth.api.entity.User;
import com.calishealth.api.repository.EmailVerificationRepository;
import com.calishealth.api.repository.UserProfileRepository;
import com.calishealth.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserProfileRepository userProfileRepository;
    @Mock
    private EmailVerificationRepository emailVerificationRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtEncoder jwtEncoder;

    private AuthService authService;

    @BeforeEach
    public void setUp() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("app.jwt.expiration-minutes", "120");
        env.setProperty("app.mail.otp-expiration-minutes", "10");

        authService = new AuthService(
                userRepository,
                userProfileRepository,
                emailVerificationRepository,
                emailService,
                passwordEncoder,
                jwtEncoder,
                env
        );
    }

    @Test
    void register_Success_CreatesUserAndSendsOtp() {
        RegisterRequest req = new RegisterRequest("test@example.com", "Password123!", "Nguyen", "An");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(req.password())).thenReturn("hashed_pass");

        RegisterResponse res = authService.register(req);

        assertEquals("test@example.com", res.email());
        assertTrue(res.message().contains("thành công"));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("test@example.com", savedUser.getEmail());
        assertFalse(savedUser.isEmailVerified());

        verify(emailVerificationRepository).save(any(EmailVerification.class));
        verify(emailService).sendOtpEmail(eq("test@example.com"), anyString(), eq(10));
    }

    @Test
    void login_ThrowsException_WhenEmailNotVerified() {
        LoginRequest req = new LoginRequest("test@example.com", "Password123!");
        User user = new User();
        user.setEmail("test@example.com");
        user.setPasswordHash("hashed_pass");
        user.setEmailVerified(false);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(req.password(), "hashed_pass")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.login(req));
        assertTrue(ex.getMessage().contains("chưa được kích hoạt"));
    }

    @Test
    void verifyOtp_Success_VerifiesUserAndReturnsToken() {
        VerifyOtpRequest req = new VerifyOtpRequest("test@example.com", "123456");
        EmailVerification verification = new EmailVerification();
        verification.setEmail("test@example.com");
        verification.setOtpCode("123456");
        verification.setType("REGISTER");
        verification.setExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));

        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setEmailVerified(false);

        Jwt mockJwt = mock(Jwt.class);
        when(mockJwt.getTokenValue()).thenReturn("mock.jwt.token");
        when(jwtEncoder.encode(any(JwtEncoderParameters.class))).thenReturn(mockJwt);

        when(emailVerificationRepository.findTopByEmailAndOtpCodeAndTypeAndVerifiedAtIsNullOrderByCreatedAtDesc(
                "test@example.com", "123456", "REGISTER"
        )).thenReturn(Optional.of(verification));
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        AuthResponse res = authService.verifyOtp(req);

        assertNotNull(res);
        assertEquals("mock.jwt.token", res.accessToken());
        assertEquals("test@example.com", res.email());
        assertTrue(user.isEmailVerified());
        assertNotNull(verification.getVerifiedAt());

        verify(userRepository).save(user);
        verify(emailVerificationRepository).save(verification);
    }

    @Test
    void verifyOtp_Fails_WhenOtpExpired() {
        VerifyOtpRequest req = new VerifyOtpRequest("test@example.com", "123456");
        EmailVerification verification = new EmailVerification();
        verification.setEmail("test@example.com");
        verification.setOtpCode("123456");
        verification.setType("REGISTER");
        verification.setExpiresAt(Instant.now().minus(5, ChronoUnit.MINUTES));

        when(emailVerificationRepository.findTopByEmailAndOtpCodeAndTypeAndVerifiedAtIsNullOrderByCreatedAtDesc(
                "test@example.com", "123456", "REGISTER"
        )).thenReturn(Optional.of(verification));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(req));
        assertTrue(ex.getMessage().contains("hết hạn"));
    }

    @Test
    void resendOtp_Success_SendsNewOtp() {
        ResendOtpRequest req = new ResendOtpRequest("test@example.com");
        User user = new User();
        user.setEmail("test@example.com");
        user.setEmailVerified(false);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        SimpleMessageResponse res = authService.resendOtp(req);

        assertTrue(res.message().contains("Mã OTP mới đã được gửi"));
        verify(emailVerificationRepository).save(any(EmailVerification.class));
        verify(emailService).sendOtpEmail(eq("test@example.com"), anyString(), eq(10));
    }
}
