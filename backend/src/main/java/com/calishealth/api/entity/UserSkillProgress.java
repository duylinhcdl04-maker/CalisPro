package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/** Trạng thái của người dùng trên từng nút của Skill Tree (exercise_progressions). */
@Entity @Table(name = "user_skill_progress", uniqueConstraints = @UniqueConstraint(name = "uk_usp", columnNames = {"user_id", "exercise_id"}))
public class UserSkillProgress {
 public static final String LOCKED = "LOCKED", READY = "READY", IN_PROGRESS = "IN_PROGRESS",
         ACHIEVED_SELF_REPORTED = "ACHIEVED_SELF_REPORTED", ACHIEVED = "ACHIEVED";

 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(name = "user_id", nullable = false) private Long userId;
 @Column(name = "exercise_id", nullable = false) private Long exerciseId;
 @Column(nullable = false, length = 30) private String status = LOCKED;
 @Column(name = "best_value", precision = 10, scale = 2) private BigDecimal bestValue;
 @Column(name = "best_form_score", precision = 5, scale = 2) private BigDecimal bestFormScore;
 @Column(name = "qualifying_sessions", nullable = false) private int qualifyingSessions;
 @Column(length = 20) private String source;
 @Column(name = "achieved_at") private Instant achievedAt;
 @Column(name = "updated_at", nullable = false) private Instant updatedAt;

 @PrePersist @PreUpdate void touch(){ updatedAt = Instant.now(); }

 public Long getId(){return id;}
 public Long getUserId(){return userId;} public void setUserId(Long v){userId=v;}
 public Long getExerciseId(){return exerciseId;} public void setExerciseId(Long v){exerciseId=v;}
 public String getStatus(){return status;} public void setStatus(String v){status=v;}
 public BigDecimal getBestValue(){return bestValue;} public void setBestValue(BigDecimal v){bestValue=v;}
 public BigDecimal getBestFormScore(){return bestFormScore;} public void setBestFormScore(BigDecimal v){bestFormScore=v;}
 public int getQualifyingSessions(){return qualifyingSessions;} public void setQualifyingSessions(int v){qualifyingSessions=v;}
 public String getSource(){return source;} public void setSource(String v){source=v;}
 public Instant getAchievedAt(){return achievedAt;} public void setAchievedAt(Instant v){achievedAt=v;}
 public Instant getUpdatedAt(){return updatedAt;}
}
