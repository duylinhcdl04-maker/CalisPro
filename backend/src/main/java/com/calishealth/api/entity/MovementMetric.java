package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "movement_metrics")
public class MovementMetric {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "movement_session_id", nullable = false) private MovementSession movementSession;
 @Column(name = "metric_type", nullable = false, length = 50) private String metricType;
 @Column(name = "metric_value", nullable = false, precision = 12, scale = 4) private BigDecimal metricValue;
 @Column(length = 30) private String unit;
 @Column(precision = 5, scale = 4) private BigDecimal confidence;
 @Column(name = "timestamp_ms") private Long timestampMs;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public MovementSession getMovementSession(){return movementSession;} public void setMovementSession(MovementSession v){movementSession=v;}
 public String getMetricType(){return metricType;} public void setMetricType(String v){metricType=v;}
 public BigDecimal getMetricValue(){return metricValue;} public void setMetricValue(BigDecimal v){metricValue=v;}
 public String getUnit(){return unit;} public void setUnit(String v){unit=v;}
 public BigDecimal getConfidence(){return confidence;} public void setConfidence(BigDecimal v){confidence=v;}
 public Long getTimestampMs(){return timestampMs;} public void setTimestampMs(Long v){timestampMs=v;}
 public Instant getCreatedAt(){return createdAt;}
}
