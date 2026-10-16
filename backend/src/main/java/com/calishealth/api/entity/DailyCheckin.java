package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Table(name = "daily_checkins")
public class DailyCheckin {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
 @Column(name = "checkin_date", nullable = false) private LocalDate checkinDate;
 @Column(name = "sleep_hours", precision = 4, scale = 2) private BigDecimal sleepHours;
 @Column(name = "energy_level") private Integer energyLevel;
 @Column(name = "stress_level") private Integer stressLevel;
 @Column(name = "muscle_soreness") private Integer muscleSoreness;
 @Column(name = "motivation_level") private Integer motivationLevel;
 @Column(columnDefinition = "text") private String notes;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public User getUser(){return user;} public void setUser(User v){user=v;}
 public LocalDate getCheckinDate(){return checkinDate;} public void setCheckinDate(LocalDate v){checkinDate=v;}
 public BigDecimal getSleepHours(){return sleepHours;} public void setSleepHours(BigDecimal v){sleepHours=v;}
 public Integer getEnergyLevel(){return energyLevel;} public void setEnergyLevel(Integer v){energyLevel=v;}
 public Integer getStressLevel(){return stressLevel;} public void setStressLevel(Integer v){stressLevel=v;}
 public Integer getMuscleSoreness(){return muscleSoreness;} public void setMuscleSoreness(Integer v){muscleSoreness=v;}
 public Integer getMotivationLevel(){return motivationLevel;} public void setMotivationLevel(Integer v){motivationLevel=v;}
 public String getNotes(){return notes;} public void setNotes(String v){notes=v;}
 public Instant getCreatedAt(){return createdAt;}
}
