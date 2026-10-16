package com.calishealth.api.service;

import com.calishealth.api.dto.CoachAccountDtos.CoachAccountDto;
import com.calishealth.api.dto.CoachAccountDtos.CreateCoachRequest;
import com.calishealth.api.entity.Role;
import com.calishealth.api.entity.User;
import com.calishealth.api.entity.UserProfile;
import com.calishealth.api.entity.UserStatus;
import com.calishealth.api.repository.UserProfileRepository;
import com.calishealth.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Admin tạo tài khoản Coach (thay cho luồng nộp hồ sơ): tài khoản ACTIVE, đã xác thực email, mật khẩu TẠM ngẫu nhiên gửi qua email,
 * bắt buộc đổi mật khẩu ở lần đăng nhập đầu, mật khẩu tạm có hạn. Gửi email lỗi ⇒ hoàn tác toàn bộ (không có tài khoản "mồ côi").
 * Mật khẩu tạm chỉ tồn tại trong email gửi đi (và log khi app.mail.log-only=true, chỉ dev); không lưu, không trả về trong API.
 */
@Service
public class CoachAccountService {
    private static final Pattern EMAIL = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final UserRepository users;
    private final UserProfileRepository profiles;
    private final PasswordEncoder encoder;
    private final PasswordPolicyService policy;
    private final EmailService email;
    private final LoginThrottleService throttle;
    private final int tempValidHours;
    private final String loginUrl;

    public CoachAccountService(UserRepository users, UserProfileRepository profiles, PasswordEncoder encoder, PasswordPolicyService policy, EmailService email, LoginThrottleService throttle,
                               @Value("${app.coach-account.temp-password-hours:72}") int tempValidHours,
                               @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.users = users; this.profiles = profiles; this.encoder = encoder; this.policy = policy; this.email = email; this.throttle = throttle;
        this.tempValidHours = tempValidHours;
        this.loginUrl = frontendUrl.replaceAll("/+$", "") + "/login";
    }

    @Transactional
    public CoachAccountDto create(long adminId, CreateCoachRequest r) {
        String address = r == null || r.email() == null ? "" : r.email().trim().toLowerCase();
        String fullName = r == null || r.fullName() == null ? "" : r.fullName().trim().replaceAll("\\s+", " ");
        if (!EMAIL.matcher(address).matches() || address.length() > 255) throw new IllegalArgumentException("Email không hợp lệ");
        if (fullName.length() < 2 || fullName.length() > 100) throw new IllegalArgumentException("Họ tên phải từ 2 đến 100 ký tự");
        if (users.findByEmail(address).isPresent()) throw new IllegalArgumentException("Email đã được sử dụng bởi một tài khoản khác");

        String temp = TempPasswordGenerator.generate();
        User u = new User();
        u.setEmail(address);
        u.setPasswordHash(encoder.encode(temp));
        u.setRole(Role.COACH);
        u.setStatus(UserStatus.ACTIVE);
        u.setEmailVerified(true);
        u = users.save(u);
        UserProfile p = new UserProfile();
        p.setUser(u);
        p.setFirstName(fullName);
        p.setLastName("");
        profiles.save(p);

        Instant expires = Instant.now().plus(Duration.ofHours(tempValidHours));
        policy.issueTemporary(u.getId(), adminId, expires);
        email.sendCoachAccountEmail(address, fullName, temp, loginUrl, tempValidHours);     // lỗi ⇒ ném ngoại lệ ⇒ rollback
        return dto(u, fullName);
    }

    /** Cấp lại mật khẩu tạm (quên mật khẩu, mật khẩu tạm hết hạn). Chỉ cho tài khoản Coach. */
    @Transactional
    public CoachAccountDto resetPassword(long adminId, long userId) {
        User u = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản"));
        if (u.getRole() != Role.COACH) throw new IllegalArgumentException("Chỉ cấp lại mật khẩu cho tài khoản Coach");
        String temp = TempPasswordGenerator.generate();
        u.setPasswordHash(encoder.encode(temp));
        users.save(u);
        policy.issueTemporary(u.getId(), adminId, Instant.now().plus(Duration.ofHours(tempValidHours)));
        throttle.reset(u.getId());     // cấp lại mật khẩu cũng mở khoá
        String name = fullName(u);
        email.sendCoachAccountEmail(u.getEmail(), name, temp, loginUrl, tempValidHours);
        return dto(u, name);
    }

    /** Admin mở khoá tài khoản đang bị khoá do nhập sai mật khẩu nhiều lần. */
    @Transactional
    public CoachAccountDto unlock(long userId) {
        User u = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản"));
        if (u.getRole() != Role.COACH) throw new IllegalArgumentException("Chỉ mở khoá tài khoản Coach");
        throttle.reset(u.getId());
        return dto(u, fullName(u));
    }

    public List<CoachAccountDto> list() {
        return users.findByRole(Role.COACH).stream().filter(u -> u.getStatus() != UserStatus.DELETED)
                .sorted(Comparator.comparing(User::getCreatedAt).reversed()).map(u -> dto(u, fullName(u))).toList();
    }

    private CoachAccountDto dto(User u, String name) {
        var pol = policy.find(u.getId());
        boolean must = pol.map(PasswordPolicyService.Policy::mustChange).orElse(false);
        boolean expired = pol.map(x -> x.tempExpired(Instant.now())).orElse(false);
        Instant lockedUntil = throttle.lockedUntil(u.getId()).orElse(null);
        String state = lockedUntil != null ? "LOCKED" : expired ? "TEMP_EXPIRED" : must ? "PENDING_FIRST_LOGIN" : "ACTIVE";
        return new CoachAccountDto(u.getId(), u.getEmail(), name, u.getStatus().name(), state, must, pol.map(PasswordPolicyService.Policy::tempExpiresAt).orElse(null),
                lockedUntil, u.getLastLoginAt(), u.getCreatedAt());
    }

    private String fullName(User u) {
        return profiles.findByUserId(u.getId()).map(p -> ((p.getFirstName() == null ? "" : p.getFirstName()) + " " + (p.getLastName() == null ? "" : p.getLastName())).trim())
                .filter(s -> !s.isEmpty()).orElse(u.getEmail());
    }
}
