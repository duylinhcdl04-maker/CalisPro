package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity @Table(name = "exercise_muscles")
@IdClass(ExerciseMuscleId.class)
public class ExerciseMuscle {
 @Id @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "exercise_id", nullable = false) private Exercise exercise;
 @Id @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "muscle_id", nullable = false) private Muscle muscle;
 @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private MuscleRole role;
 @Column(name = "activation_percent", precision = 5, scale = 2) private BigDecimal activationPercent;
 // LOW / MODERATE / HIGH / VERY_HIGH
 @Column(name = "activation_level", length = 20) private String activationLevel;
 // BILATERAL / LEFT / RIGHT / CENTRAL
 @Column(length = 20) private String laterality;
 // Danh sách mã cảm giác, phân tách bằng dấu phẩy (vd. MUSCLE_TENSION,STRETCH)
 @Column(name = "expected_sensations", length = 255) private String expectedSensations;
 @Column(name = "unexpected_sensations", length = 255) private String unexpectedSensations;
 @Column(name = "user_guidance", length = 500) private String userGuidance;
 @Column(name = "sort_order", nullable = false) private int sortOrder;

 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public Muscle getMuscle(){return muscle;} public void setMuscle(Muscle v){muscle=v;}
 public MuscleRole getRole(){return role;} public void setRole(MuscleRole v){role=v;}
 public BigDecimal getActivationPercent(){return activationPercent;} public void setActivationPercent(BigDecimal v){activationPercent=v;}
 public String getActivationLevel(){return activationLevel;} public void setActivationLevel(String v){activationLevel=v;}
 public String getLaterality(){return laterality;} public void setLaterality(String v){laterality=v;}
 public String getExpectedSensations(){return expectedSensations;} public void setExpectedSensations(String v){expectedSensations=v;}
 public String getUnexpectedSensations(){return unexpectedSensations;} public void setUnexpectedSensations(String v){unexpectedSensations=v;}
 public String getUserGuidance(){return userGuidance;} public void setUserGuidance(String v){userGuidance=v;}
 public int getSortOrder(){return sortOrder;} public void setSortOrder(int v){sortOrder=v;}
}
