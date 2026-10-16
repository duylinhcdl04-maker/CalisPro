package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "exercises")
public class Exercise {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "category_id", nullable = false) private ExerciseCategory category;
 @Column(nullable = false, unique = true, length = 100) private String code;
 @Column(nullable = false, length = 255) private String name;
 @Column(columnDefinition = "text") private String description;
 @Column(name = "difficulty_level", length = 30) private String difficultyLevel;
 @Column(name = "movement_pattern", length = 50) private String movementPattern;
 @Column(name = "equipment_required", nullable = false) private boolean equipmentRequired = false;
 @Column(columnDefinition = "text") private String instructions;
 @Column(name = "safety_notes", columnDefinition = "text") private String safetyNotes;
 @Column(name = "video_url", length = 500) private String videoUrl;
 @Column(name = "thumbnail_url", length = 500) private String thumbnailUrl;
 @Column(name = "display_name", length = 255) private String displayName;
 // Phân loại tập luyện của Builder: Strength / Skill / Mobility / Flexibility / Endurance / Conditioning / Recovery
 @Column(name = "training_category", length = 30) private String trainingCategory;
 /** Bài dùng được ở phần nào của buổi tập: các mã WARMUP, MAIN, ACCESSORY, COOLDOWN cách nhau bởi dấu phẩy. Rỗng = chưa phân loại. */
 @Column(name = "session_roles", length = 60) private String sessionRoles;
 /** Coach bật "tích hợp AI": học viên mới thấy và dùng được AI Coach (camera) với bài này. Cần thêm cấu hình đo (profile chuyển động) mới chạy được. */
 @Column(name = "ai_enabled", nullable = false) private boolean aiEnabled;
 /** Coach tạo bản nháp này và thời điểm gửi; để Admin thấy trong hàng chờ việc. Xóa khi bài được xuất bản hoặc xóa. */
 @Column(name = "author_id") private Long authorId;
 @Column(name = "submitted_at") private java.time.Instant submittedAt;
 @Column(name = "animation_url", length = 500) private String animationUrl;
 // Kỹ thuật & hơi thở
 @Column(name = "setup_instructions", columnDefinition = "text") private String setupInstructions;
 @Column(name = "execution_instructions", columnDefinition = "text") private String executionInstructions;
 @Column(name = "inhale_timing", length = 500) private String inhaleTiming;
 @Column(name = "exhale_timing", length = 500) private String exhaleTiming;
 @Column(length = 50) private String tempo;
 // An toàn (danh sách lưu ý / điều kiện dừng nằm ở exercise_attributes)
 @Column(columnDefinition = "text") private String contraindications;
 @Column(name = "general_considerations", columnDefinition = "text") private String generalConsiderations;
 // Phiên bản dữ liệu Builder; null = động tác cũ chưa từng lưu bằng Exercise Builder
 @Column(name = "builder_version", length = 20) private String builderVersion;
 // Cấu hình AI Motion soạn ở bước 5 của Builder (JSON); runtime engine dùng exercise_ai_profiles
 @Lob @Column(name = "ai_analysis_data", columnDefinition = "longtext") private String aiAnalysisData;
 @Column(nullable = false) private boolean active = true;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
 @Column(name = "updated_at", nullable = false) private Instant updatedAt;

 @PrePersist void onCreate(){ Instant now = Instant.now(); createdAt = now; updatedAt = now; }
 @PreUpdate void onUpdate(){ updatedAt = Instant.now(); }

 public Long getId(){return id;}
 public ExerciseCategory getCategory(){return category;} public void setCategory(ExerciseCategory v){category=v;}
 public String getCode(){return code;} public void setCode(String v){code=v;}
 public String getName(){return name;} public void setName(String v){name=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;}
 public String getDifficultyLevel(){return difficultyLevel;} public void setDifficultyLevel(String v){difficultyLevel=v;}
 public String getMovementPattern(){return movementPattern;} public void setMovementPattern(String v){movementPattern=v;}
 public boolean isEquipmentRequired(){return equipmentRequired;} public void setEquipmentRequired(boolean v){equipmentRequired=v;}
 public String getInstructions(){return instructions;} public void setInstructions(String v){instructions=v;}
 public String getSafetyNotes(){return safetyNotes;} public void setSafetyNotes(String v){safetyNotes=v;}
 public String getVideoUrl(){return videoUrl;} public void setVideoUrl(String v){videoUrl=v;}
 public String getThumbnailUrl(){return thumbnailUrl;} public void setThumbnailUrl(String v){thumbnailUrl=v;}
 public String getDisplayName(){return displayName;} public void setDisplayName(String v){displayName=v;}
 public String getSessionRoles(){return sessionRoles;} public void setSessionRoles(String v){sessionRoles=v;}
 public boolean isAiEnabled(){return aiEnabled;} public void setAiEnabled(boolean v){aiEnabled=v;}
 public Long getAuthorId(){return authorId;} public void setAuthorId(Long v){authorId=v;}
 public java.time.Instant getSubmittedAt(){return submittedAt;} public void setSubmittedAt(java.time.Instant v){submittedAt=v;}
 public String getTrainingCategory(){return trainingCategory;} public void setTrainingCategory(String v){trainingCategory=v;}
 public String getAnimationUrl(){return animationUrl;} public void setAnimationUrl(String v){animationUrl=v;}
 public String getSetupInstructions(){return setupInstructions;} public void setSetupInstructions(String v){setupInstructions=v;}
 public String getExecutionInstructions(){return executionInstructions;} public void setExecutionInstructions(String v){executionInstructions=v;}
 public String getInhaleTiming(){return inhaleTiming;} public void setInhaleTiming(String v){inhaleTiming=v;}
 public String getExhaleTiming(){return exhaleTiming;} public void setExhaleTiming(String v){exhaleTiming=v;}
 public String getTempo(){return tempo;} public void setTempo(String v){tempo=v;}
 public String getContraindications(){return contraindications;} public void setContraindications(String v){contraindications=v;}
 public String getGeneralConsiderations(){return generalConsiderations;} public void setGeneralConsiderations(String v){generalConsiderations=v;}
 public String getBuilderVersion(){return builderVersion;} public void setBuilderVersion(String v){builderVersion=v;}
 public String getAiAnalysisData(){return aiAnalysisData;} public void setAiAnalysisData(String v){aiAnalysisData=v;}
 public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
 public Instant getCreatedAt(){return createdAt;}
 public Instant getUpdatedAt(){return updatedAt;}
}
