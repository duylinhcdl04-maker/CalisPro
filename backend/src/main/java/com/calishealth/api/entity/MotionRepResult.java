package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

/** Kết quả từng rep (kể cả rep không hợp lệ - vẫn lưu để phân tích): hợp lệ?, vì sao, chỉ số, chất lượng. */
@Entity
@Table(name = "motion_rep_results", indexes = @Index(name = "ix_mrr_session", columnList = "movement_session_id"))
public class MotionRepResult {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "movement_session_id", nullable = false) private Long movementSessionId;
    @Column(name = "rep_number", nullable = false) private int repNumber;
    @Column(nullable = false) private boolean complete;
    @Column(nullable = false) private boolean valid;
    @Column(name = "quality_score", nullable = false) private int qualityScore;
    @Column(name = "violation_codes", columnDefinition = "text") private String violationCodes;
    @Column(name = "metrics_json", columnDefinition = "text") private String metricsJson;
    @Column(name = "start_ms", nullable = false) private long startMs;
    @Column(name = "end_ms", nullable = false) private long endMs;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

    @PrePersist void onCreate() { createdAt = Instant.now(); }

    public Long getId() { return id; }
    public Long getMovementSessionId() { return movementSessionId; } public void setMovementSessionId(Long v) { movementSessionId = v; }
    public int getRepNumber() { return repNumber; } public void setRepNumber(int v) { repNumber = v; }
    public boolean isComplete() { return complete; } public void setComplete(boolean v) { complete = v; }
    public boolean isValid() { return valid; } public void setValid(boolean v) { valid = v; }
    public int getQualityScore() { return qualityScore; } public void setQualityScore(int v) { qualityScore = v; }
    public String getViolationCodes() { return violationCodes; } public void setViolationCodes(String v) { violationCodes = v; }
    public String getMetricsJson() { return metricsJson; } public void setMetricsJson(String v) { metricsJson = v; }
    public long getStartMs() { return startMs; } public void setStartMs(long v) { startMs = v; }
    public long getEndMs() { return endMs; } public void setEndMs(long v) { endMs = v; }
    public Instant getCreatedAt() { return createdAt; }
}
