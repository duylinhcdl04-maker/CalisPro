package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "movement_events")
public class MovementEvent {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "movement_session_id", nullable = false) private MovementSession movementSession;
 @Column(name = "event_type", nullable = false, length = 50) private String eventType;
 @Column(name = "rep_number") private Integer repNumber;
 @Column(name = "start_timestamp_ms") private Long startTimestampMs;
 @Column(name = "end_timestamp_ms") private Long endTimestampMs;
 @Column(name = "duration_ms") private Long durationMs;
 @Column(precision = 5, scale = 2) private BigDecimal score;
 @Column(columnDefinition = "json") private String metadata;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public MovementSession getMovementSession(){return movementSession;} public void setMovementSession(MovementSession v){movementSession=v;}
 public String getEventType(){return eventType;} public void setEventType(String v){eventType=v;}
 public Integer getRepNumber(){return repNumber;} public void setRepNumber(Integer v){repNumber=v;}
 public Long getStartTimestampMs(){return startTimestampMs;} public void setStartTimestampMs(Long v){startTimestampMs=v;}
 public Long getEndTimestampMs(){return endTimestampMs;} public void setEndTimestampMs(Long v){endTimestampMs=v;}
 public Long getDurationMs(){return durationMs;} public void setDurationMs(Long v){durationMs=v;}
 public BigDecimal getScore(){return score;} public void setScore(BigDecimal v){score=v;}
 public String getMetadata(){return metadata;} public void setMetadata(String v){metadata=v;}
 public Instant getCreatedAt(){return createdAt;}
}
