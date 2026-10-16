package com.calishealth.api.service;

import com.calishealth.api.dto.UserTraineeDtos.UpdateProfileRequest;
import com.calishealth.api.dto.UserTraineeDtos.UserProfileResponse;
import com.calishealth.api.entity.User;
import com.calishealth.api.entity.UserProfile;
import com.calishealth.api.repository.UserProfileRepository;
import com.calishealth.api.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class UserProfileService {
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    public UserProfileService(UserProfileRepository userProfileRepository, UserRepository userRepository) {
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElse(null);

        return toResponse(user, profile);
    }

    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        UserProfile profile = userProfileRepository.findByUserId(userId).orElseGet(() -> {
            UserProfile p = new UserProfile();
            p.setUser(user);
            return p;
        });

        if (req.firstName() != null) profile.setFirstName(req.firstName());
        if (req.lastName() != null) profile.setLastName(req.lastName());
        if (req.dateOfBirth() != null) profile.setDateOfBirth(req.dateOfBirth());
        if (req.gender() != null) profile.setGender(req.gender());
        if (req.heightCm() != null) profile.setHeightCm(req.heightCm());
        if (req.weightKg() != null) profile.setWeightKg(req.weightKg());
        if (req.timezone() != null) profile.setTimezone(req.timezone());
        if (req.avatarUrl() != null) profile.setAvatarUrl(req.avatarUrl());

        UserProfile saved = userProfileRepository.save(profile);
        return toResponse(user, saved);
    }

    private UserProfileResponse toResponse(User user, UserProfile profile) {
        String firstName = profile != null ? profile.getFirstName() : null;
        String lastName = profile != null ? profile.getLastName() : null;
        String fullName = (firstName != null || lastName != null)
                ? ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim()
                : null;

        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                firstName,
                lastName,
                fullName,
                profile != null ? profile.getDateOfBirth() : null,
                profile != null ? profile.getGender() : null,
                profile != null ? profile.getHeightCm() : null,
                profile != null ? profile.getWeightKg() : null,
                profile != null ? profile.getTimezone() : "Asia/Ho_Chi_Minh",
                profile != null ? profile.getAvatarUrl() : null
        );
    }
}
