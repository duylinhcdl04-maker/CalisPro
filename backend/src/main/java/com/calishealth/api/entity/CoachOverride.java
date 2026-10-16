package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

/** Coach/Admin can thiệp quyết định tự động: lưu quyết định gốc, quyết định mới, lý do, người thực hiện. */
@Entity @Table(name = "coach_overrides")
public class CoachOverride {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(name = "user_id", nullable = false) private Long userId;
 @Column(name = "coach_id", nullable = false) private Long coachId;
 // LEVEL | SKILL_NODE | VERIFY_TEST
 @Column(name = "target_type", nullable = false, length = 30) private String targetType;
 @Column(name = "target_id") private Long targetId;
 @Column(name = "original_value_json", nullable = false, columnDefinition = "json") private String originalValueJson;
 @Column(name = "new_value_json", nullable = false, columnDefinition = "json") private String newValueJson;
 @Column(nullable = false, columnDefinition = "text") private String reason;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public Long getUserId(){return userId;} public void setUserId(Long v){userId=v;}
 public Long getCoachId(){return coachId;} public void setCoachId(Long v){coachId=v;}
 public String getTargetType(){return targetType;} public void setTargetType(String v){targetType=v;}
 public Long getTargetId(){return targetId;} public void setTargetId(Long v){targetId=v;}
 public String getOriginalValueJson(){return originalValueJson;} public void setOriginalValueJson(String v){originalValueJson=v;}
 public String getNewValueJson(){return newValueJson;} public void setNewValueJson(String v){newValueJson=v;}
 public String getReason(){return reason;} public void setReason(String v){reason=v;}
 public Instant getCreatedAt(){return createdAt;}
}
