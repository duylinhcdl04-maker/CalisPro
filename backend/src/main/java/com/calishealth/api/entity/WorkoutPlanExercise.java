package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity @Table(name = "workout_plan_exercises")
public class WorkoutPlanExercise {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "workout_plan_day_id", nullable = false) private WorkoutPlanDay workoutPlanDay;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "exercise_id", nullable = false) private Exercise exercise;
 @Column(name = "sequence_no", nullable = false) private int sequenceNo;
 @Column private Integer sets;
 @Column(name = "target_reps_min") private Integer targetRepsMin;
 @Column(name = "target_reps_max") private Integer targetRepsMax;
 @Column(name = "target_duration_sec") private Integer targetDurationSec;
 @Column(name = "rest_seconds") private Integer restSeconds;
 @Column(name = "target_rpe", precision = 3, scale = 1) private BigDecimal targetRpe;
 @Column(length = 30) private String tempo;
 @Column(columnDefinition = "text") private String notes;
 // WARMUP | MAIN | SKILL | ACCESSORY | COOLDOWN (phần của buổi tập trong giáo án mẫu)
 @Column(name = "section_type", length = 20) private String sectionType;
 // Bài admin đặt trong giáo án mẫu (trước khi engine điều chỉnh theo nấc tiến trình của user)
 @Column(name = "template_exercise_id") private Long templateExerciseId;
 // Lý do chọn bài (điểm từng thành phần của RecommendationScore) - JSON
 @Column(name = "selection_reason", columnDefinition = "text") private String selectionReason;

 public Long getId(){return id;}
 public WorkoutPlanDay getWorkoutPlanDay(){return workoutPlanDay;} public void setWorkoutPlanDay(WorkoutPlanDay v){workoutPlanDay=v;}
 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public int getSequenceNo(){return sequenceNo;} public void setSequenceNo(int v){sequenceNo=v;}
 public Integer getSets(){return sets;} public void setSets(Integer v){sets=v;}
 public Integer getTargetRepsMin(){return targetRepsMin;} public void setTargetRepsMin(Integer v){targetRepsMin=v;}
 public Integer getTargetRepsMax(){return targetRepsMax;} public void setTargetRepsMax(Integer v){targetRepsMax=v;}
 public Integer getTargetDurationSec(){return targetDurationSec;} public void setTargetDurationSec(Integer v){targetDurationSec=v;}
 public Integer getRestSeconds(){return restSeconds;} public void setRestSeconds(Integer v){restSeconds=v;}
 public BigDecimal getTargetRpe(){return targetRpe;} public void setTargetRpe(BigDecimal v){targetRpe=v;}
 public String getTempo(){return tempo;} public void setTempo(String v){tempo=v;}
 public String getNotes(){return notes;} public void setNotes(String v){notes=v;}
 public String getSectionType(){return sectionType;} public void setSectionType(String v){sectionType=v;}
 public Long getTemplateExerciseId(){return templateExerciseId;} public void setTemplateExerciseId(Long v){templateExerciseId=v;}
 public String getSelectionReason(){return selectionReason;} public void setSelectionReason(String v){selectionReason=v;}
}
