package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ai_voice_warning_cache")
public class AiVoiceWarningCache {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "text_hash", nullable = false, length = 64, unique = true)
    private String textHash;

    @Column(name = "raw_text", nullable = false, columnDefinition = "text")
    private String rawText;

    @Column(nullable = false, length = 20)
    private String language = "vi-VN";

    @Column(name = "voice_name", length = 50)
    private String voiceName;

    @Column(name = "audio_url", columnDefinition = "text")
    private String audioUrl;

    @Column(name = "storage_key", length = 255)
    private String storageKey;

    @Column(name = "duration_seconds")
    private Double duration;

    @Column(nullable = false, length = 20)
    private String status = "READY"; // PENDING, READY, FAILED

    @Column(name = "hit_count", nullable = false)
    private long hitCount = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "last_accessed_at", nullable = false)
    private Instant lastAccessedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        lastAccessedAt = now;
    }

    public Long getId() { return id; }
    public String getTextHash() { return textHash; }
    public void setTextHash(String textHash) { this.textHash = textHash; }
    public String getRawText() { return rawText; }
    public void setRawText(String rawText) { this.rawText = rawText; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getVoiceName() { return voiceName; }
    public void setVoiceName(String voiceName) { this.voiceName = voiceName; }
    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
    public String getStorageKey() { return storageKey; }
    public void setStorageKey(String storageKey) { this.storageKey = storageKey; }
    public Double getDuration() { return duration; }
    public void setDuration(Double duration) { this.duration = duration; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public long getHitCount() { return hitCount; }
    public void setHitCount(long hitCount) { this.hitCount = hitCount; }
    public void incrementHitCount() { this.hitCount++; this.lastAccessedAt = Instant.now(); }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastAccessedAt() { return lastAccessedAt; }
}
