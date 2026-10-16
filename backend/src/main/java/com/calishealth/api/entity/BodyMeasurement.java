package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Table(name = "body_measurements")
public class BodyMeasurement {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
 @Column(name = "measurement_date", nullable = false) private LocalDate measurementDate;
 @Column(name = "weight_kg", precision = 6, scale = 2) private BigDecimal weightKg;
 @Column(name = "body_fat_percent", precision = 5, scale = 2) private BigDecimal bodyFatPercent;
 @Column(name = "muscle_mass_kg", precision = 6, scale = 2) private BigDecimal muscleMassKg;
 @Column(name = "height_cm", precision = 5, scale = 2) private BigDecimal heightCm;
 @Column(length = 50) private String source;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public User getUser(){return user;} public void setUser(User v){user=v;}
 public LocalDate getMeasurementDate(){return measurementDate;} public void setMeasurementDate(LocalDate v){measurementDate=v;}
 public BigDecimal getWeightKg(){return weightKg;} public void setWeightKg(BigDecimal v){weightKg=v;}
 public BigDecimal getBodyFatPercent(){return bodyFatPercent;} public void setBodyFatPercent(BigDecimal v){bodyFatPercent=v;}
 public BigDecimal getMuscleMassKg(){return muscleMassKg;} public void setMuscleMassKg(BigDecimal v){muscleMassKg=v;}
 public BigDecimal getHeightCm(){return heightCm;} public void setHeightCm(BigDecimal v){heightCm=v;}
 public String getSource(){return source;} public void setSource(String v){source=v;}
 public Instant getCreatedAt(){return createdAt;}
}
