package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "user_sessions")
public class UserSession {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
 @Column(name = "refresh_token_hash", nullable = false, unique = true, length = 255) private String refreshTokenHash;
 @Column(name = "device_name", length = 255) private String deviceName;
 @Column(name = "device_type", length = 50) private String deviceType;
 @Column(name = "ip_address", length = 45) private String ipAddress;
 @Column(name = "user_agent", columnDefinition = "text") private String userAgent;
 @Column(name = "expires_at", nullable = false) private Instant expiresAt;
 @Column(name = "revoked_at") private Instant revokedAt;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist protected void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public User getUser(){return user;} public void setUser(User v){user=v;}
 public String getRefreshTokenHash(){return refreshTokenHash;} public void setRefreshTokenHash(String v){refreshTokenHash=v;}
 public String getDeviceName(){return deviceName;} public void setDeviceName(String v){deviceName=v;}
 public String getDeviceType(){return deviceType;} public void setDeviceType(String v){deviceType=v;}
 public String getIpAddress(){return ipAddress;} public void setIpAddress(String v){ipAddress=v;}
 public String getUserAgent(){return userAgent;} public void setUserAgent(String v){userAgent=v;}
 public Instant getExpiresAt(){return expiresAt;} public void setExpiresAt(Instant v){expiresAt=v;}
 public Instant getRevokedAt(){return revokedAt;} public void setRevokedAt(Instant v){revokedAt=v;}
 public Instant getCreatedAt(){return createdAt;}
}
