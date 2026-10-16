package com.calishealth.api.service;

import com.calishealth.api.dto.UserTraineeDtos.UpdateProfileRequest;
import com.calishealth.api.dto.UserTraineeDtos.UserProfileResponse;
import com.calishealth.api.entity.Role;
import com.calishealth.api.entity.User;
import com.calishealth.api.entity.UserProfile;
import com.calishealth.api.repository.UserProfileRepository;
import com.calishealth.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserProfileServiceTest {

    @Mock
    private UserProfileRepository profileRepository;

    @Mock
    private UserRepository userRepository;

    private UserProfileService service;

    @BeforeEach
    void setUp() {
        service = new UserProfileService(profileRepository, userRepository);
    }

    @Test
    void getProfile_ReturnsProfile() {
        User user = new User();
        user.setId(10L);
        user.setEmail("trainee@calishealth.com");
        user.setRole(Role.USER);

        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setFirstName("Thanh");
        profile.setLastName("Nguyen");
        profile.setHeightCm(BigDecimal.valueOf(175));
        profile.setWeightKg(BigDecimal.valueOf(68.5));

        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(profileRepository.findByUserId(10L)).thenReturn(Optional.of(profile));

        UserProfileResponse resp = service.getProfile(10L);

        assertNotNull(resp);
        assertEquals(10L, resp.userId());
        assertEquals("trainee@calishealth.com", resp.email());
        assertEquals("Thanh Nguyen", resp.fullName());
        assertEquals(BigDecimal.valueOf(175), resp.heightCm());
        assertEquals(BigDecimal.valueOf(68.5), resp.weightKg());
    }

    @Test
    void updateProfile_CreatesOrUpdates() {
        User user = new User();
        user.setId(10L);
        user.setEmail("trainee@calishealth.com");
        user.setRole(Role.USER);

        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(profileRepository.findByUserId(10L)).thenReturn(Optional.empty());
        when(profileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProfileRequest req = new UpdateProfileRequest(
                "Duy",
                "Linh",
                LocalDate.of(2000, 1, 1),
                "MALE",
                BigDecimal.valueOf(172),
                BigDecimal.valueOf(65),
                "Asia/Ho_Chi_Minh",
                "http://avatar.url"
        );

        UserProfileResponse resp = service.updateProfile(10L, req);

        assertNotNull(resp);
        assertEquals("Duy Linh", resp.fullName());
        assertEquals("MALE", resp.gender());
        assertEquals(BigDecimal.valueOf(172), resp.heightCm());
        verify(profileRepository).save(any(UserProfile.class));
    }
}
