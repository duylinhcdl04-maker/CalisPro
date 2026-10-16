package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "goals")
public class Goal {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(nullable = false, unique = true, length = 50) private String code;
 @Column(nullable = false, length = 100) private String name;
 @Column(columnDefinition = "text") private String description;
 @Column(length = 50) private String category;
 @Column(nullable = false) private boolean active = true;
 // Kỹ năng đích của mục tiêu (vd. MUSCLE_UP -> bài muscle-up) để tính Skill Readiness / Skill Gap
 @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "target_exercise_id") private Exercise targetExercise;
 // Trọng tâm năng lực của mục tiêu {"PULL":0.4,...} - dùng khi chọn giáo án
 @Column(name = "emphasis_json", columnDefinition = "json") private String emphasisJson;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
 @Column(name = "updated_at", nullable = false) private Instant updatedAt;

 @PrePersist void onCreate(){ Instant now = Instant.now(); createdAt = now; updatedAt = now; }
 @PreUpdate void onUpdate(){ updatedAt = Instant.now(); }

 public Long getId(){return id;}
 public void setId(Long v){id=v;}
 public String getCode(){return code;} public void setCode(String v){code=v;}
 public String getName(){return name;} public void setName(String v){name=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;}
 public String getCategory(){return category;} public void setCategory(String v){category=v;}
 public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
 public Exercise getTargetExercise(){return targetExercise;} public void setTargetExercise(Exercise v){targetExercise=v;}
 public String getEmphasisJson(){return emphasisJson;} public void setEmphasisJson(String v){emphasisJson=v;}
 public Instant getCreatedAt(){return createdAt;}
 public Instant getUpdatedAt(){return updatedAt;}
}
