package com.calishealth.api.service;

import com.calishealth.api.dto.AdminDtos.AdminUserResponse;
import com.calishealth.api.dto.AdminDtos.UpdateUserRoleRequest;
import com.calishealth.api.dto.AdminDtos.UpdateUserStatusRequest;
import com.calishealth.api.entity.Role;
import com.calishealth.api.entity.User;
import com.calishealth.api.entity.UserProfile;
import com.calishealth.api.entity.UserStatus;
import com.calishealth.api.repository.UserProfileRepository;
import com.calishealth.api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminUserService {
    private final UserRepository userRepo;
    private final UserProfileRepository profileRepo;

    public AdminUserService(UserRepository userRepo, UserProfileRepository profileRepo) {
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
    }

    public List<AdminUserResponse> listUsers(Role role, UserStatus status, String keyword) {
        List<User> list;
        if (role != null) {
            list = userRepo.findByRole(role);
        } else if (status != null) {
            list = userRepo.findByStatus(status);
        } else {
            list = userRepo.findAll();
        }

        if (status != null && role != null) {
            list = list.stream().filter(u -> u.getStatus() == status).toList();
        }

        if (keyword != null && !keyword.isBlank()) {
            String kw = keyword.trim().toLowerCase();
            list = list.stream()
                    .filter(u -> u.getEmail().toLowerCase().contains(kw))
                    .toList();
        }

        return list.stream().map(this::toResponse).toList();
    }

    public AdminUserResponse getUser(Long id) {
        User u = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + id));
        return toResponse(u);
    }

    @Transactional
    public AdminUserResponse updateUserStatus(Long id, UpdateUserStatusRequest req) {
        if (req.status() == null) {
            throw new IllegalArgumentException("Trạng thái người dùng không được để trống");
        }
        User u = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + id));
        u.setStatus(req.status());
        return toResponse(userRepo.save(u));
    }

    @Transactional
    public AdminUserResponse updateUserRole(Long id, UpdateUserRoleRequest req) {
        if (req.role() == null) {
            throw new IllegalArgumentException("Vai trò người dùng không được để trống");
        }
        User u = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + id));
        u.setRole(req.role());
        return toResponse(userRepo.save(u));
    }

    private AdminUserResponse toResponse(User u) {
        UserProfile p = profileRepo.findByUserId(u.getId()).orElse(null);
        String firstName = p != null ? p.getFirstName() : null;
        String lastName = p != null ? p.getLastName() : null;
        String fullName = p == null ? null : ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
        return new AdminUserResponse(
                u.getId(),
                u.getEmail(),
                u.getRole(),
                u.getStatus(),
                u.isEmailVerified(),
                firstName,
                lastName,
                fullName == null || fullName.isEmpty() ? null : fullName,
                u.getLastLoginAt(),
                u.getCreatedAt()
        );
    }
}
