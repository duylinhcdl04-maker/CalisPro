package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

/** Điều kiện của một level theo từng cổng: COMPETENCY | PERFORMANCE | QUALITY | SKILL. */
@Entity @Table(name = "level_requirements")
public class LevelRequirement {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "level_id", nullable = false) private FitnessLevel level;
 @Column(nullable = false, length = 20) private String gate;
 @Column(name = "competency_code", length = 30) private String competencyCode;
 @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "exercise_id") private Exercise exercise;
 // SCORE | VALID_REPS | HOLD_SEC | FORM_SCORE | VALID_RATIO | ROM | MAJOR_VIOLATIONS | NODE_ACHIEVED
 @Column(length = 30) private String metric;
 // GTE | LTE
 @Column(nullable = false, length = 5) private String operator = "GTE";
 @Column(nullable = false, precision = 10, scale = 2) private BigDecimal value;
 @Column(nullable = false) private boolean mandatory = true;
 @Column(name = "source_type", nullable = false, length = 30) private String sourceType;
 @Column(name = "source_reference", length = 500) private String sourceReference;

 public Long getId(){return id;}
 public FitnessLevel getLevel(){return level;} public void setLevel(FitnessLevel v){level=v;}
 public String getGate(){return gate;} public void setGate(String v){gate=v;}
 public String getCompetencyCode(){return competencyCode;} public void setCompetencyCode(String v){competencyCode=v;}
 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public String getMetric(){return metric;} public void setMetric(String v){metric=v;}
 public String getOperator(){return operator;} public void setOperator(String v){operator=v;}
 public BigDecimal getValue(){return value;} public void setValue(BigDecimal v){value=v;}
 public boolean isMandatory(){return mandatory;} public void setMandatory(boolean v){mandatory=v;}
 public String getSourceType(){return sourceType;} public void setSourceType(String v){sourceType=v;}
 public String getSourceReference(){return sourceReference;} public void setSourceReference(String v){sourceReference=v;}
}
