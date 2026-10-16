package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/** Con trỏ trạng thái level hiện tại của người dùng (lịch sử đầy đủ nằm ở level_evaluations). */
@Entity @Table(name = "user_level_state")
public class UserLevelState {
 public static final String PROVISIONAL = "PROVISIONAL", VERIFIED = "VERIFIED", RETURNING = "RETURNING";

 @Id @Column(name = "user_id") private Long userId;
 @Column(name = "level_code", nullable = false, length = 10) private String levelCode;
 @Column(nullable = false, length = 20) private String status;
 @Column(name = "overall_score", precision = 5, scale = 2) private BigDecimal overallScore;
 @Column(name = "ewma_overall", precision = 5, scale = 2) private BigDecimal ewmaOverall;
 @Column(name = "consecutive_below", nullable = false) private int consecutiveBelow;
 @Column(name = "last_evaluation_id") private Long lastEvaluationId;
 @Column(name = "next_assessment_due") private LocalDate nextAssessmentDue;
 @Column(name = "updated_at", nullable = false) private Instant updatedAt;

 @PrePersist @PreUpdate void touch(){ updatedAt = Instant.now(); }

 public Long getUserId(){return userId;} public void setUserId(Long v){userId=v;}
 public String getLevelCode(){return levelCode;} public void setLevelCode(String v){levelCode=v;}
 public String getStatus(){return status;} public void setStatus(String v){status=v;}
 public BigDecimal getOverallScore(){return overallScore;} public void setOverallScore(BigDecimal v){overallScore=v;}
 public BigDecimal getEwmaOverall(){return ewmaOverall;} public void setEwmaOverall(BigDecimal v){ewmaOverall=v;}
 public int getConsecutiveBelow(){return consecutiveBelow;} public void setConsecutiveBelow(int v){consecutiveBelow=v;}
 public Long getLastEvaluationId(){return lastEvaluationId;} public void setLastEvaluationId(Long v){lastEvaluationId=v;}
 public LocalDate getNextAssessmentDue(){return nextAssessmentDue;} public void setNextAssessmentDue(LocalDate v){nextAssessmentDue=v;}
 public Instant getUpdatedAt(){return updatedAt;}
}
