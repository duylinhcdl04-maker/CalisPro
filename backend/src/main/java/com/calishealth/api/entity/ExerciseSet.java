package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "exercise_sets")
public class ExerciseSet {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "workout_session_exercise_id", nullable = false) private WorkoutSessionExercise workoutSessionExercise;
 @Column(name = "set_number", nullable = false) private int setNumber;
 @Column private Integer reps;
 @Column(name = "duration_seconds") private Integer durationSeconds;
 @Column(name = "weight_kg", precision = 7, scale = 2) private BigDecimal weightKg;
 @Column(name = "assistance_kg", precision = 7, scale = 2) private BigDecimal assistanceKg;
 @Column(precision = 3, scale = 1) private BigDecimal rpe;
 @Column(name = "rest_seconds") private Integer restSeconds;
 @Column(nullable = false) private boolean completed = true;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public WorkoutSessionExercise getWorkoutSessionExercise(){return workoutSessionExercise;} public void setWorkoutSessionExercise(WorkoutSessionExercise v){workoutSessionExercise=v;}
 public int getSetNumber(){return setNumber;} public void setSetNumber(int v){setNumber=v;}
 public Integer getReps(){return reps;} public void setReps(Integer v){reps=v;}
 public Integer getDurationSeconds(){return durationSeconds;} public void setDurationSeconds(Integer v){durationSeconds=v;}
 public BigDecimal getWeightKg(){return weightKg;} public void setWeightKg(BigDecimal v){weightKg=v;}
 public BigDecimal getAssistanceKg(){return assistanceKg;} public void setAssistanceKg(BigDecimal v){assistanceKg=v;}
 public BigDecimal getRpe(){return rpe;} public void setRpe(BigDecimal v){rpe=v;}
 public Integer getRestSeconds(){return restSeconds;} public void setRestSeconds(Integer v){restSeconds=v;}
 public boolean isCompleted(){return completed;} public void setCompleted(boolean v){completed=v;}
 public Instant getCreatedAt(){return createdAt;}
}
