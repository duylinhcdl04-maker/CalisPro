package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "progress_metrics")
public class ProgressMetric {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
 @Column(name = "metric_type", nullable = false, length = 50) private String metricType;
 @Column(name = "metric_value", nullable = false, precision = 12, scale = 4) private BigDecimal metricValue;
 @Column(nullable = false, length = 30) private String unit;
 @Column(name = "recorded_at", nullable = false) private Instant recordedAt;
 @Column(name = "source_type", length = 50) private String sourceType;
 @Column(name = "source_id") private Long sourceId;

 public Long getId(){return id;}
 public User getUser(){return user;} public void setUser(User v){user=v;}
 public String getMetricType(){return metricType;} public void setMetricType(String v){metricType=v;}
 public BigDecimal getMetricValue(){return metricValue;} public void setMetricValue(BigDecimal v){metricValue=v;}
 public String getUnit(){return unit;} public void setUnit(String v){unit=v;}
 public Instant getRecordedAt(){return recordedAt;} public void setRecordedAt(Instant v){recordedAt=v;}
 public String getSourceType(){return sourceType;} public void setSourceType(String v){sourceType=v;}
 public Long getSourceId(){return sourceId;} public void setSourceId(Long v){sourceId=v;}
}
