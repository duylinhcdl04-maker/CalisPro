package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "assessment_types")
public class AssessmentType {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(nullable = false, unique = true, length = 50) private String code;
 @Column(nullable = false, length = 100) private String name;
 @Column(columnDefinition = "text") private String description;
 @Column(nullable = false, length = 20) private String version = "1.0";
 @Column(nullable = false) private boolean active = true;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public String getCode(){return code;} public void setCode(String v){code=v;}
 public String getName(){return name;} public void setName(String v){name=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;}
 public String getVersion(){return version;} public void setVersion(String v){version=v;}
 public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
 public Instant getCreatedAt(){return createdAt;}
}
