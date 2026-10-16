package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "user_consents")
public class UserConsent {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
 @Column(name = "consent_type", nullable = false, length = 50) private String consentType;
 @Column(nullable = false, length = 20) private String version;
 @Column(nullable = false) private boolean accepted;
 @Column(name = "accepted_at") private Instant acceptedAt;
 @Column(name = "revoked_at") private Instant revokedAt;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public User getUser(){return user;} public void setUser(User v){user=v;}
 public String getConsentType(){return consentType;} public void setConsentType(String v){consentType=v;}
 public String getVersion(){return version;} public void setVersion(String v){version=v;}
 public boolean isAccepted(){return accepted;} public void setAccepted(boolean v){accepted=v;}
 public Instant getAcceptedAt(){return acceptedAt;} public void setAcceptedAt(Instant v){acceptedAt=v;}
 public Instant getRevokedAt(){return revokedAt;} public void setRevokedAt(Instant v){revokedAt=v;}
 public Instant getCreatedAt(){return createdAt;}
}
