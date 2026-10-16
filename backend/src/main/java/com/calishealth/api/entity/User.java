package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "users")
public class User {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(nullable = false, unique = true, length = 255) private String email;
 @Column(name = "password_hash", nullable = false, length = 255) private String passwordHash;
 @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private UserStatus status = UserStatus.ACTIVE;
 @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private Role role = Role.USER;
 @Column(name = "email_verified", nullable = false) private boolean emailVerified = false;
 @Column(name = "last_login_at") private Instant lastLoginAt;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
 @Column(name = "updated_at", nullable = false) private Instant updatedAt;
 @Column(name = "deleted_at") private Instant deletedAt;

 @PrePersist protected void onCreate(){ Instant now = Instant.now(); createdAt = now; updatedAt = now; }
 @PreUpdate protected void onUpdate(){ updatedAt = Instant.now(); }

 public Long getId(){return id;} public void setId(Long v){id=v;}
 public String getEmail(){return email;} public void setEmail(String v){email=v;}
 public String getPasswordHash(){return passwordHash;} public void setPasswordHash(String v){passwordHash=v;}
 public UserStatus getStatus(){return status;} public void setStatus(UserStatus v){status=v;}
 public Role getRole(){return role;} public void setRole(Role v){role=v;}
 public boolean isEmailVerified(){return emailVerified;} public void setEmailVerified(boolean v){emailVerified=v;}
 public Instant getLastLoginAt(){return lastLoginAt;} public void setLastLoginAt(Instant v){lastLoginAt=v;}
 public Instant getCreatedAt(){return createdAt;}
 public Instant getUpdatedAt(){return updatedAt;}
 public Instant getDeletedAt(){return deletedAt;} public void setDeletedAt(Instant v){deletedAt=v;}
}
