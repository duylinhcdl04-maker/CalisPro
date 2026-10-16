package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/** Bài đánh giá do admin cấu hình (có phiên bản). */
@Entity @Table(name = "assessment_templates")
public class AssessmentTemplate {
 public static final String DRAFT = "DRAFT";
 public static final String PUBLISHED = "PUBLISHED";
 public static final String ARCHIVED = "ARCHIVED";

 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(nullable = false, unique = true, length = 80) private String code;
 @Column(nullable = false, length = 255) private String name;
 @Column(name = "display_name", length = 255) private String displayName;
 @Column(columnDefinition = "text") private String description;
 @Column(nullable = false, length = 50) private String type = "INITIAL";
 @Column(nullable = false, length = 20) private String status = DRAFT;
 @Column(nullable = false) private int version = 1;
 // Bài gốc của chuỗi phiên bản (NULL = chính nó là bài gốc)
 @Column(name = "root_id") private Long rootId;
 @Column(name = "parent_id") private Long parentId;
 @Column(name = "estimated_duration", nullable = false) private int estimatedDuration = 10;
 @Column(name = "tags_json", columnDefinition = "text") private String tagsJson;
 @Column(name = "target_audience_json", columnDefinition = "text") private String targetAudienceJson;
 @Column(name = "schedule_json", columnDefinition = "text") private String scheduleJson;
 @Column(name = "max_total_score", nullable = false, precision = 6, scale = 2) private BigDecimal maxTotalScore = BigDecimal.valueOf(100);
 @Column(name = "pass_score", precision = 6, scale = 2) private BigDecimal passScore;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
 @Column(name = "updated_at", nullable = false) private Instant updatedAt;
 @Column(name = "published_at") private Instant publishedAt;

 @PrePersist void onCreate(){ Instant now = Instant.now(); createdAt = now; updatedAt = now; }
 @PreUpdate void onUpdate(){ updatedAt = Instant.now(); }

 /** Id của bài gốc trong chuỗi phiên bản. */
 public Long lineageId(){ return rootId != null ? rootId : id; }

 public Long getId(){return id;}
 public String getCode(){return code;} public void setCode(String v){code=v;}
 public String getName(){return name;} public void setName(String v){name=v;}
 public String getDisplayName(){return displayName;} public void setDisplayName(String v){displayName=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;}
 public String getType(){return type;} public void setType(String v){type=v;}
 public String getStatus(){return status;} public void setStatus(String v){status=v;}
 public int getVersion(){return version;} public void setVersion(int v){version=v;}
 public Long getRootId(){return rootId;} public void setRootId(Long v){rootId=v;}
 public Long getParentId(){return parentId;} public void setParentId(Long v){parentId=v;}
 public int getEstimatedDuration(){return estimatedDuration;} public void setEstimatedDuration(int v){estimatedDuration=v;}
 public String getTagsJson(){return tagsJson;} public void setTagsJson(String v){tagsJson=v;}
 public String getTargetAudienceJson(){return targetAudienceJson;} public void setTargetAudienceJson(String v){targetAudienceJson=v;}
 public String getScheduleJson(){return scheduleJson;} public void setScheduleJson(String v){scheduleJson=v;}
 public BigDecimal getMaxTotalScore(){return maxTotalScore;} public void setMaxTotalScore(BigDecimal v){maxTotalScore=v;}
 public BigDecimal getPassScore(){return passScore;} public void setPassScore(BigDecimal v){passScore=v;}
 public Instant getCreatedAt(){return createdAt;}
 public Instant getUpdatedAt(){return updatedAt;}
 public Instant getPublishedAt(){return publishedAt;} public void setPublishedAt(Instant v){publishedAt=v;}
}
