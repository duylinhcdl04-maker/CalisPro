package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Giáo án mẫu do Admin/Coach cấu hình: điều kiện áp dụng (level, mục tiêu, số ngày, thời lượng, dụng cụ)
 * + cấu trúc tuần/ngày/phần/bài (structure_json). Engine chọn mẫu phù hợp nhất rồi điền bài theo nấc tiến trình của từng user.
 */
@Entity @Table(name = "program_templates", uniqueConstraints = @UniqueConstraint(name = "uk_pt", columnNames = {"code", "version"}))
public class ProgramTemplate {
 public static final String DRAFT = "DRAFT", PUBLISHED = "PUBLISHED", ARCHIVED = "ARCHIVED";

 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(nullable = false, length = 80) private String code;
 @Column(nullable = false) private int version = 1;
 @Column(nullable = false, length = 255) private String name;
 @Column(columnDefinition = "text") private String description;
 @Column(nullable = false, length = 20) private String status = DRAFT;
 @Column(name = "level_min", nullable = false, length = 10) private String levelMin;
 @Column(name = "level_max", nullable = false, length = 10) private String levelMax;
 @Column(name = "primary_level", nullable = false, length = 10) private String primaryLevel;
 // ["STRENGTH","SKILL"] (mã goals)
 @Column(name = "goal_codes", nullable = false, columnDefinition = "json") private String goalCodes;
 @Column(name = "days_per_week_min", nullable = false) private int daysPerWeekMin;
 @Column(name = "days_per_week_max", nullable = false) private int daysPerWeekMax;
 @Column(name = "session_minutes", nullable = false) private int sessionMinutes;
 @Column(name = "duration_weeks", nullable = false) private int durationWeeks;
 @Column(name = "deload_week") private Integer deloadWeek;
 // ["PULL_UP_BAR","PARALLEL_BARS"]
 @Column(name = "required_equipment", nullable = false, columnDefinition = "json") private String requiredEquipment;
 // {"PUSH":0.25,"PULL":0.40,...} - tự tính từ số set theo năng lực nếu admin không nhập
 @Column(name = "emphasis_json", nullable = false, columnDefinition = "json") private String emphasisJson;
 @Column(name = "requires_coach_review", nullable = false) private boolean requiresCoachReview = false;
 @Column(nullable = false) private int priority = 0;
 // Cấu trúc tuần -> ngày -> phần -> bài (định dạng của Admin Workout Plan Builder)
 @Lob @Column(name = "structure_json", nullable = false, columnDefinition = "longtext") private String structureJson;
 @Column(name = "created_by", length = 150) private String createdBy;
 @Column(name = "published_at") private Instant publishedAt;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
 @Column(name = "updated_at", nullable = false) private Instant updatedAt;

 @PrePersist void onCreate(){ Instant now = Instant.now(); createdAt = now; updatedAt = now; }
 @PreUpdate void onUpdate(){ updatedAt = Instant.now(); }

 public Long getId(){return id;}
 public String getCode(){return code;} public void setCode(String v){code=v;}
 public int getVersion(){return version;} public void setVersion(int v){version=v;}
 public String getName(){return name;} public void setName(String v){name=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;}
 public String getStatus(){return status;} public void setStatus(String v){status=v;}
 public String getLevelMin(){return levelMin;} public void setLevelMin(String v){levelMin=v;}
 public String getLevelMax(){return levelMax;} public void setLevelMax(String v){levelMax=v;}
 public String getPrimaryLevel(){return primaryLevel;} public void setPrimaryLevel(String v){primaryLevel=v;}
 public String getGoalCodes(){return goalCodes;} public void setGoalCodes(String v){goalCodes=v;}
 public int getDaysPerWeekMin(){return daysPerWeekMin;} public void setDaysPerWeekMin(int v){daysPerWeekMin=v;}
 public int getDaysPerWeekMax(){return daysPerWeekMax;} public void setDaysPerWeekMax(int v){daysPerWeekMax=v;}
 public int getSessionMinutes(){return sessionMinutes;} public void setSessionMinutes(int v){sessionMinutes=v;}
 public int getDurationWeeks(){return durationWeeks;} public void setDurationWeeks(int v){durationWeeks=v;}
 public Integer getDeloadWeek(){return deloadWeek;} public void setDeloadWeek(Integer v){deloadWeek=v;}
 public String getRequiredEquipment(){return requiredEquipment;} public void setRequiredEquipment(String v){requiredEquipment=v;}
 public String getEmphasisJson(){return emphasisJson;} public void setEmphasisJson(String v){emphasisJson=v;}
 public boolean isRequiresCoachReview(){return requiresCoachReview;} public void setRequiresCoachReview(boolean v){requiresCoachReview=v;}
 public int getPriority(){return priority;} public void setPriority(int v){priority=v;}
 public String getStructureJson(){return structureJson;} public void setStructureJson(String v){structureJson=v;}
 public String getCreatedBy(){return createdBy;} public void setCreatedBy(String v){createdBy=v;}
 public Instant getPublishedAt(){return publishedAt;} public void setPublishedAt(Instant v){publishedAt=v;}
 public Instant getCreatedAt(){return createdAt;}
 public Instant getUpdatedAt(){return updatedAt;}
}
