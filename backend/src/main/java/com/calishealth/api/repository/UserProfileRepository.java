package com.calishealth.api.repository;
import com.calishealth.api.entity.UserProfile; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface UserProfileRepository extends JpaRepository<UserProfile,Long>{Optional<UserProfile> findByUserId(Long userId);}
