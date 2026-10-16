package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Table(name = "user_profiles")
public class UserProfile {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @OneToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false, unique = true) private User user;
 @Column(name = "first_name", length = 100) private String firstName;
 @Column(name = "last_name", length = 100) private String lastName;
 @Column(name = "date_of_birth") private LocalDate dateOfBirth;
 @Column(length = 30) private String gender;
 @Column(name = "height_cm", precision = 5, scale = 2) private BigDecimal heightCm;
 @Column(name = "weight_kg", precision = 6, scale = 2) private BigDecimal weightKg;
 @Column(nullable = false, length = 64) private String timezone = "Asia/Ho_Chi_Minh";
 @Column(name = "avatar_url", length = 500) private String avatarUrl;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
 @Column(name = "updated_at", nullable = false) private Instant updatedAt;

 @PrePersist void onCreate(){ Instant now = Instant.now(); createdAt = now; updatedAt = now; }
 @PreUpdate void onUpdate(){ updatedAt = Instant.now(); }

 public Long getId(){return id;}
 public User getUser(){return user;} public void setUser(User v){user=v;}
 public String getFirstName(){return firstName;} public void setFirstName(String v){firstName=v;}
 public String getLastName(){return lastName;} public void setLastName(String v){lastName=v;}
 public LocalDate getDateOfBirth(){return dateOfBirth;} public void setDateOfBirth(LocalDate v){dateOfBirth=v;}
 public String getGender(){return gender;} public void setGender(String v){gender=v;}
 public BigDecimal getHeightCm(){return heightCm;} public void setHeightCm(BigDecimal v){heightCm=v;}
 public BigDecimal getWeightKg(){return weightKg;} public void setWeightKg(BigDecimal v){weightKg=v;}
 public String getTimezone(){return timezone;} public void setTimezone(String v){timezone=v;}
 public String getAvatarUrl(){return avatarUrl;} public void setAvatarUrl(String v){avatarUrl=v;}
 public Instant getCreatedAt(){return createdAt;}
 public Instant getUpdatedAt(){return updatedAt;}
}
