package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "workout_session_exercises")
public class WorkoutSessionExercise {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "workout_session_id", nullable = false) private WorkoutSession workoutSession;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "exercise_id", nullable = false) private Exercise exercise;
 @Column(name = "planned_sets") private Integer plannedSets;
 @Column(name = "completed_sets", nullable = false) private int completedSets = 0;
 @Column(name = "sequence_no", nullable = false) private int sequenceNo;
 @Column(name = "started_at") private Instant startedAt;
 @Column(name = "completed_at") private Instant completedAt;

 public Long getId(){return id;}
 public WorkoutSession getWorkoutSession(){return workoutSession;} public void setWorkoutSession(WorkoutSession v){workoutSession=v;}
 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public Integer getPlannedSets(){return plannedSets;} public void setPlannedSets(Integer v){plannedSets=v;}
 public int getCompletedSets(){return completedSets;} public void setCompletedSets(int v){completedSets=v;}
 public int getSequenceNo(){return sequenceNo;} public void setSequenceNo(int v){sequenceNo=v;}
 public Instant getStartedAt(){return startedAt;} public void setStartedAt(Instant v){startedAt=v;}
 public Instant getCompletedAt(){return completedAt;} public void setCompletedAt(Instant v){completedAt=v;}
}
