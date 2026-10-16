package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "audit_logs")
public class AuditLog {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id") private User user;
 @Column(nullable = false, length = 100) private String action;
 @Column(name = "entity_type", nullable = false, length = 100) private String entityType;
 @Column(name = "entity_id") private Long entityId;
 @Column(name = "old_value", columnDefinition = "json") private String oldValue;
 @Column(name = "new_value", columnDefinition = "json") private String newValue;
 @Column(name = "ip_address", length = 45) private String ipAddress;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public User getUser(){return user;} public void setUser(User v){user=v;}
 public String getAction(){return action;} public void setAction(String v){action=v;}
 public String getEntityType(){return entityType;} public void setEntityType(String v){entityType=v;}
 public Long getEntityId(){return entityId;} public void setEntityId(Long v){entityId=v;}
 public String getOldValue(){return oldValue;} public void setOldValue(String v){oldValue=v;}
 public String getNewValue(){return newValue;} public void setNewValue(String v){newValue=v;}
 public String getIpAddress(){return ipAddress;} public void setIpAddress(String v){ipAddress=v;}
 public Instant getCreatedAt(){return createdAt;}
}
