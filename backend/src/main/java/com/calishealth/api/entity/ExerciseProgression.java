package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity @Table(name = "exercise_progressions")
public class ExerciseProgression {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "exercise_id", nullable = false) private Exercise exercise;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "prerequisite_exercise_id", nullable = false) private Exercise prerequisiteExercise;
 @Enumerated(EnumType.STRING) @Column(name = "progression_type", nullable = false, length = 30) private ProgressionType progressionType;
 @Column(name = "required_score", precision = 8, scale = 2) private BigDecimal requiredScore;
 @Column(name = "min_reps") private Integer minReps;
 @Column(columnDefinition = "text") private String notes;
 // Tiêu chí của nấc tiên quyết để mở nấc tiếp theo (Skill Gate). min_reps ở trên áp dụng cho bài tính rep.
 @Column(name = "min_hold_sec") private Integer minHoldSec;
 @Column(name = "min_form_score", precision = 5, scale = 2) private BigDecimal minFormScore;
 @Column(name = "min_qualifying_sessions") private Integer minQualifyingSessions;
 @Column(name = "mandatory_prerequisite") private Boolean mandatory;
 @Column(precision = 5, scale = 2) private BigDecimal weight;
 @Column(name = "source_type", length = 30) private String sourceType;

 public Long getId(){return id;}
 public Integer getMinHoldSec(){return minHoldSec;} public void setMinHoldSec(Integer v){minHoldSec=v;}
 public BigDecimal getMinFormScore(){return minFormScore;} public void setMinFormScore(BigDecimal v){minFormScore=v;}
 public Integer getMinQualifyingSessions(){return minQualifyingSessions;} public void setMinQualifyingSessions(Integer v){minQualifyingSessions=v;}
 public Boolean getMandatory(){return mandatory;} public void setMandatory(Boolean v){mandatory=v;}
 public BigDecimal getWeight(){return weight;} public void setWeight(BigDecimal v){weight=v;}
 public String getSourceType(){return sourceType;} public void setSourceType(String v){sourceType=v;}
 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public Exercise getPrerequisiteExercise(){return prerequisiteExercise;} public void setPrerequisiteExercise(Exercise v){prerequisiteExercise=v;}
 public ProgressionType getProgressionType(){return progressionType;} public void setProgressionType(ProgressionType v){progressionType=v;}
 public BigDecimal getRequiredScore(){return requiredScore;} public void setRequiredScore(BigDecimal v){requiredScore=v;}
 public Integer getMinReps(){return minReps;} public void setMinReps(Integer v){minReps=v;}
 public String getNotes(){return notes;} public void setNotes(String v){notes=v;}
}
