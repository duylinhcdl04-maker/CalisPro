package com.calishealth.api.service;

import com.calishealth.api.dto.AuthDtos.*;
import com.calishealth.api.entity.EmailVerification;
import com.calishealth.api.entity.User;
import com.calishealth.api.entity.UserProfile;
import com.calishealth.api.repository.EmailVerificationRepository;
import com.calishealth.api.repository.UserProfileRepository;
import com.calishealth.api.repository.UserRepository;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class AuthService {
    private final UserRepository users;
    private final UserProfileRepository profiles;
    private final EmailVerificationRepository emailVerifications;
    private final EmailService emailService;
    private final PasswordEncoder encoder;
    private final JwtEncoder jwtEncoder;
    private final long expirationMinutes;
    private final long otpExpirationMinutes;
    private final PasswordPolicyService passwordPolicy;   // null = không có ràng buộc mật khẩu tạm (test/legacy)
    private final LoginThrottleService throttle;           // null = không khoá tài khoản (test/legacy)

    public AuthService(UserRepository users, UserProfileRepository profiles, EmailVerificationRepository emailVerifications, EmailService emailService,
                       PasswordEncoder encoder, JwtEncoder jwtEncoder, Environment env) {
        this(users, profiles, emailVerifications, emailService, encoder, jwtEncoder, env, null, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public AuthService(
            UserRepository users,
            UserProfileRepository profiles,
            EmailVerificationRepository emailVerifications,
            EmailService emailService,
            PasswordEncoder encoder,
            JwtEncoder jwtEncoder,
            Environment env,
            PasswordPolicyService passwordPolicy,
            LoginThrottleService throttle
    ) {
        this.passwordPolicy = passwordPolicy;
        this.throttle = throttle;
        this.users = users;
        this.profiles = profiles;
        this.emailVerifications = emailVerifications;
        this.emailService = emailService;
        this.encoder = encoder;
        this.jwtEncoder = jwtEncoder;
        this.expirationMinutes = Long.parseLong(env.getProperty("app.jwt.expiration-minutes", "120"));
        this.otpExpirationMinutes = Long.parseLong(env.getProperty("app.mail.otp-expiration-minutes", "10"));
    }

    @Transactional
    public RegisterResponse register(RegisterRequest r) {
        if (r.email() == null || r.email().isBlank()) {
            throw new IllegalArgumentException("Email không được để trống");
        }
        if (r.password() == null || r.password().length() < 8) {
            throw new IllegalArgumentException("Mật khẩu phải chứa ít nhất 8 ký tự");
        }

        String email = r.email().trim().toLowerCase();
        var existingOpt = users.findByEmail(email);

        User u;
        if (existingOpt.isPresent()) {
            u = existingOpt.get();
            if (u.isEmailVerified()) {
                throw new IllegalArgumentException("Email đã được đăng ký trong hệ thống");
            }
            // User exists but unverified: update password and names
            u.setPasswordHash(encoder.encode(r.password()));
            users.save(u);

            UserProfile p = profiles.findByUserId(u.getId()).orElseGet(() -> {
                UserProfile np = new UserProfile();
                np.setUser(u);
                return np;
            });
            p.setFirstName(r.firstName());
            p.setLastName(r.lastName());
            profiles.save(p);
        } else {
            u = new User();
            u.setEmail(email);
            u.setPasswordHash(encoder.encode(r.password()));
            u.setEmailVerified(false);
            users.save(u);

            UserProfile p = new UserProfile();
            p.setUser(u);
            p.setFirstName(r.firstName());
            p.setLastName(r.lastName());
            profiles.save(p);
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));

        EmailVerification v = new EmailVerification();
        v.setEmail(email);
        v.setOtpCode(otp);
        v.setType("REGISTER");
        v.setExpiresAt(Instant.now().plus(Duration.ofMinutes(otpExpirationMinutes)));
        emailVerifications.save(v);

        // Send email via Gmail SMTP
        emailService.sendOtpEmail(email, otp, (int) otpExpirationMinutes);

        return new RegisterResponse("Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP xác thực.", email);
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest r) {
        if (r.email() == null || r.email().isBlank() || r.otp() == null || r.otp().isBlank()) {
            throw new IllegalArgumentException("Email và mã OTP không được để trống");
        }

        String email = r.email().trim().toLowerCase();
        String otp = r.otp().trim();

        EmailVerification v = emailVerifications
                .findTopByEmailAndOtpCodeAndTypeAndVerifiedAtIsNullOrderByCreatedAtDesc(email, otp, "REGISTER")
                .orElseThrow(() -> new IllegalArgumentException("Mã OTP không chính xác hoặc đã được sử dụng"));

        if (v.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.");
        }

        v.setVerifiedAt(Instant.now());
        emailVerifications.save(v);

        User u = users.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin tài khoản"));
        u.setEmailVerified(true);
        users.save(u);

        UserProfile p = profiles.findByUserId(u.getId()).orElse(null);
        return token(u, p);
    }

    @Transactional
    public SimpleMessageResponse resendOtp(ResendOtpRequest r) {
        if (r.email() == null || r.email().isBlank()) {
            throw new IllegalArgumentException("Email không được để trống");
        }

        String email = r.email().trim().toLowerCase();
        User u = users.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email này chưa được đăng ký"));

        if (u.isEmailVerified()) {
            throw new IllegalArgumentException("Email này đã được xác thực, bạn có thể đăng nhập ngay");
        }

        String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));

        EmailVerification v = new EmailVerification();
        v.setEmail(email);
        v.setOtpCode(otp);
        v.setType("REGISTER");
        v.setExpiresAt(Instant.now().plus(Duration.ofMinutes(otpExpirationMinutes)));
        emailVerifications.save(v);

        emailService.sendOtpEmail(email, otp, (int) otpExpirationMinutes);

        return new SimpleMessageResponse("Mã OTP mới đã được gửi đến email của bạn.");
    }

    @Transactional
    public AuthResponse login(LoginRequest r) {
        if (r.email() == null || r.email().isBlank() || r.password() == null || r.password().isBlank()) {
            throw new IllegalArgumentException("Email và mật khẩu không được để trống");
        }

        User u = users.findByEmail(r.email().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Email hoặc mật khẩu không chính xác"));

        // Đang bị khoá thì từ chối TRƯỚC khi so mật khẩu (kể cả mật khẩu đúng) để không thành công cụ dò mật khẩu
        if (throttle != null) {
            var lockedUntil = throttle.lockedUntil(u.getId());
            if (lockedUntil.isPresent()) throw new IllegalArgumentException(lockMessage(lockedUntil.get()));
        }

        if (!encoder.matches(r.password(), u.getPasswordHash())) {
            if (throttle != null) {
                var nowLocked = throttle.recordFailure(u.getId());
                if (nowLocked != null) throw new IllegalArgumentException(lockMessage(nowLocked));
            }
            throw new IllegalArgumentException("Email hoặc mật khẩu không chính xác");
        }

        // Mật khẩu đúng nhưng tài khoản bị vô hiệu hoá: báo rõ (không lộ gì cho người không biết mật khẩu)
        if (u.getStatus() != com.calishealth.api.entity.UserStatus.ACTIVE || u.getDeletedAt() != null) {
            throw new IllegalArgumentException("Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
        }

        if (!u.isEmailVerified()) {
            throw new IllegalArgumentException("Tài khoản chưa được kích hoạt. Vui lòng xác thực mã OTP trước khi đăng nhập.");
        }

        // Mật khẩu tạm do Admin cấp: quá hạn thì không đăng nhập được (kiểm tra SAU khi mật khẩu đúng nên không lộ tài khoản có tồn tại hay không);
        // còn hạn thì đăng nhập được nhưng token chỉ dùng để đổi mật khẩu.
        boolean mustChange = false;
        if (passwordPolicy != null) {
            var policy = passwordPolicy.find(u.getId());
            if (policy.isPresent() && policy.get().tempExpired(Instant.now()))
                throw new IllegalArgumentException("Mật khẩu tạm đã hết hạn. Vui lòng liên hệ quản trị viên để được cấp lại.");
            mustChange = policy.map(PasswordPolicyService.Policy::mustChange).orElse(false);
        }

        if (throttle != null) throttle.reset(u.getId());
        u.setLastLoginAt(Instant.now());
        users.save(u);

        UserProfile p = profiles.findByUserId(u.getId()).orElse(null);
        return token(u, p, mustChange);
    }

    /**
     * Đổi mật khẩu (tự nguyện hoặc bắt buộc sau khi nhận mật khẩu tạm). Trả token MỚI không còn hạn chế để người dùng đi tiếp mà không phải đăng nhập lại.
     * Mật khẩu mới: ≥ 8 ký tự, có chữ và số, khác mật khẩu hiện tại và khác email.
     */
    @Transactional
    public AuthResponse changePassword(long userId, String currentPassword, String newPassword) {
        User u = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản"));
        if (currentPassword == null || !encoder.matches(currentPassword, u.getPasswordHash()))
            throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác");
        validateNewPassword(u, currentPassword, newPassword);
        u.setPasswordHash(encoder.encode(newPassword));
        users.save(u);
        if (passwordPolicy != null) passwordPolicy.markChanged(u.getId());
        if (throttle != null) throttle.reset(u.getId());
        return token(u, profiles.findByUserId(u.getId()).orElse(null), false);
    }

    private String lockMessage(Instant until) {
        long minutes = Math.max(1, java.time.Duration.between(Instant.now(), until).plusSeconds(59).toMinutes());
        return "Tài khoản tạm thời bị khóa do nhập sai mật khẩu nhiều lần. Vui lòng thử lại sau " + minutes + " phút hoặc liên hệ quản trị viên.";
    }

    static void validateNewPassword(User u, String current, String candidate) {
        if (candidate == null || candidate.length() < 8) throw new IllegalArgumentException("Mật khẩu mới phải có ít nhất 8 ký tự");
        if (candidate.length() > 72) throw new IllegalArgumentException("Mật khẩu mới tối đa 72 ký tự");
        if (candidate.chars().noneMatch(Character::isLetter) || candidate.chars().noneMatch(Character::isDigit))
            throw new IllegalArgumentException("Mật khẩu mới phải gồm cả chữ và số");
        if (candidate.equals(current)) throw new IllegalArgumentException("Mật khẩu mới phải khác mật khẩu hiện tại");
        if (candidate.equalsIgnoreCase(u.getEmail())) throw new IllegalArgumentException("Mật khẩu mới không được trùng email");
    }

    private AuthResponse token(User u, UserProfile p) {
        return token(u, p, false);
    }

    private AuthResponse token(User u, UserProfile p, boolean mustChangePassword) {
        Instant now = Instant.now();
        JwtClaimsSet.Builder claimBuilder = JwtClaimsSet.builder()
                .issuer("calishealth-api")
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofMinutes(expirationMinutes)))
                .subject(u.getId().toString())
                .claim("email", u.getEmail())
                .claim("role", u.getRole().name());
        if (mustChangePassword) claimBuilder.claim("mcp", true);     // token hạn chế: chỉ được đổi mật khẩu (PasswordChangeRequiredFilter)
        JwtClaimsSet claims = claimBuilder.build();
        String t = jwtEncoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        String fullName = p == null ? null : ((p.getFirstName() == null ? "" : p.getFirstName()) + " " + (p.getLastName() == null ? "" : p.getLastName())).trim();
        return new AuthResponse(t, "Bearer", u.getId().toString(), u.getEmail(), fullName == null || fullName.isEmpty() ? null : fullName, mustChangePassword);
    }
}
