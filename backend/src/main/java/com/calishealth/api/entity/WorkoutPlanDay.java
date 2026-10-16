package com.calishealth.api.entity;

import jakarta.persistence.*;

@Entity @Table(name = "workout_plan_days")
public class WorkoutPlanDay {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "workout_plan_id", nullable = false) private WorkoutPlan workoutPlan;
 @Column(name = "day_number", nullable = false) private int dayNumber;
 @Column(nullable = false, length = 255) private String name;
 @Column(length = 100) private String focus;
 @Column(name = "estimated_duration_min") private Integer estimatedDurationMin;
 @Column(name = "rest_day", nullable = false) private boolean restDay = false;
 @Column(name = "week_number") private Integer weekNumber;
 @Column(name = "deload") private Boolean deload;

 public Long getId(){return id;}
 public Integer getWeekNumber(){return weekNumber;} public void setWeekNumber(Integer v){weekNumber=v;}
 public Boolean getDeload(){return deload;} public void setDeload(Boolean v){deload=v;}
 public WorkoutPlan getWorkoutPlan(){return workoutPlan;} public void setWorkoutPlan(WorkoutPlan v){workoutPlan=v;}
 public int getDayNumber(){return dayNumber;} public void setDayNumber(int v){dayNumber=v;}
 public String getName(){return name;} public void setName(String v){name=v;}
 public String getFocus(){return focus;} public void setFocus(String v){focus=v;}
 public Integer getEstimatedDurationMin(){return estimatedDurationMin;} public void setEstimatedDurationMin(Integer v){estimatedDurationMin=v;}
 public boolean isRestDay(){return restDay;} public void setRestDay(boolean v){restDay=v;}
}
