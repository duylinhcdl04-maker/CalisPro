package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "notifications")
public class Notification {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
 @Column(nullable = false, length = 50) private String type;
 @Column(nullable = false, length = 255) private String title;
 @Column(nullable = false, columnDefinition = "text") private String message;
 @Column(name = "reference_type", length = 50) private String referenceType;
 @Column(name = "reference_id") private Long referenceId;
 @Column(name = "is_read", nullable = false) private boolean read = false;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
 @Column(name = "read_at") private Instant readAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public User getUser(){return user;} public void setUser(User v){user=v;}
 public String getType(){return type;} public void setType(String v){type=v;}
 public String getTitle(){return title;} public void setTitle(String v){title=v;}
 public String getMessage(){return message;} public void setMessage(String v){message=v;}
 public String getReferenceType(){return referenceType;} public void setReferenceType(String v){referenceType=v;}
 public Long getReferenceId(){return referenceId;} public void setReferenceId(Long v){referenceId=v;}
 public boolean isRead(){return read;} public void setRead(boolean v){read=v;}
 public Instant getCreatedAt(){return createdAt;}
 public Instant getReadAt(){return readAt;} public void setReadAt(Instant v){readAt=v;}
}
