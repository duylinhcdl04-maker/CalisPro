package com.calishealth.api.entity;

import jakarta.persistence.*;

@Entity @Table(name = "exercise_restrictions")
public class ExerciseRestriction {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "exercise_id", nullable = false) private Exercise exercise;
 @Column(name = "restriction_code", nullable = false, length = 100) private String restrictionCode;
 @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private RestrictionSeverity severity = RestrictionSeverity.CAUTION;
 @Column(columnDefinition = "text") private String description;

 public Long getId(){return id;}
 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public String getRestrictionCode(){return restrictionCode;} public void setRestrictionCode(String v){restrictionCode=v;}
 public RestrictionSeverity getSeverity(){return severity;} public void setSeverity(RestrictionSeverity v){severity=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;}
}
