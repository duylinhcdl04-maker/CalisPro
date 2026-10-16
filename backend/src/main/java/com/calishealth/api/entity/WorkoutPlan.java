package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Table(name = "workout_plans")
public class WorkoutPlan {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
 @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "recommendation_run_id") private RecommendationRun recommendationRun;
 @Column(nullable = false, length = 255) private String name;
 @Column(columnDefinition = "text") private String description;
 @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "goal_id") private Goal goal;
 @Column(name = "difficulty_level", length = 30) private String difficultyLevel;
 @Column(name = "duration_weeks") private Integer durationWeeks;
 @Column(name = "days_per_week") private Integer daysPerWeek;
 @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private WorkoutPlanStatus status = WorkoutPlanStatus.DRAFT;
 @Column(name = "start_date") private LocalDate startDate;
 @Column(name = "end_date") private LocalDate endDate;
 @Column(nullable = false) private int version = 1;
 // ---- Training Cycle: mỗi plan là 1 chu kỳ, truy vết được về bài đánh giá đã sinh ra nó ----
 @Column(name = "cycle_number") private Integer cycleNumber;
 @Column(name = "assessment_session_id") private Long assessmentSessionId;
 @Column(name = "level_evaluation_id") private Long levelEvaluationId;
 @Column(name = "previous_plan_id") private Long previousPlanId;
 @Column(name = "program_template_id") private Long programTemplateId;
 @Column(name = "program_template_version") private Integer programTemplateVersion;
 @Column(name = "rule_set_id") private Long ruleSetId;
 // INITIAL_PROVISIONAL | BASELINE_RECALIBRATION | PERIODIC_PROMOTED | PERIODIC_MAINTAINED | PERIODIC_REGRESSED | GOAL_CHANGED | CONSTRAINT_CHANGED | RETURNING | COACH_OVERRIDE | FALLBACK_SKELETON
 @Column(name = "generation_reason", length = 40) private String generationReason;
 @Column(name = "input_snapshot", columnDefinition = "json") private String inputSnapshot;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
 @Column(name = "updated_at", nullable = false) private Instant updatedAt;

 @PrePersist void onCreate(){ Instant now = Instant.now(); createdAt = now; updatedAt = now; }
 @PreUpdate void onUpdate(){ updatedAt = Instant.now(); }

 public Long getId(){return id;}
 public User getUser(){return user;} public void setUser(User v){user=v;}
 public RecommendationRun getRecommendationRun(){return recommendationRun;} public void setRecommendationRun(RecommendationRun v){recommendationRun=v;}
 public String getName(){return name;} public void setName(String v){name=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;}
 public Goal getGoal(){return goal;} public void setGoal(Goal v){goal=v;}
 public String getDifficultyLevel(){return difficultyLevel;} public void setDifficultyLevel(String v){difficultyLevel=v;}
 public Integer getDurationWeeks(){return durationWeeks;} public void setDurationWeeks(Integer v){durationWeeks=v;}
 public Integer getDaysPerWeek(){return daysPerWeek;} public void setDaysPerWeek(Integer v){daysPerWeek=v;}
 public WorkoutPlanStatus getStatus(){return status;} public void setStatus(WorkoutPlanStatus v){status=v;}
 public LocalDate getStartDate(){return startDate;} public void setStartDate(LocalDate v){startDate=v;}
 public LocalDate getEndDate(){return endDate;} public void setEndDate(LocalDate v){endDate=v;}
 public int getVersion(){return version;} public void setVersion(int v){version=v;}
 public Integer getCycleNumber(){return cycleNumber;} public void setCycleNumber(Integer v){cycleNumber=v;}
 public Long getAssessmentSessionId(){return assessmentSessionId;} public void setAssessmentSessionId(Long v){assessmentSessionId=v;}
 public Long getLevelEvaluationId(){return levelEvaluationId;} public void setLevelEvaluationId(Long v){levelEvaluationId=v;}
 public Long getPreviousPlanId(){return previousPlanId;} public void setPreviousPlanId(Long v){previousPlanId=v;}
 public Long getProgramTemplateId(){return programTemplateId;} public void setProgramTemplateId(Long v){programTemplateId=v;}
 public Integer getProgramTemplateVersion(){return programTemplateVersion;} public void setProgramTemplateVersion(Integer v){programTemplateVersion=v;}
 public Long getRuleSetId(){return ruleSetId;} public void setRuleSetId(Long v){ruleSetId=v;}
 public String getGenerationReason(){return generationReason;} public void setGenerationReason(String v){generationReason=v;}
 public String getInputSnapshot(){return inputSnapshot;} public void setInputSnapshot(String v){inputSnapshot=v;}
 public Instant getCreatedAt(){return createdAt;}
 public Instant getUpdatedAt(){return updatedAt;}
}
