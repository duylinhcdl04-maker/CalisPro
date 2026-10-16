package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "personal_records")
public class PersonalRecord {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "exercise_id", nullable = false) private Exercise exercise;
 @Column(name = "record_type", nullable = false, length = 50) private String recordType;
 @Column(name = "record_value", nullable = false, precision = 12, scale = 4) private BigDecimal recordValue;
 @Column(nullable = false, length = 30) private String unit;
 @Column(name = "achieved_at", nullable = false) private Instant achievedAt;
 @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "source_session_id") private WorkoutSession sourceSession;

 public Long getId(){return id;}
 public User getUser(){return user;} public void setUser(User v){user=v;}
 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public String getRecordType(){return recordType;} public void setRecordType(String v){recordType=v;}
 public BigDecimal getRecordValue(){return recordValue;} public void setRecordValue(BigDecimal v){recordValue=v;}
 public String getUnit(){return unit;} public void setUnit(String v){unit=v;}
 public Instant getAchievedAt(){return achievedAt;} public void setAchievedAt(Instant v){achievedAt=v;}
 public WorkoutSession getSourceSession(){return sourceSession;} public void setSourceSession(WorkoutSession v){sourceSession=v;}
}
