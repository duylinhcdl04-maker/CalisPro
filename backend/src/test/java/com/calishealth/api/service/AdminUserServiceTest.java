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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserProfileRepository profileRepository;

    private AdminUserService adminUserService;

    @BeforeEach
    public void setUp() {
        adminUserService = new AdminUserService(userRepository, profileRepository);
    }

    @Test
    public void listUsers_FilterByRole() {
        User coach = new User();
        coach.setId(1L);
        coach.setEmail("coach@example.com");
        coach.setRole(Role.COACH);

        when(userRepository.findByRole(Role.COACH)).thenReturn(List.of(coach));
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.empty());

        List<AdminUserResponse> result = adminUserService.listUsers(Role.COACH, null, null);

        assertEquals(1, result.size());
        assertEquals("coach@example.com", result.get(0).email());
        assertEquals(Role.COACH, result.get(0).role());
    }

    @Test
    public void updateUserRole_Success() {
        User user = new User();
        user.setId(2L);
        user.setEmail("user@example.com");
        user.setRole(Role.USER);

        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setFirstName("John");
        profile.setLastName("Doe");

        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(profileRepository.findByUserId(2L)).thenReturn(Optional.of(profile));

        AdminUserResponse response = adminUserService.updateUserRole(2L, new UpdateUserRoleRequest(Role.COACH));

        assertNotNull(response);
        assertEquals(Role.COACH, response.role());
        assertEquals("John Doe", response.fullName());
        verify(userRepository).save(user);
    }

    @Test
    public void updateUserStatus_Success() {
        User user = new User();
        user.setId(3L);
        user.setEmail("test@example.com");
        user.setStatus(UserStatus.ACTIVE);

        when(userRepository.findById(3L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(profileRepository.findByUserId(3L)).thenReturn(Optional.empty());

        AdminUserResponse response = adminUserService.updateUserStatus(3L, new UpdateUserStatusRequest(UserStatus.SUSPENDED));

        assertNotNull(response);
        assertEquals(UserStatus.SUSPENDED, response.status());
        verify(userRepository).save(user);
    }
}
