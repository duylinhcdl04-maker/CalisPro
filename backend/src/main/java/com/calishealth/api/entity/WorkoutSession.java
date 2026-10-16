package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "workout_sessions")
public class WorkoutSession {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
 @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "workout_plan_id") private WorkoutPlan workoutPlan;
 @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "workout_plan_day_id") private WorkoutPlanDay workoutPlanDay;
 @Column(name = "started_at", nullable = false) private Instant startedAt;
 @Column(name = "completed_at") private Instant completedAt;
 @Column(name = "duration_seconds") private Integer durationSeconds;
 @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private WorkoutSessionStatus status = WorkoutSessionStatus.IN_PROGRESS;
 @Column(name = "energy_level") private Integer energyLevel;
 @Column(name = "difficulty_rating") private Integer difficultyRating;
 @Column(columnDefinition = "text") private String notes;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ if(startedAt == null) startedAt = Instant.now(); createdAt = Instant.now(); }

 public Long getId(){return id;}
 public User getUser(){return user;} public void setUser(User v){user=v;}
 public WorkoutPlan getWorkoutPlan(){return workoutPlan;} public void setWorkoutPlan(WorkoutPlan v){workoutPlan=v;}
 public WorkoutPlanDay getWorkoutPlanDay(){return workoutPlanDay;} public void setWorkoutPlanDay(WorkoutPlanDay v){workoutPlanDay=v;}
 public Instant getStartedAt(){return startedAt;} public void setStartedAt(Instant v){startedAt=v;}
 public Instant getCompletedAt(){return completedAt;} public void setCompletedAt(Instant v){completedAt=v;}
 public Integer getDurationSeconds(){return durationSeconds;} public void setDurationSeconds(Integer v){durationSeconds=v;}
 public WorkoutSessionStatus getStatus(){return status;} public void setStatus(WorkoutSessionStatus v){status=v;}
 public Integer getEnergyLevel(){return energyLevel;} public void setEnergyLevel(Integer v){energyLevel=v;}
 public Integer getDifficultyRating(){return difficultyRating;} public void setDifficultyRating(Integer v){difficultyRating=v;}
 public String getNotes(){return notes;} public void setNotes(String v){notes=v;}
 public Instant getCreatedAt(){return createdAt;}
}
